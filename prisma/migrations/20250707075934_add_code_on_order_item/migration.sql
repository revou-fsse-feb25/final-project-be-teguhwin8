/*
  Warnings:

  - Added the required column `code` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "code" TEXT NOT NULL;
