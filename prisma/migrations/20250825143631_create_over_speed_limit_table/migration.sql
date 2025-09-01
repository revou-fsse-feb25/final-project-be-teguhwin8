-- CreateTable
CREATE TABLE "OverSpeedlimit" (
    "id" TEXT NOT NULL,
    "speedWarning" INTEGER DEFAULT 0,
    "speedLimit" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OverSpeedlimit_pkey" PRIMARY KEY ("id")
);
