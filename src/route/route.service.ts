/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RouteService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: CreateRouteDto) {
    try {
      // Create route first
      const data = await this.prisma.route.create({
        data: {
          operator: request.operator,
          code: request.code,
          name: request.name,
          description: request.description,
          numberOfDriver: request.numberOfDriver,
          numberOfFuel: request.numberOfFuel,
          numberOfToll: request.numberOfToll,
          numberOfOther: request.numberOfOther,
          feeDriver: request.feeDriver,
          feeFuel: request.feeFuel,
          feeToll: request.feeToll,
          feeOther: request.feeOther,
          totalFeeDriver: request.totalFeeDriver,
          totalFeeFuel: request.totalFeeFuel,
          totalFeeToll: request.totalFeeToll,
          totalFeeOther: request.totalFeeOther,
        },
      });

      // Create route points if pointIds are provided
      if (request.pointIds && request.pointIds.length > 0) {
        const routePointsData = request.pointIds.map((pointId) => ({
          routeId: data.id,
          pointId: pointId,
        }));

        await this.prisma.routePoint.createMany({
          data: routePointsData,
        });
      }

      // Fetch the complete route with relations
      const result = await this.prisma.route.findFirst({
        where: { id: data.id },
        include: {
          operatorData: true,
          RoutePoint: {
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

  async findAll(request: any) {
    try {
      const whereConditions = {
        deletedAt: null,
      };
      if (request.code) {
        whereConditions['code'] = {
          contains: request.code,
        };
      }
      if (request.operator) {
        whereConditions['operator'] = request.operator;
      }
      const datas = await this.prisma.route.findMany({
        where: whereConditions,
        include: {
          Vehicle: true,
          operatorData: true,
          RoutePoint: {
            include: {
              point: true,
              route: true,
            },
          },
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
      const datas = await this.prisma.route.findUnique({
        where: { id },
        include: {
          Vehicle: true,
          operatorData: true,
          RoutePoint: {
            include: {
              point: true,
              route: true,
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
      // Validate route exists
      const existingRoute = await this.prisma.route.findUnique({
        where: { id },
      });

      if (!existingRoute || existingRoute.deletedAt) {
        return this.globalService.response('Route Not Found!', {});
      }

      // Update route data
      const data = await this.prisma.route.update({
        where: { id },
        data: {
          operator: request.operator,
          code: request.code,
          name: request.name,
          description: request.description,
          numberOfDriver: request.numberOfDriver,
          numberOfFuel: request.numberOfFuel,
          numberOfToll: request.numberOfToll,
          numberOfOther: request.numberOfOther,
          feeDriver: request.feeDriver,
          feeFuel: request.feeFuel,
          feeToll: request.feeToll,
          feeOther: request.feeOther,
          totalFeeDriver: request.totalFeeDriver,
          totalFeeFuel: request.totalFeeFuel,
          totalFeeToll: request.totalFeeToll,
          totalFeeOther: request.totalFeeOther,
        },
      });

      // Handle pointIds update if provided
      if (request.pointIds !== undefined) {
        // Delete existing route points permanently
        await this.prisma.routePoint.deleteMany({
          where: { routeId: id },
        });

        // Create new route points if pointIds are provided
        if (request.pointIds.length > 0) {
          const routePointsData = request.pointIds.map((point) => ({
            routeId: id,
            pointId: point.value,
          }));

          await this.prisma.routePoint.createMany({
            data: routePointsData,
          });
        }
      }

      // Fetch updated route with relations
      const result = await this.prisma.route.findFirst({
        where: { id: data.id },
        include: {
          operatorData: true,
          RoutePoint: {
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

  async remove(id: string) {
    try {
      const validate = await this.prisma.route.findUnique({ where: { id } });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.route.update({
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
      const validate = await this.prisma.route.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.route.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async createPoint(request: any) {
    try {
      const validateRoute = await this.prisma.route.findFirst({
        where: {
          id: request.routeId,
        },
      });
      if (!validateRoute) {
        return this.globalService.response('Route Not Found!', {});
      }
      const validatePoint = await this.prisma.point.findFirst({
        where: {
          id: request.pointId,
        },
      });
      if (!validatePoint) {
        return this.globalService.response('Point Not Found!', {});
      }
      const routePoint = await this.prisma.routePoint.create({
        data: {
          routeId: request.routeId,
          pointId: request.pointId,
        },
      });
      const result = await this.prisma.routePoint.findFirst({
        where: { id: routePoint.id },
        include: {
          route: true,
          point: true,
        },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async updatePoint(request: any) {
    try {
      const validateRoute = await this.prisma.route.findFirst({
        where: {
          id: request.routeId,
        },
      });
      if (!validateRoute) {
        return this.globalService.response('Route Not Found!', {});
      }
      const validatePoint = await this.prisma.point.findFirst({
        where: {
          id: request.pointId,
        },
      });
      if (!validatePoint) {
        return this.globalService.response('Point Not Found!', {});
      }
      await this.prisma.routePoint.update({
        where: {
          id: request.routePointId,
        },
        data: {
          routeId: request.routeId,
          pointId: request.pointId,
        },
      });
      const result = await this.prisma.routePoint.findFirst({
        where: { id: request.routePointId },
        include: {
          route: true,
          point: true,
        },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async deletePoint(request: any) {
    try {
      const validatePoint = await this.prisma.routePoint.findFirst({
        where: {
          id: request.routeId,
        },
      });
      if (!validatePoint || validatePoint.deletedAt) {
        return this.globalService.response('Route Point Not Found!', {});
      }
      const result = await this.prisma.routePoint.findFirst({
        where: { id: request.routePointId },
        include: {
          route: true,
          point: true,
        },
      });
      await this.prisma.routePoint.update({
        where: {
          id: request.routePointId,
        },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
