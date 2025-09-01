import { $Enums, Voucher as VoucherModel } from '@prisma/client';

export default class VoucherEntity implements VoucherModel {
  id: string;
  routeId: string;
  code: string;
  price: number;
  quota: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  voucherType: $Enums.voucherType;
  discountType: $Enums.discountType;
  discount: number;
  usageLimit: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
