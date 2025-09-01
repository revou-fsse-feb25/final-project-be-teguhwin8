/*
  Warnings:

  - A unique constraint covering the columns `[jobId,email]` on the table `CareerApplyJob` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CareerApplyJob_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplyJob_jobId_email_key" ON "CareerApplyJob"("jobId", "email");
