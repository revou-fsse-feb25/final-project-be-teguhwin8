-- CreateEnum
CREATE TYPE "SliderStatus" AS ENUM ('DRAFT', 'PUBLISH');

-- AlterTable
ALTER TABLE "Slider" ADD COLUMN     "status" "SliderStatus" NOT NULL DEFAULT 'DRAFT';
