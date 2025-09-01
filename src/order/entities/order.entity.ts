import { Order as OrderModel, Prisma } from '@prisma/client';

export default class OrderEntity implements OrderModel {
  id: string;
  code: string;
  voucherId: string;
  customerBankId: string;
  customerId: string;
  invoiceId: string;
  tripId: string;
  date: string;
  canceledDate: string;
  rescheduleDate: string;
  status: string;
  totalPrice: number;
  cancelReason: string;
  discount: number;
  subtotal: number;
  dataRefund: Prisma.JsonValue;
  hasCalendarEvent: boolean;
  calendarProvider: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
