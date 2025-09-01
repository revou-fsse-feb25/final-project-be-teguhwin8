/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScheduleTripService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const data = await this.prisma.scheduleTrips.create({
        data: {
          scheduleId: request.scheduleId,
          vehicleId: request.vehicleId,
          driverId: request.driverId,
          departureTime: request.departureTime,
          arrivalTime: request.arrivalTime,
          isActive: request.isActive,
        },
      });
      const result = await this.prisma.scheduleTrips.findFirst({
        where: { id: data.id },
        include: {
          schedule: true,
          vehicle: true,
          driver: true,
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
      const datas = await this.prisma.scheduleTrips.findMany({
        where: whereConditions,
        include: {
          schedule: true,
          vehicle: true,
          driver: true,
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
      const datas = await this.prisma.scheduleTrips.findUnique({
        where: { id, deletedAt: null },
        include: {
          schedule: true,
          vehicle: true,
          driver: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, updateScheduleTripDto: any) {
    try {
      const scheduleTrip = await this.prisma.scheduleTrips.findFirst({
        where: { id, deletedAt: null },
      });
      if (!scheduleTrip) {
        throw new Error(
          `ScheduleTrip with ID ${id} not found or has been deleted`,
        );
      }
      const { deletedAt, ...safeDto } = updateScheduleTripDto as any;
      const updated = await this.prisma.scheduleTrips.update({
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
      const deleted = await this.prisma.scheduleTrips.update({
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
      const restored = await this.prisma.scheduleTrips.update({
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
