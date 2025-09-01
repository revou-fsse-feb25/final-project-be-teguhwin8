-- AlterTable
ALTER TABLE "ScheduleTripPoint" ALTER COLUMN "departureTime" SET DATA TYPE TEXT,
ALTER COLUMN "arrivalTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ScheduleTripPointUpdates" ALTER COLUMN "departureTime" SET DATA TYPE TEXT,
ALTER COLUMN "arrivalTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ScheduleTrips" ALTER COLUMN "departureTime" SET DATA TYPE TEXT,
ALTER COLUMN "arrivalTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ScheduleTripsUpdates" ALTER COLUMN "departureTime" SET DATA TYPE TEXT,
ALTER COLUMN "arrivalTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TripPoint" ALTER COLUMN "departureTime" SET DATA TYPE TEXT,
ALTER COLUMN "arrivalTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Trips" ALTER COLUMN "departureTime" SET DATA TYPE TEXT,
ALTER COLUMN "arrivalTime" SET DATA TYPE TEXT;
