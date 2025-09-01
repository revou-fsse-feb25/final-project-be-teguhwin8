import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { CreateCareerJobDto } from './dto/create-career-job.dto';
import { UpdateCareerJobDto } from './dto/update-career-job.dto';
import { CareerSortBy, isBlankish, SortOrder } from './utils/career-job.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class CareerJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(dto: CreateCareerJobDto) {
    try {
      const required: Record<string, any> = {
        titleIndonesia: dto.titleIndonesia,
        descriptionIndonesia: dto.descriptionIndonesia,
        titleEnglish: dto.titleEnglish,
        descriptionEnglish: dto.descriptionEnglish,
      } as any;
      for (const [k, v] of Object.entries(required)) {
        if (!v || String(v).trim() === '') {
          throw new BadRequestException(`Missing ${k}`);
        }
      }

      const langs = await this.prisma.language.findMany({
        where: { code: { in: ['id_ID', 'en_US'] } },
        select: { id: true, code: true },
      });
      const byCode = new Map(langs.map((l) => [l.code, l.id]));
      if (!byCode.has('id_ID') || !byCode.has('en_US')) {
        throw new BadRequestException(
          'Required languages (id_ID, en_US) not found',
        );
      }
      const ID = byCode.get('id_ID')!;
      const EN = byCode.get('en_US')!;

      const collectTranslations = (entityId: string) => {
        const rows: {
          entityId: string;
          languageId: number;
          field: string;
          translation: string;
        }[] = [];

        // Wajib
        rows.push({
          entityId,
          languageId: ID,
          field: 'title',
          translation: dto.titleIndonesia!.trim(),
        });
        rows.push({
          entityId,
          languageId: ID,
          field: 'description',
          translation: dto.descriptionIndonesia!.trim(),
        });
        rows.push({
          entityId,
          languageId: EN,
          field: 'title',
          translation: dto.titleEnglish!.trim(),
        });
        rows.push({
          entityId,
          languageId: EN,
          field: 'description',
          translation: dto.descriptionEnglish!.trim(),
        });

        const optionalPairs: Array<
          [field: string, idVal?: string, enVal?: string]
        > = [
          ['jobType', dto.jobTypeIndonesia, dto.jobTypeEnglish],
          ['department', dto.departmentIndonesia, dto.departmentEnglish],
          ['location', dto.locationIndonesia, dto.locationEnglish],
          ['requirements', dto.requirementsIndonesia, dto.requirementsEnglish],
          [
            'responsibilities',
            dto.responsibilitiesIndonesia,
            dto.responsibilitiesEnglish,
          ],
        ];
        for (const [field, idVal, enVal] of optionalPairs) {
          if (idVal && String(idVal).trim() !== '') {
            rows.push({
              entityId,
              languageId: ID,
              field,
              translation: idVal.trim(),
            });
          }
          if (enVal && String(enVal).trim() !== '') {
            rows.push({
              entityId,
              languageId: EN,
              field,
              translation: enVal.trim(),
            });
          }
        }

        return rows;
      };

      const result = await this.prisma.$transaction(async (tx) => {
        const entity = await tx.entity.create({ data: { type: 'CareerJob' } });

        const job = await tx.careerJob.create({
          data: {
            entityId: entity.id,
            salaryRange: dto.salaryRange ?? null,
            isActive: dto.isActive ?? true,
            postedAt: dto.postedAt ? new Date(dto.postedAt) : undefined,
            expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : undefined,
            createdById: dto.createdById ?? null,
            lastUpdatedById: dto.lastUpdatedById ?? null,
          },
        });

        const rows = collectTranslations(entity.id);
        if (rows.length) {
          await tx.translation.createMany({
            data: rows,
            skipDuplicates: true,
          });
        }

        const full = await tx.careerJob.findUnique({
          where: { id: job.id },
          include: {
            entity: {
              include: {
                translations: {
                  where: { languageId: { in: [ID, EN] } },
                },
              },
            },
          },
        });

        return full!;
      });

      const codeById = new Map(langs.map((l) => [l.id, l.code]));
      const grouped = result.entity.translations.reduce<
        Record<string, Record<string, string>>
      >((acc, t) => {
        const code = codeById.get(t.languageId)!;
        acc[code] ??= {};
        acc[code][t.field] = t.translation;
        return acc;
      }, {});

      return this.globalService.response('Career job created successfully.', {
        id: result.id,
        entityId: result.entityId,
        salaryRange: result.salaryRange,
        isActive: result.isActive,
        postedAt: result.postedAt,
        expiredAt: result.expiredAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        translations: grouped,
      });
    } catch (error) {
      throw new BadRequestException({
        code: 400,
        message: 'Failed to create career job',
        error: error?.message,
      });
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    lang: string = 'id_ID',
    sortBy: CareerSortBy = 'deletedAt',
    sortOrder: SortOrder = 'desc',
  ) {
    try {
      const pageNum = Math.max(1, page);
      const take = Math.min(
        100,
        Math.max(1, Number.parseInt(limit.toString(), 10)),
      );
      const skip = (pageNum - 1) * take;
      const whereCareer: any = { deletedAt: null };

      const searchableFields = [
        'title',
        'description',
        'jobType',
        'department',
        'location',
        'requirements',
        'responsibilities',
      ] as const;

      if (search && search.trim()) {
        whereCareer.entity = {
          translations: {
            some: {
              language: { code: lang },
              field: { in: searchableFields as unknown as string[] },
              translation: { contains: search, mode: 'insensitive' },
            },
          },
        };
      }

      const effectiveSortBy: Exclude<CareerSortBy, 'deletedAt'> =
        sortBy === 'deletedAt' ? 'postedAt' : (sortBy as any);

      const [rows, total] = await this.prisma.$transaction([
        this.prisma.careerJob.findMany({
          where: whereCareer,
          skip,
          take,
          orderBy: [{ [effectiveSortBy]: sortOrder }, { postedAt: 'desc' }],
          include: {
            entity: {
              include: {
                translations: {
                  where: {
                    language: { code: lang },
                    field: { in: searchableFields as unknown as string[] },
                  },
                },
              },
            },
          },
        }),
        this.prisma.careerJob.count({ where: whereCareer }),
      ]);

      const datas = rows.map((j) => {
        const t = Object.fromEntries(
          j.entity.translations.map((x) => [x.field, x.translation]),
        );
        return {
          id: j.id,
          entityId: j.entityId,
          isActive: j.isActive,
          salaryRange: j.salaryRange,
          postedAt: j.postedAt,
          expiredAt: j.expiredAt,
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
          title: t['title'] ?? null,
          description: t['description'] ?? null,
          jobType: t['jobType'] ?? null,
          department: t['department'] ?? null,
          location: t['location'] ?? null,
          requirements: t['requirements'] ?? null,
          responsibilities: t['responsibilities'] ?? null,
          lang,
        };
      });

      const totalPages = Math.ceil(total / take);

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
        sort: { sortBy, sortOrder },
        filters: {
          search: isBlankish(search) ? '' : search!,
          lang,
          deleted: false,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        code: 400,
        message: 'Failed to fetch career jobs',
        error: error?.message,
      });
    }
  }

  async findOne(id: string, lang: string = 'id_ID') {
    try {
      const whereTranslation =
        lang === 'multiple'
          ? {
              field: {
                in: [
                  'title',
                  'description',
                  'jobType',
                  'department',
                  'location',
                  'requirements',
                  'responsibilities',
                ],
              },
            }
          : {
              language: { code: lang },
              field: {
                in: [
                  'title',
                  'description',
                  'jobType',
                  'department',
                  'location',
                  'requirements',
                  'responsibilities',
                ],
              },
            };

      const job = await this.prisma.careerJob.findFirst({
        where: { id, deletedAt: null },
        include: {
          entity: {
            include: {
              translations: {
                where: whereTranslation,
                include: lang === 'multiple' ? { language: true } : undefined,
              },
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundException({
          code: 404,
          message: `Career job with id ${id} not found or has been deleted.`,
        });
      }

      let translationsResult: any;

      if (lang === 'multiple') {
        translationsResult = job.entity.translations.reduce<
          Record<string, Record<string, string>>
        >((acc, t) => {
          const code = t.language?.code || 'unknown';
          acc[code] ??= {};
          acc[code][t.field] = t.translation;
          return acc;
        }, {});
      } else {
        const tMap = new Map(
          job.entity.translations.map((t) => [t.field, t.translation]),
        );
        translationsResult = {
          title: tMap.get('title') ?? null,
          description: tMap.get('description') ?? null,
          jobType: tMap.get('jobType') ?? null,
          department: tMap.get('department') ?? null,
          location: tMap.get('location') ?? null,
          requirements: tMap.get('requirements') ?? null,
          responsibilities: tMap.get('responsibilities') ?? null,
        };
      }

      return this.globalService.response('Career job found.', {
        id: job.id,
        entityId: job.entityId,
        isActive: job.isActive,
        salaryRange: job.salaryRange,
        postedAt: job.postedAt,
        expiredAt: job.expiredAt,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        translations: translationsResult,
        lang,
      });
    } catch (error) {
      throw new BadRequestException({
        code: 400,
        message: 'Failed to fetch career job',
        error: error?.message,
      });
    }
  }

  async update(id: string, dto: UpdateCareerJobDto) {
    try {
      const existing = await this.prisma.careerJob.findUnique({
        where: { id },
        select: { id: true, entityId: true, deletedAt: true },
      });
      if (!existing || existing.deletedAt) {
        throw new NotFoundException({
          code: 404,
          message: `Career job with id ${id} not found or has been deleted.`,
        });
      }

      const langs = await this.prisma.language.findMany({
        where: { code: { in: ['id_ID', 'en_US'] } },
        select: { id: true, code: true },
      });
      const byCode = new Map(langs.map((l) => [l.code, l.id]));
      if (!byCode.has('id_ID') || !byCode.has('en_US')) {
        throw new BadRequestException(
          'Required languages (id_ID, en_US) not found',
        );
      }
      const ID = byCode.get('id_ID')!;
      const EN = byCode.get('en_US')!;
      const eid = existing.entityId;

      const toBool = (v: any) => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return v === 1;
        if (typeof v === 'string') {
          const s = v.trim().toLowerCase();
          if (['1', 'true', 'yes', 'on'].includes(s)) return true;
          if (['0', 'false', 'no', 'off'].includes(s)) return false;
        }
        return undefined;
      };
      const toDate = (v: any) =>
        v === null ? null : v ? new Date(v) : undefined;

      const jobData: any = {};
      if (dto.salaryRange !== undefined) jobData.salaryRange = dto.salaryRange;

      if (dto.isActive !== undefined) {
        const b = toBool(dto.isActive as any);
        if (b === undefined)
          throw new BadRequestException(
            'isActive must be boolean/0/1/true/false',
          );
        jobData.isActive = b;
      }

      if (dto.postedAt !== undefined) jobData.postedAt = toDate(dto.postedAt);
      if (dto.expiredAt !== undefined)
        jobData.expiredAt = toDate(dto.expiredAt);

      if (dto.createdById !== undefined)
        jobData.createdById = dto.createdById ?? null;
      if (dto.lastUpdatedById !== undefined)
        jobData.lastUpdatedById = dto.lastUpdatedById ?? null;

      Object.keys(jobData).forEach(
        (k) => jobData[k] === undefined && delete jobData[k],
      );

      type TPayload = { langId: number; field: string; value: string };
      const transOps: TPayload[] = [];
      const pushIf = (langId: number, field: string, val?: string) => {
        if (val !== undefined)
          transOps.push({ langId, field, value: val?.trim?.() ?? '' });
      };

      pushIf(ID, 'title', (dto as any).titleIndonesia);
      pushIf(ID, 'description', (dto as any).descriptionIndonesia);
      pushIf(ID, 'jobType', (dto as any).jobTypeIndonesia);
      pushIf(ID, 'department', (dto as any).departmentIndonesia);
      pushIf(ID, 'location', (dto as any).locationIndonesia);
      pushIf(ID, 'requirements', (dto as any).requirementsIndonesia);
      pushIf(ID, 'responsibilities', (dto as any).responsibilitiesIndonesia);
      // EN
      pushIf(EN, 'title', (dto as any).titleEnglish);
      pushIf(EN, 'description', (dto as any).descriptionEnglish);
      pushIf(EN, 'jobType', (dto as any).jobTypeEnglish);
      pushIf(EN, 'department', (dto as any).departmentEnglish);
      pushIf(EN, 'location', (dto as any).locationEnglish);
      pushIf(EN, 'requirements', (dto as any).requirementsEnglish);
      pushIf(EN, 'responsibilities', (dto as any).responsibilitiesEnglish);

      const result = await this.prisma.$transaction(async (tx) => {
        if (Object.keys(jobData).length) {
          await tx.careerJob.update({ where: { id }, data: jobData });
        }

        if (transOps.length) {
          await Promise.all(
            transOps.map(({ langId, field, value }) =>
              tx.translation.upsert({
                where: {
                  entityId_languageId_field: {
                    entityId: eid,
                    languageId: langId,
                    field,
                  },
                },
                update: { translation: value },
                create: {
                  entityId: eid,
                  languageId: langId,
                  field,
                  translation: value,
                },
              }),
            ),
          );
        }

        return tx.careerJob.findUnique({
          where: { id },
          include: {
            entity: {
              include: {
                translations: {
                  where: {
                    languageId: { in: [ID, EN] },
                    field: {
                      in: [
                        'title',
                        'description',
                        'jobType',
                        'department',
                        'location',
                        'requirements',
                        'responsibilities',
                      ],
                    },
                  },
                },
              },
            },
          },
        });
      });

      const codeById = new Map(langs.map((l) => [l.id, l.code]));
      const grouped = result!.entity.translations.reduce<
        Record<string, Record<string, string>>
      >((acc, t) => {
        const code = codeById.get(t.languageId)!;
        acc[code] ??= {};
        acc[code][t.field] = t.translation;
        return acc;
      }, {});

      return this.globalService.response('Career job updated successfully.', {
        id: result!.id,
        entityId: result!.entityId,
        isActive: result!.isActive,
        salaryRange: result!.salaryRange,
        postedAt: result!.postedAt,
        expiredAt: result!.expiredAt,
        createdAt: result!.createdAt,
        updatedAt: result!.updatedAt,
        translations: grouped,
      });
    } catch (error) {
      throw new BadRequestException({
        code: 400,
        message: 'Failed to update career job',
        error: error?.message,
      });
    }
  }

  async remove(id: string, hard = false) {
    try {
      const existing = await this.prisma.careerJob.findUnique({
        where: { id },
        select: { id: true, entityId: true, deletedAt: true },
      });

      if (!existing || existing.deletedAt) {
        throw new NotFoundException({
          code: 404,
          message: `Career job with id ${id} not found or has been deleted.`,
        });
      }

      if (!hard) {
        const softDeleted = await this.prisma.careerJob.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        });

        return this.globalService.response(
          'Career job soft-deleted successfully.',
          softDeleted,
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const removedJob = await tx.careerJob.delete({ where: { id } });
        await tx.entity.delete({ where: { id: existing.entityId } });

        return removedJob;
      });

      return this.globalService.response(
        'Career job hard-deleted successfully.',
        result,
      );
    } catch (error) {
      throw new BadRequestException({
        code: 400,
        message: 'Failed to delete career job',
        error: error?.message,
      });
    }
  }

  // Recovery Mode API
  async findAllRecovery(
    page = 1,
    limit = 10,
    search?: string,
    lang: string = 'id_ID',
    sortBy: CareerSortBy = 'deletedAt',
    sortOrder: SortOrder = 'desc',
  ) {
    try {
      const pageNum = Math.max(1, page);
      const take = Math.min(
        100,
        Math.max(1, Number.parseInt(limit.toString(), 10)),
      );
      const skip = (pageNum - 1) * take;
      const whereCareer: any = { deletedAt: { not: null } };

      const searchableFields = [
        'title',
        'description',
        'jobType',
        'department',
        'location',
        'requirements',
        'responsibilities',
      ] as const;

      if (search && search.trim()) {
        whereCareer.entity = {
          translations: {
            some: {
              language: { code: lang },
              field: { in: searchableFields as unknown as string[] },
              translation: { contains: search, mode: 'insensitive' },
            },
          },
        };
      }

      const [rows, total] = await this.prisma.$transaction([
        this.prisma.careerJob.findMany({
          where: whereCareer,
          skip,
          take,
          orderBy: [{ [sortBy]: sortOrder }, { postedAt: 'desc' }],
          include: {
            entity: {
              include: {
                translations: {
                  where: {
                    language: { code: lang },
                    field: { in: searchableFields as unknown as string[] },
                  },
                },
              },
            },
          },
        }),
        this.prisma.careerJob.count({ where: whereCareer }),
      ]);

      const datas = rows.map((j) => {
        const t = Object.fromEntries(
          j.entity.translations.map((x) => [x.field, x.translation]),
        );
        return {
          id: j.id,
          entityId: j.entityId,
          isActive: j.isActive,
          salaryRange: j.salaryRange,
          postedAt: j.postedAt,
          expiredAt: j.expiredAt,
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
          deletedAt: j.deletedAt,
          title: t['title'] ?? null,
          description: t['description'] ?? null,
          jobType: t['jobType'] ?? null,
          department: t['department'] ?? null,
          location: t['location'] ?? null,
          requirements: t['requirements'] ?? null,
          responsibilities: t['responsibilities'] ?? null,
          lang,
        };
      });

      const totalPages = Math.ceil(total / take);

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
        sort: { sortBy, sortOrder },
        filters: {
          search: isBlankish(search) ? '' : search!,
          lang,
          deleted: true,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        code: 400,
        message: 'Failed to fetch deleted career jobs',
        error: error?.message,
      });
    }
  }

  async restore(id: string) {
    try {
      const job = await this.prisma.careerJob.update({
        where: { id },
        data: { deletedAt: null },
        include: {
          entity: true,
        },
      });

      return {
        code: 200,
        message: 'Career job restored successfully',
        data: job,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException({
          code: 404,
          message: 'Career job not found',
        });
      }
      console.error('[CareerJobService][restore] Error:', error);
      throw new InternalServerErrorException('Failed to restore career job');
    }
  }

  async destroy(id: string) {
    try {
      const old = await this.prisma.careerJob.findUnique({
        where: { id },
        select: { id: true, entityId: true },
      });

      if (!old) {
        throw new NotFoundException({
          code: 404,
          message: 'Career job not found',
        });
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.careerApplyJob.deleteMany({ where: { jobId: id } });
        await tx.careerJob.delete({ where: { id } });
        await tx.entity.delete({ where: { id: old.entityId } });
      });

      return {
        code: 200,
        message: 'Career job permanently deleted',
        data: { id },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException({
          code: 404,
          message: 'Career job not found',
        });
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('[CareerJobService][destroy] Error:', error);
      throw new InternalServerErrorException(
        'Failed to hard delete career job',
      );
    }
  }
}
