-- CreateTable
CREATE TABLE "FaqContent" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "disclaimer" TEXT,
    "link" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FaqContent_pkey" PRIMARY KEY ("id")
);
