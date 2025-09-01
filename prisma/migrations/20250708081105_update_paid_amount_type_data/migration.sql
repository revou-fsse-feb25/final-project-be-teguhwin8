/*
  Warnings:

  - The `paid_amount` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "paid_amount",
ADD COLUMN     "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
