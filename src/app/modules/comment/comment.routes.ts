import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { CommentController } from "./comment.controller";
import { Role } from "../../../../generated/prisma/enums";

// Mounted at /api/v1/posts
const postCommentRouter = Router();

postCommentRouter.post(
  "/:postId/comments",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  CommentController.createComment,
);

// GET {{URL}}/posts/POST_ID/comments?page=1&limit=10
postCommentRouter.get("/:postId/comments", CommentController.getCommentsByPost);

// Mounted at /api/v1/comments
const commentRouter = Router();

commentRouter.patch(
  "/:commentId",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  CommentController.updateComment,
);

// commentRouter.delete(
//   "/:commentId",
//   checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
//   CommentController.deleteComment,
// );

export const PostCommentRoutes = postCommentRouter;
export const CommentRoutes = commentRouter;
