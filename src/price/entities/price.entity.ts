import { Price as PriceModel } from '@prisma/client';

export default class PriceEntity implements PriceModel {
  id: string;
  name: string;
  routeId: string;
  up1Price: number;
  up2Price: number;
  basePrice: number;
  down1Price: number;
  down2Price: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
