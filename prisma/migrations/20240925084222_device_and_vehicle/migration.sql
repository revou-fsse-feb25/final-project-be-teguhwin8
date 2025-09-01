-- AlterTable
ALTER TABLE "DeviceLogs" ADD COLUMN     "distance" TEXT,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "master" TEXT,
    "values" TEXT,
    "name" TEXT,
    "description" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "brand" TEXT,
    "type" TEXT,
    "name" TEXT,
    "imei" TEXT,
    "deviceid" TEXT,
    "lastLat" TEXT,
    "lastLong" TEXT,
    "initialLat" TEXT,
    "initialLong" TEXT,
    "initialDate" TEXT,
    "deviceNumber" TEXT,
    "mac" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "operator" TEXT,
    "type" TEXT,
    "name" TEXT,
    "licensePlate" TEXT,
    "driver" TEXT,
    "route" TEXT,
    "deviceId" TEXT,
    "deviceImei" TEXT,
    "totalDistanceMeter" DOUBLE PRECISION DEFAULT 0,
    "totalDistanceKiloMeter" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_brand_fkey" FOREIGN KEY ("brand") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_type_fkey" FOREIGN KEY ("type") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_operator_fkey" FOREIGN KEY ("operator") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_type_fkey" FOREIGN KEY ("type") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
