-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_simcardId_fkey";

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_simcardId_fkey" FOREIGN KEY ("simcardId") REFERENCES "SimCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
