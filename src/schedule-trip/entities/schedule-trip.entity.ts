import { ScheduleTrips as ScheduleTripsModel } from '@prisma/client';

export default class ScheduleTripsEntity implements ScheduleTripsModel {
  id: string;
  scheduleId: string;
  vehicleId: string;
  driverId: string;
  departureTime: string;
  arrivalTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
