import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { isBlankish } from './utils/sldier.utils';

@Injectable()
export class SliderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(dto: CreateSliderDto, file?: Express.Multer.File) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let imageUrl: string | null = null;
        if (file) {
          const uploaded = await this.globalService.uploadFile({
            buffer: file.buffer,
            fileType: {
              ext: file.originalname.split('.').pop(),
              mime: file.mimetype,
            },
          });
          imageUrl = uploaded?.Location ?? null;
        }

        const languages = await tx.language.findMany({
          where: { code: { in: ['id_ID', 'en_US'] } },
          select: { id: true, code: true },
        });
        const langMap = Object.fromEntries(
          languages.map((l) => [l.code, l.id]),
        );
        if (!langMap['id_ID'] || !langMap['en_US']) {
          throw new BadRequestException(
            'Languages id_ID & en_US belum tersedia.',
          );
        }

        const entity = await tx.entity.create({
          data: { type: 'SLIDER' },
          select: { id: true },
        });

        const slider = await tx.slider.create({
          data: {
            type: dto.type ?? null,
            imageUrl,
            entityId: entity.id,
            status: dto.status ?? 'DRAFT',
            createdById: dto.createdById ?? null,
            lastUpdatedById: dto.lastUpdatedById ?? null,
          },
        });

        const trRows: Parameters<typeof tx.translation.createMany>[0]['data'] =
          [];

        if (dto.titleIndonesia !== undefined) {
          trRows.push({
            entityId: entity.id,
            languageId: langMap['id_ID'],
            field: 'title',
            translation: dto.titleIndonesia ?? '',
          });
        }
        if (dto.titleEnglish !== undefined) {
          trRows.push({
            entityId: entity.id,
            languageId: langMap['en_US'],
            field: 'title',
            translation: dto.titleEnglish ?? '',
          });
        }
        if (dto.descriptionIndonesia !== undefined) {
          trRows.push({
            entityId: entity.id,
            languageId: langMap['id_ID'],
            field: 'description',
            translation: dto.descriptionIndonesia ?? '',
          });
        }
        if (dto.descriptionEnglish !== undefined) {
          trRows.push({
            entityId: entity.id,
            languageId: langMap['en_US'],
            field: 'description',
            translation: dto.descriptionEnglish ?? '',
          });
        }

        if (trRows.length) {
          await tx.translation.createMany({ data: trRows });
        }

        return {
          code: 201,
          message: 'Slider created successfully.',
          data: slider,
        };
      });
    } catch (error) {
      console.error('[SliderService.create] Error:', error);
      throw new BadRequestException('Failed to create slider');
    }
  }

  async findAll(request: any) {
    try {
      const {
        page = '1',
        limit = '10',
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        type,
        lang,
        deleted,
        status,
      } = request ?? {};

      const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
      const take = Math.max(parseInt(String(limit), 10) || 10, 1);
      const skip = (pageNum - 1) * take;

      const allowedSort = new Set(['createdAt', 'updatedAt', 'type']);
      const _sortBy = allowedSort.has(String(sortBy))
        ? String(sortBy)
        : 'createdAt';
      const _sortOrder =
        String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

      // ---- LANG PARSING ----
      const wantMultiple = String(lang ?? '').toLowerCase() === 'multiple';
      const targetLang: 'id_ID' | 'en_US' =
        !wantMultiple && (lang === 'en_US' || lang === 'id_ID')
          ? lang
          : 'id_ID';
      const langsForQuery = wantMultiple
        ? (['id_ID', 'en_US'] as const)
        : [targetLang];

      const langs = await this.prisma.language.findMany({
        where: { code: { in: langsForQuery.slice() } },
        select: { id: true, code: true },
      });
      const languageIds = langs.map((l) => l.id);

      // ---- WHERE CLAUSE ----
      const AND: any[] = [];
      const wantDeleted = String(deleted ?? 'false').toLowerCase() === 'true';
      AND.push(
        wantDeleted ? { NOT: { deletedAt: null } } : { deletedAt: null },
      );

      if (!isBlankish(type)) {
        AND.push({
          type: { equals: String(type).trim(), mode: 'insensitive' },
        });
      }

      if (!isBlankish(status)) {
        AND.push({ status: String(status).toUpperCase() });
      }

      if (!isBlankish(search)) {
        AND.push({
          entity: {
            translations: {
              some: {
                field: { in: ['title', 'description'] },
                translation: {
                  contains: String(search).trim(),
                  mode: 'insensitive',
                },
                languageId: { in: languageIds },
              },
            },
          },
        });
      } else {
        AND.push({
          entity: {
            translations: {
              some: {
                languageId: { in: languageIds },
                field: { in: ['title', 'description'] },
              },
            },
          },
        });
      }

      const whereClause = { AND };
      const [rows, total] = await this.prisma.$transaction([
        this.prisma.slider.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: { [_sortBy]: _sortOrder },
          include: {
            entity: {
              include: {
                translations: {
                  where: {
                    field: { in: ['title', 'description'] },
                    language: {
                      code: {
                        in: wantMultiple ? ['id_ID', 'en_US'] : [targetLang],
                      },
                    },
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
        }),
        this.prisma.slider.count({ where: whereClause }),
      ]);
      const datas = rows.map((s) => {
        const T = s.entity.translations;

        if (wantMultiple) {
          const translations = {
            id_ID: {
              title:
                T.find(
                  (t) => t.language.code === 'id_ID' && t.field === 'title',
                )?.translation ?? '',
              description:
                T.find(
                  (t) =>
                    t.language.code === 'id_ID' && t.field === 'description',
                )?.translation ?? '',
            },
            en_US: {
              title:
                T.find(
                  (t) => t.language.code === 'en_US' && t.field === 'title',
                )?.translation ?? '',
              description:
                T.find(
                  (t) =>
                    t.language.code === 'en_US' && t.field === 'description',
                )?.translation ?? '',
            },
          };

          return {
            id: s.id,
            type: s.type,
            status: s.status,
            imageUrl: s.imageUrl,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            translations,
          };
        }

        const title =
          T.find((t) => t.language.code === targetLang && t.field === 'title')
            ?.translation ?? '';
        const description =
          T.find(
            (t) => t.language.code === targetLang && t.field === 'description',
          )?.translation ?? '';

        return {
          id: s.id,
          type: s.type,
          status: s.status,
          imageUrl: s.imageUrl,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          title,
          description,
        };
      });

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
          lang: wantMultiple ? ['multiple'] : [targetLang],
          type: isBlankish(type) ? '' : String(type),
          deleted: wantDeleted,
          ...(isBlankish(status)
            ? {}
            : { status: String(status).toUpperCase() }),
        },
      };
    } catch (error) {
      console.error('[SliderService.findAll] Error:', error);
      throw new InternalServerErrorException('Failed to fetch sliders');
    }
  }

  async findOne(id: string) {
    try {
      const slider = await this.prisma.slider.findFirst({
        where: { id, deletedAt: null },
        include: {
          entity: {
            include: {
              translations: {
                where: {
                  field: { in: ['title', 'description'] },
                  language: { code: { in: ['id_ID', 'en_US'] } },
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
      });

      if (!slider) {
        throw new NotFoundException(`Slider with id ${id} not found`);
      }

      const translations = {
        id_ID: {
          title:
            slider.entity.translations.find(
              (t) => t.language.code === 'id_ID' && t.field === 'title',
            )?.translation ?? '',
          description:
            slider.entity.translations.find(
              (t) => t.language.code === 'id_ID' && t.field === 'description',
            )?.translation ?? '',
        },
        en_US: {
          title:
            slider.entity.translations.find(
              (t) => t.language.code === 'en_US' && t.field === 'title',
            )?.translation ?? '',
          description:
            slider.entity.translations.find(
              (t) => t.language.code === 'en_US' && t.field === 'description',
            )?.translation ?? '',
        },
      };

      const formattedSlider = {
        id: slider.id,
        type: slider.type,
        status: slider.status,
        imageUrl: slider.imageUrl,
        translations,
        createdAt: slider.createdAt,
        updatedAt: slider.updatedAt,
      };

      return {
        code: 200,
        message: 'Successfully retrieved slider',
        data: formattedSlider,
      };
    } catch (error) {
      console.error('[SliderService.findOne] Error:', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateSliderDto, file?: Express.Multer.File) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.slider.findFirst({
          where: { id, deletedAt: null },
          select: { id: true, imageUrl: true, entityId: true },
        });
        if (!existing) {
          throw new NotFoundException(`Slider with id ${id} not found`);
        }
        let imageUrl = existing.imageUrl ?? null;
        if (file) {
          const uploaded = await this.globalService.uploadFile({
            buffer: file.buffer,
            fileType: {
              ext: file.originalname.split('.').pop(),
              mime: file.mimetype,
            },
          });
          imageUrl = uploaded?.Location ?? null;
        }
        await tx.slider.update({
          where: { id },
          data: {
            type: dto.type ?? undefined,
            status: dto.status ?? 'DRAFT',
            imageUrl,
            lastUpdatedById: dto.lastUpdatedById ?? undefined,
          },
        });
        const languages = await tx.language.findMany({
          where: { code: { in: ['id_ID', 'en_US'] } },
          select: { id: true, code: true },
        });
        const langMap = Object.fromEntries(
          languages.map((l) => [l.code, l.id]),
        );
        if (!langMap['id_ID'] || !langMap['en_US']) {
          throw new BadRequestException(
            'Languages id_ID & en_US belum tersedia.',
          );
        }
        const upsertTr = async (
          field: 'title' | 'description',
          code: 'id_ID' | 'en_US',
          value: string | undefined,
        ) => {
          if (value === undefined) return;
          await tx.translation.upsert({
            where: {
              entityId_languageId_field: {
                entityId: existing.entityId,
                languageId: langMap[code],
                field,
              },
            },
            update: { translation: value ?? '' },
            create: {
              entityId: existing.entityId,
              languageId: langMap[code],
              field,
              translation: value ?? '',
            },
          });
        };
        await upsertTr('title', 'id_ID', dto.titleIndonesia);
        await upsertTr('title', 'en_US', dto.titleEnglish);
        await upsertTr('description', 'id_ID', dto.descriptionIndonesia);
        await upsertTr('description', 'en_US', dto.descriptionEnglish);
        const updated = await tx.slider.findUnique({ where: { id } });
        return {
          code: 200,
          message: `Slider with id ${id} updated successfully.`,
          data: updated,
        };
      });
    } catch (error) {
      console.error('[SliderService.update] Error:', error);
      throw new BadRequestException('Failed to update slider');
    }
  }

  async remove(id: string, userId?: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.slider.findFirst({
          where: { id, deletedAt: null },
        });
        if (!existing) {
          throw new NotFoundException(
            `Slider with id ${id} not found or already deleted`,
          );
        }

        const deletedSlider = await tx.slider.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            ...(userId ? { lastUpdatedById: userId } : {}),
          },
        });

        return {
          code: 200, // 204 sebaiknya tanpa body; pakai 200 agar konsisten
          message: `Slider with id ${id} soft deleted successfully.`,
          data: deletedSlider,
        };
      });
    } catch (error) {
      console.error('[SliderService.remove] Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to delete slider');
    }
  }

  // Recovery Mode API
  async findAllRecovery(request: any) {
    try {
      const {
        page = '1',
        limit = '10',
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        type,
        lang,
        status,
      } = request ?? {};

      const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
      const take = Math.max(parseInt(String(limit), 10) || 10, 1);
      const skip = (pageNum - 1) * take;

      const allowedSort = new Set(['createdAt', 'updatedAt', 'type']);
      const _sortBy = allowedSort.has(String(sortBy))
        ? String(sortBy)
        : 'createdAt';
      const _sortOrder =
        String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

      const wantMultiple = String(lang ?? '').toLowerCase() === 'multiple';
      const targetLang: 'id_ID' | 'en_US' =
        !wantMultiple && (lang === 'en_US' || lang === 'id_ID')
          ? lang
          : 'id_ID';
      const langsForQuery = wantMultiple
        ? (['id_ID', 'en_US'] as const)
        : [targetLang];

      const langs = await this.prisma.language.findMany({
        where: { code: { in: langsForQuery.slice() } },
        select: { id: true, code: true },
      });
      const languageIds = langs.map((l) => l.id);

      const AND: any[] = [{ NOT: { deletedAt: null } }];

      if (!isBlankish(type)) {
        AND.push({
          type: { equals: String(type).trim(), mode: 'insensitive' },
        });
      }

      if (!isBlankish(status)) {
        AND.push({ status: String(status).toUpperCase() });
      }

      if (!isBlankish(search)) {
        AND.push({
          entity: {
            translations: {
              some: {
                field: { in: ['title', 'description'] },
                translation: {
                  contains: String(search).trim(),
                  mode: 'insensitive',
                },
                languageId: { in: languageIds },
              },
            },
          },
        });
      } else {
        AND.push({
          entity: {
            translations: {
              some: {
                languageId: { in: languageIds },
                field: { in: ['title', 'description'] },
              },
            },
          },
        });
      }

      const whereClause = { AND };
      const [rows, total] = await this.prisma.$transaction([
        this.prisma.slider.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: { [_sortBy]: _sortOrder },
          include: {
            entity: {
              include: {
                translations: {
                  where: {
                    field: { in: ['title', 'description'] },
                    language: {
                      code: {
                        in: wantMultiple ? ['id_ID', 'en_US'] : [targetLang],
                      },
                    },
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
        }),
        this.prisma.slider.count({ where: whereClause }),
      ]);

      const datas = rows.map((s) => {
        const T = s.entity.translations;
        if (wantMultiple) {
          const translations = {
            id_ID: {
              title:
                T.find(
                  (t) => t.language.code === 'id_ID' && t.field === 'title',
                )?.translation ?? '',
              description:
                T.find(
                  (t) =>
                    t.language.code === 'id_ID' && t.field === 'description',
                )?.translation ?? '',
            },
            en_US: {
              title:
                T.find(
                  (t) => t.language.code === 'en_US' && t.field === 'title',
                )?.translation ?? '',
              description:
                T.find(
                  (t) =>
                    t.language.code === 'en_US' && t.field === 'description',
                )?.translation ?? '',
            },
          };
          return {
            id: s.id,
            type: s.type,
            status: s.status,
            imageUrl: s.imageUrl,
            deletedAt: s.deletedAt,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            translations,
          };
        }
        const title =
          T.find((t) => t.language.code === targetLang && t.field === 'title')
            ?.translation ?? '';
        const description =
          T.find(
            (t) => t.language.code === targetLang && t.field === 'description',
          )?.translation ?? '';
        return {
          id: s.id,
          type: s.type,
          status: s.status,
          imageUrl: s.imageUrl,
          deletedAt: s.deletedAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          title,
          description,
        };
      });

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
          lang: wantMultiple ? ['multiple'] : [targetLang],
          type: isBlankish(type) ? '' : String(type),
          deleted: true,
          ...(isBlankish(status)
            ? {}
            : { status: String(status).toUpperCase() }),
        },
      };
    } catch (error) {
      console.error('[SliderService.findAllRecovery] Error:', error);
      throw new InternalServerErrorException('Failed to fetch deleted sliders');
    }
  }

  async restore(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.slider.findFirst({
          where: { id, NOT: { deletedAt: null } },
          select: { id: true },
        });
        if (!existing) {
          throw new NotFoundException(
            `Slider with id ${id} not found or not deleted`,
          );
        }

        const restored = await tx.slider.update({
          where: { id },
          data: { deletedAt: null },
        });

        return {
          code: 200,
          message: `Slider with id ${id} restored successfully.`,
          data: restored,
        };
      });
    } catch (error) {
      console.error('[SliderService.restore] Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to restore slider');
    }
  }

  async destroy(id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.slider.findFirst({
          where: { id, NOT: { deletedAt: null } },
          select: { id: true, entityId: true },
        });
        if (!existing) {
          throw new NotFoundException(
            `Slider with id ${id} not found or not deleted`,
          );
        }
        await tx.entity.delete({ where: { id: existing.entityId } });
        return {
          code: 200,
          message: `Slider with id ${id} permanently deleted.`,
          data: { id, entityId: existing.entityId },
        };
      });
    } catch (error) {
      console.error('[SliderService.destroy] Error:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to permanently delete slider');
    }
  }
}
