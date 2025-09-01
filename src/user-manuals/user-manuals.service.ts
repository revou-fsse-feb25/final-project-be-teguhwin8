/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserManualDto } from './dto/create-user-manual.dto';
import { UpdateUserManualDto } from './dto/update-user-manual.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class UserManualsService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  // Create a new UserManual
  async create(createUserManualDto: CreateUserManualDto) {
    try {
      const newUserManual = await this.prisma.userManual.create({
        data: createUserManualDto,
      });

      return {
        message: 'User manual created successfully',
        status: 'success',
        data: newUserManual,
      };
    } catch (error) {
      return this.handleException(error, 'Failed to create user manual');
    }
  }

  // Get all UserManuals
  async findAll(searchParams: {
    title?: string;
    featuresId?: string;
    description?: string;
  }) {
    try {
      const { title, featuresId, description } = searchParams;

      const userManuals = await this.prisma.userManual.findMany({
        where: {
          AND: [
            { deletedAt: null },
            title ? { title: { contains: title, mode: 'insensitive' } } : {},
            featuresId ? { featuresId } : {},
            description
              ? { description: { contains: description, mode: 'insensitive' } }
              : {},
          ],
        },
        include: {
          features: true,
          steps: true,
        },
      });

      return {
        message: 'User manuals retrieved successfully',
        status: 'success',
        data: userManuals,
      };
    } catch (error) {
      return this.handleException(error, 'Failed to retrieve user manuals');
    }
  }

  // Get a specific UserManual by ID
  async findOne(id: string) {
    try {
      const userManual = await this.prisma.userManual.findFirst({
        where: { id, deletedAt: null },
        include: { features: true, steps: true },
      });
      if (!userManual) throw new NotFoundException('User manual not found');
      return {
        message: 'User manual retrieved successfully',
        status: 'success',
        data: userManual,
      };
    } catch (error) {
      return this.handleException(error, 'Failed to get user manual');
    }
  }

  // Update a UserManual by ID
  async update(id: string, updateUserManualDto: UpdateUserManualDto) {
    try {
      // Only update if not soft-deleted
      const userManual = await this.prisma.userManual.findFirst({
        where: { id, deletedAt: null },
      });

      if (!userManual) {
        throw new NotFoundException(
          `UserManual with ID ${id} not found or has been deleted`,
        );
      }

      // Prevent updating deletedAt via DTO
      const { deletedAt, ...safeDto } = updateUserManualDto as any;

      const updatedUserManual = await this.prisma.userManual.update({
        where: { id },
        data: safeDto,
      });

      return {
        message: 'User manual updated successfully',
        status: 'success',
        data: updatedUserManual,
      };
    } catch (error) {
      return this.handleException(
        error,
        `Failed to update user manual with ID ${id}`,
      );
    }
  }

  // Remove (soft delete)
  async remove(id: string) {
    try {
      const deleted = await this.prisma.userManual.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully soft deleted', deleted);
    } catch (error) {
      return this.handleException(error, 'Failed to soft delete user manual');
    }
  }

  // Restore
  async restore(id: string) {
    try {
      const restored = await this.prisma.userManual.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      return this.handleException(error, 'Failed to restore user manual');
    }
  }

  // Centralized exception handling
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
