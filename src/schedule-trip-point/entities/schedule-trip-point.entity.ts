import { ScheduleTripPoint as ScheduleTripPointModel } from '@prisma/client';

export default class ScheduleTripPointEntity implements ScheduleTripPointModel {
  id: string;
  scheduleTripId: string;
  routeId: string;
  pointId: string;
  isDeparture: boolean;
  isArrival: boolean;
  departureTime: string;
  arrivalTime: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
