import type { Request, Response } from "express";
import type { AuthRequest } from "../auth/auth.interface";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { CommentService } from "./comment.service";
import { CommentValidation } from "./comment.validation";

const createComment = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }

  const { postId } = CommentValidation.postIdParamsSchema.parse(req.params);

  const payload = CommentValidation.createCommentValidationSchema.parse(
    req.body,
  );

  const result = await CommentService.createComment(
    postId,
    req.user.userId,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Comment created successfully",
    data: result,
  });
});

const getCommentsByPost = catchAsync(async (req: Request, res: Response) => {
  const { postId } = CommentValidation.postIdParamsSchema.parse(req.params);

  const query = CommentValidation.getCommentsQuerySchema.parse(req.query);

  const result = await CommentService.getCommentsByPost(postId, query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Comments retrieved successfully",
    data: result,
  });
});

const updateComment = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }

  const { commentId } = CommentValidation.commentIdParamsSchema.parse(
    req.params,
  );

  const payload = CommentValidation.updateCommentValidationSchema.parse(
    req.body,
  );

  const result = await CommentService.updateComment(
    commentId,
    req.user.userId,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Comment updated successfully",
    data: result,
  });
});

const deleteComment = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }

  const { commentId } = CommentValidation.commentIdParamsSchema.parse(
    req.params,
  );

  const result = await CommentService.deleteComment(commentId, req.user.userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const CommentController = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
