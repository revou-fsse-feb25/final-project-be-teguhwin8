import { VehicleSeat as VehicleSeatModel } from '@prisma/client';

export default class VehicleSeatEntity implements VehicleSeatModel {
  id: string;
  vehicleId: string;
  code: string;
  row: string;
  column: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
