import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VoucherService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const data = await this.prisma.voucher.create({
        data: {
          routeId: request.routeId,
          code: request.code,
          name: request.name,
          description: request.description,
          startDate: request.startDate,
          endDate: request.endDate,
          expiryDate: request.expiryDate,
          voucherType: request.voucherType,
          discountType: request.discountType,
          usageLimit: request.usageLimit,
          quota: request.quota,
          price: request.price,
          discount: request.discount,
        },
      });
      const result = await this.prisma.voucher.findFirst({
        where: { id: data.id },
        include: { route: true },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(request: any) {
    try {
      const toArray = (v: unknown) =>
        Array.isArray(v)
          ? v
          : typeof v === 'string'
          ? v
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const toInt = (v: any, def: number) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) && n > 0 ? n : def;
      };

      const page = toInt(request.page, 1);
      const limit = Math.min(Math.max(toInt(request.limit, 10), 1), 100);
      const skip = (page - 1) * limit;

      const where: Prisma.VoucherWhereInput = { deletedAt: null };

      if (request.code) where.code = request.code;

      const voucherTypes = toArray(request.voucherType);
      if (voucherTypes.length) where.voucherType = { in: voucherTypes as any };

      const discountTypes = toArray(request.discountType);
      if (discountTypes.length)
        where.discountType = { in: discountTypes as any };

      if (request.search && String(request.search).trim() !== '') {
        const q = String(request.search).trim();
        where.AND = [
          ...(Array.isArray(where.AND)
            ? where.AND
            : where.AND
            ? [where.AND]
            : []),
          {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        ];
      }

      const [total, data] = await this.prisma.$transaction([
        this.prisma.voucher.count({ where }),
        this.prisma.voucher.findMany({
          where,
          include: { route: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        code: 200,
        message: 'Successfully',
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          code: request.code ?? null,
          voucherType: voucherTypes.length ? voucherTypes : null,
          discountType: discountTypes.length ? discountTypes : null,
          search: request.search ?? null,
        },
      };
    } catch (error) {
      console.error('[VoucherService.findAll] Something Wrong :', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Something Wrong!',
      });
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.voucher.findUnique({
        where: { id, deletedAt: null },
        include: { route: true },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any) {
    try {
      const data = await this.prisma.voucher.update({
        where: { id },
        data: {
          routeId: request.routeId,
          code: request.code,
          name: request.name,
          description: request.description,
          startDate: request.startDate,
          endDate: request.endDate,
          expiryDate: request.expiryDate,
          voucherType: request.voucherType,
          discountType: request.discountType,
          usageLimit: request.usageLimit,
          quota: request.quota,
          price: request.price,
          discount: request.discount,
        },
      });
      const result = await this.prisma.voucher.findFirst({
        where: { id: data.id },
        include: { route: true },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.voucher.findUnique({
        where: { id, deletedAt: null },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.voucher.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.voucher.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.voucher.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
