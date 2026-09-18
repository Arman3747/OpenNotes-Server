// import { Post, Prisma } from "../../../generated/prisma/client";
// import { prisma } from "../../lib/prisma";

// const createPost = async (payload: Prisma.PostCreateInput): Promise<Post> => {
//   const createdPost = await prisma.post.create({
//     data: payload,
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//         },
//       },
//     },
//   });

//   return createdPost;
// };

// const getAllPosts = async ({
//   page = 1,
//   limit = 10,
//   search,
//   isFeatured,
//   tags,
// }: {
//   page?: number;
//   limit?: number;
//   search?: string;
//   isFeatured?: boolean;
//   tags?: string[];
// }) => {
//   const skip = (page - 1) * limit;

//   const where: any = {
//     AND: [
//       search && {
//         OR: [
//           { title: { contains: search, mode: "insensitive" } },
//           { content: { contains: search, mode: "insensitive" } },
//         ],
//       },
//       typeof isFeatured === "boolean" && { isFeatured },
//       tags && tags.length > 0 && { tags: { hasEvery: tags } },
//     ].filter(Boolean),
//   };

//   const result = await prisma.post.findMany({
//     skip,
//     take: limit,
//     where,
//     include: {
//       author: true,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });

//   const total = await prisma.post.count({ where });

//   return {
//     data: result,
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// };

// const getPostById = async (id: number) => {
//   return await prisma.$transaction(async (tx) => {
//     await tx.post.update({
//       where: { id },
//       data: {
//         views: {
//           increment: 1,
//         },
//       },
//     });

//     return await tx.post.findUnique({
//       where: { id },
//       include: { author: true },
//     });
//   });
// };

// const updatePost = async (id: number, data: Partial<any>) => {
//   return prisma.post.update({ where: { id }, data });
// };

// const deletePost = async (id: number) => {
//   return prisma.post.delete({ where: { id } });
// };

// const getBlogStat = async () => {
//   return await prisma.$transaction(async (tx) => {
//     const aggregates = await tx.post.aggregate({
//       _count: true,
//       _sum: { views: true },
//       _avg: { views: true },
//       _max: { views: true },
//       _min: { views: true },
//     });

//     const featuredCount = await tx.post.count({
//       where: {
//         isFeatured: true,
//       },
//     });

//     const topFeatured = await tx.post.findFirst({
//       where: { isFeatured: true },
//       orderBy: { views: "desc" },
//     });

//     const lastWeek = new Date();
//     lastWeek.setDate(lastWeek.getDate() - 7);

//     const lastWeekPostCount = await tx.post.count({
//       where: {
//         createdAt: {
//           gte: lastWeek,
//         },
//       },
//     });

//     return {
//       stats: {
//         totalPosts: aggregates._count ?? 0,
//         totalViews: aggregates._sum.views ?? 0,
//         avgViews: aggregates._avg.views ?? 0,
//         minViews: aggregates._min.views ?? 0,
//         maxViews: aggregates._max.views ?? 0,
//       },
//       featured: {
//         count: featuredCount,
//         topPost: topFeatured,
//       },
//       lastWeekPostCount,
//     };
//   });
// };

// export const postService = {
//   createPost,
//   getAllPosts,
//   getPostById,
//   updatePost,
//   deletePost,
//   getBlogStat,
// };
