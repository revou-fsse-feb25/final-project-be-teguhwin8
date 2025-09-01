/*
  Warnings:

  - You are about to drop the column `basePrice` on the `TripSeat` table. All the data in the column will be lost.
  - You are about to drop the column `finalPrice` on the `TripSeat` table. All the data in the column will be lost.
  - You are about to drop the column `finalPrice` on the `Trips` table. All the data in the column will be lost.
  - You are about to alter the column `basePrice` on the `Trips` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "TripSeat" DROP COLUMN "basePrice",
DROP COLUMN "finalPrice";

-- AlterTable
ALTER TABLE "Trips" DROP COLUMN "finalPrice",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "down1Price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "down2Price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "up1Price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "up2Price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "basePrice" SET DEFAULT 0,
ALTER COLUMN "basePrice" SET DATA TYPE DOUBLE PRECISION;
