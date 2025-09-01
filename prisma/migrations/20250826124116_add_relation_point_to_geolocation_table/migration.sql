/*
  Warnings:

  - Added the required column `pointId` to the `Geolocation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Geolocation" ADD COLUMN     "pointId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Geolocation" ADD CONSTRAINT "Geolocation_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
