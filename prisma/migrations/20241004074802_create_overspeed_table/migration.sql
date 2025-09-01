-- CreateTable
CREATE TABLE "Overspeed" (
    "id" TEXT NOT NULL,
    "datetime" TEXT,
    "vehicleId" TEXT,
    "speed" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Overspeed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Overspeed" ADD CONSTRAINT "Overspeed_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
