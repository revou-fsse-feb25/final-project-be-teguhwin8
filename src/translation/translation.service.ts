import { Injectable } from '@nestjs/common';
import { UpdateTranslationDto } from './dto/update-translation.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LANGS } from './utils/translation.utils';

@Injectable()
export class TranslationService {
  constructor(private prisma: PrismaService) {}

  async findAll(request: Record<string, any>) {
    const page = parseInt(request.page as string, 10) || 1;
    const limit = parseInt(request.limit as string, 10) || 10;
    const skip = (page - 1) * limit;
    const sortBy = request.sortBy || 'createdAt';
    const sortOrder = request.sortOrder === 'asc' ? 'asc' : 'desc';
    const search = request.search ? String(request.search).trim() : '';
    const languageId = request.languageId
      ? parseInt(request.languageId, 10)
      : undefined;
    const type = request.type ? String(request.type) : undefined;

    const isBlankish = (value: string | undefined | null): boolean => {
      return !value || value.trim() === '';
    };

    const where: any = {
      ...(type && { type }),
      translations: {
        some: {
          ...(languageId && { languageId }),
          ...(search &&
            !isBlankish(search) && {
              translation: {
                contains: search,
                mode: 'insensitive',
              },
            }),
        },
      },
    };

    const [entities, total] = await Promise.all([
      this.prisma.entity.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          translations: {
            where: {
              ...(languageId && { languageId }),
              ...(search &&
                !isBlankish(search) && {
                  translation: {
                    contains: search,
                    mode: 'insensitive',
                  },
                }),
            },
            include: {
              language: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.entity.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      code: 200,
      message: 'Successfully',
      data: entities ?? [],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      sort: { sortBy, sortOrder },
      filters: {
        search: isBlankish(search) ? '' : search,
        deleted: false,
      },
    };
  }

  async findOne(id: string) {
    const row = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        translations: {
          where: {
            language: { code: { in: LANGS as unknown as string[] } },
          },
          include: { language: true },
        },
      },
    });

    if (!row) {
      return { code: 404, message: 'Entity not found', data: null };
    }

    return {
      code: 200,
      message: 'Translations fetched successfully',
      data: row,
    };
  }

  async update(id: string, updateTranslationDto: UpdateTranslationDto) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
    });
    if (!entity) {
      return { code: 404, message: 'Entity not found', data: null };
    }
    const languageMap = new Map<string, number>();
    const languages = await this.prisma.language.findMany({
      where: { code: { in: LANGS as unknown as string[] } },
      select: { id: true, code: true },
    });
    languages.forEach((lang) => languageMap.set(lang.code, lang.id));
    for (const t of updateTranslationDto.translation) {
      if (!languageMap.has(t.lang)) {
        return {
          code: 400,
          message: `Invalid language code: ${t.lang}`,
          data: null,
        };
      }
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedEntity = await tx.entity.update({
        where: { id },
        data: {
          type: updateTranslationDto.type ?? entity.type,
        },
        include: {
          translations: {
            where: {
              language: { code: { in: LANGS as unknown as string[] } },
            },
            include: { language: true },
          },
        },
      });
      for (const t of updateTranslationDto.translation) {
        const languageId = languageMap.get(t.lang)!;
        if (t.translationId) {
          await tx.translation.update({
            where: { id: t.translationId },
            data: {
              field: t.field,
              translation: t.value,
              languageId,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.translation.create({
            data: {
              entityId: id,
              languageId,
              field: t.field,
              translation: t.value,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
      const updatedTranslations = await tx.translation.findMany({
        where: {
          entityId: id,
          language: { code: { in: LANGS as unknown as string[] } },
        },
        include: { language: true },
      });
      return {
        entity: updatedEntity,
        translations: updatedTranslations,
      };
    });
    const translations = result.translations.map((t) => ({
      id: t.id,
      entityId: t.entityId,
      languageId: t.languageId,
      field: t.field,
      translation: t.translation,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      language: {
        id: t.language.id,
        code: t.language.code,
        name: t.language.name,
        createdAt: t.language.createdAt,
        updatedAt: t.language.updatedAt,
      },
    }));
    return {
      code: 200,
      message: 'Entity and translations updated successfully',
      data: {
        id: result.entity.id,
        type: result.entity.type,
        createdAt: result.entity.createdAt,
        translations,
      },
    };
  }

  async remove(id: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        faq: true,
        careerJob: true,
        Articles: true,
        Tag: true,
        About: true,
      },
    });

    if (!entity) {
      return { code: 404, message: 'Entity not found', data: null };
    }

    await this.prisma.$transaction(async (tx) => {
      if (entity.faq) {
        await tx.faq.delete({ where: { entityId: id } });
      }
      if (entity.careerJob) {
        await tx.careerJob.delete({ where: { entityId: id } });
      }
      if (entity.Articles) {
        await tx.articles.delete({ where: { entityId: id } });
      }
      if (entity.Tag) {
        await tx.tag.delete({ where: { entityId: id } });
      }
      if (entity.About) {
        await tx.about.delete({ where: { entityId: id } });
      }
      await tx.entity.delete({ where: { id } });
    });

    return {
      code: 200,
      message: 'Entity and related data deleted successfully',
      data: null,
    };
  }
}
