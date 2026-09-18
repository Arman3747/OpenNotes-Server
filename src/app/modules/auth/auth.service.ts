import { User, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import bcryptjs from "bcryptjs";
import { createUserTokens } from "../../utils/userTokens";
import config from "../../../config";

import type {
  ChangePasswordInput,
  ResetPasswordInput,
} from "./auth.validation";
import { LoginUserInput } from "./auth.interface";
import { generateToken, verifyToken } from "../../utils/jwt";
import emailSender from "../../utils/sendEmail";


const registerWithEmailAndPassword = async (payload: Prisma.UserCreateInput): Promise<User> => {
  const { email, password, ...rest } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(409, "User already exists!");
  }

  // Password is nullable in your Prisma model.
  if (!password) {
    throw new AppError(400, "Password is required!");
  }

  const hashedPassword = await bcryptjs.hash(
    password,
    Number(config.bcrypt.salt_round),
  );

  const createdUser = await prisma.user.create({
    data: {
      ...rest,
      email,
      password: hashedPassword,
    },
  });

  return createdUser;
};

const loginWithEmailAndPassword = async ({
  email,
  password,
}: LoginUserInput) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(400, "Email Does not Exists !");
  }

  const isPasswordMatch = await bcryptjs.compare(
    password as string,
    isUserExist.password as string,
  );

  if (!isPasswordMatch) {
    throw new AppError(400, "Incorrect Password !");
  }

  const tokens = createUserTokens(isUserExist);

  return {
    ...tokens,
    user: {
      id: isUserExist?.id,
      email: isUserExist?.email,
      name: isUserExist?.name,
      username: isUserExist?.username,
      profilePhoto: isUserExist?.profilePhoto,
      role: isUserExist?.role,
    },
  };
};

const changePassword = async (
  userId: string,
  { oldPassword, newPassword }: ChangePasswordInput,
): Promise<void> => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!userData || userData.deletedAt) {
    throw new AppError(401, "Account is no longer available");
  }

  if (userData.status !== "ACTIVE") {
    throw new AppError(403, "Account is not active");
  }

  if (!userData.password) {
    throw new AppError(
      400,
      "This account does not have a password. Use the set-password flow.",
    );
  }

  const isOldPasswordMatch = await bcryptjs.compare(
    oldPassword,
    userData.password,
  );

  if (!isOldPasswordMatch) {
    throw new AppError(400, "Old password is incorrect");
  }

  const hashedPassword: string = await bcryptjs.hash(
    newPassword,
    Number(config.bcrypt.salt_round),
  );

  const result = await prisma.user.updateMany({
    where: {
      id: userData.id,
      password: userData.password,
      status: "ACTIVE",
      deletedAt: null,
    },
    data: {
      password: hashedPassword,
    },
  });

  if (result.count !== 1) {
    throw new AppError(409, "Account details changed. Please try again.");
  }
};

const forgotPassword = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      password: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!user || !user.password || user.deletedAt || user.status !== "ACTIVE") {
    throw new AppError(401, "Invalid account !");
  }

  const resetPassToken = generateToken(
    { userId: user.id, email: user.email, role: user.role },
    config.token.jwt_reset_pass_secret as string,
    config.token.jwt_reset_pass_expires as string,
  );

  const resetPassLink = config.reset_pass_link + `?token=${resetPassToken}`;

  await emailSender(
    user.email,
    `
      <div>
          <p>Dear User,</p>
          <p>Your password reset link 
              <a href=${resetPassLink} target="_blank">
                  <button>
                      Reset Password
                  </button>
              </a>
          </p>
      </div>
    `,
  );
};

const resetPassword = async ({
  token,
  newPassword,
}: ResetPasswordInput): Promise<void> => {
  // verify token

  const verifiedToken = verifyToken(
    token,
    config.token.jwt_reset_pass_secret as string,
  );

  const user = await prisma.user.findUnique({
    where: { id: verifiedToken.userId },
    select: {
      id: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    throw new AppError(400, "Reset link is invalid or expired");
  }

  // hash password
  const hashedPassword = await bcryptjs.hash(
    newPassword,
    Number(config.bcrypt.salt_round),
  );

  // update into database
  await prisma.user.update({
    where: {
      id: verifiedToken.userId,
    },
    data: {
      password: hashedPassword,
    },
  });
};

/**
 * http://localhost:3000/reset-password-token?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YzVmZjg4Mi0zZmNlLTRhYTgtYWE2My0yZDE4MWQ2ODYwYjciLCJlbWFpbCI6ImxlZUB5b3BtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzg5NDQ5MjUyLCJleHAiOjE3ODk0NDk4NTJ9.mQkY6A8R3fR3wBo8DPQllHhSq7E6MCQkiTof3Ka-yzk
*/

// const authWithGoogle = async (data: Prisma.UserCreateInput) => {
//   let user = await prisma.user.findUnique({
//     where: {
//       email: data.email,
//     },
//   });

//   if (!user) {
//     user = await prisma.user.create({
//       data,
//     });
//   }

//   return user;
// };

export const AuthService = {
  registerWithEmailAndPassword,
  loginWithEmailAndPassword,
  changePassword,
  forgotPassword,
  resetPassword,

  //   authWithGoogle,
};
