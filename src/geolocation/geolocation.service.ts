import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGeolocationDto } from './dto/create-geolocation.dto';
import { UpdateGeolocationDto } from './dto/update-geolocation.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class GeolocationService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createGeolocationDto: CreateGeolocationDto) {
    try {
      const created = await this.prisma.geolocation.create({
        data: {
          longitude: createGeolocationDto.longitude ?? 0,
          latitude: createGeolocationDto.latitude ?? 0,
          radius: createGeolocationDto.radius ?? 0,
          operatorId: createGeolocationDto.operatorId ?? null,
          status: createGeolocationDto.status ?? 'INACTIVE',
          name: createGeolocationDto.name ?? '-',
          address: createGeolocationDto.address ?? '-',
          pointId: createGeolocationDto.pointId ?? null,
        },
      });

      return this.globalService.response('Geolocation created', created);
    } catch (e) {
      throw new BadRequestException('Failed to create geolocation');
    }
  }

  async findAll(request: any) {
    const page = Math.max(parseInt(request?.page ?? '1', 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(request?.limit ?? '10', 10) || 10, 1),
      100,
    );
    const sortBy = (request?.sortBy as string) || 'updatedAt';
    const sortOrder =
      ((request?.sortOrder as string) || 'desc').toLowerCase() === 'asc'
        ? 'asc'
        : 'desc';
    const search = request?.search as string | undefined;

    const skip = (page - 1) * limit;
    const where: any = {
      deletedAt: null,
    };
    if (search) {
      const statusValues = ['ACTIVE', 'INACTIVE'].filter((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      );
      where.OR = [
        { operatorId: { contains: search, mode: 'insensitive' } },
        { status: { in: statusValues } },
        {
          operator: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { master: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.geolocation.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            operator: {
              select: { name: true, master: true, code: true },
            },
            point: true,
          },
        }),
        this.prisma.geolocation.count({ where }),
      ]);

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        sortBy,
        sortOrder,
      };

      return this.globalService.response('Geolocation list', items, {
        pagination,
      });
    } catch (e) {
      console.error('Error in findAll:', e);
      throw new BadRequestException(
        'Failed to fetch geolocation list: ' + e.message,
      );
    }
  }

  async findOne(id: string) {
    const data = await this.prisma.geolocation.findUnique({
      where: { id },
      include: { point: true, operator: true },
    });
    if (!data || data.deletedAt) {
      throw new NotFoundException(`Geolocation with id ${id} not found`);
    }
    return this.globalService.response('Geolocation detail', data);
  }

  async update(id: string, updateGeolocationDto: UpdateGeolocationDto) {
    const existing = await this.prisma.geolocation.findUnique({
      where: { id },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Geolocation with id ${id} not found`);
    }

    try {
      const updated = await this.prisma.geolocation.update({
        where: { id },
        data: {
          ...(updateGeolocationDto.longitude !== undefined && {
            longitude: updateGeolocationDto.longitude,
          }),
          ...(updateGeolocationDto.latitude !== undefined && {
            latitude: updateGeolocationDto.latitude,
          }),
          ...(updateGeolocationDto.radius !== undefined && {
            radius: updateGeolocationDto.radius,
          }),
          ...(updateGeolocationDto.operatorId !== undefined && {
            operatorId: updateGeolocationDto.operatorId,
          }),
          ...(updateGeolocationDto.pointId !== undefined && {
            pointId: updateGeolocationDto.pointId,
          }),
          ...(updateGeolocationDto.status !== undefined && {
            status: updateGeolocationDto.status,
          }),
          ...(updateGeolocationDto.longitude !== undefined && {
            longitude: updateGeolocationDto.longitude,
          }),
          ...(updateGeolocationDto.name !== undefined && {
            name: updateGeolocationDto.name,
          }),
          ...(updateGeolocationDto.address !== undefined && {
            address: updateGeolocationDto.address,
          }),
        },
      });

      return this.globalService.response('Geolocation updated', updated);
    } catch (e) {
      throw new BadRequestException('Failed to update geolocation');
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.geolocation.findUnique({
      where: { id },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Geolocation with id ${id} not found`);
    }

    const removed = await this.prisma.geolocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.globalService.response('Geolocation removed', removed);
  }
}
