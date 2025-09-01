-- CreateTable
CREATE TABLE "CareerContent" (
    "id" TEXT NOT NULL,
    "sectionType" TEXT,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "contentData" JSONB,
    "lastUpdatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "CareerContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerJob" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "jobType" TEXT,
    "department" TEXT,
    "requirements" TEXT,
    "responsibilities" TEXT,
    "salaryRange" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "lastUpdatedById" TEXT,

    CONSTRAINT "CareerJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerContent_sectionType_idx" ON "CareerContent"("sectionType");

-- AddForeignKey
ALTER TABLE "CareerContent" ADD CONSTRAINT "CareerContent_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerJob" ADD CONSTRAINT "CareerJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerJob" ADD CONSTRAINT "CareerJob_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
