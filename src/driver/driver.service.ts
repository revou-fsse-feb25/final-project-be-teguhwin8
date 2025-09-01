/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  assertAllowed,
  ic,
  isBlankish,
  toInsensitiveContains,
} from './utils/driver.utils';
import { AudienceScope, NotificationChannel, Prisma } from '@prisma/client';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { getReminderSimDriverTranslations } from 'src/email/templates/translations/driver/reminder-sim-driver';

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  private async uploadImage(
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (!file) return null;
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    try {
      const uploaded = await this.globalService.uploadFile({
        buffer: file.buffer,
        fileType: { ext, mime: file.mimetype },
      });
      return uploaded?.Location ?? null;
    } catch (e) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async create(
    request: CreateDriverDto,
    files?: {
      simPhoto?: Express.Multer.File;
      ktpPhoto?: Express.Multer.File;
    },
  ) {
    try {
      const [simUploaded, ktpUploaded] = await Promise.all([
        this.uploadImage(files?.simPhoto),
        this.uploadImage(files?.ktpPhoto),
      ]);

      const result = await this.prisma.$transaction(async (tx) => {
        const driverRole = await tx.role.findFirst({
          where: { name: { equals: 'driver', mode: 'insensitive' } },
          select: { id: true },
        });
        if (!driverRole)
          throw new BadRequestException('Role "driver" tidak ditemukan.');

        if (!request.name?.trim()) {
          throw new BadRequestException('Nama driver wajib diisi.');
        }

        const user = await tx.user.create({
          data: {
            name: request.name,
            email: request.email ?? null,
            phoneNumber: request.mobilePhone ?? null,
            password: request.password ?? null,
            type: 'driver',
            roleId: driverRole.id,
            operatorId: request.operator ?? null,
            isVerifiedOTP: false,
          },
          select: { id: true },
        });

        const driver = await tx.driver.create({
          data: {
            operator: request.operator ?? null,
            shift: request.shift ?? null,
            code: request.code ?? null,
            name: request.name ?? null,
            vehicleId: request.vehicleId ?? null,
            mobilePhone: request.mobilePhone ?? null,
            description: request.description ?? null,
            userId: user.id,
            nik: request.nik ?? null,
            simNumber: request.simNumber ?? null,
            simPhotoUrl: simUploaded ?? null,
            ktpPhotoUrl: ktpUploaded ?? null,
            simExpiryDate: request.simExpiryDate
              ? new Date(request.simExpiryDate)
              : null,
          },
          select: { id: true },
        });

        return tx.driver.findUnique({
          where: { id: driver.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                roleId: true,
                type: true,
              },
            },
            operatorData: true,
            shiftData: true,
            vehicleData: true,
          },
        });
      });

      return this.globalService.response('Successfully', result);
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = Array.isArray((error as any).meta?.target)
          ? (error as any).meta?.target.join(',')
          : (error as any).meta?.target;

        if (String(target).includes('Driver_userId')) {
          throw new ConflictException(
            'User tersebut sudah terhubung ke driver lain.',
          );
        }
        if (String(target).includes('Driver_vehicleId')) {
          throw new ConflictException('Vehicle sudah terpakai driver lain.');
        }
        if (String(target).includes('User_email')) {
          throw new ConflictException('Email sudah digunakan.');
        }
        if (String(target).includes('User_phoneNumber')) {
          throw new ConflictException('Nomor HP sudah digunakan.');
        }
        if (String(target).includes('Driver_nik')) {
          throw new ConflictException('NIK sudah digunakan.');
        }
        if (String(target).includes('Driver_simNumber')) {
          throw new ConflictException('Nomor SIM sudah digunakan.');
        }
        throw new ConflictException('Gagal karena unique constraint.');
      }
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(request: any) {
    try {
      const searchFields = [];
      const filterFields = ['userId'];
      const allowedSort = new Set([
        'createdAt',
        'updatedAt',
        'name',
        'code',
        'vehicleId',
        'shift',
      ]);
      const include = {
        vehicleData: true,
        operatorData: true,
        shiftData: true,
        user: true,
      };

      let customWhere: any;
      if (request.search) {
        customWhere = {
          OR: [
            { name: { contains: request.search } },
            { code: { contains: request.search } },
            { mobilePhone: { contains: request.search } },
            { operatorData: { is: { name: { contains: request.search } } } },
            // { shiftData: { is: { name: { contains: request.search } } } },
            // { vehicleId: { contains: request.search } },
            {
              user: {
                OR: [
                  { name: { contains: request.search } },
                  { email: { contains: request.search } },
                  { phoneNumber: { contains: request.search } },
                ],
              },
            },
          ],
        };
      }
      return await this.globalService.handleSearchAndFilter(
        this.prisma,
        this.prisma.driver,
        request,
        searchFields,
        filterFields,
        allowedSort,
        include,
        customWhere,
      );
    } catch (error) {
      console.error('[VehicleService.findAll] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.driver.findUnique({
        where: { id },
        include: {
          vehicleData: true,
          operatorData: true,
          shiftData: true,
          user: true,
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

  async update(
    id: string,
    request: UpdateDriverDto,
    files?: {
      simPhoto?: Express.Multer.File;
      ktpPhoto?: Express.Multer.File;
    },
  ) {
    try {
      console.time('uploadImages');
      const [simUploaded, ktpUploaded] = await Promise.all([
        this.uploadImage(files?.simPhoto),
        this.uploadImage(files?.ktpPhoto),
      ]);
      console.timeEnd('uploadImages');

      try {
        console.time('transaction');
        const result = await this.prisma.$transaction(async (tx) => {
          const existing = await tx.driver.findUnique({
            where: { id },
            select: { id: true, userId: true },
          });
          if (!existing)
            throw new NotFoundException(`Driver ${id} tidak ditemukan`);

          if (request.userId !== undefined) {
            if (request.userId === null) {
              await tx.driver.update({ where: { id }, data: { userId: null } });
            } else {
              const targetUser = await tx.user.findUnique({
                where: { id: request.userId },
                select: { id: true },
              });
              if (!targetUser)
                throw new BadRequestException('User tujuan tidak ditemukan.');
              const used = await tx.driver.findFirst({
                where: { userId: request.userId, NOT: { id } },
                select: { id: true },
              });
              if (used)
                throw new ConflictException(
                  `User tersebut sudah terhubung ke driver ${used.id}`,
                );
              const driverRole = await tx.role.findFirst({
                where: { name: { equals: 'driver', mode: 'insensitive' } },
                select: { id: true },
              });
              if (!driverRole)
                throw new BadRequestException('Role "driver" tidak ditemukan.');

              await tx.user.update({
                where: { id: targetUser.id },
                data: { roleId: driverRole.id, type: 'DRIVER' },
              });
              await tx.driver.update({
                where: { id },
                data: { userId: targetUser.id },
              });
              existing.userId = targetUser.id;
            }
          }

          const drv = await tx.driver.update({
            where: { id },
            data: {
              vehicleId: request.vehicleId ?? null,
              operator: request.operator ?? null,
              shift: request.shift ?? null,
              code: request.code ?? null,
              name: request.name ?? undefined,
              mobilePhone: request.mobilePhone ?? null,
              description: request.description ?? null,
              nik: request.nik ?? null,
              simNumber: request.simNumber ?? null,
              simPhotoUrl: simUploaded ?? request.simPhotoUrl ?? null,
              ktpPhotoUrl: ktpUploaded ?? request.ktpPhotoUrl ?? null,
              simExpiryDate: request.simExpiryDate
                ? new Date(request.simExpiryDate)
                : null,
            },
            select: { id: true, userId: true },
          });

          const hasUserFields =
            request.email !== undefined ||
            request.userPhone !== undefined ||
            request.userName !== undefined ||
            request.password !== undefined ||
            request.operator !== undefined ||
            request.name !== undefined ||
            request.mobilePhone !== undefined;

          if (drv.userId && hasUserFields) {
            const userUpdate: Prisma.UserUpdateInput = {
              name:
                request.userName !== undefined
                  ? request.userName
                  : request.name !== undefined
                  ? request.name
                  : undefined,
              email: request.email ?? undefined,
              phoneNumber:
                request.userPhone !== undefined
                  ? request.userPhone
                  : request.mobilePhone !== undefined
                  ? request.mobilePhone
                  : undefined,
              password:
                request.password !== undefined ? request.password : undefined,
              type: 'driver',
            };

            const driverRole = await tx.role.findFirst({
              where: { name: { equals: 'driver', mode: 'insensitive' } },
              select: { id: true },
            });
            if (!driverRole)
              throw new BadRequestException('Role "driver" tidak ditemukan.');
            userUpdate.role = { connect: { id: driverRole.id } };

            await tx.user.update({
              where: { id: drv.userId },
              data: userUpdate,
            });
          }

          return tx.driver.findUnique({
            where: { id },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                  roleId: true,
                  type: true,
                },
              },
              operatorData: true,
              shiftData: true,
              vehicleData: true,
            },
          });
        });
        console.timeEnd('transaction');

        return this.globalService.response('Successfully', result);
      } catch (error) {
        if (simUploaded) await this.globalService.deleteFile(simUploaded);
        if (ktpUploaded) await this.globalService.deleteFile(ktpUploaded);
        throw error;
      }
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = Array.isArray((error as any).meta?.target)
          ? (error as any).meta?.target.join(',')
          : (error as any).meta?.target;

        if (String(target).includes('Driver_userId')) {
          throw new ConflictException(
            'User tersebut sudah terhubung ke driver lain.',
          );
        }
        if (String(target).includes('Driver_vehicleId')) {
          throw new ConflictException('Vehicle sudah terpakai driver lain.');
        }
        if (String(target).includes('User_email')) {
          throw new ConflictException('Email sudah digunakan.');
        }
        if (String(target).includes('User_phoneNumber')) {
          throw new ConflictException('Nomor HP sudah digunakan.');
        }
        if (String(target).includes('Driver_nik')) {
          throw new ConflictException('NIK sudah digunakan.');
        }
        if (String(target).includes('Driver_simNumber')) {
          throw new ConflictException('Nomor SIM sudah digunakan.');
        }
        throw new ConflictException('Gagal karena unique constraint.');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2028'
      ) {
        throw new InternalServerErrorException(
          'Transaction timeout. Consider optimizing image uploads or increasing transaction timeout.',
        );
      }
      console.error('[DriverService.update] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.driver.findUnique({
        where: { id },
        select: { id: true, deletedAt: true, userId: true },
      });
      if (!existing || existing.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const now = new Date();
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.driver.update({
          where: { id },
          data: { deletedAt: now },
        });
        if (existing.userId) {
          await tx.user.update({
            where: { id: existing.userId },
            data: { deletedAt: now },
          });
        }
        return tx.driver.findUnique({
          where: { id },
          include: {
            user: {
              select: { id: true, name: true, email: true, deletedAt: true },
            },
          },
        });
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('[DriverService.remove] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  // Recovery mode API
  async findAllRecovery(request: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'deletedAt',
      sortOrder = 'desc',
      code,
      operator,
      shift,
      vehicle,
    } = request ?? {};

    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'deletedAt',
      'name',
      'code',
      'vehicleId',
      'shift',
    ]);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'deletedAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;

    const AND: any[] = [{ deletedAt: { not: null } }];

    if (!isBlankish(code)) AND.push({ code: ic(String(code)) });

    if (!isBlankish(operator)) {
      const op = String(operator).trim();
      AND.push({
        OR: [{ operator: op }, { operatorData: { name: ic(op) } }],
      });
    }

    if (!isBlankish(vehicle)) {
      AND.push({ vehicleId: String(vehicle).trim() });
    }

    if (!isBlankish(shift)) {
      const sv = String(shift).trim();
      AND.push({
        OR: [{ shift: sv }, { shiftData: { name: ic(sv) } }],
      });
    }

    if (!isBlankish(search)) {
      const kw = String(search).trim();
      AND.push({
        OR: [
          { name: ic(kw) },
          { code: ic(kw) },
          { mobilePhone: ic(kw) },
          { operatorData: { name: ic(kw) } },
          { shiftData: { name: ic(kw) } },
          { vehicleId: ic(kw) },
          { vehicleData: { licensePlate: ic(kw) } },
          { vehicleData: { name: ic(kw) } },
          { vehicleData: { deviceImei: ic(kw) } },
          { vehicleData: { deviceId: ic(kw) } },
          { user: { is: { name: ic(kw) } } },
          { user: { is: { email: ic(kw) } } },
          { user: { is: { phoneNumber: ic(kw) } } },
          { user: { is: { type: ic(kw) } } },
          { user: { is: { role: { name: ic(kw) } } } },
        ],
      });
    }

    const whereConditions: any = { AND };

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.driver.count({ where: whereConditions }),
        this.prisma.driver.findMany({
          where: whereConditions,
          include: {
            vehicleData: true,
            operatorData: true,
            shiftData: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                type: true,
                deletedAt: true,
                role: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
        }),
      ]);

      const totalPages = Math.ceil(total / take) || 1;

      return {
        code: 200,
        message: 'Successfully',
        data: datas ?? [],
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
          search: isBlankish(search) ? '' : search,
          code: isBlankish(code) ? '' : code,
          operator: isBlankish(operator) ? '' : operator,
          shift: isBlankish(shift) ? '' : shift,
          vehicle: isBlankish(vehicle) ? '' : vehicle,
          onlyDeleted: true,
        },
      };
    } catch (error: any) {
      if (error.name === 'PrismaClientValidationError') {
        throw new BadRequestException(error.message);
      }
      console.error('Failed to list deleted drivers:', error);
      throw new InternalServerErrorException('Failed to list deleted drivers');
    }
  }

  async restore(id: string) {
    try {
      const restored = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.driver.findUnique({
          where: { id },
          select: { id: true, deletedAt: true, userId: true },
        });
        if (!existing || !existing.deletedAt) {
          return null;
        }
        if (existing.userId) {
          const u = await tx.user.findUnique({
            where: { id: existing.userId },
            select: { id: true, deletedAt: true },
          });
          if (u && u.deletedAt) {
            await tx.user.update({
              where: { id: u.id },
              data: { deletedAt: null },
            });
          }
        }

        await tx.driver.update({
          where: { id },
          data: { deletedAt: null },
        });
        return tx.driver.findUnique({
          where: { id },
          include: {
            user: {
              select: { id: true, name: true, email: true, deletedAt: true },
            },
          },
        });
      });

      if (!restored) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }

      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('[DriverService.restore] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async destroy(id: string) {
    try {
      const res = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.driver.findFirst({
          where: { id, deletedAt: { not: null } },
          select: { id: true, userId: true },
        });
        if (!existing) {
          throw new NotFoundException('Driver not found or not soft-deleted');
        }
        try {
          await tx.vehicle.updateMany({
            where: { driverId: id },
            data: { driverId: null },
          });
        } catch (_) {}
        try {
          await tx.scheduleTrips.updateMany({
            where: { driverId: id },
            data: { driverId: null },
          });
        } catch (_) {}
        try {
          await tx.trips.updateMany({
            where: { driverId: id },
            data: { driverId: null },
          });
        } catch (_) {}

        await tx.driver.delete({ where: { id } });
        let userHardDeleted = false;
        if (existing.userId) {
          try {
            await tx.user.delete({ where: { id: existing.userId } });
            userHardDeleted = true;
          } catch (e: any) {
            if (e?.code === 'P2003') {
              throw new ConflictException(
                'Driver deleted, but cannot destroy the linked user due to existing relations. Please detach or remove dependent records, then retry.',
              );
            }
            throw e;
          }
        }
        return {
          code: 200,
          message: 'Successfully destroyed',
          data: { id, hardDeleted: true, userHardDeleted },
        };
      });

      return res;
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new ConflictException(
          'Cannot destroy driver due to existing relations. Please retry.',
        );
      }
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error('Failed to hard delete driver:', error);
      throw new InternalServerErrorException('Failed to hard delete driver');
    }
  }

  // Cron Schedule
  async remindSIMDriver() {
    try {
      const todayJakarta = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
      );
      todayJakarta.setHours(0, 0, 0, 0);
      const rangeStart = new Date(todayJakarta.getTime() + 14 * 86400000);
      const rangeEnd = new Date(todayJakarta.getTime() + 15 * 86400000);
      const drivers = await this.prisma.driver.findMany({
        where: {
          simExpiryDate: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        select: {
          id: true,
          name: true,
          simNumber: true,
          simExpiryDate: true,
        },
      });
      if (!drivers.length) {
        console.info(
          '[DriverService][remindSIMDriver] no drivers for H-14 window',
        );
        return { code: 200, message: 'No candidates', data: [] };
      }
      const userData = await this.globalService.getUserByRoleName('superadmin');
      const audienceUserIds = Array.from(
        new Set(userData.map((u: any) => u.id)),
      );
      if (!audienceUserIds.length) {
        console.warn(
          '[DriverService][remindSIMDriver] no users with role "superadmin"',
        );
        return { code: 200, message: 'No audience', data: [] };
      }
      const sent: any[] = [];
      for (const v of drivers) {
        const { title, description } = getReminderSimDriverTranslations({
          name: v.name,
          simNumber: v.simNumber,
          simExpiryDate: v.simExpiryDate as unknown as Date,
        });
        const templateData = {
          simExpiryDate: new Date(v.simExpiryDate).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
          }),
          driverName: v.name ?? '-',
          simNumber: v.simNumber ?? '-',
        };
        void this.globalService
          .sendNotificationInApp({
            titleIndonesia: title.id,
            titleEnglish: title.en,
            descriptionIndonesia: description.id,
            descriptionEnglish: description.en,
            subjectType: 'DRIVER',
            subjectId: v.id,
            audienceScope: AudienceScope.USER,
            audienceUserIds,
            channels: [NotificationChannel.EMAIL],
            templateKey: 'driver.reminder-sim-driver',
            additionalData: templateData,
          })
          .catch((e: any) =>
            console.error(
              '[remindSIMDriver] sendNotificationInApp error for',
              v.id,
              e,
            ),
          );
        void this.globalService
          .sendNotificationEmail({
            subject: title.id,
            toUserIds: audienceUserIds,
            templateKey: 'driver.reminder-sim-driver',
            additionalData: templateData,
          })
          .catch((e: any) =>
            console.error(
              '[remindSIMDriver] sendNotificationEmail error for',
              v.id,
              e,
            ),
          );
        sent.push({
          vehicleId: v.id,
          subjectId: v.id,
          subject: title,
          description,
        });
      }
      return { code: 200, message: 'Sent', data: sent };
    } catch (error) {
      console.error('[DriverService][remindSIMDriver] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
