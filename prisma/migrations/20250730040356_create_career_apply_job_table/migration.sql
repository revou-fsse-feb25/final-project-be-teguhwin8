-- CreateTable
CREATE TABLE "CareerApplyJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "portfolio" TEXT,
    "portfolioFile" TEXT,
    "linkedinLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerApplyJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplyJob_email_key" ON "CareerApplyJob"("email");

-- AddForeignKey
ALTER TABLE "CareerApplyJob" ADD CONSTRAINT "CareerApplyJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CareerJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
