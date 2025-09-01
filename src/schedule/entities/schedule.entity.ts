import { Schedules as SchedulesModel } from '@prisma/client';

export default class SchedulesEntity implements SchedulesModel {
  id: string;
  routeId: string;
  vehicleId: string;
  days: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
