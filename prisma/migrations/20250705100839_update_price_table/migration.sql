/*
  Warnings:

  - You are about to drop the column `reducePrice` on the `Price` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Price" DROP COLUMN "reducePrice",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
