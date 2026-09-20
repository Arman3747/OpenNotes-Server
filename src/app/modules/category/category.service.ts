import { prisma } from "../../../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import { CreateCategoryInput } from "./category.validation";

// Create a category.
const createCategory = async (payload: CreateCategoryInput) => {
  const category = await prisma.categories.create({
    data: {
      categoriesName: payload.categoriesName,
      icon: payload.icon,
    },
  });

  return category;
};

// Get all categories, sorted alphabetically.
const getAllCategories = async () => {
  const categories = await prisma.categories.findMany({
    orderBy: [{ categoriesName: "asc" }, { id: "asc" }],
  });

  return categories;
};

// Get one category using its unique ID.
const getCategoryById = async (categoryId: string) => {
  const category = await prisma.categories.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  return category;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
};
