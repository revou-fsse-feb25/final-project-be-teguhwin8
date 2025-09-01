/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import * as fileType from 'file-type';

@Injectable()
export class PointService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any, image?: Express.Multer.File) {
    try {
      let uploadedImageUrl: string | null = null;

      if (image) {
        const uploadResult = await this.globalService.uploadFile({
          buffer: image.buffer,
          fileType: await this.getFileType(image),
        });
        uploadedImageUrl = uploadResult.Location;
      }

      const data = await this.prisma.point.create({
        data: {
          operator: request.operator,
          pointCode: request.pointCode,
          operatingHours: request.operatingHours,
          name: request.name,
          description: request.description,
          lat: request.lat,
          long: request.long,
          address: request.address,
          city: request.city,
          image: uploadedImageUrl,
        },
      });
      await this.updateRoutePairsEfficient();
      const result = await this.prisma.point.findFirst({
        where: { id: data.id },
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
      if (request.name) {
        whereConditions['name'] = {
          contains: request.name,
        };
      }
      if (request.operator) {
        whereConditions['operator'] = request.operator;
      }
      const datas = await this.prisma.point.findMany({
        where: whereConditions,
        include: {
          operatorData: true,
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
      const datas = await this.prisma.point.findUnique({
        where: { id },
        include: {
          operatorData: true,
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

  async update(id: string, request: any, image?: Express.Multer.File) {
    try {
      let uploadedImageUrl: string | undefined;

      if (image) {
        const uploadResult = await this.globalService.uploadFile({
          buffer: image.buffer,
          fileType: await this.getFileType(image),
        });
        uploadedImageUrl = uploadResult.Location;
      }

      const data = await this.prisma.point.update({
        where: { id },
        data: {
          operator: request.operator,
          pointCode: request.pointCode,
          operatingHours: request.operatingHours,
          name: request.name,
          description: request.description,
          lat: request.lat,
          address: request.address,
          long: request.long,
          city: request.city,
          ...(uploadedImageUrl ? { image: uploadedImageUrl } : {}),
        },
      });
      await this.updateRoutePairsEfficient();
      const result = await this.prisma.point.findFirst({
        where: { id: data.id },
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  private async updateRoutePairsEfficient() {
    const points = await this.prisma.point.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    const pointIds = points.map((p) => p.id);
    const allPairs = [];
    for (let i = 0; i < pointIds.length; i++) {
      for (let j = 0; j < pointIds.length; j++) {
        if (i !== j) {
          allPairs.push({ departureId: pointIds[i], arrivalId: pointIds[j] });
        }
      }
    }
    const existingPairs = await this.prisma.routePair.findMany({
      where: { deletedAt: null },
      select: { id: true, departureId: true, arrivalId: true },
    });
    const existingSet = new Set(
      existingPairs.map((p) => `${p.departureId}|${p.arrivalId}`),
    );
    const allSet = new Set(
      allPairs.map((p) => `${p.departureId}|${p.arrivalId}`),
    );
    const toInsert = allPairs.filter(
      (p) => !existingSet.has(`${p.departureId}|${p.arrivalId}`),
    );
    const toDelete = existingPairs.filter(
      (p) => !allSet.has(`${p.departureId}|${p.arrivalId}`),
    );
    if (toInsert.length > 0) {
      await this.prisma.routePair.createMany({ data: toInsert });
    }
    if (toDelete.length > 0) {
      const now = new Date();
      await Promise.all(
        toDelete.map((p) =>
          this.prisma.routePair.update({
            where: { id: p.id },
            data: { deletedAt: now },
          }),
        ),
      );
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.point.findUnique({ where: { id } });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.point.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.updateRoutePairsEfficient();
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.point.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.point.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  private async getFileType(file: Express.Multer.File) {
    const detected = await fileType.fromBuffer(file.buffer);
    return (
      detected || {
        ext: file.originalname.split('.').pop() || 'bin',
        mime: file.mimetype,
      }
    );
  }
}
