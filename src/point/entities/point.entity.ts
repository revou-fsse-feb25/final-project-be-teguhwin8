import { Point as PointModel } from '@prisma/client';

export default class PointEntity implements PointModel {
  id: string;
  idOTA: number;
  operator: string;
  pointCode: string;
  name: string;
  description: string;
  lat: string;
  long: string;
  city: string;
  image: string;
  operatingHours: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
