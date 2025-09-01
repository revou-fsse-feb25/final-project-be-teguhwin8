-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "inspectionExpiryDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "odometerKm" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "registrationExpiryDate" TIMESTAMP(3),
ADD COLUMN     "serviceReminderIntervalKm" INTEGER DEFAULT 0;
