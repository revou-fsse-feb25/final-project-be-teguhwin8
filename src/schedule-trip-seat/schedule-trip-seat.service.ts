/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class ScheduleTripSeatService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const data = await this.prisma.scheduleTripSeat.create({
        data: {
          scheduleTripId: request.scheduleTripId,
          code: request.code,
          row: request.row,
          column: request.column,
          isHotSeat: request.isHotSeat,
        },
      });
      const result = await this.prisma.scheduleTripSeat.findFirst({
        where: { id: data.id },
        include: {
          scheduleTrip: true,
        },
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
      if (request.scheduleTripId) {
        whereConditions['scheduleTrip'] = {
          id: request.scheduleTripId,
        };
      }
      const datas = await this.prisma.scheduleTripSeat.findMany({
        where: whereConditions,
        include: {
          scheduleTrip: true,
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
      const datas = await this.prisma.scheduleTripSeat.findUnique({
        where: { id, deletedAt: null },
        include: {
          scheduleTrip: true,
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
      const data = await this.prisma.scheduleTripSeat.update({
        where: { id },
        data: {
          scheduleTripId: request.scheduleTripId,
          code: request.code,
          row: request.row,
          column: request.column,
          isHotSeat: request.isHotSeat,
        },
      });
      const result = await this.prisma.scheduleTripSeat.findFirst({
        where: { id: data.id },
        include: {
          scheduleTrip: true,
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
      const validate = await this.prisma.scheduleTripSeat.findUnique({
        where: { id, deletedAt: null },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.scheduleTripSeat.update({
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
      const validate = await this.prisma.scheduleTripSeat.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.scheduleTripSeat.update({
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
