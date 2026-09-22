import { prisma } from "../../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import {
  BlogPostStatus,
  BlogPostVisibility,
  Role,
  UserStatus,
} from "../../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import type { CommentInput, GetCommentsQuery } from "./comment.validation";

const commentInclude = {
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      profilePhoto: true,
    },
  },
} satisfies Prisma.CommentInclude;

// Do not expose comments belonging to private or draft posts.
const publicPostWhere: Prisma.BlogPostWhereInput = {
  status: BlogPostStatus.PUBLISHED,
  visibility: BlogPostVisibility.PUBLIC,
  author: {
    is: {
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
  },
};

// Keep related writes atomic and retry concurrent write conflicts.
const runMutation = async <T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2034") {
          if (attempt < 2) continue;

          throw new AppError(
            409,
            "A concurrent change occurred. Please try again.",
          );
        }

        if (error.code === "P2025") {
          throw new AppError(404, "Required record was not found");
        }

        if (error.code === "P2003") {
          throw new AppError(409, "A related record prevents this operation");
        }
      }

      throw error;
    }
  }

  throw new Error("Transaction could not complete");
};

const requireActiveUser = async (
  tx: Prisma.TransactionClient,
  userId: string,
) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(401, "Account is no longer available");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(403, "Account is not active");
  }

  return user;
};

const requirePublicPost = async (
  tx: Prisma.TransactionClient,
  postId: string,
) => {
  const post = await tx.blogPost.findFirst({
    where: {
      ...publicPostWhere,
      id: postId,
    },
    select: { id: true },
  });

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  return post;
};

// POST /posts/:postId/comments
const createComment = async (
  postId: string,
  userId: string,
  payload: CommentInput,
) =>
  runMutation(async (tx) => {
    await requireActiveUser(tx, userId);
    await requirePublicPost(tx, postId);

    const comment = await tx.comment.create({
      data: {
        content: payload.content,
        authorId: userId,
        postId,
      },
      include: commentInclude,
    });

    // Both operations succeed or both are rolled back.
    await tx.blogPost.update({
      where: { id: postId },
      data: {
        commentsCount: { increment: 1 },
      },
    });

    return comment;
  });

// GET /posts/:postId/comments
const getCommentsByPost = async (postId: string, query: GetCommentsQuery) => {
  const { page, limit } = query;

  // Use one consistent snapshot for visibility, rows, and total.
  return prisma.$transaction(
    async (tx) => {
      await requirePublicPost(tx, postId);

      const comments = await tx.comment.findMany({
        where: { postId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: commentInclude,
      });

      const total = await tx.comment.count({
        where: { postId },
      });

      return {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );
};

// PATCH /comments/:commentId
const updateComment = async (
  commentId: string,
  userId: string,
  payload: CommentInput,
) =>
  runMutation(async (tx) => {
    await requireActiveUser(tx, userId);

    const comment = await tx.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(404, "Comment not found");
    }

    // Admins cannot rewrite another person's comment.
    if (comment.authorId !== userId) {
      throw new AppError(403, "You can only edit your own comments");
    }

    await requirePublicPost(tx, comment.postId);

    return tx.comment.update({
      where: { id: commentId },
      data: {
        content: payload.content,
        // Preserve true once a comment has been edited.
        isEdited: comment.isEdited || comment.content !== payload.content,
      },
      include: commentInclude,
    });
  });

// DELETE /comments/:commentId
const deleteComment = async (commentId: string, userId: string) =>
  runMutation(async (tx) => {
    const user = await requireActiveUser(tx, userId);

    const comment = await tx.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError(404, "Comment not found");
    }

    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    if (comment.authorId !== user.id && !isAdmin) {
      throw new AppError(403, "You are not permitted to delete this comment");
    }

    // Deletion is allowed even if the post was unpublished.
    // Related likes require an appropriate deletion policy.
    await tx.comment.delete({
      where: { id: commentId },
    });

    await tx.blogPost.update({
      where: { id: comment.postId },
      data: {
        commentsCount: { decrement: 1 },
      },
    });

    return { id: commentId };
  });

export const CommentService = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
