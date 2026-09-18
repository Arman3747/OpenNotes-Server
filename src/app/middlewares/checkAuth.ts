import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import config from "../../config";
import { prisma } from "../../../lib/prisma";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { AuthRequest } from "../modules/auth/auth.interface";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies?.accessToken;

      if (!accessToken) {
        throw new AppError(403, "No Token Received !");
      }

      const verifiedToken = verifyToken(
        accessToken,
        config.token.jwt_access_secret as string,
      );

      const isUserExist = await prisma.user.findUnique({
        where: {
          id: verifiedToken.userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          deletedAt: true,
        },
      });

      if (!isUserExist) {
        throw new AppError(404, "Email Does not Exists !");
      }

      if (
        isUserExist.status === UserStatus.BLOCKED ||
        isUserExist.status === UserStatus.INACTIVE
      ) {
        throw new AppError(404, `User Is ${isUserExist.status} !`);
      }

      if (authRoles.length && !authRoles.includes(verifiedToken.role)) {
        throw new AppError(403, "You are not permitted to view this route !");
      }

      req.user = {
        userId: isUserExist.id,
        email: isUserExist.email,
        role: isUserExist.role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
