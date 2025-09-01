import { Overspeed as OverspeedModel } from '@prisma/client';

export default class OverspeedEntity implements OverspeedModel {
  id: string;
  datetime: string;
  vehicleId: string;
  speed: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
