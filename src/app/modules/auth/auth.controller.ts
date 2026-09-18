import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  loginUserValidationSchema,
  registerUserValidationSchema,
  resetPasswordValidationSchema,
} from "./auth.validation";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { setAuthCookie } from "../../utils/setCookies";
import { AuthRequest } from "./auth.interface";
import AppError from "../../errorHelpers/AppError";

const registerWithEmailAndPassword = catchAsync(
  async (req: Request, res: Response) => {
    // zod validation
    const payload = registerUserValidationSchema.parse(req.body);
    //send service
    const result = await AuthService.registerWithEmailAndPassword(payload);

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "User Created successfully !",
      data: result,
    });
  },
);

const loginWithEmailAndPassword = catchAsync(
  async (req: Request, res: Response) => {
    // zod validation
    const payload = loginUserValidationSchema.parse(req.body);
    //send service
    const result = await AuthService.loginWithEmailAndPassword(payload);

    setAuthCookie(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message:
        "accessToken created, refreshToken created, cookies saved and Logged in successfully",
      data: result,
    });
  },
);

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User Logged Out Successfully !",
    data: null,
  });
});

const changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }
  // zod validation
  const payload = changePasswordValidationSchema.parse(req.body);
  //send service
  await AuthService.changePassword(req.user.userId, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password changed successfully !!!",
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: AuthRequest, res: Response) => {
  // zod validation
  const { email } = forgotPasswordValidationSchema.parse(req.body);
  //send service
  await AuthService.forgotPassword(email);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message:
      "If an eligible account exists, a password-reset link will be sent.",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = resetPasswordValidationSchema.parse(req.body);

  await AuthService.resetPassword(payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password reset successfully. Please log in.",
    data: null,
  });
});

// const authWithGoogle = async (req: Request, res: Response) => {
//   try {
//     const result = await AuthService.authWithGoogle(req.body);
//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

export const AuthController = {
  registerWithEmailAndPassword,
  loginWithEmailAndPassword,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  //   authWithGoogle,
};
