import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CategoryValidation } from "./category.validation";
import { CategoryService } from "./category.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  // zod validation
  const payload = CategoryValidation.createCategoryValidationSchema.parse(
    req.body,
  );
  //send service
  const result = await CategoryService.createCategory(payload);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Category created successfully !!!",
    data: result,
  });
});

const getAllCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = CategoryValidation.categoryIdParamsSchema.parse(
    req.params,
  );

  const result = await CategoryService.getCategoryById(categoryId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category retrieved successfully",
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
};
