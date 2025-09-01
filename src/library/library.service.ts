/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any) {
    try {
      const validateCode = await this.prisma.library.findFirst({
        where: {
          code: request.code,
        },
      });
      if (validateCode) {
        return this.globalService.response('Code Already Exist!', {});
      }
      const data = await this.prisma.library.create({
        data: {
          code: request.code,
          master: request.master,
          values: request.values,
          name: request.name,
          description: request.description,
          status: request.status,
        },
      });
      const result = await this.prisma.library.findFirst({
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
      if (request.code) {
        whereConditions['code'] = {
          contains: request.code,
        };
      }
      if (request.master) {
        whereConditions['master'] = {
          contains: request.master,
        };
      }
      const datas = await this.prisma.library.findMany({
        where: whereConditions,
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.library.findUnique({
        where: { id, deletedAt: null },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, request: any) {
    try {
      const library = await this.prisma.library.findFirst({
        where: { id, deletedAt: null },
      });
      if (!library) {
        throw new Error(`Library with ID ${id} not found or has been deleted`);
      }
      const { deletedAt, ...safeDto } = request as any;
      const updated = await this.prisma.library.update({
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
      const deleted = await this.prisma.library.update({
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
      const restored = await this.prisma.library.update({
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
