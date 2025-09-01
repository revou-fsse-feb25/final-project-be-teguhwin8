/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeaturesDto } from './dto/create-feature.dto';
import { UpdateFeaturesDto } from './dto/update-feature.dto';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class FeaturesService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createFeaturesDto: CreateFeaturesDto) {
    try {
      const newFeature = await this.prisma.features.create({
        data: createFeaturesDto,
      });
      return {
        message: 'Feature created successfully',
        status: 'success',
        data: newFeature,
      };
    } catch (error) {
      return this.handleException(error, 'Failed to create feature');
    }
  }

  async findAll() {
    try {
      const features = await this.prisma.features.findMany({
        where: { deletedAt: null },
      });
      return {
        message: 'Features retrieved successfully',
        status: 'success',
        data: features,
      };
    } catch (error) {
      return this.handleException(error, 'Failed to retrieve features');
    }
  }

  async findOne(id: string) {
    try {
      const feature = await this.prisma.features.findUnique({ where: { id } });
      if (!feature || feature.deletedAt) {
        throw new NotFoundException(`Feature with ID ${id} not found`);
      }
      return {
        message: 'Feature retrieved successfully',
        status: 'success',
        data: feature,
      };
    } catch (error) {
      return this.handleException(
        error,
        `Failed to retrieve feature with ID ${id}`,
      );
    }
  }

  async update(id: string, updateFeaturesDto: UpdateFeaturesDto) {
    try {
      const feature = await this.prisma.features.findFirst({
        where: { id, deletedAt: null },
      });
      if (!feature) {
        throw new NotFoundException(
          `Feature with ID ${id} not found or has been deleted`,
        );
      }
      const { deletedAt, ...safeDto } = updateFeaturesDto as any;
      const updated = await this.prisma.features.update({
        where: { id },
        data: safeDto,
      });
      return {
        message: 'Feature updated successfully',
        status: 'success',
        data: updated,
      };
    } catch (error) {
      return this.handleException(
        error,
        `Failed to update feature with ID ${id}`,
      );
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.features.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully soft deleted', deleted);
    } catch (error) {
      return this.handleException(error, 'Failed to soft delete feature');
    }
  }

  async restore(id: string) {
    try {
      const restored = await this.prisma.features.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      return this.handleException(error, 'Failed to restore feature');
    }
  }

  private handleException(error: any, customMessage: string) {
    console.error(error);
    if (error instanceof NotFoundException) {
      return {
        message: error.message,
        status: 'error',
        data: null,
      };
    }
    throw new InternalServerErrorException({
      message: customMessage,
      status: 'error',
      data: null,
    });
  }
}
