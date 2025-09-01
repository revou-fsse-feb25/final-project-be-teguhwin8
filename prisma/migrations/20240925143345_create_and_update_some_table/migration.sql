/*
  Warnings:

  - You are about to drop the column `deviceNumber` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `deviceid` on the `Device` table. All the data in the column will be lost.
  - The `initialDate` column on the `Device` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `driver` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `route` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_devices` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[simcardId]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[driverId]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_devices" DROP CONSTRAINT "user_devices_user_id_fkey";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "deviceNumber",
DROP COLUMN "deviceid",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "lastLongDate" TIMESTAMP(3),
ADD COLUMN     "simcardId" TEXT,
DROP COLUMN "initialDate",
ADD COLUMN     "initialDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "driver",
DROP COLUMN "route",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "routeId" TEXT;

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "user_devices";

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36),
    "app_id" TEXT,
    "device_id" TEXT,
    "language" TEXT,
    "time_zone" TEXT,
    "country" TEXT,
    "first_active_at" INTEGER,
    "last_active_at" INTEGER,
    "subscription_type" TEXT,
    "subscription_enabled" BOOLEAN NOT NULL DEFAULT true,
    "subscription_app_version" TEXT,
    "subscription_device_model" TEXT,
    "subscription_os_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimCard" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "telco" TEXT,
    "type" TEXT,
    "msisdNumber" TEXT,
    "simNumber" TEXT,
    "description" TEXT,
    "activeUntil" TEXT,
    "lastUsage" TEXT,
    "lastUsageDate" TIMESTAMP(3),
    "initialQuota" TEXT,
    "lastQuota" TEXT,
    "lastQuotaBalance" TEXT,
    "lastPulsaBalace" DOUBLE PRECISION,
    "lastPulsaDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SimCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "operator" TEXT,
    "shift" TEXT,
    "code" TEXT,
    "name" TEXT,
    "vehicleId" TEXT,
    "routeId" TEXT,
    "mobilePhone" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "operator" TEXT,
    "code" TEXT,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_user_id_key" ON "UserDevice"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SimCard_deviceId_key" ON "SimCard"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_vehicleId_key" ON "Driver"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_simcardId_key" ON "Device"("simcardId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_driverId_key" ON "Vehicle"("driverId");

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_simcardId_fkey" FOREIGN KEY ("simcardId") REFERENCES "SimCard"("deviceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimCard" ADD CONSTRAINT "SimCard_telco_fkey" FOREIGN KEY ("telco") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimCard" ADD CONSTRAINT "SimCard_type_fkey" FOREIGN KEY ("type") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("vehicleId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_operator_fkey" FOREIGN KEY ("operator") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_shift_fkey" FOREIGN KEY ("shift") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_operator_fkey" FOREIGN KEY ("operator") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;
