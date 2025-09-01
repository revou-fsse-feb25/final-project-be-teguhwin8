/*
  Warnings:

  - You are about to drop the column `disclaimer` on the `FaqContent` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `FaqContent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entityId]` on the table `FaqContent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityId` to the `FaqContent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FaqContent" DROP COLUMN "disclaimer",
DROP COLUMN "title",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FaqContent_entityId_key" ON "FaqContent"("entityId");

-- CreateIndex
CREATE INDEX "FaqContent_entityId_idx" ON "FaqContent"("entityId");

-- AddForeignKey
ALTER TABLE "FaqContent" ADD CONSTRAINT "FaqContent_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
