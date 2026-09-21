import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { PostController } from "./post.controller";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

// Public reads.
/**
 *
 * GET {{URL}}/posts?page=1&limit=10
 * GET {{URL}}/posts?search=nextjs&tag=react
 *
 */

router.get("/", PostController.getAllPosts);
router.get("/slug/:slug", PostController.getPostBySlug);
router.get("/:postId", PostController.getPostById);

// Authenticated writes.
// The service checks ownership/admin permissions.
router.post(
  "/",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  PostController.createPost,
);

router.patch(
  "/:postId/publish",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  PostController.publishPost,
);

router.patch(
  "/:postId/unpublish",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  PostController.unpublishPost,
);

router.patch(
  "/:postId",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  PostController.updatePost,
);

// router.delete("/:postId", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.USER), PostController.deletePost);

export const PostRoutes = router;

//old

// import express from "express";
// import { postController } from "./post.controller";

// const router = express.Router();

// // router.get("/stats", postController.getBlogStat);

// router.post("/", postController.createPost);

// // router.get("/", postController.getAllPosts);
// // router.get("/:id", postController.getPostById);
// // router.patch("/:id", postController.updatePost);
// // router.delete("/:id", postController.deletePost);

// export const postRouter = router;
