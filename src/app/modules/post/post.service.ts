import { randomUUID } from "node:crypto";
import { prisma } from "../../../../lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import {
  BlogPostStatus,
  BlogPostVisibility,
  Role,
  UserStatus,
} from "../../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import type {
  CreatePostInput,
  UpdatePostInput,
  ListPostsQuery,
} from "./post.validation";

export interface PostActor {
  userId: string;
  role: Role;
}

// Include only safe author/category fields.
const postInclude = {
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      profilePhoto: true,
    },
  },
  category: {
    select: {
      id: true,
      categoriesName: true,
      icon: true,
    },
  },
} satisfies Prisma.BlogPostInclude;

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

const isAdmin = (role: Role): boolean =>
  role === Role.ADMIN || role === Role.SUPER_ADMIN;

// Run mutations atomically and retry concurrent write conflicts.
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
            "The post changed during this request. Please try again.",
          );
        }

        if (error.code === "P2002") {
          throw new AppError(409, "This slug is already in use");
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

// Recheck the actor inside the mutation transaction.
const requireActiveActor = async (
  tx: Prisma.TransactionClient,
  actor: PostActor,
) => {
  const user = await tx.user.findUnique({
    where: { id: actor.userId },
    select: {
      id: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
    throw new AppError(403, "Account is not active");
  }

  return user;
};

const requireEditablePost = async (
  tx: Prisma.TransactionClient,
  postId: string,
  actor: PostActor,
) => {
  const user = await requireActiveActor(tx, actor);

  const post = await tx.blogPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  if (post.authorId !== user.id && !isAdmin(user.role)) {
    throw new AppError(403, "You cannot modify this post");
  }

  return { post, user };
};

const requireCategory = async (
  tx: Prisma.TransactionClient,
  categoryId: string,
) => {
  const category = await tx.categories.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }
};

const generateSlug = (title: string): string => {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");

  return `${base || "post"}-${randomUUID()}`;
};

// Define a flexible JSON type or use `unknown` / `any` depending on your setup
type JsonContent = Record<string, any> | Array<any> | string | null | undefined;

/**
 * Recursively extracts plain text from any JSON structure (Editor.js, TipTap, BlockNote, etc.)
 */
const extractTextFromJson = (node: JsonContent): string => {
  if (!node) return "";

  // If node is already a string
  if (typeof node === "string") return node;

  // If node is an array, process each item
  if (Array.isArray(node)) {
    return node.map(extractTextFromJson).join(" ");
  }

  // If node is an object, look for text fields or traverse nested children/blocks
  if (typeof node === "object") {
    let text = "";

    // Common rich-text JSON field names for text content
    if (typeof node.text === "string") text += " " + node.text;

    // Traverse all keys (e.g., content, children, blocks)
    for (const key of Object.keys(node)) {
      if (key !== "text" && typeof node[key] === "object") {
        text += " " + extractTextFromJson(node[key]);
      }
    }

    return text;
  }

  return "";
};

/**
 * Calculates read time in minutes (Int?) from JSON content
 */
export const calculateReadTimeFromJson = (
  content: JsonContent,
  wpm = 225,
): number | null => {
  if (!content) return null;

  // 1. Convert JSON tree to plain text string
  const plainText = extractTextFromJson(content).trim();
  if (!plainText) return null;

  // 2. Count words by splitting on whitespace
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // 3. Return integer minutes (minimum 1 min if content exists)
  return wordCount > 0 ? Math.max(1, Math.ceil(wordCount / wpm)) : null;
};

// POST /posts
const createPost = async (actor: PostActor, payload: CreatePostInput) =>
  runMutation(async (tx) => {
    const user = await requireActiveActor(tx, actor);

    if (payload.isFeatured !== undefined && !isAdmin(user.role)) {
      throw new AppError(403, "Only admins can set isFeatured");
    }

    await requireCategory(tx, payload.categoryId);

    const post = await tx.blogPost.create({
      data: {
        title: payload.title,
        slug: payload.slug ?? generateSlug(payload.title),
        // Zod has rejected top-level null and non-JSON values.
        content: payload.content as Prisma.InputJsonValue,
        coverImage: payload.coverImage ?? null,
        categoryId: payload.categoryId,
        authorId: user.id,
        tags: payload.tags,
        visibility: payload.visibility,
        status: payload.status,
        readTime:
          payload.readTime ?? calculateReadTimeFromJson(payload.content),
        isFeatured: payload.isFeatured ?? false,
        publishedAt:
          payload.status === BlogPostStatus.PUBLISHED ? new Date() : null,
      },
      include: postInclude,
    });

    await tx.user.update({
      where: { id: user.id },
      data: { postsCount: { increment: 1 } },
    });

    await tx.categories.update({
      where: { id: payload.categoryId },
      data: { categoriesPostsCount: { increment: 1 } },
    });

    return post;
  });

// GET /posts
const getAllPosts = async (query: ListPostsQuery) => {
  const { page, limit, categoryId, authorId, search, tag } = query;

  const where: Prisma.BlogPostWhereInput = {
    ...publicPostWhere,
    ...(categoryId ? { categoryId } : {}),
    ...(authorId ? { authorId } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const [posts, total] = await prisma.$transaction(
    [
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        // List responses omit the potentially large editor content.
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          tags: true,
          isFeatured: true,
          readTime: true,
          views: true,
          likesCount: true,
          commentsCount: true,
          sharesCount: true,
          publishedAt: true,
          createdAt: true,
          author: postInclude.author,
          category: postInclude.category,
        },
      }),
      prisma.blogPost.count({ where }),
    ],
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// // GET /posts/:postId
// const getPostById = async (postId: string) => {
//   const post = await prisma.blogPost.findFirst({
//     where: {
//       ...publicPostWhere,
//       id: postId,
//     },
//     include: postInclude,
//   });

//   if (!post) {
//     throw new AppError(404, "Post not found");
//   }

//   return post;
// };

// // GET /posts/slug/:slug
// const getPostBySlug = async (slug: string) => {
//   const post = await prisma.blogPost.findFirst({
//     where: {
//       ...publicPostWhere,
//       slug,
//     },
//     include: postInclude,
//   });

//   if (!post) {
//     throw new AppError(404, "Post not found");
//   }

//   return post;
// };

// GET /posts/:postId
const getPostById = async (postId: string) => {
  return prisma.$transaction(async (tx) => {
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

    return tx.blogPost.update({
      where: {
        id: post.id,
        AND: [publicPostWhere],
      },
      data: {
        views: {
          increment: 1,
        },
      },
      include: postInclude,
    });
  });
};

// GET /posts/slug/:slug
const getPostBySlug = async (slug: string) => {
  return prisma.$transaction(async (tx) => {
    const post = await tx.blogPost.findFirst({
      where: {
        ...publicPostWhere,
        slug,
      },
      select: { id: true },
    });

    if (!post) {
      throw new AppError(404, "Post not found");
    }

    return tx.blogPost.update({
      where: {
        id: post.id,
        AND: [publicPostWhere],
      },
      data: {
        views: {
          increment: 1,
        },
      },
      include: postInclude,
    });
  });
};

// PATCH /posts/:postId
const updatePost = async (
  postId: string,
  actor: PostActor,
  payload: UpdatePostInput,
) =>
  runMutation(async (tx) => {
    const { post, user } = await requireEditablePost(tx, postId, actor);

    if (payload.isFeatured !== undefined && !isAdmin(user.role)) {
      throw new AppError(403, "Only admins can set isFeatured");
    }

    if (
      payload.categoryId !== undefined &&
      payload.categoryId !== post.categoryId
    ) {
      await requireCategory(tx, payload.categoryId);

      await tx.categories.update({
        where: { id: post.categoryId },
        data: { categoriesPostsCount: { decrement: 1 } },
      });

      await tx.categories.update({
        where: { id: payload.categoryId },
        data: { categoriesPostsCount: { increment: 1 } },
      });
    }

    // Explicit fields prevent changes to authorId, status, or counters.
    const data: Prisma.BlogPostUncheckedUpdateInput = {};

    if (payload.title !== undefined) data.title = payload.title;
    if (payload.slug !== undefined) data.slug = payload.slug;

    if (payload.content !== undefined) {
      data.content = payload.content as Prisma.InputJsonValue;
    }

    if (payload.coverImage !== undefined) {
      data.coverImage = payload.coverImage;
    }

    if (payload.categoryId !== undefined) {
      data.categoryId = payload.categoryId;
    }

    if (payload.tags !== undefined) data.tags = payload.tags;

    if (payload.visibility !== undefined) {
      data.visibility = payload.visibility;
    }

    if (payload.readTime !== undefined) {
      data.readTime = payload.readTime;
    }

    if (payload.isFeatured !== undefined) {
      data.isFeatured = payload.isFeatured;
    }

    return tx.blogPost.update({
      where: { id: postId },
      data,
      include: postInclude,
    });
  });

// DELETE /posts/:postId
const deletePost = async (postId: string, actor: PostActor) =>
  runMutation(async (tx) => {
    const { post } = await requireEditablePost(tx, postId, actor);

    // Hard delete. Restrictive foreign keys can reject this operation.
    await tx.blogPost.delete({
      where: { id: postId },
    });

    await tx.user.update({
      where: { id: post.authorId },
      data: { postsCount: { decrement: 1 } },
    });

    await tx.categories.update({
      where: { id: post.categoryId },
      data: { categoriesPostsCount: { decrement: 1 } },
    });

    return { id: postId };
  });

// Shared publish/unpublish implementation.
const changePublicationStatus = async (
  postId: string,
  actor: PostActor,
  status: typeof BlogPostStatus.DRAFT | typeof BlogPostStatus.PUBLISHED,
) =>
  runMutation(async (tx) => {
    const { post } = await requireEditablePost(tx, postId, actor);

    return tx.blogPost.update({
      where: { id: postId },
      data: {
        status,
        // Preserve the first publication timestamp.
        publishedAt:
          status === BlogPostStatus.PUBLISHED
            ? (post.publishedAt ?? new Date())
            : post.publishedAt,
      },
      include: postInclude,
    });
  });

const publishPost = (postId: string, actor: PostActor) =>
  changePublicationStatus(postId, actor, BlogPostStatus.PUBLISHED);

const unpublishPost = (postId: string, actor: PostActor) =>
  changePublicationStatus(postId, actor, BlogPostStatus.DRAFT);

export const PostService = {
  createPost,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
};

// import { Post, Prisma } from "../../../generated/prisma/client";
// import { prisma } from "../../lib/prisma";

// const createPost = async (payload: Prisma.PostCreateInput): Promise<Post> => {
//   const createdPost = await prisma.post.create({
//     data: payload,
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//         },
//       },
//     },
//   });

//   return createdPost;
// };

// const getAllPosts = async ({
//   page = 1,
//   limit = 10,
//   search,
//   isFeatured,
//   tags,
// }: {
//   page?: number;
//   limit?: number;
//   search?: string;
//   isFeatured?: boolean;
//   tags?: string[];
// }) => {
//   const skip = (page - 1) * limit;

//   const where: any = {
//     AND: [
//       search && {
//         OR: [
//           { title: { contains: search, mode: "insensitive" } },
//           { content: { contains: search, mode: "insensitive" } },
//         ],
//       },
//       typeof isFeatured === "boolean" && { isFeatured },
//       tags && tags.length > 0 && { tags: { hasEvery: tags } },
//     ].filter(Boolean),
//   };

//   const result = await prisma.post.findMany({
//     skip,
//     take: limit,
//     where,
//     include: {
//       author: true,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });

//   const total = await prisma.post.count({ where });

//   return {
//     data: result,
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// };

// const getPostById = async (id: number) => {
//   return await prisma.$transaction(async (tx) => {
//     await tx.post.update({
//       where: { id },
//       data: {
//         views: {
//           increment: 1,
//         },
//       },
//     });

//     return await tx.post.findUnique({
//       where: { id },
//       include: { author: true },
//     });
//   });
// };

// const updatePost = async (id: number, data: Partial<any>) => {
//   return prisma.post.update({ where: { id }, data });
// };

// const deletePost = async (id: number) => {
//   return prisma.post.delete({ where: { id } });
// };

// const getBlogStat = async () => {
//   return await prisma.$transaction(async (tx) => {
//     const aggregates = await tx.post.aggregate({
//       _count: true,
//       _sum: { views: true },
//       _avg: { views: true },
//       _max: { views: true },
//       _min: { views: true },
//     });

//     const featuredCount = await tx.post.count({
//       where: {
//         isFeatured: true,
//       },
//     });

//     const topFeatured = await tx.post.findFirst({
//       where: { isFeatured: true },
//       orderBy: { views: "desc" },
//     });

//     const lastWeek = new Date();
//     lastWeek.setDate(lastWeek.getDate() - 7);

//     const lastWeekPostCount = await tx.post.count({
//       where: {
//         createdAt: {
//           gte: lastWeek,
//         },
//       },
//     });

//     return {
//       stats: {
//         totalPosts: aggregates._count ?? 0,
//         totalViews: aggregates._sum.views ?? 0,
//         avgViews: aggregates._avg.views ?? 0,
//         minViews: aggregates._min.views ?? 0,
//         maxViews: aggregates._max.views ?? 0,
//       },
//       featured: {
//         count: featuredCount,
//         topPost: topFeatured,
//       },
//       lastWeekPostCount,
//     };
//   });
// };

// export const postService = {
//   createPost,
//   getAllPosts,
//   getPostById,
//   updatePost,
//   deletePost,
//   getBlogStat,
// };
