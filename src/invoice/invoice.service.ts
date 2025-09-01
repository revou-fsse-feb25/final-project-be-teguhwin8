import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalService } from '../global/global.service';
import axios from 'axios';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(data: any) {
    try {
      const code =
        data.code ||
        (await this.globalService.generateInvoiceCode(this.prisma));
      const invoice = await this.prisma.invoice.create({
        data: {
          code,
          customerId: data.customerId,
          totalPrice: data.totalPrice,
          date: data.date,
          external_id: data.external_id,
          status: data.status,
          merchant_name: data.merchant_name,
          amount: data.amount,
          payer_email: data.payer_email,
          description: data.description,
          paid_amount: data.paid_amount,
          currency: data.currency,
          paid_at: data.paid_at,
          payment_method: data.payment_method,
          payment_channel: data.payment_channel,
          payment_destination: data.payment_destination,
          success_redirect_url: data.success_redirect_url,
          failure_redirect_url: data.failure_redirect_url,
          bank_code: data.bank_code,
          ewallet_type: data.ewallet_type,
          url_payment: data.url_payment,
          data: data.data,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
          deletedAt: data.deletedAt ?? null,
        },
      });
      return this.globalService.response('Successfully created', invoice);
    } catch (error) {
      console.error('Create error:', error);
      throw new InternalServerErrorException('Failed to create invoice');
    }
  }

  async findAll() {
    try {
      const invoices = await this.prisma.invoice.findMany({
        where: { deletedAt: null },
        include: {
          customer: true,
          Order: {
            include: {
              OrderItem: {
                include: {
                  seat: true,
                },
              },
              invoice: true,
              customer: {
                include: {
                  user: true,
                },
              },
              voucher: true,
              trip: true,
            },
          },
        },
      });
      return this.globalService.response('Successfully', invoices);
    } catch (error) {
      console.error('Find all error:', error);
      throw new InternalServerErrorException('Failed to get invoices');
    }
  }

  async findOne(id: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          Order: {
            include: {
              OrderItem: {
                include: {
                  seat: true,
                },
              },
              invoice: true,
              customer: {
                include: {
                  user: true,
                },
              },
              voucher: true,
              trip: true,
            },
          },
        },
      });
      if (!invoice || invoice.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      return this.globalService.response('Successfully', invoice);
    } catch (error) {
      console.error('Find one error:', error);
      throw new InternalServerErrorException('Failed to get invoice');
    }
  }

  async update(id: string, data: any) {
    try {
      const invoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          customerId: data.customerId,
          totalPrice: data.totalPrice,
          date: data.date,
          external_id: data.external_id,
          status: data.status,
          merchant_name: data.merchant_name,
          amount: data.amount,
          payer_email: data.payer_email,
          description: data.description,
          paid_amount: data.paid_amount,
          currency: data.currency,
          paid_at: data.paid_at,
          payment_method: data.payment_method,
          payment_channel: data.payment_channel,
          payment_destination: data.payment_destination,
          success_redirect_url: data.success_redirect_url,
          failure_redirect_url: data.failure_redirect_url,
          bank_code: data.bank_code,
          ewallet_type: data.ewallet_type,
          url_payment: data.url_payment,
          data: data.data,
          updatedAt: new Date(),
        },
      });
      return this.globalService.response('Successfully updated', invoice);
    } catch (error) {
      console.error('Update error:', error);
      throw new InternalServerErrorException('Failed to update invoice');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.invoice.findUnique({ where: { id } });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const deleted = await this.prisma.invoice.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully deleted', deleted);
    } catch (error) {
      console.error('Delete error:', error);
      throw new InternalServerErrorException('Failed to delete invoice');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.invoice.findUnique({ where: { id } });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.invoice.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Restore error:', error);
      throw new InternalServerErrorException('Failed to restore invoice');
    }
  }

  async getXenditBank() {
    try {
      const apiKey = process.env.KEYXENDIT;

      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      };

      let bank;
      try {
        const response = await axios.get(
          'https://api.xendit.co/available_disbursements_banks',
          { headers },
        );
        bank = response.data;
      } catch (error) {
        console.error(
          'Error:',
          error.response ? error.response.data : error.message,
        );
      }
      return this.globalService.response('Successfully', bank);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
