/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const data = await this.prisma.schedules.create({
        data: {
          routeId: request.routeId,
          vehicleId: request.vehicleId,
          days: request.days,
          isActive: request.isActive,
        },
      });
      const result = await this.prisma.schedules.findFirst({
        where: { id: data.id },
        include: {
          vehicle: true,
          route: true,
          ScheduleTrips: true,
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
      if (request.vehicle) {
        whereConditions['vehicle'] = {
          name: {
            contains: request.vehicle,
          },
        };
      }
      const datas = await this.prisma.schedules.findMany({
        where: whereConditions,
        include: {
          vehicle: true,
          route: true,
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
      const datas = await this.prisma.schedules.findUnique({
        where: { id },
        include: {
          vehicle: true,
          route: {
            include: {
              RoutePoint: {
                orderBy: [{ createdAt: 'asc' }],
                include: { point: true },
              },
            },
          },
          ScheduleTrips: true,
          ScheduleTemplate: {
            include: {
              ScheduleTemplatePoint: {
                orderBy: [{ sort: 'asc' }],
                include: {
                  point: true,
                  route: true,
                },
              },
              driver: true,
              vehicle: true,
            },
          },
        },
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

  async update(id: string, request: any) {
    try {
      const data = await this.prisma.schedules.update({
        where: { id },
        data: {
          routeId: request.routeId,
          vehicleId: request.vehicleId,
          days: request.days,
          isActive: request.isActive,
        },
      });
      const result = await this.prisma.schedules.findFirst({
        where: { id: data.id },
        include: {
          vehicle: true,
          route: true,
          ScheduleTrips: true,
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
      const validate = await this.prisma.schedules.findUnique({
        where: { id },
      });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.schedules.update({
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
      const validate = await this.prisma.schedules.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.schedules.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async generate(request: any) {
    try {
      const schedule = await this.prisma.schedules.findUnique({
        where: { id: request.scheduleId },
        include: {
          vehicle: true,
          route: {
            include: {
              RoutePoint: {
                where: { deletedAt: null },
                include: { point: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });
      if (!schedule || !schedule.route) {
        return this.globalService.response('Schedule/Route not found', {});
      }
      const points = schedule.route.RoutePoint.map((rp) => rp.point).filter(
        Boolean,
      );
      if (points.length < 2) {
        return this.globalService.response(
          'Route must have at least 2 points',
          {},
        );
      }
      const createdTemplates = [];
      const driver = await this.prisma.driver.findFirst({
        where: { name: 'Driver Y' },
      });
      // isRound: false (forward)
      for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const departure = points[i];
          const arrival = points[j];
          const scheduleTemplate = await this.prisma.scheduleTemplate.create({
            data: {
              scheduleId: schedule.id,
              vehicleId: schedule.vehicleId,
              driverId: driver.id,
              pointDepartureId: departure.id,
              pointArrivalId: arrival.id,
              description: `Dari ${departure.name} ke ${arrival.name}`,
              price: 0,
              pricePackage: 0,
              isSale: false,
              departureTime: '',
              arrivalTime: '',
              isRound: false,
            },
          });
          const templatePoints = points.slice(i, j + 1).map((pt, idx, arr) => ({
            scheduleTemplateId: scheduleTemplate.id,
            routeId: schedule.route.id,
            pointId: pt.id,
            isDeparture: idx === 0,
            isArrival: idx === arr.length - 1,
            departureTime: '',
            sort: idx + 1,
          }));
          await this.prisma.scheduleTemplatePoint.createMany({
            data: templatePoints,
          });
          const templateWithPoints =
            await this.prisma.scheduleTemplate.findUnique({
              where: { id: scheduleTemplate.id },
              include: {
                ScheduleTemplatePoint: {
                  orderBy: { sort: 'asc' },
                },
              },
            });
          createdTemplates.push(templateWithPoints);
        }
      }

      // isRound: true (reverse)
      for (let i = points.length - 1; i > 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
          const departure = points[i];
          const arrival = points[j];
          const scheduleTemplateRound =
            await this.prisma.scheduleTemplate.create({
              data: {
                scheduleId: schedule.id,
                vehicleId: schedule.vehicleId,
                driverId: driver.id,
                pointDepartureId: departure.id,
                pointArrivalId: arrival.id,
                description: `Dari ${departure.name} ke ${arrival.name}`,
                price: 0,
                pricePackage: 0,
                isSale: false,
                departureTime: '',
                arrivalTime: '',
                isRound: true,
              },
            });
          const templatePointsRound = points
            .slice(j, i + 1)
            .reverse()
            .map((pt, idx, arr) => ({
              scheduleTemplateId: scheduleTemplateRound.id,
              routeId: schedule.route.id,
              pointId: pt.id,
              isDeparture: idx === 0,
              isArrival: idx === arr.length - 1,
              departureTime: '',
              sort: idx + 1,
            }));
          await this.prisma.scheduleTemplatePoint.createMany({
            data: templatePointsRound,
          });
          const templateWithPointsRound =
            await this.prisma.scheduleTemplate.findUnique({
              where: { id: scheduleTemplateRound.id },
              include: {
                ScheduleTemplatePoint: {
                  orderBy: { sort: 'asc' },
                },
              },
            });
          createdTemplates.push(templateWithPointsRound);
        }
      }
      return this.globalService.response(
        'Successfully generated schedule templates',
        createdTemplates,
      );
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async updateMultiRoute(request: any) {
    try {
      const scheduleTemplate = await this.prisma.scheduleTemplate.findUnique({
        where: { id: request.scheduleTemplateId },
      });
      if (!scheduleTemplate) {
        return this.globalService.response('Schedule Template not found', {});
      }
      await this.prisma.scheduleTemplate.update({
        where: { id: request.scheduleTemplateId },
        data: {
          departureTime: request.departureTime,
          description: request.description,
          price: request.price,
          pricePackage: request.pricePackage,
          isSale: request.isSale,
        },
      });

      await this.prisma.scheduleTemplate.updateMany({
        where: {
          scheduleId: request.scheduleId,
          pointDepartureId: scheduleTemplate.pointDepartureId,
          isRound: scheduleTemplate.isRound,
        },
        data: {
          departureTime: request.departureTime,
        },
      });

      await this.prisma.scheduleTemplate.updateMany({
        where: {
          scheduleId: request.scheduleId,
          pointArrivalId: scheduleTemplate.pointDepartureId,
          isRound: scheduleTemplate.isRound,
        },
        data: {
          arrivalTime: request.departureTime,
        },
      });

      await this.prisma.scheduleTemplatePoint.updateMany({
        where: {
          pointId: scheduleTemplate.pointDepartureId,
          scheduleTemplate: {
            scheduleId: request.scheduleId,
            isRound: scheduleTemplate.isRound,
          },
        },
        data: {
          departureTime: request.departureTime,
        },
      });

      if (request.arrivalTime) {
        await this.prisma.scheduleTemplate.updateMany({
          where: {
            scheduleId: request.scheduleId,
            pointArrivalId: scheduleTemplate.pointArrivalId,
            isRound: scheduleTemplate.isRound,
          },
          data: {
            arrivalTime: request.arrivalTime,
          },
        });

        await this.prisma.scheduleTemplatePoint.updateMany({
          where: {
            pointId: scheduleTemplate.pointArrivalId,
            scheduleTemplate: {
              scheduleId: request.scheduleId,
              isRound: scheduleTemplate.isRound,
            },
          },
          data: {
            departureTime: request.arrivalTime,
          },
        });
      }
      const result = await this.prisma.scheduleTemplate.findUnique({
        where: { id: request.scheduleTemplateId },
        include: {
          ScheduleTemplatePoint: {
            orderBy: { createdAt: 'asc' },
            include: {
              point: true,
            },
          },
        },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
