import { Request, Response } from "express";
import { UserService } from "./user.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserValidation } from "./user.validation";
import { AuthRequest } from "../auth/auth.interface";
import AppError from "../../errorHelpers/AppError";

const me = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }

  const result = await UserService.me(req.user.userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  // zod validation
  const payload = UserValidation.createUserValidationSchema.parse(req.body);
  //send service
  const result = await UserService.createUser(payload);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User Created successfully !",
    data: result,
  });
});

const updateUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }

  if (req.user.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  // Validate request body
  const payload = UserValidation.updateUserValidationSchema.parse(req.body);

  // Update database
  const result = await UserService.updateUser(userId, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User updated successfully",
    data: result,
  });
});

const getUserById = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }

  // ZOD Validation
  const { userId } = UserValidation.getUserByIdParamsSchema.parse(req.params);

  // Request Service
  const result = await UserService.getUserById(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User profile retrieved successfully",
    data: result,
  });
});

// const getAllUsers = async (req: Request, res: Response) => {
//   try {
//     const result = await UserService.getAllUsers();
//     res.status(201).send(result);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

// const getUsersById = async (req: Request, res: Response) => {
//   try {
//     const result = await UserService.getUserById(Number(req.params.id));
//     res.status(201).send(result);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

// const updateUser = async (req: Request, res: Response) => {
//   try {
//     const result = await UserService.updateUser(
//       Number(req.params.id),
//       req.body,
//     );
//     res.status(201).json(result);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

// const deleteUser = async (req: Request, res: Response) => {
//   try {
//     const result = await UserService.deleteUser(Number(req.params.id));
//     res.status(201).json(result);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

export const UserController = {
  me,
  createUser,
  updateUser,
  getUserById,

  
  //   getAllUsers,
  //   getUsersById,
  //   updateUser,
  //   deleteUser,
};
