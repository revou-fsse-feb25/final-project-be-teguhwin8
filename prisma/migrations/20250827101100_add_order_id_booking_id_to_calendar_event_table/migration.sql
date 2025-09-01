-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "orderId" TEXT;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
