-- CreateTable
CREATE TABLE "CustomerBank" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "nameAccount" TEXT,
    "codeAccount" TEXT NOT NULL,
    "nameBank" TEXT NOT NULL,
    "codeBank" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerBank_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomerBank" ADD CONSTRAINT "CustomerBank_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
