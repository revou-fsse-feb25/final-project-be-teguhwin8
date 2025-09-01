import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class CareerContentService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async findAll(request: any) {
    try {
      const {
        page = '1',
        limit = '10',
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        sectionType,
        lang,
        deleted,
      } = request ?? {};

      const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
      const take = Math.max(parseInt(String(limit), 10) || 10, 1);
      const skip = (pageNum - 1) * take;

      const allowedSort = new Set(['createdAt', 'updatedAt', 'sectionType']);
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

      if (sectionType) {
        AND.push({
          sectionType: {
            equals: String(sectionType).trim(),
            mode: 'insensitive',
          },
        });
      }

      if (search) {
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
        this.prisma.careerContent.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: { [_sortBy]: _sortOrder },
          include: {
            data: true,
            lastUpdatedBy: true,
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
        this.prisma.careerContent.count({ where: whereClause }),
      ]);

      const datas = rows.map((item) => {
        const T = item.entity?.translations ?? [];

        if (wantMultiple) {
          const translations = {
            id_ID: {
              title:
                T.find(
                  (t) => t.language.code === 'id_ID' && t.field === 'title',
                )?.translation ?? 'Judul Artikel 1',
              description:
                T.find(
                  (t) =>
                    t.language.code === 'id_ID' && t.field === 'description',
                )?.translation ?? 'Konten artikel 1',
            },
            en_US: {
              title:
                T.find(
                  (t) => t.language.code === 'en_US' && t.field === 'title',
                )?.translation ?? 'Article Title 1',
              description:
                T.find(
                  (t) =>
                    t.language.code === 'en_US' && t.field === 'description',
                )?.translation ?? 'Article content 1',
            },
          };

          return {
            id: item.id,
            sectionType: item.sectionType,
            image: item.image,
            lastUpdatedById: item.lastUpdatedById,
            entityId: item.entityId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            deletedAt: item.deletedAt,
            data: item.data,
            lastUpdatedBy: item.lastUpdatedBy,
            translations,
          };
        }

        const title =
          T.find((t) => t.language.code === targetLang && t.field === 'title')
            ?.translation ??
          (targetLang === 'en_US' ? 'Article Title 1' : 'Judul Artikel 1');
        const description =
          T.find(
            (t) => t.language.code === targetLang && t.field === 'description',
          )?.translation ??
          (targetLang === 'en_US' ? 'Article content 1' : 'Konten artikel 1');

        return {
          id: item.id,
          sectionType: item.sectionType,
          image: item.image,
          lastUpdatedById: item.lastUpdatedById,
          entityId: item.entityId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt,
          data: item.data,
          lastUpdatedBy: item.lastUpdatedBy,
          title,
          description,
        };
      });

      const totalPages = Math.max(Math.ceil(total / take), 1);

      return {
        code: 200,
        message: 'Career content fetched successfully.',
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
          search: search ? String(search) : '',
          lang: wantMultiple ? ['multiple'] : [targetLang],
          sectionType: sectionType ? String(sectionType) : '',
          deleted: wantDeleted,
        },
      };
    } catch (error) {
      console.error('CareerContentService.findAll error:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to fetch career content.',
        error: error.message || error,
      });
    }
  }

  async findOne(id: string) {
    try {
      const [careerContent] = await this.prisma.$transaction([
        this.prisma.careerContent.findUnique({
          where: { id },
        }),
      ]);

      if (!careerContent || careerContent.deletedAt) {
        throw new NotFoundException(
          `CareerContent with id ${id} not found or has been deleted`,
        );
      }

      return {
        code: 200,
        message: 'Career content fetched successfully',
        data: careerContent,
      };
    } catch (error) {
      console.error('CareerContentService.findOne error:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to fetch career content',
        error: error.message || error,
      });
    }
  }

  async create(payload: any) {
    const {
      titleIndonesia,
      titleEnglish,
      descriptionIndonesia,
      descriptionEnglish,
      image,
      sectionType,
      lastUpdatedById,
    } = payload;

    const allowedSectionTypes = [
      'banner',
      'thrive',
      'jobs',
      'moments',
      'whoweare',
    ];

    if (!allowedSectionTypes.includes(sectionType)) {
      throw new BadRequestException({
        code: 400,
        message: `Invalid sectionType. Allowed values are: ${allowedSectionTypes.join(
          ', ',
        )}`,
      });
    }

    if (
      titleIndonesia === undefined &&
      titleEnglish === undefined &&
      descriptionIndonesia === undefined &&
      descriptionEnglish === undefined
    ) {
      throw new BadRequestException({
        code: 400,
        message:
          'At least one translation field (titleIndonesia, titleEnglish, descriptionIndonesia, descriptionEnglish) must be provided',
      });
    }

    const existing = await this.prisma.careerContent.findFirst({
      where: { sectionType, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException({
        code: 409,
        message: `Career content with sectionType "${sectionType}" already exists.`,
      });
    }

    try {
      let imageUrl: string | null = null;
      if (image) {
        const fileName = image.originalName || image.originalname;
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (!ext) {
          throw new BadRequestException({
            code: 400,
            message: 'Invalid file: No file extension found',
          });
        }
        const uploaded = await this.globalService.uploadFile({
          buffer: image.buffer,
          fileType: {
            ext,
            mime: image.mimetype || image.busBoyMimeType || 'image/jpeg',
          },
        });
        imageUrl = uploaded?.Location ?? null;
      }

      return await this.prisma.$transaction(async (tx) => {
        const entity = await tx.entity.create({
          data: { type: 'CAREER_CONTENT' },
        });
        const careerContent = await tx.careerContent.create({
          data: {
            entityId: entity.id,
            sectionType,
            image: imageUrl,
            lastUpdatedById,
          },
        });
        const translations = [];
        if (titleIndonesia) {
          translations.push({
            entityId: entity.id,
            languageId: 1,
            field: 'title',
            translation: titleIndonesia,
          });
        }
        if (titleEnglish) {
          translations.push({
            entityId: entity.id,
            languageId: 2,
            field: 'title',
            translation: titleEnglish,
          });
        }
        if (descriptionIndonesia) {
          translations.push({
            entityId: entity.id,
            languageId: 1,
            field: 'description',
            translation: descriptionIndonesia,
          });
        }
        if (descriptionEnglish) {
          translations.push({
            entityId: entity.id,
            languageId: 2,
            field: 'description',
            translation: descriptionEnglish,
          });
        }
        if (translations.length > 0) {
          try {
            await tx.translation.createMany({
              data: translations,
            });
          } catch (transError) {
            console.error('Failed to create translations:', transError);
            throw new InternalServerErrorException({
              code: 500,
              message: 'Failed to create translations',
              error: transError.message || transError,
            });
          }
        }
        const createdTranslations = await tx.translation.findMany({
          where: { entityId: entity.id },
        });
        const translationsObject = {
          id_ID: {
            title:
              createdTranslations.find(
                (t) => t.languageId === 1 && t.field === 'title',
              )?.translation || 'Judul Artikel 1',
            description:
              createdTranslations.find(
                (t) => t.languageId === 1 && t.field === 'description',
              )?.translation || 'Konten artikel 1',
          },
          en_US: {
            title:
              createdTranslations.find(
                (t) => t.languageId === 2 && t.field === 'title',
              )?.translation || 'Article Title 1',
            description:
              createdTranslations.find(
                (t) => t.languageId === 2 && t.field === 'description',
              )?.translation || 'Article content 1',
          },
        };

        return {
          ...careerContent,
          entity: { id: entity.id },
          translations: translationsObject,
        };
      });
    } catch (error) {
      console.error('Error creating CareerContent:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to create CareerContent',
        error: error.message || error,
      });
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async update(id: string, payload: any) {
    const {
      titleIndonesia,
      titleEnglish,
      descriptionIndonesia,
      descriptionEnglish,
      image,
      sectionType,
      lastUpdatedById,
    } = payload;

    const allowedSectionTypes = [
      'banner',
      'thrive',
      'jobs',
      'moments',
      'whoweare',
    ];

    if (!allowedSectionTypes.includes(sectionType)) {
      throw new BadRequestException({
        code: 400,
        message: `Invalid sectionType. Allowed values are: ${allowedSectionTypes.join(
          ', ',
        )}`,
      });
    }

    if (
      titleIndonesia === undefined &&
      titleEnglish === undefined &&
      descriptionIndonesia === undefined &&
      descriptionEnglish === undefined
    ) {
      throw new BadRequestException({
        code: 400,
        message:
          'At least one translation field (titleIndonesia, titleEnglish, descriptionIndonesia, descriptionEnglish) must be provided',
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const careerContent = await tx.careerContent.findUnique({
          where: { id },
          include: { entity: true },
        });

        if (!careerContent) {
          throw new NotFoundException({
            code: 404,
            message: `CareerContent with ID ${id} not found`,
          });
        }

        if (!careerContent.entityId) {
          throw new BadRequestException({
            code: 400,
            message: `CareerContent with ID ${id} has no associated entityId`,
          });
        }
        let imageUrl: string | null = careerContent.image;
        if (image) {
          const fileName = image.originalName || image.originalname;
          const ext = fileName?.split('.').pop()?.toLowerCase();
          if (!ext) {
            throw new BadRequestException({
              code: 400,
              message: 'Invalid file: No file extension found',
            });
          }
          const uploaded = await this.globalService.uploadFile({
            buffer: image.buffer,
            fileType: {
              ext,
              mime: image.mimetype || image.busBoyMimeType || 'image/jpeg',
            },
          });
          imageUrl = uploaded?.Location ?? null;
        }

        const updatedCareerContent = await tx.careerContent.update({
          where: { id },
          data: {
            sectionType,
            image: imageUrl,
            lastUpdatedById,
            updatedAt: new Date(),
          },
        });
        const translations = [];
        if (titleIndonesia) {
          translations.push({
            languageId: 1,
            field: 'title',
            translation: titleIndonesia,
          });
        }
        if (titleEnglish) {
          translations.push({
            languageId: 2,
            field: 'title',
            translation: titleEnglish,
          });
        }
        if (descriptionIndonesia) {
          translations.push({
            languageId: 1,
            field: 'description',
            translation: descriptionIndonesia,
          });
        }
        if (descriptionEnglish) {
          translations.push({
            languageId: 2,
            field: 'description',
            translation: descriptionEnglish,
          });
        }
        for (const trans of translations) {
          try {
            await tx.translation.upsert({
              where: {
                entityId_languageId_field: {
                  entityId: careerContent.entityId,
                  languageId: trans.languageId,
                  field: trans.field,
                },
              },
              update: {
                translation: trans.translation,
                updatedAt: new Date(),
              },
              create: {
                entityId: careerContent.entityId,
                languageId: trans.languageId,
                field: trans.field,
                translation: trans.translation,
              },
            });
          } catch (transError) {
            console.error(
              `Failed to upsert translation for ${trans.field} (languageId: ${trans.languageId}):`,
              transError,
            );
            throw new InternalServerErrorException({
              code: 500,
              message: `Failed to update translation for ${trans.field} (languageId: ${trans.languageId})`,
            });
          }
        }
        const updatedTranslations = await tx.translation.findMany({
          where: { entityId: careerContent.entityId },
        });

        const translationsObject = {
          id_ID: {
            title:
              updatedTranslations.find(
                (t) => t.languageId === 1 && t.field === 'title',
              )?.translation || 'Judul Artikel 1',
            description:
              updatedTranslations.find(
                (t) => t.languageId === 1 && t.field === 'description',
              )?.translation || 'Konten artikel 1',
          },
          en_US: {
            title:
              updatedTranslations.find(
                (t) => t.languageId === 2 && t.field === 'title',
              )?.translation || 'Article Title 1',
            description:
              updatedTranslations.find(
                (t) => t.languageId === 2 && t.field === 'description',
              )?.translation || 'Article content 1',
          },
        };

        return {
          ...updatedCareerContent,
          entity: { id: careerContent.entityId },
          translations: translationsObject,
        };
      });
    } catch (error) {
      console.error('Error updating CareerContent:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to update CareerContent',
        error: error.message || error,
      });
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async createImageData(careerContentId: string, body: any) {
    try {
      const careerContent = await this.prisma.careerContent.findUnique({
        where: { id: careerContentId },
      });

      if (!careerContent) {
        throw new NotFoundException(
          `CareerContent with ID ${careerContentId} not found`,
        );
      }

      let imageUrl: string | null = careerContent.image;
      if (body.image) {
        const fileName = body.image.originalName || body.image.originalname;
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!ext) {
          throw new BadRequestException({
            code: 400,
            message: 'Invalid file: No file extension found',
          });
        }
        const uploaded = await this.globalService.uploadFile({
          buffer: body.image.buffer,
          fileType: {
            ext,
            mime:
              body.image.mimetype || body.image.busBoyMimeType || 'image/jpeg',
          },
        });
        imageUrl = uploaded?.Location ?? null;
      } else if (body.image) {
        throw new BadRequestException({
          code: 400,
          message: 'Invalid file: Missing originalname or mimetype',
        });
      }
      const careerContentData = await this.prisma.careerContentData.create({
        data: {
          careerContentId,
          image: imageUrl,
        },
      });
      return careerContentData;
    } catch (error) {
      console.error('Error creating CareerContentData:', error);
      throw new Error('Failed to create CareerContentData');
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async updateImageData(id: string, body: any) {
    try {
      const existingData = await this.prisma.careerContentData.findUnique({
        where: { id },
        include: { careerContent: true },
      });

      if (!existingData) {
        throw new NotFoundException(
          `CareerContentData with ID ${id} not found`,
        );
      }
      let imageUrl: string | null = existingData.image;
      if (body.image) {
        const fileName = body.image.originalName || body.image.originalname;
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!ext) {
          throw new BadRequestException({
            code: 400,
            message: 'Invalid file: No file extension found',
          });
        }
        const uploaded = await this.globalService.uploadFile({
          buffer: body.image.buffer,
          fileType: {
            ext,
            mime:
              body.image.mimetype || body.image.busBoyMimeType || 'image/jpeg',
          },
        });
        imageUrl = uploaded?.Location ?? null;
      } else if (body.image) {
        throw new BadRequestException({
          code: 400,
          message: 'Invalid file: Missing originalname or mimetype',
        });
      }

      const updatedData = await this.prisma.careerContentData.update({
        where: { id },
        data: {
          image: imageUrl,
          updatedAt: new Date(),
        },
      });

      return updatedData;
    } catch (error) {
      console.error('Error updating CareerContentData:', error);
      throw new Error('Failed to update CareerContentData');
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async deleteImageData(id: string) {
    try {
      const existingData = await this.prisma.careerContentData.findUnique({
        where: { id },
      });

      if (!existingData) {
        throw new NotFoundException(
          `CareerContentData with ID ${id} not found`,
        );
      }
      const deletedData = await this.prisma.careerContentData.delete({
        where: { id },
      });
      return deletedData;
    } catch (error) {
      console.error('Error deleting CareerContentData:', error);
      throw new Error('Failed to delete CareerContentData');
    } finally {
      await this.prisma.$disconnect();
    }
  }
}
