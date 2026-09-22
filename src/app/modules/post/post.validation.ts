import { z } from "zod";
import {
  BlogPostStatus,
  BlogPostVisibility,
} from "../../../../generated/prisma/enums";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers, and single hyphens",
  );

const contentSchema = z
  .json()
  .refine(
    (value) => value !== null && typeof value === "object",
    "Content must be a JSON object or array",
  );

const editableFields = {
  title: z.string().trim().min(3).max(200),
  slug: slugSchema.optional(),
  content: contentSchema,
  coverImage: z
    .url({ protocol: /^https?$/ })
    .nullable()
    .optional(),
  categoryId: z.uuid("Invalid category ID"),
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
  visibility: z.enum(BlogPostVisibility),
  readTime: z.number().int().min(1).max(1440).nullable().optional(),
  isFeatured: z.boolean().optional(),
};

const createPostValidationSchema = z.strictObject({
  ...editableFields,
  tags: editableFields.tags.default([]),
  visibility: editableFields.visibility.default(BlogPostVisibility.PUBLIC),
  status: z
    .enum([BlogPostStatus.DRAFT, BlogPostStatus.PUBLISHED])
    .default(BlogPostStatus.PUBLISHED),
});

// Status changes use the dedicated publish/unpublish routes.
const updatePostValidationSchema = z
  .strictObject(editableFields)
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    "At least one field is required",
  );

const postIdParamsSchema = z.object({
  postId: z.uuid("Invalid post ID"),
});

const slugParamsSchema = z.object({
  slug: slugSchema,
});

// Query-string numbers arrive as strings.
const positiveIntegerQuery = (fallback: string, max: number) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Must be a positive integer")
    .default(fallback)
    .transform(Number)
    .pipe(z.number().int().min(1).max(max));

const listPostsQuerySchema = z.strictObject({
  page: positiveIntegerQuery("1", 100000),
  limit: positiveIntegerQuery("20", 100),
  categoryId: z.uuid().optional(),
  authorId: z.uuid().optional(),
  search: z.string().trim().min(1).max(100).optional(),
  tag: z.string().trim().min(1).max(50).optional(),
});

// Publish/unpublish do not accept editable post fields.
const emptyBodySchema = z.strictObject({});

export type CreatePostInput = z.infer<typeof createPostValidationSchema>;

export type UpdatePostInput = z.infer<typeof updatePostValidationSchema>;

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export const PostValidation = {
  createPostValidationSchema,
  updatePostValidationSchema,
  postIdParamsSchema,
  slugParamsSchema,
  listPostsQuerySchema,
  emptyBodySchema,
};
