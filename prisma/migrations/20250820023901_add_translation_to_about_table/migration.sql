/*
  Warnings:

  - You are about to drop the column `descriptionAbout` on the `About` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionBanner` on the `About` table. All the data in the column will be lost.
  - You are about to drop the column `titleAbout` on the `About` table. All the data in the column will be lost.
  - You are about to drop the column `titleBanner` on the `About` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entityId]` on the table `About` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "About" DROP COLUMN "descriptionAbout",
DROP COLUMN "descriptionBanner",
DROP COLUMN "titleAbout",
DROP COLUMN "titleBanner",
ADD COLUMN     "entityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "About_entityId_key" ON "About"("entityId");

-- CreateIndex
CREATE INDEX "About_entityId_idx" ON "About"("entityId");

-- CreateIndex
CREATE INDEX "About_lastUpdateAuthorId_idx" ON "About"("lastUpdateAuthorId");

-- AddForeignKey
ALTER TABLE "About" ADD CONSTRAINT "About_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
