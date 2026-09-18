import { z } from "zod";
import { Buffer } from "node:buffer";

export const registerUserValidationSchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),

    name: z.string().trim().min(1).max(100).nullish(),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      )
      .nullish(),
    profilePhoto: z.string().url("Invalid profile photo URL").nullish(),
    boi: z
      .string()
      .trim()
      .max(500, "Bio cannot exceed 500 characters")
      .nullish(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).default("USER"),
    phone: z.string().trim().min(1).max(30).nullish(),
    country: z.string().trim().min(1).max(100).nullish(),
    website: z.string().url("Invalid website URL").nullish(),
    instagram: z.string().url("Invalid Instagram URL").nullish(),
  })
  .strict();

export const loginUserValidationSchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const changePasswordValidationSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "New password must not exceed 72 bytes",
      ),
  })
  .strict()
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from the old password",
    path: ["newPassword"],
  });

export const forgotPasswordValidationSchema = z
  .object({
    email: z.string().trim().email("Invalid email address"),
  })
  .strict();

export const resetPasswordValidationSchema = z
  .object({
    token: z.jwt("Invalid JWT format"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must not exceed 72 bytes"
      ),
  })
  .strict();

export type ResetPasswordInput = z.infer<typeof resetPasswordValidationSchema>;

export type ChangePasswordInput = z.infer<
  typeof changePasswordValidationSchema
>;
