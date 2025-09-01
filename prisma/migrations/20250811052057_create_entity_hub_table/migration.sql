/*
  Warnings:

  - You are about to drop the column `department` on the `CareerJob` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `CareerJob` table. All the data in the column will be lost.
  - You are about to drop the column `jobType` on the `CareerJob` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `CareerJob` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `CareerJob` table. All the data in the column will be lost.
  - You are about to drop the column `responsibilities` on the `CareerJob` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `CareerJob` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `Translation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entityId]` on the table `CareerJob` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityId]` on the table `Faq` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityId,languageId,field]` on the table `Translation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityId` to the `CareerJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `Faq` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Translation" DROP CONSTRAINT "Translation_entityId_fkey";

-- DropIndex
DROP INDEX "Translation_entityType_entityId_idx";

-- DropIndex
DROP INDEX "Translation_entityType_entityId_languageId_field_key";

-- AlterTable
ALTER TABLE "CareerJob" DROP COLUMN "department",
DROP COLUMN "description",
DROP COLUMN "jobType",
DROP COLUMN "location",
DROP COLUMN "requirements",
DROP COLUMN "responsibilities",
DROP COLUMN "title",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "entityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Translation" DROP COLUMN "entityType";

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerJob_entityId_key" ON "CareerJob"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Faq_entityId_key" ON "Faq"("entityId");

-- CreateIndex
CREATE INDEX "Translation_entityId_idx" ON "Translation"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_entityId_languageId_field_key" ON "Translation"("entityId", "languageId", "field");

-- AddForeignKey
ALTER TABLE "CareerJob" ADD CONSTRAINT "CareerJob_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
