import { z } from "zod";

const createCategoryValidationSchema = z.strictObject({
  categoriesName: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  icon: z
    .string()
    .trim()
    .min(1, "Icon cannot be empty")
    .max(2048, "Icon is too long")
    .nullish(),
});

const categoryIdParamsSchema = z.object({
  categoryId: z.uuid("Invalid category ID"),
});

export type CreateCategoryInput = z.infer<
  typeof createCategoryValidationSchema
>;

export const CategoryValidation = {
  createCategoryValidationSchema,
  categoryIdParamsSchema,
};