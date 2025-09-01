DO $$
BEGIN
   -- Drop Vehicle_driverId_fkey if it exists
   IF EXISTS (
       SELECT 1
       FROM information_schema.table_constraints
       WHERE constraint_name = 'Vehicle_driverId_fkey'
   ) THEN
       ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_driverId_fkey";
   END IF;

   -- Add Vehicle_driverId_fkey
   ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId")
   REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

   -- Drop Driver_vehicleId_fkey if it exists
   IF EXISTS (
       SELECT 1
       FROM information_schema.table_constraints
       WHERE constraint_name = 'Driver_vehicleId_fkey'
   ) THEN
       ALTER TABLE "Driver" DROP CONSTRAINT "Driver_vehicleId_fkey";
   END IF;

   -- Add Driver_vehicleId_fkey
   ALTER TABLE "Driver" ADD CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId")
   REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

END $$;
