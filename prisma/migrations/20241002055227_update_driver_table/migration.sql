/*
  Warnings:

  - You are about to drop the column `routeId` on the `Driver` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_routeId_fkey";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "routeId";
