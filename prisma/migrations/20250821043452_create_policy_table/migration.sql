-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('RESCHEDULE_POLICY', 'REFUND_CANCEL_POLICY', 'TERMS_AND_CONDITIONS');

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Policy_type_key" ON "Policy"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_entityId_key" ON "Policy"("entityId");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
