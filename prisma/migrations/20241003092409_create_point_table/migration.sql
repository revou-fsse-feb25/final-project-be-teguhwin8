-- CreateTable
CREATE TABLE "Point" (
    "id" TEXT NOT NULL,
    "operator" TEXT,
    "pointCode" TEXT,
    "name" TEXT,
    "description" TEXT,
    "lat" TEXT,
    "long" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Point_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_operator_fkey" FOREIGN KEY ("operator") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;
