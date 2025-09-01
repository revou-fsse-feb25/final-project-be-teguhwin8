/*
  Warnings:

  - A unique constraint covering the columns `[idOTA]` on the table `Point` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Point" ADD COLUMN     "idOTA" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Point_idOTA_key" ON "Point"("idOTA");
