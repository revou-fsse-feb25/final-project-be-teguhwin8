/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScheduleTripPointService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const data = await this.prisma.scheduleTripPoint.create({
        data: {
          scheduleTripId: request.scheduleTripId,
          routeId: request.routeId,
          pointId: request.pointId,
          isDeparture: request.isDeparture,
          isArrival: request.isArrival,
          departureTime: request.departureTime,
          arrivalTime: request.arrivalTime,
        },
      });
      const result = await this.prisma.scheduleTripPoint.findFirst({
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
      const datas = await this.prisma.scheduleTripPoint.findMany({
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
      const data = await this.prisma.scheduleTripPoint.findFirst({
        where: { id, deletedAt: null },
        include: { scheduleTrip: true },
      });
      if (!data)
        throw new Error(
          `ScheduleTripPoint with ID ${id} not found or has been deleted`,
        );
      return this.globalService.response('Successfully', data);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any) {
    try {
      const data = await this.prisma.scheduleTripPoint.findFirst({
        where: { id, deletedAt: null },
      });
      if (!data)
        throw new Error(
          `ScheduleTripPoint with ID ${id} not found or has been deleted`,
        );
      const { deletedAt, ...safeDto } = request as any;
      const updated = await this.prisma.scheduleTripPoint.update({
        where: { id },
        data: safeDto,
      });
      return this.globalService.response('Successfully', updated);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.scheduleTripPoint.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully soft deleted', deleted);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string) {
    try {
      const restored = await this.prisma.scheduleTripPoint.update({
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
