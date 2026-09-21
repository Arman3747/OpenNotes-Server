/*
  Warnings:

  - You are about to drop the column `picture` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `blogPosts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "picture";

-- CreateIndex
CREATE UNIQUE INDEX "blogPosts_slug_key" ON "blogPosts"("slug");
