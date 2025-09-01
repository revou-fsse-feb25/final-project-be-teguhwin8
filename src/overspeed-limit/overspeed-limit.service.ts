import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOverspeedLimitDto } from './dto/create-overspeed-limit.dto';
import { UpdateOverspeedLimitDto } from './dto/update-overspeed-limit.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class OverspeedLimitService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createOverspeedLimitDto: CreateOverspeedLimitDto) {
    try {
      const created = await this.prisma.overSpeedlimit.create({
        data: {
          speedWarning: createOverspeedLimitDto.speedWarning ?? 0,
          speedLimit: createOverspeedLimitDto.speedLimit ?? 0,
        },
      });

      return this.globalService.response('Overspeed limit created', created);
    } catch (e) {
      throw new BadRequestException('Failed to create overspeed limit');
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
    if (search && !isNaN(parseFloat(search))) {
      const searchValue = parseFloat(search);
      where.OR = [
        { speedWarning: { gte: searchValue - 10, lte: searchValue + 10 } },
        { speedLimit: { gte: searchValue - 10, lte: searchValue + 10 } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.overSpeedlimit.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.overSpeedlimit.count({ where }),
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
    return this.globalService.response('Overspeed limit list', items, {
      pagination,
    });
  }

  async findOne(id: string) {
    const data = await this.prisma.overSpeedlimit.findUnique({ where: { id } });
    if (!data || data.deletedAt) {
      throw new NotFoundException(`Overspeed limit with id ${id} not found`);
    }
    return this.globalService.response('Overspeed limit detail', data);
  }

  async update(id: string, updateOverspeedLimitDto: UpdateOverspeedLimitDto) {
    const existing = await this.prisma.overSpeedlimit.findUnique({
      where: { id },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Overspeed limit with id ${id} not found`);
    }

    try {
      const updated = await this.prisma.overSpeedlimit.update({
        where: { id },
        data: {
          ...(updateOverspeedLimitDto.speedWarning !== undefined && {
            speedWarning: updateOverspeedLimitDto.speedWarning,
          }),
          ...(updateOverspeedLimitDto.speedLimit !== undefined && {
            speedLimit: updateOverspeedLimitDto.speedLimit,
          }),
        },
      });

      return this.globalService.response('Overspeed limit updated', updated);
    } catch (e) {
      throw new BadRequestException('Failed to update overspeed limit');
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.overSpeedlimit.findUnique({
      where: { id },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Overspeed limit with id ${id} not found`);
    }

    const removed = await this.prisma.overSpeedlimit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.globalService.response('Overspeed limit removed', removed);
  }
}
