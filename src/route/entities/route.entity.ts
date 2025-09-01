import { Route as RouteModel } from '@prisma/client';

export default class RouteEntity implements RouteModel {
  id: string;
  operator: string;
  code: string;
  name: string;
  description: string;
  numberOfDriver: number;
  numberOfToll: number;
  numberOfFuel: number;
  numberOfOther: number;
  feeDriver: number;
  feeToll: number;
  feeFuel: number;
  feeOther: number;
  totalFeeDriver: number;
  totalFeeToll: number;
  totalFeeFuel: number;
  totalFeeOther: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
