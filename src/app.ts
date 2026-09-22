import compression from "compression";
import cors from "cors";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import config from "./config";

import { userRouter } from "./app/modules/user/user.routes";
import { authRouter } from "./app/modules/auth/auth.routes";
import { CategoryRoutes } from "./app/modules/category/category.routes";
import { PostRoutes } from "./app/modules/post/post.router";
import {
  CommentRoutes,
  PostCommentRoutes,
} from "./app/modules/comment/comment.routes";

const app = express();

// Middleware
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(compression()); // Compresses response bodies for faster delivery
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// Default route for testing
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: '"Open Notes" is running successfully !!!',
    environment: config.node_env,
    uptime: process.uptime().toFixed(2) + "sec",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", CategoryRoutes);
app.use("/api/v1/posts", PostCommentRoutes);
app.use("/api/v1/post", PostRoutes);
app.use("/api/v1/comments", CommentRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

export default app;
