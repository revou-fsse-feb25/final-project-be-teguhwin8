import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateCareerApplyJobDto } from './dto/create-career-apply-job.dto';
import { UpdateCareerApplyJobDto } from './dto/update-career-apply-job.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CareerApplyJobService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(createCareerApplyJobDto: CreateCareerApplyJobDto, file: any) {
    try {
      const normalizedEmail = (createCareerApplyJobDto.email || '')
        .trim()
        .toLowerCase();

      if (file) {
        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException({
            code: 400,
            message:
              'Invalid file type. Only PDF, PPTX, and DOCX files are allowed.',
          });
        }
      }

      const duplicate = await this.prisma.careerApplyJob.findFirst({
        where: {
          jobId: createCareerApplyJobDto.jobId,
          email: normalizedEmail,
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new BadRequestException({
          code: 400,
          message: 'Email ini sudah pernah melamar untuk posisi tersebut.',
          error: 'DuplicateApplication',
        });
      }

      let uploadedFileUrl: string | null = null;
      if (file) {
        const s3Response = await this.globalService.uploadFile({
          buffer: file.buffer,
          fileType: {
            ext: file.originalname.split('.').pop(),
            mime: file.mimetype,
          },
        });
        uploadedFileUrl = (s3Response as any)?.Location || null;
      }

      const careerApplyJob = await this.prisma.careerApplyJob.create({
        data: {
          jobId: createCareerApplyJobDto.jobId,
          fullName: createCareerApplyJobDto.fullName,
          email: normalizedEmail,
          phone: createCareerApplyJobDto.phone,
          portfolio: createCareerApplyJobDto.portfolio,
          portfolioFile: uploadedFileUrl,
          linkedinLink: createCareerApplyJobDto.linkedinLink,
        },
      });

      return {
        code: 201,
        message: 'Career application created successfully.',
        data: careerApplyJob,
      };
    } catch (error) {
      console.error('Create CareerApplyJob Error:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta as any)?.target as
          | string[]
          | string
          | undefined;
        if (
          (Array.isArray(target) &&
            target.includes('career_apply_unique_job_email')) ||
          (typeof target === 'string' &&
            target.includes('career_apply_unique_job_email')) ||
          true
        ) {
          throw new BadRequestException({
            code: 400,
            message: 'Email ini sudah pernah melamar untuk posisi tersebut.',
            error: 'DuplicateApplication',
          });
        }
      }

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to create career application.',
      });
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    lang: 'id_ID' | 'en_US' | 'multiple' = 'id_ID',
  ) {
    try {
      const skip = (page - 1) * limit;
      const take = parseInt(limit.toString(), 10);

      const searchableFields = [
        'title',
        'description',
        'jobType',
        'department',
        'location',
        'requirements',
        'responsibilities',
      ] as const;

      const isMultiple = lang === 'multiple';
      const wantedLangs = isMultiple ? ['id_ID', 'en_US'] : [lang, 'en_US'];

      const where: Prisma.CareerApplyJobWhereInput = search?.trim()
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { jobId: { contains: search, mode: 'insensitive' } },
              {
                job: {
                  entity: {
                    translations: {
                      some: {
                        language: { code: { in: wantedLangs } },
                        field: { in: searchableFields as unknown as string[] },
                        translation: { contains: search, mode: 'insensitive' },
                      },
                    },
                  },
                },
              },
            ],
          }
        : {};

      const [rows, total] = await this.prisma.$transaction([
        this.prisma.careerApplyJob.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            job: {
              include: {
                entity: {
                  include: {
                    translations: {
                      where: {
                        language: { code: { in: wantedLangs } },
                        field: { in: searchableFields as unknown as string[] },
                      },
                      select: {
                        field: true,
                        translation: true,
                        language: { select: { code: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.careerApplyJob.count({ where }),
      ]);

      type TTrans = {
        field: string;
        translation: string | null;
        language?: { code: 'id_ID' | 'en_US' };
      };

      const toMapByLang = (translations: TTrans[]) => {
        const out: Record<'id_ID' | 'en_US', Record<string, string | null>> = {
          id_ID: {} as any,
          en_US: {} as any,
        };
        for (const f of searchableFields) {
          out.id_ID[f] = null;
          out.en_US[f] = null;
        }
        for (const tr of translations) {
          const code = tr.language?.code;
          if (code === 'id_ID' || code === 'en_US') {
            out[code][tr.field] = tr.translation ?? null;
          }
        }
        for (const f of searchableFields) {
          if (out.id_ID[f] == null) out.id_ID[f] = out.en_US[f];
        }
        return out;
      };

      const data = rows.map((a) => {
        const maps = toMapByLang(a.job.entity.translations as TTrans[]);

        const base = {
          id: a.id,
          fullName: a.fullName,
          email: a.email,
          phone: a.phone,
          portfolio: a.portfolio,
          portfolioFile: a.portfolioFile,
          linkedinLink: a.linkedinLink,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        };

        const jobBase = {
          id: a.job.id,
          entityId: a.job.entityId,
          isActive: a.job.isActive,
          salaryRange: a.job.salaryRange,
          postedAt: a.job.postedAt,
          expiredAt: a.job.expiredAt,
        };

        if (isMultiple) {
          return {
            ...base,
            job: {
              ...jobBase,
              i18n: {
                id_ID: maps.id_ID,
                en_US: maps.en_US,
              },
              lang: 'multiple',
            },
          };
        } else {
          const chosen = lang === 'id_ID' ? maps.id_ID : maps.en_US;
          return {
            ...base,
            job: {
              ...jobBase,
              title: chosen.title,
              description: chosen.description,
              jobType: chosen.jobType,
              department: chosen.department,
              location: chosen.location,
              requirements: chosen.requirements,
              responsibilities: chosen.responsibilities,
              lang,
            },
          };
        }
      });

      return {
        code: 200,
        message: 'Successfully retrieved career applications.',
        data,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      console.error('Find All CareerApplyJob Error:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to retrieve career applications.',
      });
    }
  }

  async findOne(id: string, lang: 'id_ID' | 'en_US' | 'multiple' = 'id_ID') {
    try {
      const searchableFields = [
        'title',
        'description',
        'jobType',
        'department',
        'location',
        'requirements',
        'responsibilities',
      ] as const;

      const isMultiple = lang === 'multiple';
      const wantedLangs = isMultiple ? ['id_ID', 'en_US'] : [lang, 'en_US'];

      const row = await this.prisma.careerApplyJob.findUnique({
        where: { id },
        include: {
          job: {
            include: {
              entity: {
                include: {
                  translations: {
                    where: {
                      language: { code: { in: wantedLangs } },
                      field: { in: searchableFields as unknown as string[] },
                    },
                    select: {
                      field: true,
                      translation: true,
                      language: { select: { code: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!row) {
        throw new BadRequestException({
          code: 404,
          message: `Career application with ID ${id} not found.`,
        });
      }

      type TTrans = {
        field: string;
        translation: string | null;
        language?: { code: 'id_ID' | 'en_US' };
      };

      const toMapByLang = (translations: TTrans[]) => {
        const out: Record<'id_ID' | 'en_US', Record<string, string | null>> = {
          id_ID: {} as any,
          en_US: {} as any,
        };
        for (const f of searchableFields) {
          out.id_ID[f] = null;
          out.en_US[f] = null;
        }
        for (const tr of translations) {
          const code = tr.language?.code;
          if (code === 'id_ID' || code === 'en_US') {
            out[code][tr.field] = tr.translation ?? null;
          }
        }
        for (const f of searchableFields) {
          if (out.id_ID[f] == null) out.id_ID[f] = out.en_US[f];
        }
        return out;
      };

      const maps = toMapByLang(row.job.entity.translations as TTrans[]);

      const base = {
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        portfolio: row.portfolio,
        portfolioFile: row.portfolioFile,
        linkedinLink: row.linkedinLink,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };

      const jobBase = {
        id: row.job.id,
        entityId: row.job.entityId,
        isActive: row.job.isActive,
        salaryRange: row.job.salaryRange,
        postedAt: row.job.postedAt,
        expiredAt: row.job.expiredAt,
      };

      const data = isMultiple
        ? {
            ...base,
            job: {
              ...jobBase,
              i18n: {
                id_ID: maps.id_ID,
                en_US: maps.en_US,
              },
              lang: 'multiple',
            },
          }
        : {
            ...base,
            job: {
              ...jobBase,
              title: (lang === 'id_ID' ? maps.id_ID : maps.en_US).title,
              description: (lang === 'id_ID' ? maps.id_ID : maps.en_US)
                .description,
              jobType: (lang === 'id_ID' ? maps.id_ID : maps.en_US).jobType,
              department: (lang === 'id_ID' ? maps.id_ID : maps.en_US)
                .department,
              location: (lang === 'id_ID' ? maps.id_ID : maps.en_US).location,
              requirements: (lang === 'id_ID' ? maps.id_ID : maps.en_US)
                .requirements,
              responsibilities: (lang === 'id_ID' ? maps.id_ID : maps.en_US)
                .responsibilities,
              lang,
            },
          };

      return {
        code: 200,
        message: `Successfully retrieved career application with ID ${id}.`,
        data,
      };
    } catch (error) {
      console.error('Find One CareerApplyJob Error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to retrieve career application.',
      });
    }
  }

  async update(
    id: string,
    updateCareerApplyJobDto: UpdateCareerApplyJobDto,
    file: any,
  ) {
    try {
      if (file) {
        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException({
            code: 400,
            message:
              'Invalid file type. Only PDF, PPTX, and DOCX files are allowed.',
          });
        }
      }

      let uploadedFileUrl = null;
      if (file) {
        const s3Response = await this.globalService.uploadFile({
          buffer: file.buffer,
          fileType: {
            ext: file.originalname.split('.').pop(),
            mime: file.mimetype,
          },
        });
        uploadedFileUrl = s3Response.Location || null;
      }

      const updatedCareerApplyJob = await this.prisma.careerApplyJob.update({
        where: { id },
        data: {
          fullName: updateCareerApplyJobDto.fullName,
          email: updateCareerApplyJobDto.email,
          phone: updateCareerApplyJobDto.phone,
          portfolio: updateCareerApplyJobDto.portfolio,
          portfolioFile:
            uploadedFileUrl || updateCareerApplyJobDto.portfolioFile,
          linkedinLink: updateCareerApplyJobDto.linkedinLink,
        },
      });

      return {
        code: 200,
        message: `Career application with ID ${id} updated successfully.`,
        data: updatedCareerApplyJob,
      };
    } catch (error) {
      console.error('Update CareerApplyJob Error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to update career application.',
      });
    }
  }

  async remove(id: string) {
    try {
      const careerApplyJob = await this.prisma.careerApplyJob.findUnique({
        where: { id },
      });
      if (!careerApplyJob) {
        throw new BadRequestException({
          code: 404,
          message: `Career application with ID ${id} not found.`,
        });
      }

      await this.prisma.careerApplyJob.delete({
        where: { id },
      });

      return {
        code: 200,
        message: `Career application with ID ${id} deleted successfully.`,
      };
    } catch (error) {
      console.error('Delete CareerApplyJob Error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to delete career application.',
      });
    }
  }

  // Recovery Mode API
  // Recovery Mode API untuk FAQ
  async findAllRecovery(request: any) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'deletedAt',
      sortOrder = 'desc',
      authorId,
    } = request ?? {};

    const pageNum = Math.max(Number(page) || 1, 1);
    const take = Math.max(Number(limit) || 10, 1);
    const skip = (pageNum - 1) * take;

    const authorIdArray = Array.isArray(authorId)
      ? authorId
      : authorId
      ? String(authorId)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const whereConditions: any = {
      deletedAt: { not: null },
      ...(authorIdArray ? { authorId: { in: authorIdArray } } : {}),
    };

    if (!isBlankish(search)) {
      const kw = String(search).trim();
      whereConditions.OR = [
        { category: { contains: kw, mode: 'insensitive' } },
        { entityId: { contains: kw, mode: 'insensitive' } },
        { status: { equals: kw } },
        {
          entity: {
            translations: {
              some: {
                translation: { contains: kw, mode: 'insensitive' },
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
      'category',
      'entityId',
    ]);
    const _sortBy = allowedSort.has(String(sortBy))
      ? String(sortBy)
      : 'deletedAt';
    const _sortOrder =
      String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
      const [total, datas] = await this.prisma.$transaction([
        this.prisma.faq.count({ where: whereConditions }),
        this.prisma.faq.findMany({
          where: whereConditions,
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
          include: {
            author: true,
            entity: {
              include: {
                translations: true, // semua translation ikut
              },
            },
          },
        }),
      ]);

      // mapping data biar ada title/description langsung
      const data = datas.map((f) => {
        const tMap = new Map(
          f.entity?.translations?.map((t) => [t.field, t.translation]) ?? [],
        );
        return {
          id: f.id,
          authorId: f.authorId,
          category: f.category,
          status: f.status,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
          deletedAt: f.deletedAt,
          title: tMap.get('title') ?? null,
          description: tMap.get('description') ?? null,
        };
      });

      return {
        code: 200,
        message: 'Successfully',
        data,
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
          authorId: authorIdArray ?? 'ANY',
          search: isBlankish(search) ? '' : search,
          onlyDeleted: true,
        },
      };
    } catch (error) {
      console.error('Failed to list deleted faq:', error);
      throw new InternalServerErrorException('Failed to list deleted faq');
    }
  }

  async restore(id: string) {
    try {
      const result = await this.prisma.faq.updateMany({
        where: { id, NOT: { deletedAt: null } },
        data: { deletedAt: null },
      });

      if (result.count === 0) {
        throw new NotFoundException('faq not found or not soft-deleted');
      }

      const restored = await this.prisma.faq.findUnique({
        where: { id },
      });

      return {
        code: 200,
        message: 'Successfully Restored',
        data: restored,
      };
    } catch (error) {
      console.error('Failed to restore faq:', error);
      throw new InternalServerErrorException('Failed to restore faq');
    }
  }

  async destroy(id: string) {
    try {
      // pastikan FAQ ada & sudah soft-deleted
      const faq = await this.prisma.faq.findFirst({
        where: { id, NOT: { deletedAt: null } },
        select: { id: true, entityId: true },
      });
      if (!faq)
        throw new NotFoundException('FAQ not found or not soft-deleted');

      await this.prisma.$transaction(async (tx) => {
        // 1) hapus semua translation by entityId
        if (faq.entityId) {
          await tx.translation.deleteMany({
            where: { entityId: faq.entityId },
          });
        }

        // 2) hapus FAQ (child dari Entity)
        const res = await tx.faq.deleteMany({
          where: { id: faq.id, NOT: { deletedAt: null } },
        });
        if (res.count === 0)
          throw new NotFoundException('FAQ not found or not soft-deleted');

        // 3) hapus Entity (parent) setelah child-nya hilang
        if (faq.entityId) {
          await tx.entity.deleteMany({ where: { id: faq.entityId } });
        }
      });

      return {
        code: 200,
        message: 'Successfully destroyed',
        data: { id, hardDeleted: true },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot hard delete: related records still reference this FAQ.',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Record already removed');
        }
      }
      console.error('Failed to hard delete FAQ:', error);
      throw new InternalServerErrorException('Failed to hard delete FAQ');
    }
  }
}

export function isBlankish(v: any): boolean {
  return (
    v === undefined ||
    v === null ||
    (typeof v === 'string' &&
      ['', 'any', 'null', 'undefined'].includes(v.trim().toLowerCase()))
  );
}
