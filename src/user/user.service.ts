/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { Prisma } from '@prisma/client';
import {
  toArray,
  localPart,
  toDate,
  toNull,
  toRel,
  toTypeCode,
  yyyymmddDots,
  toUpdate,
} from './utils/user.utils';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: {
    name?: string;
    email: string;
    password: string;
    roleId: string;
    phoneNumber?: string;
    type?: string;
    operatorId?: string;
  }) {
    const roleLabel = (r?: { name?: string | null }) =>
      r?.name?.trim() ? r.name : '-';

    const role = await this.prisma.role.findFirst({
      where: { id: request.roleId, deletedAt: null },
      select: { id: true },
    });
    if (!role) return this.globalService.response('Role Not Found!', {});
    const conflictMessages: string[] = [];
    if (request.email?.trim()) {
      const dupEmail = await this.prisma.user.findFirst({
        where: { deletedAt: null, email: request.email },
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      });
      if (dupEmail) {
        conflictMessages.push(
          `Email sudah digunakan oleh "${
            dupEmail.name ?? dupEmail.email ?? '-'
          }" (Role: ${roleLabel(dupEmail.role)}).`,
        );
      }
    } else {
      throw new BadRequestException('Email is required');
    }
    if (request.phoneNumber?.trim()) {
      const dupPhone = await this.prisma.user.findFirst({
        where: { deletedAt: null, phoneNumber: request.phoneNumber },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          role: { select: { name: true } },
        },
      });
      if (dupPhone) {
        conflictMessages.push(
          `Nomor telepon sudah digunakan oleh "${
            dupPhone.name ?? dupPhone.phoneNumber ?? '-'
          }" (Role: ${roleLabel(dupPhone.role)}).`,
        );
      }
    }

    if (conflictMessages.length > 0) {
      throw new BadRequestException(conflictMessages.join(' '));
    }
    const hashPassword = await bcrypt.hash(request.password, 10);
    const fallbackName = request.name?.trim()?.length
      ? request.name.trim()
      : request.email.split('@')[0];
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: fallbackName || null,
          email: request.email,
          password: hashPassword,
          roleId: request.roleId,
          phoneNumber: request.phoneNumber ?? null,
          type: request.type ?? null,
          operatorId: request.operatorId ?? null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          type: true,
        },
      });
      const typeCode = toTypeCode(user.type);
      const dateStr = yyyymmddDots(new Date());
      const last = await tx.staffProfile.findFirst({
        where: {
          employeeNo: { startsWith: `TRV-${typeCode}-${dateStr}` },
        },
        orderBy: { employeeNo: 'desc' },
        select: { employeeNo: true },
      });
      let nextNumber = 1;
      if (last?.employeeNo) {
        const parts = last.employeeNo.split('-');
        const lastNum = parseInt(parts[3], 10);
        if (!isNaN(lastNum)) nextNumber = lastNum + 1;
      }
      const employeeNo = `TRV-${typeCode}-${dateStr}-${String(
        nextNumber,
      ).padStart(3, '0')}`;
      await tx.staffProfile.create({
        data: {
          userId: user.id,
          employeeNo,
          fullName: user.name ?? user.email.split('@')[0] ?? '',
          preferredName: user.name ?? null,
          personalEmail: user.email,
          phone: user.phoneNumber ?? null,
          status: 'ACTIVE',
        },
      });
      return tx.user.findUnique({
        where: { id: user.id },
        include: { StaffProfile: true, role: true, operator: true },
      });
    });
    return this.globalService.response('Successfully', created);
  }

  async findAll(request: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
      roleId,
      notRoleId,
      operator,
      operatorId,
    } = request ?? {};

    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;

    const typeArray = toArray(type);
    const roleIds = toArray(roleId);
    const notRoleIds = toArray(notRoleId);
    const operatorParam = operatorId ?? operator ?? null;
    const whereConditions: any = {
      deletedAt: null,
      ...(typeArray ? { type: { in: typeArray } } : { type: { not: null } }),
      ...(operatorParam ? { operatorId: operatorParam } : {}),
    };
    if (roleIds?.length) {
      whereConditions.roleId = { in: roleIds };
    }
    if (notRoleIds?.length) {
      whereConditions.NOT = [
        ...(whereConditions.NOT ?? []),
        { roleId: { in: notRoleIds } },
      ];
    }
    if (search && String(search).trim() !== '') {
      const kw = String(search).trim();
      whereConditions.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        { email: { contains: kw, mode: 'insensitive' } },
        { phoneNumber: { contains: kw, mode: 'insensitive' } },
        { operator: { name: { contains: kw, mode: 'insensitive' } } },
        { role: { name: { contains: kw, mode: 'insensitive' } } },
      ];
    }
    const allowedSort = new Set(['createdAt', 'updatedAt', 'name', 'email']);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'createdAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.user.count({ where: whereConditions }),
        this.prisma.user.findMany({
          where: whereConditions,
          include: { role: true, operator: true, StaffProfile: true },
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
        }),
      ]);
      const totalPages = Math.ceil(total / take);

      return {
        code: 200,
        message: 'Successfully',
        data: datas,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          type: typeArray ?? 'ANY',
          roleId: roleIds ?? 'ANY',
          notRoleId: notRoleIds ?? 'ANY',
          operatorId: operatorParam ?? 'ANY',
          search: search ?? '',
        },
      };
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.user.findUnique({
        where: { id, deletedAt: null },
        include: {
          role: {
            include: {
              permission: {
                include: {
                  permission: true,
                },
              },
            },
          },
          StaffProfile: true,
          operator: true,
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { StaffProfile: true },
    });
    if (!existing) {
      return this.globalService.response('Data Not Found!', {});
    }
    const roleLabel = (r?: { name?: string | null }) =>
      r?.name?.trim() ? r.name : '-';
    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, deletedAt: null },
        select: { id: true },
      });
      if (!role) {
        return this.globalService.response('Role Not Found!', {});
      }
    }
    const conflictMessages: string[] = [];
    if (dto.email && dto.email !== existing.email) {
      const dupEmail = await this.prisma.user.findFirst({
        where: {
          deletedAt: null,
          email: dto.email,
          NOT: { id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      });

      if (dupEmail) {
        conflictMessages.push(
          `Email sudah digunakan oleh "${
            dupEmail.name ?? dupEmail.email ?? '-'
          }" (Role: ${roleLabel(dupEmail.role)}).`,
        );
      }
    }
    if (dto.phoneNumber && dto.phoneNumber !== existing.phoneNumber) {
      const dupPhone = await this.prisma.user.findFirst({
        where: {
          deletedAt: null,
          phoneNumber: dto.phoneNumber,
          NOT: { id },
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          role: { select: { name: true } },
        },
      });

      if (dupPhone) {
        conflictMessages.push(
          `Nomor telepon sudah digunakan oleh "${
            dupPhone.name ?? dupPhone.phoneNumber ?? '-'
          }" (Role: ${roleLabel(dupPhone.role)}).`,
        );
      }
    }

    if (conflictMessages.length > 0) {
      throw new BadRequestException(conflictMessages.join(' '));
    }
    let newPassword: string | undefined;
    if (dto.password && dto.password.trim()) {
      newPassword = await bcrypt.hash(dto.password, 10);
    }
    delete (dto as any).schoolId;
    const willSetName = dto.name ?? existing.name;
    const willSetEmail = dto.email ?? existing.email;
    const willSetPhone = dto.phoneNumber ?? existing.phoneNumber;
    const syncFullName =
      willSetName && willSetName.trim().length > 0
        ? willSetName.trim()
        : localPart(willSetEmail ?? '') || '';
    const syncPreferredName = willSetName ?? null;
    const syncPersonalEmail = willSetEmail ?? null;
    const syncPhone = willSetPhone ?? null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          name: willSetName ?? null,
          email: willSetEmail ?? null,
          password: newPassword ?? undefined,
          roleId: dto.roleId ?? undefined,
          phoneNumber: willSetPhone ?? null,
          type: dto.type ?? undefined,
          operatorId: dto.operatorId ?? undefined,
        },
        include: { StaffProfile: true },
      });
      await tx.staffProfile.upsert({
        where: { userId: updatedUser.id },
        create: {
          userId: updatedUser.id,
          fullName: syncFullName,
          preferredName: syncPreferredName,
          personalEmail: syncPersonalEmail,
          phone: syncPhone,
          status: 'ACTIVE',
        },
        update: {
          fullName: syncFullName,
          preferredName: syncPreferredName,
          personalEmail: syncPersonalEmail,
          phone: syncPhone,
        },
      });

      return tx.user.findUnique({
        where: { id: updatedUser.id },
        include: {
          StaffProfile: true,
          role: true,
          operator: true,
        },
      });
    });

    return this.globalService.response('Successfully', updated);
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.user.findUnique({
        where: { id, deletedAt: null },
        include: { StaffProfile: true },
      });
      if (!validate) {
        return this.globalService.response('Data Not Found!', {});
      }

      const deletedAt = new Date();

      const datas = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id },
          data: { deletedAt },
        });

        if (validate.StaffProfile) {
          await tx.staffProfile.update({
            where: { userId: id },
            data: { deletedAt },
          });
        }

        return user;
      });

      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('[UsersService.remove] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async updateProfile(request: any, file?: Express.Multer.File) {
    try {
      const { userId, user = {}, staff = {} } = request ?? {};
      if (!userId?.trim()) {
        throw new BadRequestException('userId is required');
      }
      const existing = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { StaffProfile: true },
      });
      if (!existing) {
        return this.globalService.response('Data Not Found!', {});
      }
      if (user.roleId !== undefined && user.roleId !== null) {
        const role = await this.prisma.role.findFirst({
          where: { id: user.roleId, deletedAt: null },
          select: { id: true },
        });
        if (!role) return this.globalService.response('Role Not Found!', {});
      }
      if (user.email !== undefined) {
        if (user.email && user.email !== existing.email) {
          const dup = await this.prisma.user.findFirst({
            where: { email: user.email, deletedAt: null, NOT: { id: userId } },
            select: { id: true },
          });
          if (dup) throw new UnauthorizedException('email already exist');
        }
      }
      if (staff.workEmail !== undefined && staff.workEmail) {
        const dupWork = await this.prisma.staffProfile.findFirst({
          where: {
            workEmail: staff.workEmail,
            deletedAt: null,
            NOT: { userId },
          },
          select: { userId: true },
        });
        if (dupWork) throw new BadRequestException('workEmail already exist');
      }
      if (staff.employeeNo !== undefined && staff.employeeNo) {
        const dupEmp = await this.prisma.staffProfile.findFirst({
          where: { employeeNo: staff.employeeNo, NOT: { userId } },
          select: { userId: true },
        });
        if (dupEmp) throw new BadRequestException('employeeNo already exist');
      }
      if (staff.managerId !== undefined && staff.managerId) {
        const mgr = await this.prisma.staffProfile.findUnique({
          where: { userId: staff.managerId },
          select: { userId: true },
        });
        if (!mgr)
          throw new BadRequestException(
            'managerId is not a valid StaffProfile',
          );
      }
      let uploadedPhotoUrl: string | null = null;
      if (file) {
        const allowedMime = new Set([
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
        ]);
        const MAX_SIZE = 5 * 1024 * 1024;
        if (!allowedMime.has(file.mimetype)) {
          throw new BadRequestException(
            'Invalid photo format. Only PNG, JPG, JPEG, WEBP are allowed.',
          );
        }
        if (file.size > MAX_SIZE) {
          throw new BadRequestException('Photo is too large. Max size is 5MB.');
        }
        const uploaded = await this.globalService.uploadFile({
          buffer: file.buffer,
          fileType: {
            ext: file.originalname.split('.').pop(),
            mime: file.mimetype,
          },
        });
        uploadedPhotoUrl = uploaded?.Location ?? null;
      }
      const finalUserData: Prisma.UserUpdateInput = {
        name: toUpdate(user.name),
        email: toUpdate(user.email),
        phoneNumber: toUpdate(user.phoneNumber),
        type: toUpdate(user.type),
        role: user.roleId !== undefined ? toRel(user.roleId) : undefined,
        operator:
          user.operatorId !== undefined ? toRel(user.operatorId) : undefined,
      };
      const staffPlain = {
        employeeNo: toUpdate(staff.employeeNo),
        fullName:
          staff.fullName !== undefined ? toUpdate(staff.fullName) : undefined,
        preferredName:
          staff.preferredName !== undefined
            ? toUpdate(staff.preferredName)
            : undefined,
        workEmail: toUpdate(staff.workEmail),
        personalEmail:
          staff.personalEmail !== undefined
            ? toUpdate(staff.personalEmail)
            : undefined,
        phone: staff.phone !== undefined ? toUpdate(staff.phone) : undefined,
        secondaryPhone: toUpdate(staff.secondaryPhone),
        jobTitle: toUpdate(staff.jobTitle),
        photoUrl: file ? uploadedPhotoUrl : toUpdate(staff.photoUrl),
        gender: staff.gender !== undefined ? (staff.gender as any) : undefined,
        dateOfBirth:
          staff.dateOfBirth !== undefined
            ? toDate(staff.dateOfBirth)
            : undefined,
        maritalStatus:
          staff.maritalStatus !== undefined
            ? (staff.maritalStatus as any)
            : undefined,
        department: toUpdate(staff.department),
        managerId: toUpdate(staff.managerId),
        grade: toUpdate(staff.grade),
        costCenter: toUpdate(staff.costCenter),
        workLocation: toUpdate(staff.workLocation),
        workSchedule: toUpdate(staff.workSchedule),
        employmentType:
          staff.employmentType !== undefined
            ? (staff.employmentType as any)
            : undefined,
        shiftType:
          staff.shiftType !== undefined ? (staff.shiftType as any) : undefined,
        hiredAt:
          staff.hiredAt !== undefined ? toDate(staff.hiredAt) : undefined,
        probationEndAt:
          staff.probationEndAt !== undefined
            ? toDate(staff.probationEndAt)
            : undefined,
        terminatedAt:
          staff.terminatedAt !== undefined
            ? toDate(staff.terminatedAt)
            : undefined,
        terminationReason: toUpdate(staff.terminationReason),
        address: toUpdate(staff.address),
        city: toUpdate(staff.city),
        country: toUpdate(staff.country),
        nationalId: toUpdate(staff.nationalId),
        taxId: toUpdate(staff.taxId),
        notes: toUpdate(staff.notes),
        status: staff.status !== undefined ? (staff.status as any) : undefined,
      };

      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: finalUserData,
        });
        await tx.staffProfile.upsert({
          where: { userId },
          create: {
            userId: String(userId),
            status: (staff.status as any) ?? 'ACTIVE',
            ...staffPlain,
          },
          update: {
            ...staffPlain,
          },
        });

        return tx.user.findUnique({
          where: { id: userId },
          include: {
            StaffProfile: true,
            role: true,
            operator: true,
          },
        });
      });
      return this.globalService.response('Successfully', updated);
    } catch (error) {
      console.error('[UsersService.updateProfile] Error:', error);
      if ((error as any)?.code === 'P2002') {
        const fields = (error as any)?.meta?.target ?? [];
        throw new BadRequestException(
          `Unique constraint failed on: ${
            Array.isArray(fields) ? fields.join(', ') : String(fields)
          }`,
        );
      }
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile');
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
      type,
      roleId,
      notRoleId,
      operator,
      operatorId,
    } = request ?? {};

    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;

    const typeArray = toArray(type);
    const roleIds = toArray(roleId);
    const notRoleIds = toArray(notRoleId);
    const operatorParam = operatorId ?? operator ?? null;

    const whereConditions: any = {
      deletedAt: { not: null },
      ...(typeArray ? { type: { in: typeArray } } : { type: { not: null } }),
      ...(operatorParam ? { operatorId: operatorParam } : {}),
    };

    if (roleIds?.length) {
      whereConditions.roleId = { in: roleIds };
    }
    if (notRoleIds?.length) {
      whereConditions.NOT = [
        ...(whereConditions.NOT ?? []),
        { roleId: { in: notRoleIds } },
      ];
    }

    if (search && String(search).trim() !== '') {
      const kw = String(search).trim();
      whereConditions.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        { email: { contains: kw, mode: 'insensitive' } },
        { phoneNumber: { contains: kw, mode: 'insensitive' } },
        { operator: { name: { contains: kw, mode: 'insensitive' } } },
        { role: { name: { contains: kw, mode: 'insensitive' } } },
      ];
    }

    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'deletedAt',
      'name',
      'email',
    ]);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'deletedAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.user.count({ where: whereConditions }),
        this.prisma.user.findMany({
          where: whereConditions,
          include: { role: true, operator: true, StaffProfile: true },
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
        }),
      ]);

      const totalPages = Math.ceil(total / take);

      return {
        code: 200,
        message: 'Successfully',
        data: datas,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          type: typeArray ?? 'ANY',
          roleId: roleIds ?? 'ANY',
          notRoleId: notRoleIds ?? 'ANY',
          operatorId: operatorParam ?? 'ANY',
          search: search ?? '',
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
      const restored = await this.prisma.$transaction(async (tx) => {
        const result = await tx.user.updateMany({
          where: { id, NOT: { deletedAt: null } },
          data: { deletedAt: null },
        });

        if (result.count === 0) {
          throw new NotFoundException('User not found or not soft-deleted');
        }
        await tx.staffProfile.updateMany({
          where: { userId: id, NOT: { deletedAt: null } },
          data: { deletedAt: null },
        });
        return tx.user.findUnique({
          where: { id },
          include: {
            role: true,
            operator: true,
            StaffProfile: true,
          },
        });
      });

      return {
        code: 200,
        message: 'Successfully Restored',
        data: restored,
      };
    } catch (error) {
      console.error('[UsersService.restore] Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async destroy(id: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.userDevice.deleteMany({ where: { user_id: id } });
        await tx.scheduleTripsUpdates.deleteMany({ where: { updatedBy: id } });
        await tx.customer.deleteMany({ where: { userId: id } });
        await tx.articles.updateMany({
          where: { authorId: id },
          data: { authorId: null },
        });
        await tx.about.updateMany({
          where: { lastUpdateAuthorId: id },
          data: { lastUpdateAuthorId: null },
        });
        await tx.faq.updateMany({
          where: { authorId: id },
          data: { authorId: null },
        });
        await tx.banner.updateMany({
          where: { lastUpdateAuthorId: id },
          data: { lastUpdateAuthorId: null },
        });
        await tx.slider.updateMany({
          where: { createdById: id },
          data: { createdById: null },
        });
        await tx.slider.updateMany({
          where: { lastUpdatedById: id },
          data: { lastUpdatedById: null },
        });
        await tx.careerContent.updateMany({
          where: { lastUpdatedById: id },
          data: { lastUpdatedById: null },
        });
        await tx.careerJob.updateMany({
          where: { createdById: id },
          data: { createdById: null },
        });
        await tx.careerJob.updateMany({
          where: { lastUpdatedById: id },
          data: { lastUpdatedById: null },
        });

        await tx.staffProfile.updateMany({
          where: { managerId: id },
          data: { managerId: null },
        });

        await tx.staffProfile.deleteMany({
          where: { userId: id },
        });

        const delRes = await tx.user.deleteMany({
          where: { id, NOT: { deletedAt: null } },
        });

        return delRes;
      });

      if (result.count === 0) {
        throw new NotFoundException('User not found or not soft-deleted');
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
            'Cannot hard delete: the user is still referenced by other records. Clean up related data first.',
          );
        }
      }
      console.error('[UsersService.destroy] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
