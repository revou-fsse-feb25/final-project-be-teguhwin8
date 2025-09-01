-- CreateTable
CREATE TABLE "About" (
    "id" TEXT NOT NULL,
    "titleBanner" TEXT,
    "descriptionBanner" TEXT,
    "imageBanner" TEXT,
    "titleAbout" TEXT,
    "descriptionAbout" TEXT,
    "imageAbout" TEXT,
    "lastUpdateAuthorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "About_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "About" ADD CONSTRAINT "About_lastUpdateAuthorId_fkey" FOREIGN KEY ("lastUpdateAuthorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
