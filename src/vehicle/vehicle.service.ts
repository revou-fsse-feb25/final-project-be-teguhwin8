/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import {
  shouldNotifyByOdometer,
  VehicleNotifyCandidate,
} from './utils/reminder.service';
import { isBlank, toDate, toFloat, toInt, toNull } from './utils/vehicle.utils';
import { AudienceScope, NotificationChannel, Prisma } from '@prisma/client';
import { getReminderServiceTranslations } from 'src/email/templates/translations/vehicle/reminder-service';
import { getReminderInspectionTranslations } from 'src/email/templates/translations/vehicle/reminder-inspection';
import { getReminderRegistrartionTranslations } from 'src/email/templates/translations/vehicle/reminder-registration';

@Injectable()
export class VehicleService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(request: any, file?: Express.Multer.File) {
    try {
      const validateName = await this.prisma.vehicle.findFirst({
        where: { name: request.name },
        select: { id: true },
      });
      if (validateName) {
        return this.globalService.response('Name Already Exist!', {});
      }
      if (request.driverId) {
        const validateDriver = await this.prisma.driver.findFirst({
          where: { id: request.driverId },
          select: { id: true },
        });
        if (!validateDriver) {
          return this.globalService.response('Driver Not Found!', {});
        }
      }
      const validateDevice = request.deviceId
        ? await this.prisma.device.findFirst({
            where: { id: request.deviceId },
          })
        : null;
      if (request.routeId) {
        const validateRoute = await this.prisma.route.findFirst({
          where: { id: request.routeId },
          select: { id: true },
        });
        if (!validateRoute) {
          return this.globalService.response('Route Not Found!', {});
        }
      }
      const ALLOWED_MIME = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ]);
      const MAX_SIZE = 5 * 1024 * 1024;
      let thumbnailUrl: string | null = null;
      if (file) {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          throw new BadRequestException(
            'Invalid thumbnail format. Only PNG, JPG, JPEG, WEBP are allowed.',
          );
        }
        if (file.size > MAX_SIZE) {
          throw new BadRequestException('Thumbnail too large. Max 5MB.');
        }
        const uploaded = await this.globalService.uploadFile({
          buffer: file.buffer,
          fileType: {
            ext: file.originalname.split('.').pop(),
            mime: file.mimetype,
          },
        });
        thumbnailUrl = uploaded?.Location ?? null;
      }

      const payload = {
        driverId: toNull(request.driverId),
        deviceId: toNull(request.deviceId),
        deviceImei: validateDevice ? validateDevice.imei : null,
        operator: toNull(request.operator),
        type: toNull(request.type),
        name: toNull(request.name),
        licensePlate: toNull(request.licensePlate),
        routeId: toNull(request.routeId),
        description: toNull(request.description),
        totalDistanceMeter: toFloat(request.totalDistanceMeter, 0),
        seat: toInt(request.seat, null),
        odometerKm: toFloat(request.odometerKm, 0),
        serviceReminderIntervalKm: toInt(request.serviceReminderIntervalKm, 0),
        inspectionExpiryDate: toDate(request.inspectionExpiryDate),
        registrationExpiryDate: toDate(request.registrationExpiryDate),
        notes: toNull(request.notes),
        statusFleet: toNull(request.statusFleet),
        thumbnail: thumbnailUrl,
      };

      const data = await this.prisma.vehicle.create({
        data: payload,
        select: { id: true },
      });

      if (request.seat) {
        if (Number(request.seat) === 8) {
          const seats = [
            { vehicleId: data.id, code: '1', row: '2', column: '2' },
            { vehicleId: data.id, code: '2', row: '2', column: '3' },
            { vehicleId: data.id, code: '3', row: '3', column: '1' },
            { vehicleId: data.id, code: '4', row: '3', column: '3' },
            { vehicleId: data.id, code: '5', row: '4', column: '1' },
            { vehicleId: data.id, code: '6', row: '4', column: '2' },
            { vehicleId: data.id, code: '7', row: '4', column: '3' },
            { vehicleId: data.id, code: '8', row: '1', column: '1' },
          ];
          await this.prisma.vehicleSeat.createMany({
            data: seats,
            skipDuplicates: true,
          });
        }

        if (Number(request.seat) === 14) {
          const seats = [
            { vehicleId: data.id, code: '1', row: '2', column: '2' },
            { vehicleId: data.id, code: '2', row: '2', column: '3' },
            { vehicleId: data.id, code: '3', row: '2', column: '4' },
            { vehicleId: data.id, code: '4', row: '3', column: '1' },
            { vehicleId: data.id, code: '5', row: '3', column: '3' },
            { vehicleId: data.id, code: '6', row: '3', column: '4' },
            { vehicleId: data.id, code: '7', row: '4', column: '1' },
            { vehicleId: data.id, code: '8', row: '4', column: '3' },
            { vehicleId: data.id, code: '9', row: '4', column: '4' },
            { vehicleId: data.id, code: '10', row: '5', column: '1' },
            { vehicleId: data.id, code: '11', row: '5', column: '2' },
            { vehicleId: data.id, code: '12', row: '5', column: '3' },
            { vehicleId: data.id, code: '13', row: '5', column: '4' },
            { vehicleId: data.id, code: '14', row: '1', column: '1' },
          ];
          await this.prisma.vehicleSeat.createMany({
            data: seats,
            skipDuplicates: true,
          });
        }
      }
      if (request.deviceId) {
        await this.prisma.device.update({
          where: { id: request.deviceId },
          data: { status: 'IN_USE' },
        });
      }
      if (request.driverId) {
        await this.prisma.driver.update({
          where: { id: request.driverId },
          data: { status: 'IN_USE' },
        });
      }
      const result = await this.prisma.vehicle.findFirst({
        where: { id: data.id },
        include: {},
      });
      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('[VehicleService.create] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findAll(request: any) {
    try {
      const searchFields = ['name', 'licensePlate'];
      const filterFields = [
        'name',
        'licensePlate',
        'deviceImei',
        'operator',
        'type',
        'statusFleet',
        'statusDevice',
        'deviceId',
        'driverId',
        'routeId',
      ];
      const allowedSort = new Set([
        'createdAt',
        'updatedAt',
        'name',
        'licensePlate',
        'operator',
        'type',
        'statusFleet',
        'statusDevice',
        'odometerKm',
        'totalDistanceKiloMeter',
        'seat',
      ]);
      const include = {
        driverData: true,
        device: { include: { simCard: true } },
        route: true,
        operatorData: true,
        typeData: true,
        vehicleSeat: { where: { deletedAt: null } },
      };
      return await this.globalService.handleSearchAndFilter(
        this.prisma,
        this.prisma.vehicle,
        request,
        searchFields,
        filterFields,
        allowedSort,
        include,
      );
    } catch (error) {
      console.error('[VehicleService.findAll] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findOne(id: string) {
    try {
      const datas = await this.prisma.vehicle.findUnique({
        where: { id },
        include: {
          driverData: true,
          device: true,
          route: {
            include: {
              RoutePoint: {
                include: {
                  point: true,
                  route: true,
                },
              },
            },
          },
          operatorData: true,
          typeData: true,
          vehicleSeat: {
            where: {
              deletedAt: null,
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

  async update(id: string, request: any, file?: Express.Multer.File) {
    try {
      if (!isBlank(request.name)) {
        const validateName = await this.prisma.vehicle.findFirst({
          where: { name: String(request.name), id: { not: id } },
          select: { id: true },
        });
        if (validateName) {
          return this.globalService.response('Name Already Exist!', {});
        }
      }

      if (!isBlank(request.driverId)) {
        const validateDriver = await this.prisma.driver.findFirst({
          where: { id: String(request.driverId) },
          select: { id: true },
        });
        if (!validateDriver) {
          return this.globalService.response('Driver Not Found!', {});
        }
      }

      let validateDevice: { imei?: string } | null = null;
      if (!isBlank(request.deviceId)) {
        validateDevice = await this.prisma.device.findFirst({
          where: { id: String(request.deviceId) },
          select: { imei: true },
        });
        if (!validateDevice) {
          return this.globalService.response('Device Not Found!', {});
        }
      }

      if (!isBlank(request.routeId)) {
        const validateRoute = await this.prisma.route.findFirst({
          where: { id: String(request.routeId) },
          select: { id: true },
        });
        if (!validateRoute) {
          return this.globalService.response('Route Not Found!', {});
        }
      }
      const ALLOWED_MIME = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ]);
      const MAX_SIZE = 5 * 1024 * 1024;

      let thumbnailField: string | null | undefined = undefined;
      if (file) {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          throw new BadRequestException(
            'Invalid thumbnail format. Only PNG, JPG, JPEG, WEBP are allowed.',
          );
        }
        if (file.size > MAX_SIZE) {
          throw new BadRequestException('Thumbnail too large. Max 5MB.');
        }
        const uploaded = await this.globalService.uploadFile({
          buffer: file.buffer,
          fileType: {
            ext: file.originalname.split('.').pop(),
            mime: file.mimetype,
          },
        });
        thumbnailField = uploaded?.Location ?? null;
      } else if (Object.prototype.hasOwnProperty.call(request, 'thumbnail')) {
        const t = String(request.thumbnail ?? '').trim();
        thumbnailField = t === '' || t.toLowerCase() === 'null' ? null : t;
      }

      const dataToUpdate: any = {
        driverId: !isBlank(request.driverId)
          ? String(request.driverId)
          : undefined,
        deviceId: !isBlank(request.deviceId)
          ? String(request.deviceId)
          : undefined,
        deviceImei: !isBlank(request.deviceId)
          ? validateDevice?.imei ?? null
          : undefined,
        operator: !isBlank(request.operator)
          ? String(request.operator)
          : undefined,
        type: !isBlank(request.type) ? String(request.type) : undefined,
        name: !isBlank(request.name) ? String(request.name) : undefined,
        licensePlate: !isBlank(request.licensePlate)
          ? String(request.licensePlate)
          : undefined,
        routeId: !isBlank(request.routeId)
          ? String(request.routeId)
          : undefined,
        description: !isBlank(request.description)
          ? String(request.description)
          : undefined,
        totalDistanceMeter: !isBlank(request.totalDistanceMeter)
          ? toFloat(request.totalDistanceMeter, 0)
          : undefined,
        totalDistanceKiloMeter: !isBlank(request.totalDistanceKiloMeter)
          ? toFloat(request.totalDistanceKiloMeter, 0)
          : undefined,
        seat: !isBlank(request.seat) ? toInt(request.seat, null) : undefined,
        odometerKm: !isBlank(request.odometerKm)
          ? toFloat(request.odometerKm, 0)
          : undefined,
        serviceReminderIntervalKm: !isBlank(request.serviceReminderIntervalKm)
          ? toInt(request.serviceReminderIntervalKm, 0)
          : undefined,
        inspectionExpiryDate: toDate(request.inspectionExpiryDate),
        registrationExpiryDate: toDate(request.registrationExpiryDate),
        notes: !isBlank(request.notes) ? String(request.notes) : undefined,
        statusFleet: !isBlank(request.statusFleet)
          ? String(request.statusFleet)
          : undefined,
        ...(thumbnailField !== undefined ? { thumbnail: thumbnailField } : {}),
      };
      const result = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.vehicle.update({
          where: { id },
          data: dataToUpdate,
          select: { id: true },
        });
        if (Object.prototype.hasOwnProperty.call(dataToUpdate, 'seat')) {
          await tx.vehicleSeat.deleteMany({ where: { vehicleId: updated.id } });

          const seatNum = dataToUpdate.seat as number | null;
          if (seatNum === 8) {
            const seats8 = [
              { vehicleId: updated.id, code: '1', row: '2', column: '2' },
              { vehicleId: updated.id, code: '2', row: '2', column: '3' },
              { vehicleId: updated.id, code: '3', row: '3', column: '1' },
              { vehicleId: updated.id, code: '4', row: '3', column: '3' },
              { vehicleId: updated.id, code: '5', row: '4', column: '1' },
              { vehicleId: updated.id, code: '6', row: '4', column: '2' },
              { vehicleId: updated.id, code: '7', row: '4', column: '3' },
              { vehicleId: updated.id, code: '8', row: '1', column: '1' },
            ];
            await tx.vehicleSeat.createMany({
              data: seats8,
              skipDuplicates: true,
            });
          } else if (seatNum === 14) {
            const seats14 = [
              { vehicleId: updated.id, code: '1', row: '2', column: '2' },
              { vehicleId: updated.id, code: '2', row: '2', column: '3' },
              { vehicleId: updated.id, code: '3', row: '2', column: '4' },
              { vehicleId: updated.id, code: '4', row: '3', column: '1' },
              { vehicleId: updated.id, code: '5', row: '3', column: '3' },
              { vehicleId: updated.id, code: '6', row: '3', column: '4' },
              { vehicleId: updated.id, code: '7', row: '4', column: '1' },
              { vehicleId: updated.id, code: '8', row: '4', column: '3' },
              { vehicleId: updated.id, code: '9', row: '4', column: '4' },
              { vehicleId: updated.id, code: '10', row: '5', column: '1' },
              { vehicleId: updated.id, code: '11', row: '5', column: '2' },
              { vehicleId: updated.id, code: '12', row: '5', column: '3' },
              { vehicleId: updated.id, code: '13', row: '5', column: '4' },
              { vehicleId: updated.id, code: '14', row: '1', column: '1' },
            ];
            await tx.vehicleSeat.createMany({
              data: seats14,
              skipDuplicates: true,
            });
          }
        }

        if (!isBlank(request.deviceId)) {
          await tx.device.update({
            where: { id: String(request.deviceId) },
            data: { status: 'IN_USE' },
          });
        }
        if (!isBlank(request.deviceBeforeId)) {
          await tx.device.update({
            where: { id: String(request.deviceBeforeId) },
            data: { status: 'NOT_IN_USE' },
          });
        }

        if (!isBlank(request.driverId)) {
          await tx.driver.update({
            where: { id: String(request.driverId) },
            data: { status: 'IN_USE', vehicleId: id },
          });
        }
        if (!isBlank(request.driverBeforeId)) {
          await tx.driver.update({
            where: { id: String(request.driverBeforeId) },
            data: { status: 'NOT_IN_USE', vehicleId: null },
          });
        }

        return tx.vehicle.findUnique({ where: { id: updated.id } });
      });

      return this.globalService.response('Successfully', result);
    } catch (error) {
      console.error('[VehicleService.update] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remove(id: string) {
    try {
      const validate = await this.prisma.vehicle.findUnique({
        where: { id },
        select: { id: true, deletedAt: true },
      });
      if (!validate || validate.deletedAt) {
        return this.globalService.response('Data Not Found!', {});
      }
      const datas = await this.prisma.vehicle.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          statusFleet: 'SOFT_DELETED',
        },
      });
      return this.globalService.response('Successfully', datas);
    } catch (error) {
      console.error('[VehicleService.remove] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  // Recovery Mode API
  async findAllRecovery(request: any) {
    try {
      const isBlankish = (v: any) =>
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '');
      const ic = (v: string) => ({ contains: v, mode: 'insensitive' as const });

      const {
        page = 1,
        limit = 10,
        search,
        name,
        licensePlate,
        deviceImei,
        operator,
        type,
        statusFleet,
        statusDevice,
        deviceId,
        driverId,
        routeId,
        deletedFrom,
        deletedTo,
        sortBy = 'deletedAt',
        sortOrder = 'desc',
      } = request ?? {};

      const allowedSort = new Set([
        'deletedAt',
        'createdAt',
        'updatedAt',
        'name',
        'licensePlate',
        'operator',
        'type',
        'statusFleet',
        'statusDevice',
        'odometerKm',
        'totalDistanceKiloMeter',
        'seat',
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
      if (!isBlankish(search)) {
        const s = String(search).trim();
        AND.push({
          OR: [
            { name: ic(s) },
            { licensePlate: ic(s) },
            { deviceImei: ic(s) },
            { operator: ic(s) },
            { type: ic(s) },
            { statusFleet: ic(s) },
            { statusDevice: ic(s) },
            { description: ic(s) },
            { notes: ic(s) },
          ],
        });
      }

      if (!isBlankish(name)) AND.push({ name: ic(String(name)) });
      if (!isBlankish(licensePlate))
        AND.push({ licensePlate: ic(String(licensePlate)) });
      if (!isBlankish(deviceImei))
        AND.push({ deviceImei: ic(String(deviceImei)) });
      if (!isBlankish(operator)) AND.push({ operator: String(operator) });
      if (!isBlankish(type)) AND.push({ type: String(type) });
      if (!isBlankish(statusFleet))
        AND.push({ statusFleet: String(statusFleet) });
      if (!isBlankish(statusDevice))
        AND.push({ statusDevice: String(statusDevice) });
      if (!isBlankish(deviceId)) AND.push({ deviceId: String(deviceId) });
      if (!isBlankish(driverId)) AND.push({ driverId: String(driverId) });
      if (!isBlankish(routeId)) AND.push({ routeId: String(routeId) });
      if (!isBlankish(deletedFrom) || !isBlankish(deletedTo)) {
        const deletedAt: any = {};
        if (!isBlankish(deletedFrom))
          deletedAt.gte = new Date(String(deletedFrom));
        if (!isBlankish(deletedTo)) deletedAt.lte = new Date(String(deletedTo));
        AND.push({ deletedAt });
      }

      const where: Prisma.VehicleWhereInput = { AND };
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.vehicle.count({ where }),
        this.prisma.vehicle.findMany({
          where,
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
          include: {
            driverData: true,
            device: { include: { simCard: true } },
            route: true,
            operatorData: true,
            typeData: true,
            vehicleSeat: { where: { deletedAt: null } },
          },
        }),
      ]);

      const totalPages = Math.max(Math.ceil(total / take), 1);

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
          search: isBlankish(search) ? '' : String(search),
          name: isBlankish(name) ? '' : String(name),
          licensePlate: isBlankish(licensePlate) ? '' : String(licensePlate),
          deviceImei: isBlankish(deviceImei) ? '' : String(deviceImei),
          operator: isBlankish(operator) ? '' : String(operator),
          type: isBlankish(type) ? '' : String(type),
          statusFleet: isBlankish(statusFleet) ? '' : String(statusFleet),
          statusDevice: isBlankish(statusDevice) ? '' : String(statusDevice),
          deviceId: isBlankish(deviceId) ? '' : String(deviceId),
          driverId: isBlankish(driverId) ? '' : String(driverId),
          routeId: isBlankish(routeId) ? '' : String(routeId),
          deletedFrom: isBlankish(deletedFrom) ? '' : String(deletedFrom),
          deletedTo: isBlankish(deletedTo) ? '' : String(deletedTo),
        },
      };
    } catch (error) {
      console.error('[VehicleService.findAllRecovery] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async restore(id: string, action?: string) {
    try {
      const validate = await this.prisma.vehicle.findUnique({
        where: { id },
        select: { id: true, deletedAt: true, name: true, licensePlate: true },
      });

      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }

      const actionType = (action ?? '').trim().toLowerCase();

      // ---- CHECKING ----
      if (actionType.includes('checking')) {
        const currentName = (validate.name ?? '').trim();

        if (!currentName) {
          return this.globalService.response(
            'No name set. Nothing to check. Safe to restore.',
            { id: validate.id, name: validate.name },
          );
        }

        const conflict = await this.prisma.vehicle.findFirst({
          where: {
            id: { not: validate.id },
            deletedAt: null,
            name: { equals: currentName, mode: 'insensitive' },
          },
          select: { id: true, name: true, licensePlate: true },
        });

        if (conflict) {
          return this.globalService.response(
            'Duplicate vehicle name detected. Please resolve before restore.',
            {
              restoreCandidate: {
                id: validate.id,
                name: validate.name,
                licensePlate: validate.licensePlate,
              },
              conflictWith: conflict,
            },
          );
        }

        return this.globalService.response(
          'No duplicate name found. Safe to restore.',
          { id: validate.id, name: validate.name },
        );
      }

      // ---- RESTORE ----
      if (actionType.includes('restore')) {
        if (validate.name) {
          const conflict = await this.prisma.vehicle.findFirst({
            where: {
              id: { not: validate.id },
              deletedAt: null,
              name: { equals: validate.name, mode: 'insensitive' },
            },
            select: { id: true, name: true, licensePlate: true },
          });

          if (conflict) {
            return this.globalService.response(
              'Restore failed. Duplicate vehicle name exists.',
              { conflictWith: conflict },
            );
          }
        }

        const restored = await this.prisma.vehicle.update({
          where: { id },
          data: {
            deletedAt: null,
            statusFleet: 'INACTIVE',
          },
        });

        return this.globalService.response('Successfully Restored', restored);
      }

      // ---- INVALID ACTION ----
      return this.globalService.response('Invalid action!', { action });
    } catch (error) {
      console.error('[VehicleService.restore] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async destroy(id: string, action: string) {
    try {
      if (!id?.trim()) {
        throw new BadRequestException({
          code: 400,
          message: 'Vehicle id is required',
          data: null,
        });
      }

      const exists = await this.prisma.vehicle.findUnique({
        where: { id },
        select: { id: true, name: true, licensePlate: true },
      });

      if (!exists) {
        throw new BadRequestException({
          code: 404,
          message: `Vehicle with id ${id} not found`,
          data: null,
        });
      }
      const act = String(action ?? '')
        .trim()
        .toLowerCase();
      if (act.includes('checking')) {
        const [
          driversToNull,
          vehicleSeatCount,
          scheduleTripsCount,
          schedulesCount,
          tripsCount,
          scheduleTemplateCount,
          overspeedCount,
          anomaliDeviceCount,
        ] = await Promise.all([
          this.prisma.driver.count({ where: { vehicleId: id } }),
          this.prisma.vehicleSeat.count({ where: { vehicleId: id } }),
          this.prisma.scheduleTrips.count({ where: { vehicleId: id } }),
          this.prisma.schedules.count({ where: { vehicleId: id } }),
          this.prisma.trips.count({ where: { vehicleId: id } }),
          this.prisma.scheduleTemplate.count({ where: { vehicleId: id } }),
          this.prisma.overspeed.count({ where: { vehicleId: id } }),
          this.prisma.anomaliDevice.count({ where: { vehicleId: id } }),
        ]);

        return {
          code: 200,
          message: 'Checking only. No data modified.',
          data: {
            vehicle: {
              id: exists.id,
              name: exists.name,
              licensePlate: exists.licensePlate,
            },
            impactSummary: {
              willNullify: { Driver_vehicleId: driversToNull },
              willDelete: {
                VehicleSeat: vehicleSeatCount,
                ScheduleTrips: scheduleTripsCount,
                Schedules: schedulesCount,
                Trips: tripsCount,
                ScheduleTemplate: scheduleTemplateCount,
                Overspeed: overspeedCount,
                AnomaliDevice: anomaliDeviceCount,
              },
              note: 'Use action="destroy" to proceed with permanent deletion.',
            },
          },
        };
      }

      if (act.includes('destroy')) {
        const result = await this.prisma.$transaction(async (tx) => {
          const driverUpdate = await tx.driver.updateMany({
            where: { vehicleId: id },
            data: { vehicleId: null },
          });
          const vehicleSeatDel = await tx.vehicleSeat.deleteMany({
            where: { vehicleId: id },
          });
          const scheduleTripsDel = await tx.scheduleTrips.deleteMany({
            where: { vehicleId: id },
          });
          const schedulesDel = await tx.schedules.deleteMany({
            where: { vehicleId: id },
          });
          const tripsDel = await tx.trips.deleteMany({
            where: { vehicleId: id },
          });
          const scheduleTemplateDel = await tx.scheduleTemplate.deleteMany({
            where: { vehicleId: id },
          });
          const overspeedDel = await tx.overspeed.deleteMany({
            where: { vehicleId: id },
          });
          const anomaliDeviceDel = await tx.anomaliDevice.deleteMany({
            where: { vehicleId: id },
          });
          await tx.vehicle.delete({ where: { id } });
          return {
            driverNullified: driverUpdate.count,
            deleted: {
              vehicleSeat: vehicleSeatDel.count,
              scheduleTrips: scheduleTripsDel.count,
              schedules: schedulesDel.count,
              trips: tripsDel.count,
              scheduleTemplate: scheduleTemplateDel.count,
              overspeed: overspeedDel.count,
              anomaliDevice: anomaliDeviceDel.count,
            },
          };
        });

        return {
          code: 200,
          message: 'Vehicle permanently deleted (destroy) successfully',
          data: {
            vehicle: {
              id: exists.id,
              name: exists.name,
              licensePlate: exists.licensePlate,
            },
            impactResult: result,
          },
        };
      }

      return {
        code: 400,
        message: 'Invalid action. Use "checking" or "destroy".',
        data: { action },
      };
    } catch (error) {
      console.error('Vehicle destroy error:', error);
      if (error?.response) throw error;
      throw new BadRequestException({
        code: 500,
        message: 'Failed to destroy vehicle',
        data: null,
      });
    }
  }

  // Cron Schedule
  async remindService() {
    try {
      const vehicles = await this.prisma.vehicle.findMany({
        where: { deletedAt: null, serviceReminderIntervalKm: { gt: 0 } },
        select: {
          id: true,
          name: true,
          licensePlate: true,
          odometerKm: true,
          serviceReminderIntervalKm: true,
          serviceLastNotifiedCycleIndex: true,
          serviceLastNotifiedKm: true,
        },
      });
      const candidates: VehicleNotifyCandidate[] = [];
      for (const v of vehicles) {
        const calc = shouldNotifyByOdometer(
          Number(v.odometerKm ?? 0),
          Number(v.serviceReminderIntervalKm ?? 0),
          1000,
        );
        if (!calc) continue;
        if (
          v.serviceLastNotifiedCycleIndex != null &&
          v.serviceLastNotifiedCycleIndex >= calc.cycleIndex
        ) {
          continue;
        }
        candidates.push({
          id: v.id,
          name: v.name ?? null,
          licensePlate: v.licensePlate ?? null,
          ...calc,
        });
      }
      const notified: VehicleNotifyCandidate[] = [];
      for (const c of candidates) {
        try {
          this.sendVehicleServiceReminder(c).catch((e) => {
            console.error('[VehicleService][notify] failed for', c.id, e);
          });
          notified.push(c);
        } catch (e) {
          console.error('[VehicleService][notify] setup failed for', c.id, e);
        }
      }

      if (notified.length) {
        await this.prisma.$transaction(
          notified.map((c) =>
            this.prisma.vehicle.update({
              where: { id: c.id },
              data: {
                serviceLastNotifiedCycleIndex: c.cycleIndex,
                serviceLastNotifiedKm: c.odometerKm,
              },
            }),
          ),
        );
      }
      return {
        code: 200,
        totalChecked: vehicles.length,
        totalToNotify: candidates.length,
        totalSent: notified.length,
        data: notified,
      };
    } catch (error) {
      console.error('[VehicleService][remindService] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remindInspection() {
    try {
      const todayJakarta = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
      );
      todayJakarta.setHours(0, 0, 0, 0);
      const rangeStart = new Date(todayJakarta.getTime() + 14 * 86400000);
      const rangeEnd = new Date(todayJakarta.getTime() + 15 * 86400000);
      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          inspectionExpiryDate: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        select: {
          id: true,
          name: true,
          licensePlate: true,
          inspectionExpiryDate: true,
          typeData: {
            select: { name: true },
          },
        },
      });
      if (!vehicles.length) {
        console.info(
          '[VehicleService][remindInspection] no vehicles for H-14 window',
        );
        return { code: 200, message: 'No candidates', data: [] };
      }
      const userData = await this.globalService.getUserByRoleName('superadmin');
      const audienceUserIds = Array.from(
        new Set(userData.map((u: any) => u.id)),
      );
      if (!audienceUserIds.length) {
        console.warn(
          '[VehicleService][remindInspection] no users with role "superadmin"',
        );
        return { code: 200, message: 'No audience', data: [] };
      }
      const sent: any[] = [];
      for (const v of vehicles) {
        const { title, description } = getReminderInspectionTranslations({
          name: v.name,
          licensePlate: v.licensePlate,
          inspectionExpiryDate: v.inspectionExpiryDate as unknown as Date,
        });
        const templateData = {
          kir_expiry_date: new Date(v.inspectionExpiryDate).toLocaleDateString(
            'id-ID',
            {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              timeZone: 'Asia/Jakarta',
            },
          ),
          vehicle_name: v.name ?? '-',
          license_plate: v.licensePlate ?? '-',
          vehicle_type: v.typeData.name ?? '-',
        };
        void this.globalService
          .sendNotificationInApp({
            titleIndonesia: title.id,
            titleEnglish: title.en,
            descriptionIndonesia: description.id,
            descriptionEnglish: description.en,
            subjectType: 'VEHICLE',
            subjectId: v.id,
            audienceScope: AudienceScope.USER,
            audienceUserIds,
            channels: [NotificationChannel.EMAIL],
            templateKey: 'vehicle.reminder-inspection',
            additionalData: templateData,
          })
          .catch((e: any) =>
            console.error(
              '[remindInspection] sendNotificationInApp error for',
              v.id,
              e,
            ),
          );
        void this.globalService
          .sendNotificationEmail({
            subject: title.id,
            toUserIds: audienceUserIds,
            templateKey: 'vehicle.reminder-inspection',
            additionalData: templateData,
          })
          .catch((e: any) =>
            console.error(
              '[remindInspection] sendNotificationEmail error for',
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
      console.error('[VehicleService][remindInspection] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async remindRegistration() {
    try {
      const todayJakarta = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
      );
      todayJakarta.setHours(0, 0, 0, 0);
      const rangeStart = new Date(todayJakarta.getTime() + 14 * 86400000);
      const rangeEnd = new Date(todayJakarta.getTime() + 15 * 86400000);
      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          registrationExpiryDate: {
            gte: rangeStart,
            lt: rangeEnd,
          },
        },
        select: {
          id: true,
          name: true,
          licensePlate: true,
          registrationExpiryDate: true,
          typeData: {
            select: { name: true },
          },
        },
      });
      if (!vehicles.length) {
        console.info(
          '[VehicleService][remindRegistration] no vehicles for H-14 window',
        );
        return { code: 200, message: 'No candidates', data: [] };
      }
      const userData = await this.globalService.getUserByRoleName('superadmin');
      const audienceUserIds = Array.from(
        new Set(userData.map((u: any) => u.id)),
      );
      if (!audienceUserIds.length) {
        console.warn(
          '[VehicleService][remindInspection] no users with role "superadmin"',
        );
        return { code: 200, message: 'No audience', data: [] };
      }
      const sent: any[] = [];
      for (const v of vehicles) {
        const { title, description } = getReminderRegistrartionTranslations({
          name: v.name,
          licensePlate: v.licensePlate,
          registrationExpiryDate: v.registrationExpiryDate as unknown as Date,
        });
        const templateData = {
          stnk_expiry_date: new Date(
            v.registrationExpiryDate,
          ).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
          }),
          vehicle_name: v.name ?? '-',
          license_plate: v.licensePlate ?? '-',
          vehicle_type: v.typeData.name ?? '-',
        };
        void this.globalService
          .sendNotificationInApp({
            titleIndonesia: title.id,
            titleEnglish: title.en,
            descriptionIndonesia: description.id,
            descriptionEnglish: description.en,
            subjectType: 'VEHICLE',
            subjectId: v.id,
            audienceScope: AudienceScope.USER,
            audienceUserIds,
            channels: [NotificationChannel.EMAIL],
            templateKey: 'vehicle.reminder-registration',
            additionalData: templateData,
          })
          .catch((e: any) =>
            console.error(
              '[remindRegistration] sendNotificationInApp error for',
              v.id,
              e,
            ),
          );
        void this.globalService
          .sendNotificationEmail({
            subject: title.id,
            toUserIds: audienceUserIds,
            templateKey: 'vehicle.reminder-registration',
            additionalData: templateData,
          })
          .catch((e: any) =>
            console.error(
              '[remindRegistration] sendNotificationEmail error for',
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
      console.error('[VehicleService][remindRegistration] Error:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  private async sendVehicleServiceReminder(
    c: VehicleNotifyCandidate,
  ): Promise<void> {
    const userData = await this.globalService.getUserByRoleName('superadmin');
    const audienceUserIds = Array.from(new Set(userData.map((u) => u.id)));
    if (!audienceUserIds.length) {
      return void console.warn(
        '[sendVehicleServiceReminder] no users with role "superadmin"',
      );
    }
    const { title, description } = getReminderServiceTranslations(c) ?? {
      title: { id: '', en: '' },
      description: { id: '', en: '' },
    };
    const remainingKm = Math.max(0, c.thresholdKm - c.odometerKm);
    const additionalData = {
      type: 'vehicle.reminder-service',
      message: {
        title: { id: title.id, en: title.en },
        description: { id: description.id, en: description.en },
      },
      vehicle: { id: c.id, name: c.name, licensePlate: c.licensePlate },
      reminder: {
        window: c.window,
        cycleIndex: c.cycleIndex,
        odometerKm: c.odometerKm,
        intervalKm: c.serviceReminderIntervalKm,
        thresholdKm: c.thresholdKm,
        windowStartKm: c.windowStartKm,
        nextPreStartKm: c.nextPreStartKm,
        distanceToNextKm: c.distanceToNextKm,
        nextCycleIndex: c.nextCycleIndex,
        nextCycleThresholdKm: c.nextCycleThresholdKm,
        nextCyclePreStartKm: c.nextCyclePreStartKm,
        remainingKm,
      },
    };
    const common = { templateKey: 'vehicle.reminder-service', additionalData };
    const results = await Promise.allSettled([
      this.globalService.sendNotificationInApp({
        titleIndonesia: title.id,
        titleEnglish: title.en,
        descriptionIndonesia: description.id,
        descriptionEnglish: description.en,
        subjectType: 'VEHICLE',
        subjectId: c.id,
        audienceScope: AudienceScope.USER,
        audienceUserIds,
        channels: [NotificationChannel.EMAIL],
        ...common,
      }),
      this.globalService.sendNotificationEmail({
        subject: title.id,
        toUserIds: audienceUserIds,
        ...common,
      }),
    ]);
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.error(
          '[sendVehicleServiceReminder] channel failed:',
          idx === 0 ? 'IN_APP' : 'EMAIL',
          r.reason,
        );
      }
    });
  }

  async resetDistance(id: string, request: any) {
    try {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id, deletedAt: null },
      });
      if (!vehicle) {
        throw new Error(`Vehicle with ID ${id} not found or has been deleted`);
      }
      const { deletedAt, ...safeDto } = request as any;
      const updated = await this.prisma.vehicle.update({
        where: { id },
        data: {
          totalDistanceMeter: 0,
          totalDistanceKiloMeter: 0,
        },
      });
      return this.globalService.response('Successfully', updated);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
