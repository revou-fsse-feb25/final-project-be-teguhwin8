-- CreateTable
CREATE TABLE "Features" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserManual" (
    "id" TEXT NOT NULL,
    "featuresId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserManual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserManualStep" (
    "id" TEXT NOT NULL,
    "userManualId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "files" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserManualStep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserManual" ADD CONSTRAINT "UserManual_featuresId_fkey" FOREIGN KEY ("featuresId") REFERENCES "Features"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserManualStep" ADD CONSTRAINT "UserManualStep_userManualId_fkey" FOREIGN KEY ("userManualId") REFERENCES "UserManual"("id") ON DELETE CASCADE ON UPDATE CASCADE;
