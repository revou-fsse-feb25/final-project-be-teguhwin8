/*
  Warnings:

  - You are about to drop the column `deviceId` on the `AnomaliDevice` table. All the data in the column will be lost.
  - You are about to drop the column `deviceImei` on the `AnomaliDevice` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnomaliDevice" DROP CONSTRAINT "AnomaliDevice_deviceId_fkey";

-- AlterTable
ALTER TABLE "AnomaliDevice" DROP COLUMN "deviceId",
DROP COLUMN "deviceImei";
