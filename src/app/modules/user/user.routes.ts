import express from "express";
import { UserController } from "./user.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/enums";

const router = express.Router();

// router.get("/", UserController.getAllUsers);
// router.get("/:id", UserController.getUsersById);


router.get("/:userId",checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER), UserController.getUserById);

router.get(
  "/me",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  UserController.me,
);

router.patch(
  "/:userId",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  UserController.updateUser,
);

// This is /register route
//router.post("/", UserController.createUser); // valid route

// router.patch("/:id", UserController.updateUser);
// router.delete("/:id", UserController.deleteUser);

export const userRouter = router;
