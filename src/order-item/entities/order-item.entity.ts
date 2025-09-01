import { OrderItem as OrderItemModel } from '@prisma/client';

export default class OrderItemEntity implements OrderItemModel {
  id: string;
  code: string;
  tripSeatId: string;
  orderId: string;
  name: string;
  address: string;
  phoneNumber: string;
  price: number;
  discount: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
