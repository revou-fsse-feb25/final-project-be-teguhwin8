/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { isBlankish } from './utils/role.utils';
import { Prisma } from '@prisma/client';
@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      const data = await this.prisma.role.create({
        data: createRoleDto,
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

    const whereConditions: any = {
      deletedAt: null,
    };

    if (!isBlankish(search)) {
      const kw = String(search).trim();
      whereConditions.OR = [{ name: { contains: kw, mode: 'insensitive' } }];
    }

    const allowedSort = new Set(['createdAt', 'updatedAt', 'name']);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'createdAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.role.count({ where: whereConditions }),
        this.prisma.role.findMany({
          where: whereConditions,
          include: {
            permission: {
              where: { deletedAt: null },
              include: { permission: true },
            },
            _count: {
              select: {
                user: true,
                permission: true,
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
        data: datas,
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
        },
      };
    } catch (error) {
      console.error('Something went wrong:', error);
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permission: {
            where: {
              deletedAt: null,
            },
            include: {
              permission: true,
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

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const validate = await this.prisma.role.findUnique({
        where: { id },
      });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.role.update({
        data: updateRoleDto,
        where: { id },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async addPermission(request: any) {
    try {
      const validate = await this.prisma.role.findUnique({
        where: { id: request.roleId },
      });

      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }

      await this.prisma.rolePermission.deleteMany({
        where: {
          roleId: request.roleId,
        },
      });

      for (let i = 0; i < request.permissionId.length; i++) {
        const permissionId = request.permissionId[i];
        const permission = await this.prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (permission && !permission.deletedAt) {
          await this.prisma.rolePermission.create({
            data: {
              roleId: request.roleId,
              permissionId: permissionId,
            },
          });
        }
      }

      const result = await this.prisma.role.findUnique({
        where: { id: request.roleId },
        include: {
          permission: {
            include: {
              permission: true,
            },
          },
        },
      });

      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const role = await this.prisma.role.findUnique({ where: { id } });
      if (!role || role.deletedAt) {
        return this.globalService.response('Role not found!', {});
      }

      const usersUsingRole = await this.prisma.user.count({
        where: {
          roleId: id,
          deletedAt: null,
        },
      });

      if (usersUsingRole > 0) {
        return this.globalService.response(
          `This role cannot be deleted because it is currently assigned to ${usersUsingRole} user(s).`,
          {
            blocked: true,
            roleId: id,
            usersUsingRole,
          },
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.updateMany({
          where: { roleId: id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        const updatedRole = await tx.role.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        return updatedRole;
      });

      return this.globalService.response('Role deleted successfully', result);
    } catch (error) {
      console.error('Something went wrong:', error);
      throw new InternalServerErrorException('Something went wrong!');
    }
  }

  async assignPermissionsToRoles(data: AssignRolePermissionDto[]) {
    try {
      const results = [];

      for (const item of data) {
        const role = await this.prisma.role.findFirst({
          where: { name: item.role },
        });

        if (!role || role.deletedAt) {
          results.push({
            role: item.role,
            message: 'Role not found or deleted',
            assignedPermissions: [],
            notFoundPermissions: [],
          });
          continue;
        }

        await this.prisma.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        const assignedPermissions: string[] = [];
        const notFoundPermissions: string[] = [];

        for (const { name } of item.permissions) {
          const permission = await this.prisma.permission.findFirst({
            where: { name },
          });

          if (!permission || permission.deletedAt) {
            notFoundPermissions.push(name);
            continue;
          }

          await this.prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });

          assignedPermissions.push(name);
        }

        results.push({
          role: role.name,
          message: 'Permissions replaced successfully',
          assignedPermissions,
          notFoundPermissions,
        });
      }

      return this.globalService.response(
        'Permissions assigned (hard delete and recreate)',
        results,
      );
    } catch (error) {
      console.error('Error assigning permissions:', error);
      throw new InternalServerErrorException(
        'Failed to assign role permissions',
      );
    }
  }

  // Recovery Mode API
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
          rolePermission: {
            some: {
              deletedAt: { not: null },
              permission: {
                name: { contains: kw, mode: 'insensitive' },
              },
            },
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
        this.prisma.role.count({ where: whereConditions }),
        this.prisma.role.findMany({
          where: whereConditions,
          include: {
            permission: {
              where: { deletedAt: { not: null } },
              include: {
                permission: true,
              },
            },
            _count: {
              select: {
                user: true,
                permission: true,
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
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string) {
    try {
      const softDeletedRole = await this.prisma.role.findFirst({
        where: { id, NOT: { deletedAt: null } },
        select: { id: true },
      });

      if (!softDeletedRole) {
        throw new NotFoundException('Role not found or not soft-deleted');
      }

      const [_, __] = await this.prisma.$transaction([
        this.prisma.role.update({
          where: { id },
          data: { deletedAt: null, updatedAt: new Date() },
        }),
        this.prisma.rolePermission.updateMany({
          where: {
            roleId: id,
            NOT: { deletedAt: null },
          },
          data: { deletedAt: null, updatedAt: new Date() },
        }),
      ]);

      const restored = await this.prisma.role.findUnique({
        where: { id },
        include: {
          permission: true,
        },
      });

      return {
        code: 200,
        message: 'Successfully Restored',
        data: restored,
      };
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async destroy(id: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        const delRes = await tx.role.deleteMany({
          where: { id, NOT: { deletedAt: null } },
        });
        return delRes;
      });

      if (result.count === 0) {
        throw new NotFoundException('Role not found or not soft-deleted');
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
            'Cannot hard delete: the role is still referenced by other records. Clean up related data first.',
          );
        }
      }
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
