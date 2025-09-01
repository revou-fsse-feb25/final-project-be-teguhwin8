-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "calendarProvider" TEXT,
ADD COLUMN     "hasCalendarEvent" BOOLEAN NOT NULL DEFAULT false;
