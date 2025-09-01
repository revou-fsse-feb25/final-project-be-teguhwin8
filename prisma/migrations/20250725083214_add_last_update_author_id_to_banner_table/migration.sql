-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "lastUpdateAuthorId" TEXT;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_lastUpdateAuthorId_fkey" FOREIGN KEY ("lastUpdateAuthorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
