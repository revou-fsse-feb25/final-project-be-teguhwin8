/*
  Warnings:

  - A unique constraint covering the columns `[idOTA]` on the table `Trips` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Trips" ADD COLUMN     "idOTA" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Trips_idOTA_key" ON "Trips"("idOTA");
