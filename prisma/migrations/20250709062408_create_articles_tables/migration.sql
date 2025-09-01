-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('draft', 'approved', 'rejected', 'deleted');

-- CreateTable
CREATE TABLE "Articles" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "titleIndonesian" TEXT,
    "titleEnglish" TEXT,
    "contentIndonesian" TEXT,
    "contentEnglish" TEXT,
    "categoryIndonesian" TEXT,
    "categoryEnglish" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" "ArticleStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Articles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Articles" ADD CONSTRAINT "Articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
