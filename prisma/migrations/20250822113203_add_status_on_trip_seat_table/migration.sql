-- CreateEnum
CREATE TYPE "statusTripSeat" AS ENUM ('AVAILABLE', 'ONHOLD', 'PAID', 'CHECKIN', 'BLOCKED');

-- AlterTable
ALTER TABLE "TripSeat" ADD COLUMN     "status" "statusTripSeat" NOT NULL DEFAULT 'AVAILABLE';
