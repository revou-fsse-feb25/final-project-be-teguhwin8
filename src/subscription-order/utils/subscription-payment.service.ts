import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

export interface XenditCreateInput {
  customerId: string;
  voucherId?: string;
  amount: number;
  duration: number;
  startDate?: string;
  phone?: string;
  name?: string;
}

@Injectable()
export class SubscriptionPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  private addMonths(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }
  private toISODate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  async xenditCreate(request: XenditCreateInput) {
    try {
      const codeInvoice = await this.globalService.generateInvoiceCode(
        this.prisma,
      );

      const customer = await this.prisma.customer.findFirst({
        where: { id: request.customerId, deletedAt: null },
        include: { user: true },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      const amount = request.amount ?? 0;
      const duration = request.duration ?? 1;
      const voucherId: string | null = request.voucherId ?? null;
      let voucherName: string | null = null;

      if (voucherId) {
        const voucher = await this.prisma.voucher.findFirst({
          where: { id: voucherId, deletedAt: null },
        });
        if (!voucher) throw new NotFoundException('Voucher not found');
        voucherName = voucher.name ?? 'Subscription Voucher';
      }

      const apiKey = process.env.KEYXENDIT;
      if (!apiKey)
        throw new InternalServerErrorException('Xendit API key missing');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      };

      const adminFee = 6500;
      const SUCCESS_URL =
        process.env.APP_SUCCESS_URL ||
        'https://stg-travl.himovy.com/payment/payment-success';
      const FAILED_URL =
        process.env.APP_FAILED_URL ||
        'https://stg-travl.himovy.com/payment/payment-failed';

      const createInvoiceParams = {
        external_id: codeInvoice,
        amount: amount + adminFee,
        description: voucherName
          ? `Purchase ${voucherName}`
          : 'Payment for Subscription',
        invoice_duration: 1200,
        currency: 'IDR',
        success_redirect_url: SUCCESS_URL,
        failure_redirect_url: FAILED_URL,
        customer: {
          given_names: customer.user?.name || request.name || 'customer',
          surname: customer.user?.name || request.name || 'customer',
          email: customer.user?.email || 'git@hijaudigital.com',
          mobile_number:
            customer.user?.phoneNumber || request.phone || '081190046494',
          addresses: [
            {
              city: 'Jakarta',
              country: 'Indonesia',
              postal_code: '12345',
              state: customer.address || 'Jakarta',
              street_line1: '-- SUBS --',
              street_line2: '-- SUBS --',
            },
          ],
        },
        customer_notification_preference: {
          invoice_created: ['whatsapp', 'email'],
          invoice_reminder: ['whatsapp', 'email'],
          invoice_paid: ['whatsapp', 'email'],
          invoice_expired: ['whatsapp', 'email'],
        },
        fees: [{ type: 'admin', value: adminFee }],
      };

      const { data: xendit } = await axios.post(
        'https://api.xendit.co/v2/invoices',
        createInvoiceParams,
        { headers },
      );

      let invoice = await this.prisma.invoice.findFirst({
        where: { external_id: codeInvoice, deletedAt: null },
      });

      if (!invoice) {
        invoice = await this.prisma.invoice.create({
          data: {
            code: codeInvoice,
            customerId: request.customerId,
            totalPrice: amount,
            date: this.toISODate(new Date()),
            external_id: codeInvoice,
            status: 'PENDING',
            merchant_name: 'SUBS',
            amount,
            payer_email: customer.user?.email || 'git@hijaudigital.com',
            description: voucherName
              ? `Purchase ${voucherName}`
              : 'Payment for Subscription',
            success_redirect_url: SUCCESS_URL,
            failure_redirect_url: FAILED_URL,
            url_payment: xendit.invoice_url,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        });
      }

      const start = request.startDate
        ? new Date(request.startDate)
        : new Date();
      const end = this.addMonths(start, duration);

      const existingOrder = await this.prisma.subscriptionOrder.findFirst({
        where: {
          OR: [
            { invoiceId: invoice.id },
            { paymentGatewayId: xendit.id || '' },
          ],
          deletedAt: null,
        },
        include: { customer: true, voucher: true, invoice: true },
      });

      if (existingOrder) {
        return this.globalService.response('Subscription already created', {
          invoice,
          subscriptionOrder: existingOrder,
          xendit,
        });
      }

      const maxRetry = 5;
      let subscriptionOrder: any = null;

      for (let i = 0; i < maxRetry; i++) {
        const orderCode = await this.globalService.generateOrderCode(
          this.prisma,
        );
        try {
          subscriptionOrder = await this.prisma.subscriptionOrder.create({
            data: {
              orderCode,
              customerId: request.customerId,
              voucherId,
              invoiceId: invoice.id,
              amount,
              duration,
              expiredDate: null,
              paymentStatus: PaymentStatus.PENDING,
              subscriptionStatus: SubscriptionStatus.INACTIVE,
              startDate: start,
              endDate: end,
              renewalDate: end,
              paymentGatewayId: xendit.id || null,
              paymentUrl: xendit.invoice_url || null,
              phone: request.phone || null,
              name: request.name || null,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            },
            include: { customer: true, voucher: true, invoice: true },
          });
          break;
        } catch (e: any) {
          if (e?.code === 'P2002' && e?.meta?.target?.includes('orderCode')) {
            if (i === maxRetry - 1) {
              throw new InternalServerErrorException(
                'Failed to generate unique orderCode after retries',
              );
            }
            continue;
          }
          throw e;
        }
      }

      return this.globalService.response(
        'Successfully created subscription invoice',
        {
          invoice,
          subscriptionOrder,
          xendit,
        },
      );
    } catch (error) {
      console.error(
        '[SubscriptionPaymentService][xenditCreate] Error:',
        error?.response?.data || error,
      );
      throw new InternalServerErrorException(
        'Failed to create subscription order',
      );
    }
  }

  async xenditCallback(payload: any) {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: { external_id: payload.external_id },
      });
      if (!invoice) {
        return this.globalService.response('Invoice not found', {}, 404);
      }

      const status: string = payload.status;
      let paidAt: string | null = null;

      if (status === 'PAID') {
        const dateObj = new Date(payload.paid_at || Date.now());
        const jakarta = new Date(
          dateObj.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
        );
        const yy = String(jakarta.getFullYear()).slice(2);
        const mm = String(jakarta.getMonth() + 1).padStart(2, '0');
        const dd = String(jakarta.getDate()).padStart(2, '0');
        const h = String(jakarta.getHours()).padStart(2, '0');
        const i = String(jakarta.getMinutes()).padStart(2, '0');
        const s = String(jakarta.getSeconds()).padStart(2, '0');
        paidAt = `${yy}-${mm}-${dd} ${h}:${i}:${s}`;
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: status,
          paid_at: paidAt,
          paid_amount:
            status === 'PAID' ? payload.paid_amount || invoice.paid_amount : 0,
          currency: payload.currency || invoice.currency,
          payment_method: payload.payment_method || invoice.payment_method,
          payment_channel: payload.payment_channel || invoice.payment_channel,
          payment_destination:
            payload.payment_destination || invoice.payment_destination,
          bank_code: payload.bank_code || invoice.bank_code,
          ewallet_type: payload.ewallet_type || invoice.ewallet_type,
          data: payload,
          updatedAt: new Date(),
        },
      });

      const subOrder = await this.prisma.subscriptionOrder.findFirst({
        where: { invoiceId: invoice.id },
      });
      if (!subOrder) {
        return this.globalService.response(
          'Callback processed (no subscription order found)',
          { status },
        );
      }

      if (status === 'PAID') {
        const start = subOrder.startDate ?? new Date();
        const end = this.addMonths(new Date(start), subOrder.duration);

        await this.prisma.subscriptionOrder.update({
          where: { id: subOrder.id },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            startDate: start,
            endDate: end,
            renewalDate: end,
            updatedAt: new Date(),
          },
        });
      } else if (status === 'EXPIRED') {
        await this.prisma.subscriptionOrder.update({
          where: { id: subOrder.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            subscriptionStatus: SubscriptionStatus.INACTIVE,
            updatedAt: new Date(),
          },
        });
      } else if (status === 'PENDING') {
        await this.prisma.subscriptionOrder.update({
          where: { id: subOrder.id },
          data: {
            paymentStatus: PaymentStatus.PENDING,
            updatedAt: new Date(),
          },
        });
      }

      return this.globalService.response('Callback processed', { status });
    } catch (error) {
      console.error(
        '[SubscriptionPaymentService][xenditCallback] Error:',
        error,
      );
      throw new InternalServerErrorException('Failed to process callback');
    }
  }
}
