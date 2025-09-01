import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateSubscriptionOrderDto } from './dto/create-subscription-order.dto';
import { UpdateSubscriptionOrderDto } from './dto/update-subscription-order.dto';
import { ListSubscriptionOrderDto } from './dto/list-subscription-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscriptionPaymentService } from './utils/subscription-payment.service';

@Injectable()
export class SubscriptionOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payment: SubscriptionPaymentService,
  ) {}

  async create(dto: CreateSubscriptionOrderDto) {
    return this.payment.xenditCreate({
      customerId: dto.customerId,
      voucherId: dto.voucherId ?? undefined,
      amount: dto.amount,
      duration: dto.duration,
      startDate: dto.startDate,
      phone: dto.phone,
      name: dto.name,
    });
  }

async findAll(q: ListSubscriptionOrderDto) {
  const page = Number(q.page ?? 1);
  const pageSize = Number(q.pageSize ?? 10);
  const skip = (page - 1) * pageSize;

  const search = q.search?.trim();
  const customerId = q.customerId?.trim();
  const includeDeleted =
    String(q.includeDeleted ?? 'false').toLowerCase() === 'true';

  const where: Prisma.SubscriptionOrderWhereInput = {
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(customerId ? { customerId } : {}),
    ...(search
      ? {
          OR: [
            { orderCode: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            {
              customer: {
                is: {
                  user: {
                    is: {
                      name: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
              },
            },
            {
              customer: {
                is: {
                  code: { contains: search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    this.prisma.subscriptionOrder.findMany({
      where,
      include: {
        customer: { include: { user: true } },
        voucher: { 
          include: { 
            route: {
              include: {
                RoutePoint: {
                  include: {
                    point: true
                  }
                }
              }
            }
          } 
        },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    this.prisma.subscriptionOrder.count({ where }),
  ]);

  return {
    message: items.length ? 'Success' : 'No data found',
    data: items,
    meta: {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
      filters: {
        includeDeleted,
        customerId: customerId ?? null,
        search: search ?? null,
      },
    },
  };
}


  async findOne(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.subscriptionOrder.findFirst({
          where: { id, deletedAt: null },
          include: { customer: true,  voucher: { include: { route: true } }, invoice: true },
        });

        if (!item) {
          throw new NotFoundException(
            `SubscriptionOrder with id "${id}" not found or already deleted.`,
          );
        }

        return {
          message: `SubscriptionOrder ${id} retrieved successfully.`,
          data: item,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('[SubscriptionOrderService.findOne] Error:', error);

      throw new Error(
        `Failed to retrieve SubscriptionOrder with id "${id}". Reason: ${
          (error as Error).message || 'Unknown error'
        }`,
      );
    }
  }

  async update(id: string, dto: UpdateSubscriptionOrderDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.subscriptionOrder.findFirst({
          where: { id, deletedAt: null },
          include: { invoice: true, customer: true, voucher: true },
        });
        if (!existing) {
          throw new NotFoundException(
            `SubscriptionOrder dengan id "${id}" tidak ditemukan atau sudah dihapus.`,
          );
        }

        // Validasi customer hanya jika berubah
        if (dto.customerId && dto.customerId !== existing.customerId) {
          const customer = await tx.customer.findFirst({
            where: { id: dto.customerId, deletedAt: null },
          });
          if (!customer)
            throw new NotFoundException('Customer tidak ditemukan');
        }

        // Validasi voucher hanya jika berubah
        if (
          dto.voucherId !== undefined &&
          dto.voucherId !== existing.voucherId
        ) {
          if (dto.voucherId) {
            const voucher = await tx.voucher.findFirst({
              where: { id: dto.voucherId, deletedAt: null },
            });
            if (!voucher)
              throw new NotFoundException('Voucher tidak ditemukan');
          }
        }

        if (dto.invoiceId && dto.invoiceId !== existing.invoiceId) {
          const invoice = await tx.invoice.findFirst({
            where: { id: dto.invoiceId, deletedAt: null },
          });
          if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');
        }

        const addMonths = (date: Date, months: number) => {
          const d = new Date(date);
          d.setMonth(d.getMonth() + months);
          return d;
        };

        const nextStart = dto.startDate
          ? new Date(dto.startDate)
          : existing.startDate;
        const nextDuration = dto.duration ?? existing.duration;
        const shouldRecalcDates =
          dto.startDate !== undefined || dto.duration !== undefined;

        let nextEnd =
          dto.endDate !== undefined
            ? dto.endDate
              ? new Date(dto.endDate)
              : null
            : existing.endDate;

        let nextRenewal =
          dto.renewalDate !== undefined
            ? dto.renewalDate
              ? new Date(dto.renewalDate)
              : null
            : existing.renewalDate;

        if (shouldRecalcDates) {
          if (!dto.endDate) nextEnd = addMonths(nextStart!, nextDuration);
          if (!dto.renewalDate) nextRenewal = nextEnd;
        }

        const nextPaymentStatus = dto.paymentStatus ?? existing.paymentStatus;
        let nextSubscriptionStatus =
          dto.subscriptionStatus ?? existing.subscriptionStatus;
        if (dto.paymentStatus && dto.subscriptionStatus === undefined) {
          if (dto.paymentStatus === 'COMPLETED')
            nextSubscriptionStatus = 'ACTIVE' as any;
          if (dto.paymentStatus === 'FAILED')
            nextSubscriptionStatus = 'INACTIVE' as any;
        }

        const data: Prisma.SubscriptionOrderUpdateInput = {
          orderCode: dto.orderCode ?? existing.orderCode,
          customer: dto.customerId
            ? { connect: { id: dto.customerId } }
            : undefined,
          voucher:
            dto.voucherId !== undefined
              ? dto.voucherId
                ? { connect: { id: dto.voucherId } }
                : undefined
              : undefined,
          invoice: dto.invoiceId
            ? { connect: { id: dto.invoiceId } }
            : undefined,
          amount: dto.amount ?? existing.amount,
          duration: dto.duration ?? existing.duration,
          expiredDate:
            dto.expiredDate !== undefined
              ? dto.expiredDate
                ? new Date(dto.expiredDate)
                : null
              : existing.expiredDate,
          paymentStatus: nextPaymentStatus,
          subscriptionStatus: nextSubscriptionStatus,
          startDate: nextStart,
          endDate: nextEnd,
          renewalDate: nextRenewal,
          paymentGatewayId:
            dto.paymentGatewayId !== undefined
              ? dto.paymentGatewayId || null
              : existing.paymentGatewayId,
          paymentUrl:
            dto.paymentUrl !== undefined
              ? dto.paymentUrl || null
              : existing.paymentUrl,
          phone: dto.phone !== undefined ? dto.phone || null : existing.phone,
          name: dto.name !== undefined ? dto.name || null : existing.name,
          updatedAt: new Date(),
        };

        try {
          const updated = await tx.subscriptionOrder.update({
            where: { id },
            data,
            include: {
              customer: { include: { user: true } },
              voucher: true,
              invoice: true,
            },
          });

          return {
            message: `SubscriptionOrder ${id} berhasil diupdate.`,
            data: updated,
          };
        } catch (e: any) {
          if (e?.code === 'P2002' && e?.meta?.target?.includes('orderCode')) {
            throw new InternalServerErrorException('orderCode sudah digunakan');
          }
          throw new InternalServerErrorException(
            `Gagal update SubscriptionOrder "${id}". Reason: ${
              e?.message ?? 'Unknown error'
            }`,
          );
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      console.error('[SubscriptionOrderService.update] Error:', error);
      throw new InternalServerErrorException(
        `Gagal update SubscriptionOrder "${id}". Reason: ${
          (error as Error)?.message ?? 'Unknown error'
        }`,
      );
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.subscriptionOrder.findFirst({
          where: { id, deletedAt: null },
          select: { id: true },
        });

        if (!existing) {
          throw new NotFoundException(
            `SubscriptionOrder with id "${id}" not found or already deleted.`,
          );
        }

        const updated = await tx.subscriptionOrder.update({
          where: { id },
          data: { deletedAt: new Date() },
          include: { customer: true, voucher: true, invoice: true },
        });

        return {
          message: `SubscriptionOrder ${id} has been soft deleted successfully.`,
          data: updated,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new Error(
        `Failed to delete SubscriptionOrder with id "${id}". Reason: ${
          (error as Error).message || 'Unknown error'
        }`,
      );
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.subscriptionOrder.findFirst({
          where: { id, deletedAt: { not: null } },
          select: { id: true },
        });

        if (!existing) {
          throw new NotFoundException(
            `Deleted SubscriptionOrder with id "${id}" not found.`,
          );
        }

        const restored = await tx.subscriptionOrder.update({
          where: { id },
          data: { deletedAt: null },
          include: { customer: true, voucher: true, invoice: true },
        });

        return {
          message: `SubscriptionOrder ${id} has been restored successfully.`,
          data: restored,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('[SubscriptionOrderService.restore] Error:', error);

      throw new Error(
        `Failed to restore SubscriptionOrder with id "${id}". Reason: ${
          (error as Error).message || 'Unknown error'
        }`,
      );
    }
  }
}
