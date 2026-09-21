import type { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { PostService } from "./post.service";
import type { PostActor } from "./post.service";
import { PostValidation } from "./post.validation";

type PostRequest = Request & {
  user?: PostActor;
};

const getActor = (req: PostRequest): PostActor => {
  if (!req.user) {
    throw new AppError(401, "Please log in to continue");
  }

  return req.user;
};

const createPost = catchAsync(async (req: PostRequest, res: Response) => {
  const actor = getActor(req);
  const payload = PostValidation.createPostValidationSchema.parse(req.body);

  const result = await PostService.createPost(actor, payload);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Post created successfully",
    data: result,
  });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const query = PostValidation.listPostsQuerySchema.parse(req.query);

  const result = await PostService.getAllPosts(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Posts retrieved successfully",
    data: result,
  });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
  const { postId } = PostValidation.postIdParamsSchema.parse(req.params);

  const result = await PostService.getPostById(postId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Post retrieved successfully",
    data: result,
  });
});

const getPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = PostValidation.slugParamsSchema.parse(req.params);

  const result = await PostService.getPostBySlug(slug);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Post retrieved successfully",
    data: result,
  });
});

const updatePost = catchAsync(async (req: PostRequest, res: Response) => {
  const actor = getActor(req);
  const { postId } = PostValidation.postIdParamsSchema.parse(req.params);

  const payload = PostValidation.updatePostValidationSchema.parse(req.body);

  const result = await PostService.updatePost(postId, actor, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Post updated successfully",
    data: result,
  });
});

const deletePost = catchAsync(async (req: PostRequest, res: Response) => {
  const actor = getActor(req);
  const { postId } = PostValidation.postIdParamsSchema.parse(req.params);

  const result = await PostService.deletePost(postId, actor);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Post deleted successfully",
    data: result,
  });
});

const publishPost = catchAsync(async (req: PostRequest, res: Response) => {
  const actor = getActor(req);
  const { postId } = PostValidation.postIdParamsSchema.parse(req.params);

  PostValidation.emptyBodySchema.parse(req.body ?? {});

  const result = await PostService.publishPost(postId, actor);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Post published successfully",
    data: result,
  });
});

const unpublishPost = catchAsync(async (req: PostRequest, res: Response) => {
  const actor = getActor(req);
  const { postId } = PostValidation.postIdParamsSchema.parse(req.params);

  PostValidation.emptyBodySchema.parse(req.body ?? {});

  const result = await PostService.unpublishPost(postId, actor);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Post unpublished successfully",
    data: result,
  });
});

export const PostController = {
  createPost,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
};

// import { Request, Response } from "express";
// import { postService } from "./post.service";
// // import { UserService } from "./user.service";

// const createPost = async (req: Request, res: Response) => {
//   try {
//     const result = await postService.createPost(req.body);
//     res.status(201).send(result);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

// const getAllPosts = async (req: Request, res: Response) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const search = (req.query.search as string) || "";
//     const isFeatured = req.query.isFeatured
//       ? req.query.isFeatured === "true"
//       : undefined;
//     const tags = req.query.tags ? (req.query.tags as string).split(",") : [];

//     const result = await postService.getAllPosts({
//       page,
//       limit,
//       search,
//       isFeatured,
//       tags,
//     });
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch posts", details: err });
//   }
// };

// const getPostById = async (req: Request, res: Response) => {
//   const post = await postService.getPostById(Number(req.params.id));
//   if (!post) return res.status(404).json({ error: "Post not found" });
//   res.json(post);
// };

// const updatePost = async (req: Request, res: Response) => {
//   const post = await postService.updatePost(Number(req.params.id), req.body);
//   res.json(post);
// };

// const deletePost = async (req: Request, res: Response) => {
//   await postService.deletePost(Number(req.params.id));
//   res.json({ message: "Post deleted" });
// };

// const getBlogStat = async (req: Request, res: Response) => {
//   try {
//     const result = await postService.getBlogStat();
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch stats", details: err });
//   }
// };

// export const postController = {
//   createPost,
//   getAllPosts,
//   getPostById,
//   updatePost,
//   deletePost,
//   getBlogStat,
// };
