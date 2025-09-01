-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "badgeBanner" TEXT,
    "titleBanner" TEXT,
    "descriptionBanner" TEXT,
    "imageBanner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);
