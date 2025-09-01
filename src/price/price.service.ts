/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class PriceService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const data = await this.prisma.price.create({
        data: {
          name: request.name,
          routeId: request.routeId,
          up1Price: request.up1Price,
          up2Price: request.up2Price,
          basePrice: request.basePrice,
          down1Price: request.down1Price,
          down2Price: request.down2Price,
          discount: request.discount,
        },
      });
      const result = await this.prisma.price.findFirst({
        where: { id: data.id },
        include: {
          route: true,
        },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(params?: { page?: number; limit?: number; search?: string }) {
    try {
      const page = Number(params?.page) || 1;
      const limit = Number(params?.limit) || 10;
      const skip = (page - 1) * limit;
      const search = params?.search || '';
      const whereConditions: any = {
        deletedAt: null,
      };
      if (search) {
        whereConditions.OR = [{ name: { contains: search } }];
      }
      const total = await this.prisma.price.count({ where: whereConditions });
      const datas = await this.prisma.price.findMany({
        where: whereConditions,
        include: {
          route: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const result = {
        data: datas,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit),
          limit,
        },
      };
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.price.findUnique({
        where: { id, deletedAt: null },
        include: {
          route: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any) {
    try {
      const data = await this.prisma.price.update({
        where: { id },
        data: {
          name: request.name,
          routeId: request.routeId,
          up1Price: request.up1Price,
          up2Price: request.up2Price,
          basePrice: request.basePrice,
          down1Price: request.down1Price,
          down2Price: request.down2Price,
          discount: request.discount,
        },
      });
      const result = await this.prisma.price.findFirst({
        where: { id: data.id },
        include: {
          route: true,
        },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.price.findUnique({
        where: { id, deletedAt: null },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.price.update({
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
      const validate = await this.prisma.price.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.price.update({
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
