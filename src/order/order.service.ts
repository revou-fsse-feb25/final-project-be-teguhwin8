/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import axios from 'axios';
import {
  AudienceScope,
  NotificationChannel,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import {
  buildDepartureTimeLabel,
  buildRouteLabel,
  buildVehicleLabel,
  formatDateID,
  getSeatLabel,
} from './utils/order.sender';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(data: any) {
    try {
      const code =
        data.code || (await this.globalService.generateOrderCode(this.prisma));
      const order = await this.prisma.order.create({
        data: {
          code,
          voucherId: data.voucherId || null,
          customerId: data.customerId,
          invoiceId: data.invoiceId,
          tripId: data.tripId,
          date: data.date,
          canceledDate: data.canceledDate || null,
          rescheduleDate: data.rescheduleDate || null,
          status: data.status,
          totalPrice: data.totalPrice,
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
          deletedAt: data.deletedAt ?? null,
        },
      });
      return this.globalService.response('Successfully created', order);
    } catch (error) {
      console.error('Create error:', error);
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async findAll(params: {
    customerId?: string;
    externalId?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const {
      customerId,
      externalId,
      search,
      status,
      page = 1,
      limit = 10,
    } = params;

    try {
      const whereClause: any = {
        deletedAt: null,
      };

      if (customerId) {
        whereClause.customerId = customerId;
      }

      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.OR = [
          {
            customer: {
              user: {
                name: {
                  contains: search,
                },
              },
            },
          },
          {
            trip: {
              name: {
                contains: search,
              },
            },
          },
        ];
      }

      const skip = (page - 1) * limit;

      const [rawOrders, totalRaw] = await Promise.all([
        this.prisma.order.findMany({
          where: whereClause,
          skip,
          take: limit,
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
        }),
        this.prisma.order.count({ where: whereClause }),
      ]);

      const filteredOrders = externalId
        ? rawOrders.filter(
            (order) =>
              order.invoice?.external_id
                ?.toLowerCase()
                .includes(externalId.toLowerCase()),
          )
        : rawOrders;

      return {
        message: 'Successfully retrieved orders',
        data: filteredOrders,
        pagination: {
          total: externalId ? filteredOrders.length : totalRaw,
          page,
          limit,
          totalPages: Math.ceil(
            (externalId ? filteredOrders.length : totalRaw) / limit,
          ),
        },
      };
    } catch (error) {
      console.error('Find all error:', error);
      throw new InternalServerErrorException('Failed to get orders');
    }
  }

  async findOne(id: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
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
      });
      if (!order || order.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      return this.globalService.response('Successfully', order);
    } catch (error) {
      console.error('Find one error:', error);
      throw new InternalServerErrorException('Failed to get order');
    }
  }

  async checkTicket(externalId: string) {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: { external_id: externalId },
      });

      if (!invoice) {
        return this.globalService.response('Ticket Not Found!', {});
      }

      const ticketDetail = await this.prisma.order.findFirst({
        where: { invoiceId: invoice.id },
        include: {
          customerBank: true,
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
      });

      if (!ticketDetail || ticketDetail.deletedAt) {
        return this.globalService.response('Order Not Found!', {});
      }

      return this.globalService.response('Successfully', ticketDetail);
    } catch (error) {
      console.error('Find by invoice.external_id error:', error);
      throw new InternalServerErrorException('Failed to get order by invoice');
    }
  }

  async update(id: string, data: any) {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: {
          voucherId: data.voucherId || null,
          customerId: data.customerId,
          invoiceId: data.invoiceId,
          tripId: data.tripId,
          date: data.date,
          canceledDate: data.canceledDate || null,
          rescheduleDate: data.rescheduleDate || null,
          status: data.status,
          totalPrice: data.totalPrice,
          updatedAt: new Date(),
        },
      });
      return this.globalService.response('Successfully updated', order);
    } catch (error) {
      console.error('Update error:', error);
      throw new InternalServerErrorException('Failed to update order');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.order.findUnique({ where: { id } });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const deleted = await this.prisma.order.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully deleted', deleted);
    } catch (error) {
      console.error('Delete error:', error);
      throw new InternalServerErrorException('Failed to delete order');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.order.findUnique({ where: { id } });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.order.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Restore error:', error);
      throw new InternalServerErrorException('Failed to restore order');
    }
  }

  async xenditCreate(request: any) {
    try {
      const codeInvoice = await this.globalService.generateInvoiceCode(
        this.prisma,
      );
      let totalPriceAfterDiscount = request.totalPrice || 0;
      let discount = 0;
      if (request.voucherId) {
        const voucher = await this.prisma.voucher.findUnique({
          where: { id: request.voucherId, deletedAt: null },
        });
        if (!voucher) {
          throw new InternalServerErrorException('Voucher not found');
        }
        if (voucher.discountType === 'PERCENTAGE') {
          discount = (request.totalPrice * voucher.discount) / 100;
          totalPriceAfterDiscount -= discount;
        } else {
          discount = voucher.discount;
          totalPriceAfterDiscount -= discount;
        }
      }
      const customer = await this.prisma.customer.findUnique({
        where: { id: request.customerId, deletedAt: null },
        include: {
          user: true,
        },
      });
      const apiKey = process.env.KEYXENDIT;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
      };
      const adminFee = 6500;
      const createInvoiceParams = {
        external_id: codeInvoice,
        amount: totalPriceAfterDiscount + adminFee,
        description: 'Payment for Order',
        invoice_duration: 1200,
        currency: 'IDR',
        success_redirect_url:
          'https://stg-travl.himovy.com/payment/payment-success',
        failure_redirect_url:
          'https://stg-travl.himovy.com/payment/payment-failed',
        customer: {
          given_names: customer.user.name || 'customer',
          surname: customer.user.name || 'customer',
          email: customer.user.email || 'git@hijaudigital.com',
          mobile_number: customer.user.phoneNumber || '081190046494',
          addresses: [
            {
              city: 'Jakarta',
              country: 'Indonesia',
              postal_code: '12345',
              state: customer.address || 'Jakarta',
              street_line1: '-- TRVL --',
              street_line2: '-- TRVL --',
            },
          ],
        },
        customer_notification_preference: {
          invoice_created: ['whatsapp', 'email'],
          invoice_reminder: ['whatsapp', 'email'],
          invoice_paid: ['whatsapp', 'email'],
          invoice_expired: ['whatsapp', 'email'],
        },
        fees: [
          {
            type: 'admin',
            value: 6500,
          },
        ],
      };
      const response = await axios.post(
        'https://api.xendit.co/v2/invoices',
        createInvoiceParams,
        { headers },
      );
      const xendit = response.data;
      const invoice = await this.prisma.invoice.create({
        data: {
          code: codeInvoice,
          customerId: request.customerId,
          totalPrice: totalPriceAfterDiscount,
          date: new Date().toISOString().slice(0, 10),
          external_id: codeInvoice,
          status: request.status || 'PENDING',
          merchant_name: 'TRVL',
          amount: totalPriceAfterDiscount,
          payer_email: customer.user.email || 'git@hijaudigital.com',
          description: 'Payment for Order',
          success_redirect_url:
            'https://stg-travl.himovy.com/payment/payment-success',
          failure_redirect_url:
            'https://stg-travl.himovy.com/payment/payment-failed',
          url_payment: xendit.invoice_url,
          createdAt: request.createdAt ?? new Date(),
          updatedAt: request.updatedAt ?? new Date(),
          deletedAt: request.deletedAt ?? null,
        },
      });
      const order = await this.prisma.order.create({
        data: {
          code: await this.globalService.generateOrderCode(this.prisma),
          voucherId: request.voucherId || null,
          customerId: request.customerId,
          invoiceId: invoice.id,
          tripId: request.tripId,
          date: new Date().toISOString().slice(0, 10),
          status: request.status,
          totalPrice: request.totalPrice || 0,
          discount: discount,
          subtotal: totalPriceAfterDiscount || 0,
          createdAt: request.createdAt ?? new Date(),
          updatedAt: request.updatedAt ?? new Date(),
          deletedAt: request.deletedAt ?? null,
        },
      });
      for (let index = 0; index < request.item.length; index++) {
        const item = request.item[index];
        const passenger = await this.prisma.customerPassenger.findUnique({
          where: { id: item.passengerId, deletedAt: null },
        });
        let itemDiscount = 0;
        let itemTotalPrice = item.price;
        if (request.voucherId) {
          const voucher = await this.prisma.voucher.findUnique({
            where: { id: request.voucherId, deletedAt: null },
          });
          if (!voucher) {
            throw new InternalServerErrorException('Voucher not found');
          }
          if (voucher.discountType === 'PERCENTAGE') {
            itemDiscount = (item.price * voucher.discount) / 100;
          } else {
            itemDiscount = voucher.discount / request.item.length;
          }
          itemTotalPrice = item.price - itemDiscount;
        }
        await this.prisma.orderItem.create({
          data: {
            code: await this.globalService.generateOrderItemCode(this.prisma),
            orderId: order.id,
            tripSeatId: item.tripSeatId,
            name: passenger?.name || 'Unknown Passenger',
            address: passenger?.address || 'Unknown Address',
            phoneNumber: passenger?.phoneNumber || 'Unknown Phone',
            price: item.price,
            discount: itemDiscount,
            totalPrice: itemTotalPrice,
            createdAt: request.createdAt ?? new Date(),
            updatedAt: request.updatedAt ?? new Date(),
            deletedAt: request.deletedAt ?? null,
          },
        });
      }
      const result = await this.prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          Order: {
            include: { OrderItem: true },
          },
        },
      });
      return this.globalService.response('Successfully created', result);
    } catch (error) {
      console.error('Create error:', error);
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async xenditCallback(payload: any) {
    try {
      const externalId = payload.external_id;
      const raw = String(payload.status || '').toUpperCase();
      if (!externalId) {
        return this.globalService.response('external_id missing', {}, 400);
      }

      const invoice = await this.prisma.invoice.findFirst({
        where: { external_id: externalId, deletedAt: null },
      });
      if (!invoice) {
        return this.globalService.response('Invoice not found', {}, 404);
      }

      const PAID_LIKE = new Set(['PAID', 'SETTLED', 'CAPTURED', 'SUCCEEDED']);
      const EXPIRED_LIKE = new Set(['EXPIRED', 'VOIDED', 'CANCELLED']);
      const isPaid = PAID_LIKE.has(raw);
      const isExpired = EXPIRED_LIKE.has(raw);

      const normalizedStatus = isPaid ? 'PAID' : isExpired ? 'EXPIRED' : raw;

      const paymentStatusEnum: PaymentStatus =
        raw === 'REFUNDED'
          ? PaymentStatus.REFUNDED
          : isPaid
          ? PaymentStatus.COMPLETED
          : isExpired
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING;

      const paidAtDate = isPaid
        ? payload.paid_at
          ? new Date(payload.paid_at)
          : new Date()
        : null;

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: normalizedStatus,
          paid_at: paidAtDate ? paidAtDate.toISOString() : null,
          paid_amount: isPaid ? payload.paid_amount ?? invoice.paid_amount : 0,
          currency: payload.currency ?? invoice.currency,
          payment_method: payload.payment_method ?? invoice.payment_method,
          payment_channel: payload.payment_channel ?? invoice.payment_channel,
          payment_destination:
            payload.payment_destination ?? invoice.payment_destination,
          bank_code: payload.bank_code ?? invoice.bank_code,
          ewallet_type: payload.ewallet_type ?? invoice.ewallet_type,
          data: payload,
          updatedAt: new Date(),
        },
      });

      const subs = await this.prisma.subscriptionOrder.findMany({
        where: { invoiceId: invoice.id, deletedAt: null },
      });

      if (subs.length > 0) {
        for (const so of subs) {
          const dur = Number(so.duration ?? 30);
          const newExpired = isPaid
            ? this.addDays(paidAtDate ?? new Date(), dur)
            : so.expiredDate;

          await this.prisma.subscriptionOrder.update({
            where: { id: so.id },
            data: {
              paymentStatus: paymentStatusEnum,
              ...(isPaid
                ? { subscriptionStatus: SubscriptionStatus.ACTIVE }
                : {}),
              ...(isPaid ? { expiredDate: newExpired } : {}),
              updatedAt: new Date(),
            },
          });
        }

        return this.globalService.response(
          'Callback processed (subscription)',
          {
            status: normalizedStatus,
          },
        );
      }

      await this.prisma.order.updateMany({
        where: { invoiceId: invoice.id, deletedAt: null },
        data: {
          status: normalizedStatus as any,
          updatedAt: new Date(),
        },
      });
      const relatedOrders = await this.prisma.order.findMany({
        where: { invoiceId: invoice.id, deletedAt: null },
        select: { id: true, tripId: true },
      });
      const orderIds = relatedOrders.map((o) => o.id);
      if (orderIds.length > 0) {
        const orderItems = await this.prisma.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { tripSeatId: true, orderId: true },
        });
        const tripSeatIds = orderItems
          .map((oi) => oi.tripSeatId)
          .filter(Boolean);
        if (tripSeatIds.length > 0) {
          await this.prisma.tripSeat.updateMany({
            where: { id: { in: tripSeatIds } },
            data: {
              status: isPaid ? 'PAID' : isExpired ? 'AVAILABLE' : undefined,
              isAvail: isPaid ? false : isExpired ? true : undefined,
              updatedAt: new Date(),
            },
          });
        }

        if (isPaid) {
          const tripId = relatedOrders.find((o) => o.tripId)?.tripId;
          if (tripId) {
            const ticketCount = orderItems.length;
            await this.prisma.trips.update({
              where: { id: tripId },
              data: {
                ticketSold: {
                  increment: ticketCount,
                },
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      return this.globalService.response('Callback processed (order)', {
        status: normalizedStatus,
      });
    } catch (error) {
      console.error('Xendit callback error:', error);
      throw new InternalServerErrorException('Failed to process callback');
    }
  }

  private addDays(base: Date | string | number, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + Number(days || 0));
    return d;
  }

  async cancel(request: any) {
    try {
      let customerBank;
      if (request.customerBankId) {
        customerBank = await this.prisma.customerBank.findUnique({
          where: { id: request.customerBankId, deletedAt: null },
        });
        if (!customerBank) {
          return this.globalService.response(
            'Customer Bank not found',
            {},
            404,
          );
        }
      } else {
        customerBank = await this.prisma.customerBank.create({
          data: {
            customerId: request.customerId,
            nameAccount: request.nameAccount,
            codeAccount: request.codeAccount,
            nameBank: request.nameBank,
            codeBank: request.codeBank,
          },
        });
      }
      if (request.orderId) {
        const order = await this.prisma.order.findUnique({
          where: { id: request.orderId, deletedAt: null },
        });
        if (!order) {
          return this.globalService.response('Order not found', {}, 404);
        }
        if (order.status === 'CANCELED') {
          return this.globalService.response('Order already canceled', {}, 400);
        }

        // DISBURSEMENT
        const apiKey = process.env.KEYXENDIT;
        const headers = {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
        };
        const disbursement = [
          {
            external_id: order.code,
            amount: order.subtotal,
            bank_code: request.codeBank,
            bank_account_name: request.nameAccount,
            bank_account_number: request.codeAccount,
            description: `Refund for Order ${order.code} to ${request.nameAccount} - ${request.codeAccount} (${request.codeBank})`,
            email_to: [
              'firlian.syaroni@gmail.com',
              'muhamadrian81182@gmail.com',
            ],
          },
        ];
        const createInvoiceParams = {
          reference: order.code,
          disbursements: disbursement,
        };

        let disbursementResponse;
        try {
          const response = await axios.post(
            'https://api.xendit.co/batch_disbursements',
            createInvoiceParams,
            { headers },
          );
          disbursementResponse = response;
        } catch (error) {
          console.error(
            'Error:',
            error.response ? error.response.data : error.message,
          );
        }

        // UPDATE ORDER
        const canceledDate = new Date().toISOString().slice(0, 10);
        const updatedOrder = await this.prisma.order.update({
          where: { id: request.orderId },
          data: {
            status: 'CANCELED',
            canceledDate: canceledDate,
            cancelReason: request.cancelReason || 'No reason provided',
            customerBankId: customerBank.id,
            dataRefund: disbursementResponse ? disbursementResponse.data : null,
            updatedAt: new Date(),
          },
        });
        return this.globalService.response(
          'Order canceled successfully',
          updatedOrder,
        );
      } else {
        return this.globalService.response('Order ID is required', {}, 400);
      }
    } catch (error) {
      console.error('Create error:', error);
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async reminderDeparture() {
    try {
      type DateCheck =
        | 'MISSING'
        | 'INVALID'
        | 'PAST'
        | 'TODAY'
        | 'TOMORROW'
        | 'WITHIN_24H'
        | 'FUTURE';

      const orders = await this.prisma.order.findMany({
        where: {
          deletedAt: null,
          status: 'PAID',
          canceledDate: null,
        },
        select: {
          id: true,
          code: true,
          date: true,
          status: true,
          trip: {
            select: {
              id: true,
              departureName: true,
              departureCity: true,
              arivalName: true,
              arivalCity: true,
              departureTime: true,
              vehicleName: true,
              vehicleLicense: true,
              driverName: true,
              // Jika ada relasi driver:
              // driver: { select: { phone: true } },
            },
          },
          OrderItem: {
            select: {
              id: true,
              code: true,
              name: true,
              phoneNumber: true,
              tripSeatId: true,
              seat: {
                select: {
                  code: true,
                  row: true,
                  column: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const issues: Array<{
        id: string;
        code: string;
        reason: DateCheck;
        rawDate?: string | null;
      }> = [];

      const upcomingWithin24h: Array<{
        id: string;
        code: string;
        dateISO: string;
        status: string;
        trip: any;
        OrderItem: any[];
        userId: string;
        customerName?: string | null;
        customerEmail?: string | null;
        customerPhone?: string | null;
      }> = [];

      const classify = (raw: string | null | undefined): DateCheck => {
        if (!raw || raw.toString().trim() === '') return 'MISSING';

        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return 'INVALID';

        const t = d.getTime();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).getTime();
        const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;

        if (t < now.getTime()) return 'PAST';
        if (t >= now.getTime() && t <= in24h.getTime()) return 'WITHIN_24H';
        if (t >= startOfToday && t < startOfTomorrow) return 'TODAY';
        if (t >= startOfTomorrow && t < startOfTomorrow + 24 * 60 * 60 * 1000)
          return 'TOMORROW';
        return 'FUTURE';
      };

      for (const o of orders) {
        const result = classify(o.date);

        if (result === 'MISSING' || result === 'INVALID') {
          issues.push({
            id: o.id,
            code: o.code,
            reason: result,
            rawDate: o.date,
          });
          continue;
        }

        if (result === 'PAST') {
          issues.push({
            id: o.id,
            code: o.code,
            reason: result,
            rawDate: o.date,
          });
        }

        if (result === 'WITHIN_24H') {
          const d = new Date(o.date!);
          upcomingWithin24h.push({
            id: o.id,
            code: o.code,
            dateISO: d.toISOString(),
            status: o.status,
            trip: o.trip,
            userId: o.customer.userId,
            OrderItem: o.OrderItem,
            customerName: o.customer?.user?.name,
            customerEmail: o.customer?.user?.email ?? null,
            customerPhone: o.customer?.user?.phoneNumber ?? null,
          });
        }
      }

      void this.makeSchemaNotifReminderDeparture(upcomingWithin24h).catch((e) =>
        console.error('[reminderDeparture] makeSchema error:', e),
      );

      return {
        success: true,
        counts: {
          total: orders.length,
          issues: issues.length,
          upcomingWithin24h: upcomingWithin24h.length,
        },
        issues,
        upcomingWithin24h,
      };
    } catch (err) {
      console.error('reminderDeparture error:', err);
      throw new InternalServerErrorException('Gagal memeriksa tanggal order');
    }
  }

  async makeSchemaNotifReminderDeparture(upcomingWithin24h: any[]) {
    if (!Array.isArray(upcomingWithin24h) || !upcomingWithin24h.length)
      return { sent: 0 };

    const jobs = upcomingWithin24h.map(async (o) => {
      const trip = o.trip ?? {};
      const bookingCode = o.code;

      const departureDateLabel = formatDateID(
        o.dateISO ?? o.trip?.date ?? new Date(),
      );
      const routeLabel = buildRouteLabel(trip);
      const pickupName = trip?.departureName ?? null;
      const paymentStatus = (o.status ?? 'PAID').toUpperCase();
      const vehicleLabel = buildVehicleLabel(trip);
      const driverName = trip?.driverName ?? null;
      const driverPhone = trip?.driver?.phone ?? null;
      const departureTimeLabel = buildDepartureTimeLabel(trip);

      const passengers = (o.OrderItem ?? []).map((it: any) => ({
        name: it?.name ?? '-',
        phone: it?.phoneNumber ?? null,
        seat: getSeatLabel(it?.seat, it?.tripSeatId),
      }));
      const passengerCount = passengers.length || 1;

      const additionalData = {
        bookingCode,
        routeLabel,
        departureDateLabel,
        departureTimeLabel,
        pickupName,
        paymentStatus,
        passengerCount,
        passengers,
        driverName,
        driverPhone,
        vehicleLabel,
        ticketUrl: `https://stg-travl.himovy.com/profile/my-ticket/${o.id}`,
        manageUrl: `https://stg-travl.himovy.com/profile/my-ticket`,
      };

      const titleID = `Pengingat Keberangkatan • ${bookingCode}`;
      const titleEN = `Departure Reminder • ${bookingCode}`;

      const descID =
        `${routeLabel}\n` +
        `Tanggal: ${departureDateLabel}${
          departureTimeLabel ? ` • ${departureTimeLabel}` : ''
        }\n` +
        `Penjemputan: ${pickupName ?? '-'}`;
      const descEN =
        `${routeLabel}\n` +
        `Date: ${departureDateLabel}${
          departureTimeLabel ? ` • ${departureTimeLabel}` : ''
        }\n` +
        `Pickup: ${pickupName ?? '-'}`;

      void this.globalService
        .sendNotificationInApp({
          titleIndonesia: titleID,
          titleEnglish: titleEN,
          descriptionIndonesia: descID,
          descriptionEnglish: descEN,
          subjectType: 'DEPARTURE',
          subjectId: o.id,
          audienceScope: AudienceScope.USER,
          audienceUserIds: [o.userId],
          channels: [NotificationChannel.IN_APP],
          templateKey: 'order.departure.reminder-departure',
          additionalData,
        })
        .catch((e: any) =>
          console.error(
            '[reminderDeparture] sendNotificationInApp error for',
            e,
          ),
        );

      void this.globalService
        .sendNotificationEmail({
          subject: `Pengingat Keberangkatan • ${bookingCode}`,
          toUserIds: [o.userId],
          templateKey: 'order.departure.reminder-departure',
          additionalData: additionalData,
        })
        .catch((e: any) =>
          console.error(
            '[reminderDeparture] sendNotificationEmail error for',
            e,
          ),
        );

      return true;
    });

    const results = await Promise.allSettled(jobs);
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return { sent, total: upcomingWithin24h.length };
  }
}
