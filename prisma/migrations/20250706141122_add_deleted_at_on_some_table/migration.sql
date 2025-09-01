-- AlterTable
ALTER TABLE "Features" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserManual" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserManualStep" ADD COLUMN     "deletedAt" TIMESTAMP(3);
