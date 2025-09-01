import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserManualStepDto } from './dto/create-user-manual-step.dto';
import { UpdateUserManualStepDto } from './dto/update-user-manual-step.dto';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class UserManualStepsService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createUserManualStepDto: CreateUserManualStepDto) {
    try {
      if (
        createUserManualStepDto.files ||
        createUserManualStepDto.files !== ''
      ) {
        const imageUrl = await this.globalService.uploadFile(
          createUserManualStepDto.files,
        );
        createUserManualStepDto.files = imageUrl.Location;
      }
      createUserManualStepDto.stepNumber = parseInt(
        createUserManualStepDto.stepNumber as unknown as string,
        10,
      );
      const data = await this.prisma.userManualStep.create({
        data: {
          ...createUserManualStepDto,
          files: createUserManualStepDto.files,
        },
      });
      return {
        message: 'User manual step created successfully',
        status: 'success',
        data: data,
      };
    } catch (error) {
      return this.handleException(error, 'Failed to create user manual step');
    }
  }

  // Get all UserManualSteps
  async findAll() {
    try {
      const steps = await this.prisma.userManualStep.findMany({
        where: { deletedAt: null },
      });
      return {
        message: 'User manual steps retrieved successfully',
        status: 'success',
        data: steps,
      };
    } catch (error) {
      return this.handleException(
        error,
        'Failed to retrieve user manual steps',
      );
    }
  }

  // Get a specific UserManualStep by ID
  async findOne(id: string) {
    try {
      const step = await this.prisma.userManualStep.findFirst({
        where: { id, deletedAt: null },
      });
      if (!step) throw new NotFoundException('User manual step not found');
      return {
        message: 'User manual step retrieved successfully',
        status: 'success',
        data: step,
      };
    } catch (error) {
      return this.handleException(error, 'Failed to get user manual step');
    }
  }

  // Update a UserManualStep by ID
  async update(id: string, updateUserManualStepDto: UpdateUserManualStepDto) {
    try {
      const step = await this.prisma.userManualStep.findUnique({
        where: { id },
      });
      if (!step) {
        throw new NotFoundException(`UserManualStep with ID ${id} not found`);
      }

      if (
        updateUserManualStepDto.files &&
        updateUserManualStepDto.files !== ''
      ) {
        const imageUrl = await this.globalService.uploadFile(
          updateUserManualStepDto.files,
        );
        updateUserManualStepDto.files = imageUrl.Location;
      }

      if (updateUserManualStepDto.stepNumber) {
        updateUserManualStepDto.stepNumber = parseInt(
          updateUserManualStepDto.stepNumber as unknown as string,
          10,
        );
      }

      const updatedStep = await this.prisma.userManualStep.update({
        where: { id },
        data: {
          ...updateUserManualStepDto,
          files: updateUserManualStepDto.files,
        },
      });

      return {
        message: 'User manual step updated successfully',
        status: 'success',
        data: updatedStep,
      };
    } catch (error) {
      return this.handleException(
        error,
        `Failed to update user manual step with ID ${id}`,
      );
    }
  }

  // Remove (soft delete)
  async remove(id: string) {
    try {
      const deleted = await this.prisma.userManualStep.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return this.globalService.response('Successfully soft deleted', deleted);
    } catch (error) {
      return this.handleException(
        error,
        'Failed to soft delete user manual step',
      );
    }
  }

  // Restore
  async restore(id: string) {
    try {
      const restored = await this.prisma.userManualStep.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      return this.handleException(error, 'Failed to restore user manual step');
    }
  }

  // Centralized exception handling
  private handleException(error: any, customMessage: string) {
    console.error(error); // Log error for debugging

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
