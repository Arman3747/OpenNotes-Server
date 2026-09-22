import { z } from "zod";

const commentBodySchema = z.strictObject({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

const postIdParamsSchema = z.object({
  postId: z.uuid("Invalid post ID"),
});

const commentIdParamsSchema = z.object({
  commentId: z.uuid("Invalid comment ID"),
});

const positiveIntegerQuery = (fallback: string, max: number) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Must be a positive integer")
    .default(fallback)
    .transform(Number)
    .pipe(z.number().int().min(1).max(max));

const getCommentsQuerySchema = z.strictObject({
  page: positiveIntegerQuery("1", 100000),
  limit: positiveIntegerQuery("10", 100),
});

export type CommentInput = z.infer<typeof commentBodySchema>;

export type GetCommentsQuery = z.infer<typeof getCommentsQuerySchema>;

export const CommentValidation = {
  createCommentValidationSchema: commentBodySchema,
  updateCommentValidationSchema: commentBodySchema,
  postIdParamsSchema,
  commentIdParamsSchema,
  getCommentsQuerySchema,
};
