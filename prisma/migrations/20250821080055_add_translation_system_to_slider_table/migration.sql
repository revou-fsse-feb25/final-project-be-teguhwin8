/*
  Warnings:

  - You are about to drop the column `description` on the `Slider` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Slider` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entityId]` on the table `Slider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entityId` to the `Slider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Slider" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "entityId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Slider_entityId_key" ON "Slider"("entityId");

-- CreateIndex
CREATE INDEX "Slider_entityId_idx" ON "Slider"("entityId");

-- AddForeignKey
ALTER TABLE "Slider" ADD CONSTRAINT "Slider_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
