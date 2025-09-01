/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateDeviceLogDto } from './dto/create-device-log.dto';
import { UpdateDeviceLogDto } from './dto/update-device-log.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class DeviceLogsService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  create(createDeviceLogDto: CreateDeviceLogDto) {
    return 'This action adds a new deviceLog';
  }

  async findAll(request: any = []) {
    try {
      const page = request.page ? parseInt(request.page) : 1;
      const pageSize = request.pageSize ? parseInt(request.pageSize) : 10;

      const skip = (page - 1) * pageSize;
      const take = pageSize;

      let datas;
      const whereConditions = {
        deletedAt: null,
      };
      if (request.imei) {
        whereConditions['ident'] = request.imei;
      }
      const total = await this.prisma.deviceLogs.count({
        where: whereConditions,
      });
      const lastPage = Math.ceil(total / pageSize);
      if (request.lastLocation) {
        datas = await this.prisma.deviceLogs.findMany({
          where: whereConditions,
          orderBy: { createdAt: 'desc' },
          skip: skip,
          take: take,
        });
      } else {
        datas = await this.prisma.deviceLogs.findMany({
          where: whereConditions,
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

  async dataVehicle(request: any) {
    try {
      let datas;
      const whereConditions = {
        deletedAt: null,
      };
      if (request.type) {
        whereConditions['ident'] = request.imei;
      }
      if (request.lastLocation) {
        datas = await this.prisma.vehicle.findMany({
          where: whereConditions,
          orderBy: {
            updatedAt: 'desc',
          },
        });
      } else {
        datas = await this.prisma.vehicle.findMany({
          where: whereConditions,
        });
      }
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.deviceLogs.findUnique({
        where: { id },
      });
      if (!datas || datas.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  update(id: number, updateDeviceLogDto: UpdateDeviceLogDto) {
    return `This action updates a #${id} deviceLog`;
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.deviceLogs.findUnique({
        where: { id },
      });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.deviceLogs.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
