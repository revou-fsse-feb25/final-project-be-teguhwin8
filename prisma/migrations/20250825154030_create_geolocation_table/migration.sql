-- CreateEnum
CREATE TYPE "GeolocationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Geolocation" (
    "id" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" "GeolocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Geolocation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Geolocation" ADD CONSTRAINT "Geolocation_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Library"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
