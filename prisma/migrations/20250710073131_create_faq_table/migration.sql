-- CreateEnum
CREATE TYPE "FaqStatus" AS ENUM ('draft', 'approved', 'rejected', 'deleted');

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "status" "FaqStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
