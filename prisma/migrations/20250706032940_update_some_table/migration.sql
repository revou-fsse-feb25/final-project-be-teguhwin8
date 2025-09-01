/*
  Warnings:

  - Added the required column `arivalCity` to the `Trips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `arivalId` to the `Trips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureCity` to the `Trips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureId` to the `Trips` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trips" ADD COLUMN     "arivalCity" TEXT NOT NULL,
ADD COLUMN     "arivalId" TEXT NOT NULL,
ADD COLUMN     "departureCity" TEXT NOT NULL,
ADD COLUMN     "departureId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Trips" ADD CONSTRAINT "Trips_arivalId_fkey" FOREIGN KEY ("arivalId") REFERENCES "Point"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trips" ADD CONSTRAINT "Trips_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Point"("id") ON DELETE CASCADE ON UPDATE CASCADE;
