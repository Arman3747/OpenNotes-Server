import { User, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import bcryptjs from "bcryptjs";
import config from "../../../config";
import { UpdateUserInput } from "./user.validation";
import { UserStatus } from "../../../../generated/prisma/enums";

const me = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      profilePhoto: true,
      boi: true,
      role: true,
      phone: true,
      country: true,
      status: true,
      isVerified: true,
      website: true,
      instagram: true,
      followersCount: true,
      followingCount: true,
      postsCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(401, "Account is no longer available");
  }

  return user;
};

const createUser = async (payload: Prisma.UserCreateInput): Promise<User> => {
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

const updateUser = async (userId: string, payload: UpdateUserInput) => {
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
      deletedAt: null,
    },
    data: payload,
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      profilePhoto: true,
      boi: true,
      phone: true,
      country: true,
      website: true,
      instagram: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const getUserById = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
    // Return only public profile fields.
    select: {
      id: true,
      name: true,
      username: true,
      profilePhoto: true,
      boi: true,
      website: true,
      instagram: true,
      followersCount: true,
      followingCount: true,
      postsCount: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

// const getAllUsers = async () => {
//   const result = await prisma.user.findMany({
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       phone: true,
//       profilePhoto: true,
//       role: true,
//       status: true,
//       createdAt: true,
//       updatedAt: true,
//       posts: true,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });
//   return result;
// };

// const getUserById = async (id: number) => {
//   const result = await prisma.user.findUnique({
//     where: {
//       id,
//     },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       phone: true,
//       profilePhoto: true,
//       role: true,
//       status: true,
//       createdAt: true,
//       updatedAt: true,
//       posts: true,
//     },
//   });

//   return result;
// };

// const updateUser = async (id: number, payload: Partial<User>) => {
//   const result = await prisma.user.update({
//     where: {
//       id,
//     },
//     data: payload,
//   });
//   return result;
// };

// const deleteUser = async (id: number) => {
//   const result = await prisma.user.delete({
//     where: {
//       id,
//     },
//   });
//   return result;
// };

export const UserService = {
  me,
  createUser, // register
  updateUser,
  getUserById,
  //   getAllUsers,
  //   getUserById,
  //   updateUser,
  //   deleteUser,
};
