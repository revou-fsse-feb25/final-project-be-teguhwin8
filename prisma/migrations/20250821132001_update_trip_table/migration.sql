/*
  Warnings:

  - The `status` column on the `Trips` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "statusTrip" AS ENUM ('PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Trips" DROP COLUMN "status",
ADD COLUMN     "status" "statusTrip" NOT NULL DEFAULT 'PENDING';
