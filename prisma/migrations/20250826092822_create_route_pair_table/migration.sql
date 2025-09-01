-- CreateTable
CREATE TABLE "RoutePair" (
    "id" TEXT NOT NULL,
    "idOTA" SERIAL NOT NULL,
    "departureId" TEXT,
    "arrivalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RoutePair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoutePair_idOTA_key" ON "RoutePair"("idOTA");

-- AddForeignKey
ALTER TABLE "RoutePair" ADD CONSTRAINT "RoutePair_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Point"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutePair" ADD CONSTRAINT "RoutePair_arrivalId_fkey" FOREIGN KEY ("arrivalId") REFERENCES "Point"("id") ON DELETE SET NULL ON UPDATE CASCADE;
