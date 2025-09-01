/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeviceService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      let validateSimCart = null;
      if (request.simcardId) {
        validateSimCart = await this.prisma.simCard.findFirst({
          where: {
            id: request.simcardId,
          },
        });
        if (!validateSimCart) {
          return this.globalService.response('Sim Card Not Found!', {});
        }
      }

      const data = await this.prisma.device.create({
        data: {
          simcardId: request.simcardId || null,
          brand: request.brand || null,
          type: request.type || null,
          name: request.name || null,
          imei: request.imei || null,
          code: request.code || null,
          lastLat: request.lastLat || null,
          lastLong: request.lastLong || null,
          lastLongDate: request.lastLongDate || null,
          initialLat: request.initialLat || null,
          initialLong: request.initialLong || null,
          initialDate: request.initialDate || null,
          mac: request.mac || null,
          description: request.description || null,
          operator: request.operator || null,
        },
      });

      if (request.simcardId && validateSimCart) {
        await this.prisma.simCard.update({
          where: { id: request.simcardId },
          data: {
            deviceId: data.id,
            status: 'IN_USE',
          },
        });
      }

      const result = await this.prisma.device.findFirst({
        where: { id: data.id },
        include: {},
      });

      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.imei) {
        whereConditions['imei'] = {
          contains: request.imei,
        };
      }
      if (request.operator) {
        whereConditions['operator'] = request.operator;
      }
      const datas = await this.prisma.device.findMany({
        where: whereConditions,
        include: {
          simCard: true,
          brandData: true,
          typeData: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.device.findUnique({
        where: { id, deletedAt: null },
        include: {
          simCard: true,
          brandData: true,
          typeData: true,
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
      let validateSimCart = null;
      if (request.simcardId) {
        validateSimCart = await this.prisma.simCard.findFirst({
          where: {
            id: request.simcardId,
          },
        });
        if (!validateSimCart) {
          return this.globalService.response('Sim Card Not Found!', {});
        }

        const existingDevice = await this.prisma.device.findFirst({
          where: {
            simcardId: request.simcardId,
          },
        });
        if (existingDevice) {
          await this.prisma.device.update({
            where: { id: existingDevice.id },
            data: { simcardId: null },
          });
        }
      }

      const data = await this.prisma.device.update({
        where: { id },
        data: {
          simcardId: request.simcardId,
          brand: request.brand,
          type: request.type,
          name: request.name,
          imei: request.imei,
          code: request.code,
          lastLat: request.lastLat,
          lastLong: request.lastLong,
          lastLongDate: request.lastLongDate,
          initialLat: request.initialLat,
          initialLong: request.initialLong,
          initialDate: request.initialDate,
          mac: request.mac,
          description: request.description,
          operator: request.operator,
        },
      });

      if (request.simCardBeforeId) {
        await this.prisma.simCard.update({
          where: { id: request.simCardBeforeId },
          data: {
            deviceId: null,
            status: 'NOT_IN_USE',
          },
        });
      }

      if (request.simcardId && validateSimCart) {
        await this.prisma.simCard.update({
          where: { id: request.simcardId },
          data: {
            deviceId: data.id,
            status: 'IN_USE',
          },
        });
      }

      const result = await this.prisma.device.findFirst({
        where: { id: data.id },
        include: { simCard: true },
      });

      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.device.findUnique({
        where: { id, deletedAt: null },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.device.update({
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
      const validate = await this.prisma.device.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.device.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async checkDevice() {
    try {
      const date = new Date();
      const jakartaOffset = 7 * 60;
      const jakartaTime = new Date(date.getTime() + jakartaOffset * 60 * 1000);
      jakartaTime.setMinutes(jakartaTime.getMinutes() - 5);

      await this.prisma.vehicle.updateMany({
        where: {
          latDateDevice: {
            gte: jakartaTime,
          },
          statusDevice: 'ONLINE',
        },
        data: {
          statusDevice: 'OFFLINE',
        },
      });
      await this.prisma.vehicle.updateMany({
        where: {
          latDateDevice: {
            lte: jakartaTime,
          },
        },
        data: {
          statusDevice: 'ONLINE',
        },
      });
      await this.prisma.vehicle.updateMany({
        where: {
          latDateDevice: null,
          totalDistanceMeter: 0,
        },
        data: {
          statusDevice: 'INACTIVE',
        },
      });
      await this.prisma.vehicle.updateMany({
        where: {
          latDateDevice: null,
          totalDistanceMeter: {
            not: 0,
          },
        },
        data: {
          statusDevice: 'OFFLINE',
        },
      });
      const result = await this.prisma.vehicle.findMany({
        where: {
          updatedAt: {
            gte: date,
          },
        },
      });
      return this.globalService.response('Successfully update devices', {
        result,
        date,
      });
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something went wrong!');
    }
  }
}
