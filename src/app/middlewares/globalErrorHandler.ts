import { NextFunction, Request, Response } from "express";
import { deleteImageFromCloudinary } from "../../config/cloudinary.config";

const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.file) {
    await deleteImageFromCloudinary(req.file.path);
  }

  let statusCode = 500;
  let success = false;
  let message = err.message || "Something went wrong!";
  let error = err;

  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
