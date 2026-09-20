import express from "express";
import { Role } from "../../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/checkAuth";
import { CategoryController } from "./category.controller";

const router = express.Router();

// Only administrators can create categories.
router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  CategoryController.createCategory,
);

// Anyone can browse categories.
router.get("/", CategoryController.getAllCategories);

router.get("/:categoryId", CategoryController.getCategoryById);

export const CategoryRoutes = router;
