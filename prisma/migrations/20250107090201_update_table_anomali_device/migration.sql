/*
  Warnings:

  - You are about to drop the column `latDateDevice` on the `AnomaliDevice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AnomaliDevice" DROP COLUMN "latDateDevice",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "lastLat" TEXT,
ADD COLUMN     "lastLong" TEXT,
ADD COLUMN     "newLat" TEXT,
ADD COLUMN     "newLong" TEXT;
