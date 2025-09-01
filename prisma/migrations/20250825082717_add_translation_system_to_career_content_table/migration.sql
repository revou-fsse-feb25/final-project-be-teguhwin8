/*
  Warnings:

  - You are about to drop the column `contentData` on the `CareerContent` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `CareerContent` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `CareerContent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entityId]` on the table `CareerContent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityId` to the `CareerContent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CareerContent" DROP COLUMN "contentData",
DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CareerContentData" (
    "id" TEXT NOT NULL,
    "careerContentId" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "CareerContentData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerContent_entityId_key" ON "CareerContent"("entityId");

-- CreateIndex
CREATE INDEX "CareerContent_entityId_idx" ON "CareerContent"("entityId");

-- AddForeignKey
ALTER TABLE "CareerContent" ADD CONSTRAINT "CareerContent_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerContentData" ADD CONSTRAINT "CareerContentData_careerContentId_fkey" FOREIGN KEY ("careerContentId") REFERENCES "CareerContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
