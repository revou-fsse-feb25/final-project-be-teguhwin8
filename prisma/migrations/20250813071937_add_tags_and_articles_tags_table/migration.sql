/*
  Warnings:

  - You are about to drop the column `categoryEnglish` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `categoryIndonesian` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `contentEnglish` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `contentIndonesian` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `titleEnglish` on the `Articles` table. All the data in the column will be lost.
  - You are about to drop the column `titleIndonesian` on the `Articles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entityId]` on the table `Articles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityId` to the `Articles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Articles" DROP COLUMN "categoryEnglish",
DROP COLUMN "categoryIndonesian",
DROP COLUMN "contentEnglish",
DROP COLUMN "contentIndonesian",
DROP COLUMN "tags",
DROP COLUMN "titleEnglish",
DROP COLUMN "titleIndonesian",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTag" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_entityId_key" ON "Tag"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_entityId_idx" ON "Tag"("entityId");

-- CreateIndex
CREATE INDEX "ArticleTag_tagId_idx" ON "ArticleTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Articles_entityId_key" ON "Articles"("entityId");

-- CreateIndex
CREATE INDEX "Articles_entityId_idx" ON "Articles"("entityId");

-- CreateIndex
CREATE INDEX "Articles_authorId_idx" ON "Articles"("authorId");

-- AddForeignKey
ALTER TABLE "Articles" ADD CONSTRAINT "Articles_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
