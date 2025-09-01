/*
  Warnings:

  - You are about to drop the column `basePrice` on the `ScheduleTripSeat` table. All the data in the column will be lost.
  - You are about to drop the column `finalPrice` on the `ScheduleTripSeat` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `ScheduleTrips` table. All the data in the column will be lost.
  - You are about to drop the column `finalPrice` on the `ScheduleTrips` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ScheduleTripSeat" DROP COLUMN "basePrice",
DROP COLUMN "finalPrice",
ADD COLUMN     "isHotSeat" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ScheduleTrips" DROP COLUMN "basePrice",
DROP COLUMN "finalPrice";
