import { Invoice as InvoiceModel, Prisma } from '@prisma/client';

export default class InvoiceEntity implements InvoiceModel {
  id: string;
  code: string;
  customerId: string;
  totalPrice: number;
  date: string;
  external_id: string;
  status: string;
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  paid_amount: number;
  currency: string;
  paid_at: string;
  payment_method: string;
  payment_channel: string;
  payment_destination: string;
  success_redirect_url: string;
  failure_redirect_url: string;
  bank_code: string;
  ewallet_type: string;
  url_payment: string;
  data: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
