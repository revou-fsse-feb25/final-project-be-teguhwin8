import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTestimonyDto } from './dto/create-testimony.dto';
import { UpdateTestimonyDto } from './dto/update-testimony.dto';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class TestimonyService {
  constructor(
    private prisma: PrismaService,
    private globalService: GlobalService,
  ) {}

  async create(createTestimonyDto: CreateTestimonyDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const newTestimony = await tx.testimonial.create({
          data: createTestimonyDto,
        });
        return this.globalService.response(
          'Testimony created successfully.',
          newTestimony,
        );
      });
    } catch (error) {
      console.error('Create Testimony Error:', error);
      throw new InternalServerErrorException('Failed to create testimony');
    }
  }

  async findAll(page = 1, limit = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.testimonial.findMany({
          where: {
            deletedAt: null,
            ...(search && {
              OR: [
                {
                  message: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  customer: {
                    user: {
                      name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            }),
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        }),

        this.prisma.testimonial.count({
          where: {
            deletedAt: null,
            ...(search && {
              OR: [
                {
                  message: {
                    contains: search,
                  },
                },
                {
                  customer: {
                    user: {
                      name: {
                        contains: search,
                      },
                    },
                  },
                },
              ],
            }),
          },
        }),
      ]);

      return {
        message: 'Testimony list fetched successfully',
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Find All Testimonies Error:', error);
      throw new InternalServerErrorException('Failed to fetch testimonies');
    }
  }

  async findDeleted(page = 1, limit = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;

      const where = {
        deletedAt: {
          not: null,
        },
        ...(search && {
          OR: [
            {
              message: {
                contains: search,
              },
            },
            {
              customer: {
                user: {
                  name: {
                    contains: search,
                  },
                },
              },
            },
          ],
        }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.testimonial.findMany({
          where,
          skip,
          take: limit,
          orderBy: { deletedAt: 'desc' },
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        }),
        this.prisma.testimonial.count({ where }),
      ]);

      return {
        message: 'Deleted testimonies fetched successfully',
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Find Deleted Testimonies Error:', error);
      throw new InternalServerErrorException(
        'Failed to fetch deleted testimonies',
      );
    }
  }

  async findOne(id: string) {
    try {
      const testimony = await this.prisma.testimonial.findUnique({
        where: { id },
        include: {
          customer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!testimony) {
        throw new NotFoundException(`Testimony with id ${id} not found`);
      }

      return this.globalService.response(
        'Testimony fetched successfully.',
        testimony,
      );
    } catch (error) {
      console.error('Find One Testimony Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch testimony');
    }
  }

  async update(id: string, updateTestimonyDto: UpdateTestimonyDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.testimonial.findUnique({ where: { id } });

        if (!existing) {
          throw new NotFoundException(`Testimony with id ${id} not found`);
        }

        const updated = await tx.testimonial.update({
          where: { id },
          data: updateTestimonyDto,
        });

        return this.globalService.response(
          'Testimony updated successfully.',
          updated,
        );
      });
    } catch (error) {
      console.error('Update Testimony Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update testimony');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.testimonial.findUnique({ where: { id } });

        if (!existing) {
          throw new NotFoundException(`Testimony with id ${id} not found`);
        }

        const result = await tx.testimonial.update({
          where: { id },
          data: { deletedAt: new Date() },
          select: {
            id: true,
            deletedAt: true,
          },
        });

        return this.globalService.response(
          `Testimony with id ${id} soft deleted successfully.`,
          result,
          204,
        );
      });
    } catch (error) {
      console.error('Delete Testimony Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to soft delete testimony');
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.testimonial.findUnique({ where: { id } });

        if (!existing || !existing.deletedAt) {
          throw new NotFoundException(
            `Testimony with id ${id} not found or not deleted`,
          );
        }

        const restored = await tx.testimonial.update({
          where: { id },
          data: { deletedAt: null },
        });

        return this.globalService.response(
          `Testimony with id ${id} restored successfully.`,
          restored,
        );
      });
    } catch (error) {
      console.error('Restore Testimony Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to restore testimony');
    }
  }

  async destroy(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.testimonial.findUnique({ where: { id } });

        if (!existing || !existing.deletedAt) {
          throw new NotFoundException(
            `Testimony with id ${id} not found or not in deleted state`,
          );
        }

        await tx.testimonial.delete({ where: { id } });

        return this.globalService.response(
          `Testimony with id ${id} permanently deleted.`,
          null,
        );
      });
    } catch (error) {
      console.error('Hard Delete Testimony Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to hard delete testimony');
    }
  }
}
