-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "feeDriver" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "feeFuel" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "feeOther" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "feeToll" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "numberOfDriver" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "numberOfFuel" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "numberOfOther" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "numberOfToll" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalFeeDriver" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalFeeFuel" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalFeeOther" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalFeeToll" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "limitOverSpeed" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "VehicleSeat" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "code" TEXT,
    "row" TEXT,
    "column" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VehicleSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedules" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "days" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTrips" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "departureTime" TIME(6) NOT NULL,
    "arrivalTime" TIME(6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleTrips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTripSeat" (
    "id" TEXT NOT NULL,
    "scheduleTripId" TEXT NOT NULL,
    "code" TEXT,
    "row" TEXT,
    "column" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleTripSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTripPoint" (
    "id" TEXT NOT NULL,
    "scheduleTripId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "isDeparture" BOOLEAN NOT NULL DEFAULT false,
    "isArrival" BOOLEAN NOT NULL DEFAULT false,
    "departureTime" TIME(6) NOT NULL,
    "arrivalTime" TIME(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleTripPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTripsUpdates" (
    "id" TEXT NOT NULL,
    "scheduleTripId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "departureTime" TIME(6) NOT NULL,
    "arrivalTime" TIME(6) NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleTripsUpdates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTripSeatUpdates" (
    "id" TEXT NOT NULL,
    "scheduleTripSeatId" TEXT NOT NULL,
    "code" TEXT,
    "row" TEXT,
    "column" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleTripSeatUpdates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleTripPointUpdates" (
    "id" TEXT NOT NULL,
    "scheduleTripPointId" TEXT NOT NULL,
    "isDeparture" BOOLEAN NOT NULL DEFAULT false,
    "isArrival" BOOLEAN NOT NULL DEFAULT false,
    "departureTime" TIME(6) NOT NULL,
    "arrivalTime" TIME(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleTripPointUpdates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trips" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "departureCode" TEXT NOT NULL,
    "departureName" TEXT NOT NULL,
    "arivalCode" TEXT NOT NULL,
    "arivalName" TEXT NOT NULL,
    "driverCode" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "vehicleLicense" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "feeDriver" DOUBLE PRECISION DEFAULT 0,
    "feeToll" DOUBLE PRECISION DEFAULT 0,
    "feeFuel" DOUBLE PRECISION DEFAULT 0,
    "feeOther" DOUBLE PRECISION DEFAULT 0,
    "feeTotal" DOUBLE PRECISION DEFAULT 0,
    "departureTime" TIME(6) NOT NULL,
    "arrivalTime" TIME(6) NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSeat" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "code" TEXT,
    "row" TEXT,
    "column" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TripSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPoint" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "isDeparture" BOOLEAN NOT NULL DEFAULT false,
    "isArrival" BOOLEAN NOT NULL DEFAULT false,
    "departureTime" TIME(6) NOT NULL,
    "arrivalTime" TIME(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TripPoint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleSeat" ADD CONSTRAINT "VehicleSeat_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedules" ADD CONSTRAINT "Schedules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedules" ADD CONSTRAINT "Schedules_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTrips" ADD CONSTRAINT "ScheduleTrips_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTrips" ADD CONSTRAINT "ScheduleTrips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTrips" ADD CONSTRAINT "ScheduleTrips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripSeat" ADD CONSTRAINT "ScheduleTripSeat_scheduleTripId_fkey" FOREIGN KEY ("scheduleTripId") REFERENCES "ScheduleTrips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripPoint" ADD CONSTRAINT "ScheduleTripPoint_scheduleTripId_fkey" FOREIGN KEY ("scheduleTripId") REFERENCES "ScheduleTrips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripPoint" ADD CONSTRAINT "ScheduleTripPoint_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripPoint" ADD CONSTRAINT "ScheduleTripPoint_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripsUpdates" ADD CONSTRAINT "ScheduleTripsUpdates_scheduleTripId_fkey" FOREIGN KEY ("scheduleTripId") REFERENCES "ScheduleTrips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripsUpdates" ADD CONSTRAINT "ScheduleTripsUpdates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripSeatUpdates" ADD CONSTRAINT "ScheduleTripSeatUpdates_scheduleTripSeatId_fkey" FOREIGN KEY ("scheduleTripSeatId") REFERENCES "ScheduleTripSeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleTripPointUpdates" ADD CONSTRAINT "ScheduleTripPointUpdates_scheduleTripPointId_fkey" FOREIGN KEY ("scheduleTripPointId") REFERENCES "ScheduleTripPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trips" ADD CONSTRAINT "Trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trips" ADD CONSTRAINT "Trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trips" ADD CONSTRAINT "Trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSeat" ADD CONSTRAINT "TripSeat_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPoint" ADD CONSTRAINT "TripPoint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPoint" ADD CONSTRAINT "TripPoint_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPoint" ADD CONSTRAINT "TripPoint_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point"("id") ON DELETE CASCADE ON UPDATE CASCADE;
