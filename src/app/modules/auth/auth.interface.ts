import type { Request } from "express";
import { Role } from "../../../../generated/prisma/enums";

export interface LoginUserInput {
  email: string;
  password: string;
}

interface AuthUser {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}