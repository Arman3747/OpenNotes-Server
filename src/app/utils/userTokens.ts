import { User } from "../../../generated/prisma/client";
// import { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { generateToken } from "./jwt";

export const createUserTokens = (user: Pick<User, "id" | "email" | "role">) => {
  const jwtPayload = {
    userId: user?.id,
    email: user?.email,
    role: user?.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    config.token.jwt_access_secret as string,
    config.token.jwt_access_expires as string,
  );

  const refreshToken = generateToken(
    jwtPayload,
    config.token.jwt_refresh_secret as string,
    config.token.jwt_refresh_expires as string,
  );

  return {
    accessToken,
    refreshToken,
  };
};
