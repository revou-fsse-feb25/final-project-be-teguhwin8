/* eslint-disable @typescript-eslint/no-unused-vars */
import { contains } from '@nestjs/class-validator';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SimCardService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const validateCode = await this.prisma.simCard.findFirst({
        where: {
          msisdNumber: request.msisdNumber,
        },
      });
      if (validateCode) {
        return this.globalService.response('MSISD Already Exist!', {});
      }
      const data = await this.prisma.simCard.create({
        data: {
          deviceId: request.deviceId,
          telco: request.telco,
          type: request.type,
          msisdNumber: request.msisdNumber,
          simNumber: request.simNumber,
          description: request.description,
          activeUntil: request.activeUntil,
          lastUsage: request.lastUsage,
          lastUsageDate: request.lastUsageDate,
          initialQuota: request.initialQuota,
          lastQuota: request.lastQuota,
          lastQuotaBalance: request.lastQuotaBalance,
          lastPulsaBalace: request.lastPulsaBalace,
          lastPulsaDate: request.lastPulsaDate,
          operator: request.operator,
          status: 'NOT_IN_USE',
        },
      });
      const result = await this.prisma.simCard.findFirst({
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
      if (request.msisdNumber) {
        whereConditions['msisdNumber'] = {
          contains: request.msisdNumber,
        };
      }
      if (request.operator) {
        whereConditions['operator'] = request.operator;
      }
      if (request.status) {
        whereConditions['status'] = request.status;
      }
      const datas = await this.prisma.simCard.findMany({
        where: whereConditions,
        include: {
          device: true,
          telcoData: true,
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
      const datas = await this.prisma.simCard.findUnique({
        where: { id, deletedAt: null },
        include: {
          device: true,
          telcoData: true,
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
      const simCard = await this.prisma.simCard.findFirst({
        where: { id, deletedAt: null },
      });
      if (!simCard) {
        throw new Error(`SimCard with ID ${id} not found or has been deleted`);
      }
      const { deletedAt, ...safeDto } = request as any;
      const updated = await this.prisma.simCard.update({
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
      const deleted = await this.prisma.simCard.update({
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
      const restored = await this.prisma.simCard.update({
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
