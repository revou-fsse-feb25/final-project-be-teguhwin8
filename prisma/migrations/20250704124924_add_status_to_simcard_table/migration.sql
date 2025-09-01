-- CreateEnum
CREATE TYPE "SimCardStatus" AS ENUM ('IN_USE', 'NOT_IN_USE');

-- AlterTable
ALTER TABLE "SimCard" ADD COLUMN     "status" "SimCardStatus";
