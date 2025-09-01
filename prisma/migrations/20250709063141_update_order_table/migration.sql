-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerBankId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerBankId_fkey" FOREIGN KEY ("customerBankId") REFERENCES "CustomerBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
