/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { isBlankish } from './utils/permission.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class PermissionService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createPermissionDto: CreatePermissionDto) {
    try {
      const data = await this.prisma.permission.create({
        data: createPermissionDto,
      });
      return this.globalService.response('Successfully', data);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(request: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = request ?? {};
    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;
    const whereConditions: any = { deletedAt: null };
    if (!isBlankish(search)) {
      const kw = String(search).trim();
      whereConditions.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        {
          role: {
            some: { role: { name: { contains: kw, mode: 'insensitive' } } },
          },
        },
      ];
    }

    const allowedSort = new Set(['createdAt', 'updatedAt', 'name']);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'createdAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.permission.count({ where: whereConditions }),
        this.prisma.permission.findMany({
          where: whereConditions,
          include: {
            role: {
              where: { deletedAt: null },
              select: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    _count: {
                      select: {
                        user: true,
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
        }),
      ]);

      return {
        code: 200,
        message: 'Successfully',
        data: Array.isArray(datas) ? datas : [],
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
          hasNextPage: pageNum < Math.ceil(total / take),
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: { search: isBlankish(search) ? '' : search },
      };
    } catch (error) {
      console.error('Failed to list permissions:', error);
      throw new InternalServerErrorException('Failed to list permissions');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.permission.findUnique({
        where: { id, deletedAt: null },
        include: {
          role: {
            where: {
              deletedAt: null,
            },
            include: {
              role: true,
            },
          },
        },
      });
      if (!datas) {
        return this.globalService.response('Data Not Found!', {});
      }
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    try {
      const permission = await this.prisma.permission.findFirst({
        where: { id, deletedAt: null },
      });
      if (!permission) {
        throw new Error(
          `Permission with ID ${id} not found or has been deleted`,
        );
      }
      const { deletedAt, ...safeDto } = updatePermissionDto as any;
      const updated = await this.prisma.permission.update({
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
      const permission = await this.prisma.permission.findUnique({
        where: { id },
        include: {
          role: {
            where: { deletedAt: null },
            include: {
              role: {
                include: {
                  user: {
                    where: { deletedAt: null },
                  },
                },
              },
            },
          },
        },
      });

      if (!permission || permission.deletedAt) {
        return this.globalService.response('Permission not found', {});
      }

      const rolesWithUsers = permission.role.filter(
        (r) => r.role.user && r.role.user.length > 0,
      );

      if (rolesWithUsers.length > 0) {
        throw new BadRequestException({
          code: 400,
          message: `This permission cannot be deleted because it is assigned to ${rolesWithUsers.length} role(s) that currently have active users.`,
          data: {
            permissionId: id,
            affectedRoles: rolesWithUsers.map((r) => ({
              roleId: r.id,
              roleName: r.role.name,
              userCount: r.role.user.length,
            })),
          },
        });
      }

      const deleted = await this.prisma.permission.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return this.globalService.response('Successfully soft deleted', deleted);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException(
        error?.message || 'Something went wrong!',
      );
    }
  }

  async createBulk(names: string[]) {
    try {
      const existing = await this.prisma.permission.findMany({
        where: { name: { in: names } },
        select: { name: true },
      });

      const existingNames = existing.map((p) => p.name);
      const newNames = names.filter((name) => !existingNames.includes(name));

      if (newNames.length === 0) {
        return this.globalService.response('No new permissions to create', []);
      }

      const created = await this.prisma.permission.createMany({
        data: newNames.map((name) => ({ name })),
        skipDuplicates: true,
      });

      return this.globalService.response('Permissions created', created);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException(
        'Something went wrong while creating permissions.',
      );
    }
  }

  async findAllRecovery(request: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'deletedAt',
      sortOrder = 'desc',
    } = request ?? {};

    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;
    const whereConditions: any = {
      deletedAt: { not: null },
    };

    if (!isBlankish(search)) {
      const kw = String(search).trim();
      whereConditions.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        {
          role: {
            some: { role: { name: { contains: kw, mode: 'insensitive' } } },
          },
        },
      ];
    }

    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'deletedAt',
      'name',
    ]);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'deletedAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.permission.count({ where: whereConditions }),
        this.prisma.permission.findMany({
          where: whereConditions,
          include: {
            role: {
              where: {
                OR: [{ deletedAt: null }, { deletedAt: { not: null } }],
              },
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    _count: {
                      select: {
                        user: true,
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
        }),
      ]);

      return {
        code: 200,
        message: 'Successfully',
        data: Array.isArray(datas) ? datas : [],
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
          hasNextPage: pageNum < Math.ceil(total / take),
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          search: isBlankish(search) ? '' : search,
          onlyDeleted: true,
        },
      };
    } catch (error) {
      console.error('Failed to list deleted permissions:', error);
      throw new InternalServerErrorException(
        'Failed to list deleted permissions',
      );
    }
  }

  async restore(id: string) {
    try {
      const result = await this.prisma.permission.updateMany({
        where: {
          id,
          NOT: { deletedAt: null },
        },
        data: { deletedAt: null },
      });
      if (result.count === 0) {
        throw new NotFoundException('Permission not found or not soft-deleted');
      }
      const restored = await this.prisma.permission.findUnique({
        where: { id },
        include: {
          role: {
            where: { deletedAt: null },
            include: { role: true },
          },
        },
      });
      return {
        code: 200,
        message: 'Successfully Restored',
        data: restored,
      };
    } catch (error) {
      console.error('Failed to restore permission:', error);
      throw new InternalServerErrorException('Failed to restore permission');
    }
  }

  async destroy(id: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { permissionId: id } });
        const delRes = await tx.permission.deleteMany({
          where: { id, NOT: { deletedAt: null } },
        });
        return delRes;
      });
      if (result.count === 0) {
        throw new NotFoundException('Permission not found or not soft-deleted');
      }
      return {
        code: 200,
        message: 'Successfully destroyed',
        data: { id, hardDeleted: true },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot hard delete: the permission is still referenced by other records. Clean up related data first.',
          );
        }
      }
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
