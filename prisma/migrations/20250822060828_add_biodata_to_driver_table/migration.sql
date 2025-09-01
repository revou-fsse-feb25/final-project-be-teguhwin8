/*
  Warnings:

  - A unique constraint covering the columns `[nik]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[simNumber]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "ktpPhotoUrl" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "simExpiryDate" TIMESTAMP(3),
ADD COLUMN     "simNumber" TEXT,
ADD COLUMN     "simPhotoUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_nik_key" ON "Driver"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_simNumber_key" ON "Driver"("simNumber");
