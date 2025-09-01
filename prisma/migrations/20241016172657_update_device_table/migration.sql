-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "operator" TEXT;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_operator_fkey" FOREIGN KEY ("operator") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;
