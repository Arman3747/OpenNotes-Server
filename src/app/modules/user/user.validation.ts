import z from "zod";

const createUserValidationSchema = z
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

const updateUserValidationSchema = z
  .strictObject({
    name: z.string().trim().min(2).max(100),
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/),
    profilePhoto: z.url().nullable(),
    boi: z.string().trim().max(500).nullable(),
    phone: z.string().trim().max(30).nullable(),
    country: z.string().trim().max(100).nullable(),
    website: z.url().nullable(),
    instagram: z.string().trim().max(100).nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const getUserByIdParamsSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  getUserByIdParamsSchema,
};

export type UpdateUserInput = z.infer<typeof updateUserValidationSchema>;
