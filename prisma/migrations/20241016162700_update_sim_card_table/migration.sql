-- AlterTable
ALTER TABLE "SimCard" ADD COLUMN     "operator" TEXT;

-- AddForeignKey
ALTER TABLE "SimCard" ADD CONSTRAINT "SimCard_operator_fkey" FOREIGN KEY ("operator") REFERENCES "Library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1
       FROM information_schema.table_constraints
       WHERE constraint_name = 'Driver_vehicleId_fkey'
   ) THEN
       ALTER TABLE "Driver"
       ADD CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId")
       REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
   END IF;
END $$;
