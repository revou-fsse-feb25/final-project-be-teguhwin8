/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OverspeedService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    return 'This action adds a new overspeed';
  }

  async findAll(request: any) {
    try {
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.pageSize ? parseInt(request.pageSize) : 10;

      const skip = (page - 1) * pageSize;
      const take = pageSize;

      let datas;
      const whereConditions = {
        deletedAt: null,
      };
      if (request.vehicleId) {
        whereConditions['vehicleId'] = {
          contains: request.vehicleId,
        };
      }
      if (request.operator) {
        whereConditions['vehicle'] = {
          operator: request.operator,
        };
      }
      if (request.name) {
        whereConditions['vehicle'] = {
          name: { contains: request.name },
        };
      }
      if (request.startDate && request.endDate) {
        whereConditions['datetime'] = {
          gte: request.startDate,
          lte: request.endDate,
        };
      }
      const total = await this.prisma.overspeed.count({
        where: whereConditions,
      });
      const lastPage = Math.ceil(total / pageSize);
      if (request.lastLocation) {
        datas = await this.prisma.overspeed.findMany({
          where: whereConditions,
          include: {
            vehicle: {
              include: {
                operatorData: true,
                driverData: true,
                typeData: true,
                device: true,
              },
            },
          },
          orderBy: { datetime: 'desc' },
          skip: skip,
          take: take,
        });
      } else {
        datas = await this.prisma.overspeed.findMany({
          where: whereConditions,
          include: {
            vehicle: {
              include: {
                operatorData: true,
                driverData: true,
                typeData: true,
                device: true,
              },
            },
          },
          orderBy: { datetime: 'desc' },
          skip: skip,
          take: take,
        });
      }
      return this.globalService.response('Successfully', datas, {
        pagination: {
          total: total,
          perPage: pageSize,
          currentPage: page,
          lastPage: lastPage,
        },
      });
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const data = await this.prisma.overspeed.findUnique({
        where: { id, deletedAt: null },
        include: {
          vehicle: {
            include: {
              operatorData: true,
              driverData: true,
              typeData: true,
              device: true,
            },
          },
        },
      });
      return this.globalService.response('Successfully', data);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any) {
    return `This action updates a #${id} overspeed`;
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.overspeed.findUnique({
        where: { id, deletedAt: null },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      const data = await this.prisma.overspeed.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully', data);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.overspeed.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.overspeed.update({
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
