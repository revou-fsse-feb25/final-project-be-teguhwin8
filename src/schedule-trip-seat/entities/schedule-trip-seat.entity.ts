import { ScheduleTripSeat as ScheduleTripSeatModel } from '@prisma/client';

export default class ScheduleTripSeatEntity implements ScheduleTripSeatModel {
  id: string;
  scheduleTripId: string;
  code: string;
  row: string;
  column: string;
  isHotSeat: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
