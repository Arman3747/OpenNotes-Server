import express from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/enums";

const router = express.Router();

router.post("/register", AuthController.registerWithEmailAndPassword);
router.post("/login", AuthController.loginWithEmailAndPassword);
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);

/**
 * | Situation                                                       | Route              |
| --------------------------------------------------------------- | ------------------ |
| “I know my password and want to change it.”                     | `/change-password` |
| “I forgot my password—send me a recovery link.”                 | `/forgot-password` |
| “I opened the recovery link and want to choose a new password.” | `/reset-password`  |

*/

router.post(
  "/change-password",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  AuthController.changePassword,
);

router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// router.post("/google", AuthController.authWithGoogle);

export const authRouter = router;


/**
 * http://localhost:3000/reset-password-token?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YzVmZjg4Mi0zZmNlLTRhYTgtYWE2My0yZDE4MWQ2ODYwYjciLCJlbWFpbCI6ImxlZUB5b3BtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzg5NDQ5MjUyLCJleHAiOjE3ODk0NDk4NTJ9.mQkY6A8R3fR3wBo8DPQllHhSq7E6MCQkiTof3Ka-yzk
*/