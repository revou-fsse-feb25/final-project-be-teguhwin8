-- AlterTable
ALTER TABLE "Trips" ADD COLUMN     "checkIn" INTEGER DEFAULT 0,
ADD COLUMN     "departureTimeActual" TEXT,
ADD COLUMN     "duration" INTEGER DEFAULT 0,
ADD COLUMN     "isRound" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "package" INTEGER DEFAULT 0,
ADD COLUMN     "seatCapacity" INTEGER DEFAULT 0,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "ticketSold" INTEGER DEFAULT 0;
