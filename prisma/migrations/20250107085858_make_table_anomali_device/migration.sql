-- CreateTable
CREATE TABLE "AnomaliDevice" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceImei" TEXT,
    "vehicleId" TEXT,
    "vehicleImei" TEXT,
    "latDateDevice" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AnomaliDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnomaliDevice_deviceId_key" ON "AnomaliDevice"("deviceId");

-- AddForeignKey
ALTER TABLE "AnomaliDevice" ADD CONSTRAINT "AnomaliDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomaliDevice" ADD CONSTRAINT "AnomaliDevice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
