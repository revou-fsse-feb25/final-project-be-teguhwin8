import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateAboutDto } from './dto/update-about.dto';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  indexTranslationsByField,
  LANGS,
  mapDtoToLangValues,
  TRANSLATABLE_FIELDS,
  TranslatableField,
} from './utils/abouts.utils';

import { buildFindFirstAboutArgs } from './query/findfirst';

import { CreateAboutDto } from './dto/create-about.dto';
import { LangParam } from './query/findfirst';

@Injectable()
export class AboutsService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async findFirst(lang: LangParam = 'id_ID') {
    const args = buildFindFirstAboutArgs(lang);
    const row: any | null = await this.prisma.about.findFirst(args);

    if (!row) {
      return { code: 404, message: 'About not found', data: null };
    }

    const base = {
      id: row.id,
      entityId: row.entityId,
      imageBanner: row.imageBanner ?? null,
      imageAbout: row.imageAbout ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    if (lang !== 'multiple') {
      const idx = indexTranslationsByField(
        row.entity?.translations ?? [],
        lang,
      );
      return {
        code: 200,
        message: 'About fetched successfully',
        data: {
          ...base,
          titleBanner: idx('titleBanner'),
          descriptionBanner: idx('descriptionBanner'),
          titleAbout: idx('titleAbout'),
          descriptionAbout: idx('descriptionAbout'),
          lang,
        },
      };
    }

    const translations: Record<string, any> = {};
    for (const lc of LANGS) {
      const idx = indexTranslationsByField(row.entity?.translations ?? [], lc);
      translations[lc] = {
        titleBanner: idx('titleBanner'),
        descriptionBanner: idx('descriptionBanner'),
        titleAbout: idx('titleAbout'),
        descriptionAbout: idx('descriptionAbout'),
      };
    }

    return {
      code: 200,
      message: 'About fetched successfully',
      data: { ...base, translations },
    };
  }

  async updateFirst(
    id: string,
    dto: UpdateAboutDto,
    files?: {
      imageBanner?: Express.Multer.File;
      imageAbout?: Express.Multer.File;
    },
  ) {
    try {
      if (!id?.trim()) {
        throw new BadRequestException({
          code: 400,
          message: 'About id is required',
          data: null,
        });
      }

      const allowedMimeTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
      ]);
      const MAX_SIZE = 5 * 1024 * 1024;

      // -------------------------------
      // 1) VALIDASI & UPLOAD DI LUAR TRANSAKSI
      // -------------------------------
      const doValidate = (f: Express.Multer.File, name: string) => {
        if (!allowedMimeTypes.has(f.mimetype)) {
          throw new BadRequestException({
            code: 400,
            message: `Invalid ${name} format. Only PNG, JPG, and JPEG are allowed.`,
          });
        }
        if (f.size > MAX_SIZE) {
          throw new BadRequestException({
            code: 400,
            message: `${name} too large. Max 5 MB.`,
          });
        }
      };

      if (files?.imageBanner) {
        const f = files.imageBanner;
        doValidate(f, 'imageBanner');
        const uploaded = await this.globalService.uploadFile({
          buffer: f.buffer,
          fileType: {
            mime: f.mimetype,
            ext: f.originalname.split('.').pop() || 'jpg',
          },
        });
        dto.imageBanner = uploaded?.Location || null;
      }

      if (files?.imageAbout) {
        const f = files.imageAbout;
        doValidate(f, 'imageAbout');
        const uploaded = await this.globalService.uploadFile({
          buffer: f.buffer,
          fileType: {
            mime: f.mimetype,
            ext: f.originalname.split('.').pop() || 'jpg',
          },
        });
        dto.imageAbout = uploaded?.Location || null;
      }
      const [langID, langEN] = await Promise.all([
        this.prisma.language.findUnique({ where: { code: 'id_ID' } }),
        this.prisma.language.findUnique({ where: { code: 'en_US' } }),
      ]);
      if (!langID || !langEN) {
        throw new BadRequestException({
          code: 400,
          message: 'Languages id_ID/en_US not found in Language table',
        });
      }
      const langValuesID = mapDtoToLangValues(dto, 'id_ID');
      const langValuesEN = mapDtoToLangValues(dto, 'en_US');
      const updated = await this.prisma.$transaction(
        async (tx) => {
          let about = await tx.about.findUnique({ where: { id } });
          if (!about || about.deletedAt !== null) {
            throw new NotFoundException({
              code: 404,
              message: `About with ID ${id} not found or already deleted`,
              data: null,
            });
          }

          // ensure entity
          if (!about.entityId) {
            const entity = await tx.entity.create({ data: { type: 'about' } });
            about = await tx.about.update({
              where: { id: about.id },
              data: { entityId: entity.id },
            });
          }

          // update images/author
          await tx.about.update({
            where: { id: about.id },
            data: {
              imageBanner:
                dto.imageBanner !== undefined ? dto.imageBanner : undefined,
              imageAbout:
                dto.imageAbout !== undefined ? dto.imageAbout : undefined,
              lastUpdateAuthorId: dto.lastUpdateAuthorId ?? undefined,
              updatedAt: new Date(),
            },
          });

          const upserts: Promise<any>[] = [];
          const upsertField = (
            languageId: number,
            field: TranslatableField,
            value?: string | null,
          ) => {
            if (value === undefined) return;
            if (value === null || value === '') {
              upserts.push(
                tx.translation.deleteMany({
                  where: { entityId: about.entityId!, languageId, field },
                }),
              );
            } else {
              upserts.push(
                tx.translation.upsert({
                  where: {
                    entityId_languageId_field: {
                      entityId: about.entityId!,
                      languageId,
                      field,
                    },
                  },
                  update: { translation: value },
                  create: {
                    entityId: about.entityId!,
                    languageId,
                    field,
                    translation: value,
                  },
                }),
              );
            }
          };

          for (const field of TRANSLATABLE_FIELDS) {
            upsertField(langID.id, field, langValuesID[field]);
            upsertField(langEN.id, field, langValuesEN[field]);
          }

          await Promise.all(upserts);
          const refreshed = await tx.about.findUnique({
            where: { id: about.id },
            include: {
              entity: {
                include: {
                  translations: {
                    where: {
                      language: { code: { in: ['id_ID', 'en_US'] } },
                      field: { in: TRANSLATABLE_FIELDS as unknown as string[] },
                    },
                    include: { language: true },
                  },
                },
              },
            },
          });

          const idxID = indexTranslationsByField(
            refreshed?.entity?.translations ?? [],
            'id_ID',
          );
          const idxEN = indexTranslationsByField(
            refreshed?.entity?.translations ?? [],
            'en_US',
          );

          return {
            id: refreshed?.id,
            entityId: refreshed?.entityId,
            images: {
              banner: refreshed?.imageBanner ?? null,
              about: refreshed?.imageAbout ?? null,
            },
            text: {
              id_ID: {
                titleBanner: idxID('titleBanner'),
                descriptionBanner: idxID('descriptionBanner'),
                titleAbout: idxID('titleAbout'),
                descriptionAbout: idxID('descriptionAbout'),
              },
              en_US: {
                titleBanner: idxEN('titleBanner'),
                descriptionBanner: idxEN('descriptionBanner'),
                titleAbout: idxEN('titleAbout'),
                descriptionAbout: idxEN('descriptionAbout'),
              },
            },
            updatedAt: refreshed?.updatedAt,
          };
        },
        // ✅ beri headroom timeout (opsional)
        { maxWait: 3_000, timeout: 15_000 },
      );

      return {
        code: 200,
        message: 'Successfully updated about data',
        data: updated,
      };
    } catch (error: any) {
      console.error('Error in updateFirst:', error);
      throw new InternalServerErrorException({
        code: error.code || 500,
        message: error.message || 'Failed to update about data',
        data: null,
      });
    }
  }

  async createFirst(
    dto: CreateAboutDto,
    files?: {
      imageBanner?: Express.Multer.File;
      imageAbout?: Express.Multer.File;
    },
  ) {
    try {
      const allowedMimeTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
      ]);
      const MAX_SIZE = 5 * 1024 * 1024;

      const created = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.about.findFirst({
          where: { deletedAt: null },
          include: {
            entity: {
              include: {
                translations: {
                  where: {
                    language: { code: { in: ['id_ID', 'en_US'] } },
                    field: {
                      in: TRANSLATABLE_FIELDS as unknown as string[],
                    },
                  },
                  include: { language: true },
                },
              },
            },
          },
        });

        if (existing) {
          const idxID = indexTranslationsByField(
            existing.entity?.translations ?? [],
            'id_ID',
          );
          const idxEN = indexTranslationsByField(
            existing.entity?.translations ?? [],
            'en_US',
          );

          return {
            id: existing.id,
            entityId: existing.entityId,
            images: {
              banner: existing.imageBanner ?? null,
              about: existing.imageAbout ?? null,
            },
            text: {
              id_ID: {
                titleBanner: idxID('titleBanner'),
                descriptionBanner: idxID('descriptionBanner'),
                titleAbout: idxID('titleAbout'),
                descriptionAbout: idxID('descriptionAbout'),
              },
              en_US: {
                titleBanner: idxEN('titleBanner'),
                descriptionBanner: idxEN('descriptionBanner'),
                titleAbout: idxEN('titleAbout'),
                descriptionAbout: idxEN('descriptionAbout'),
              },
            },
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
            isNew: false,
          };
        }

        const [langID, langEN] = await Promise.all([
          tx.language.findUnique({ where: { code: 'id_ID' } }),
          tx.language.findUnique({ where: { code: 'en_US' } }),
        ]);
        if (!langID || !langEN) {
          throw new BadRequestException({
            code: 400,
            message: 'Languages id_ID/en_US not found in Language table',
          });
        }

        if (files?.imageBanner) {
          const f = files.imageBanner;
          if (!allowedMimeTypes.has(f.mimetype)) {
            throw new BadRequestException({
              code: 400,
              message:
                'Invalid imageBanner format. Only PNG, JPG, and JPEG are allowed.',
            });
          }
          if (f.size > MAX_SIZE) {
            throw new BadRequestException({
              code: 400,
              message: 'imageBanner too large. Max 5 MB.',
            });
          }
          const uploaded = await this.globalService.uploadFile({
            buffer: f.buffer,
            fileType: {
              mime: f.mimetype,
              ext: f.originalname.split('.').pop() || 'jpg',
            },
          });
          dto.imageBanner = uploaded?.Location || null;
        }

        if (files?.imageAbout) {
          const f = files.imageAbout;
          if (!allowedMimeTypes.has(f.mimetype)) {
            throw new BadRequestException({
              code: 400,
              message:
                'Invalid imageAbout format. Only PNG, JPG, and JPEG are allowed.',
            });
          }
          if (f.size > MAX_SIZE) {
            throw new BadRequestException({
              code: 400,
              message: 'imageAbout too large. Max 5 MB.',
            });
          }
          const uploaded = await this.globalService.uploadFile({
            buffer: f.buffer,
            fileType: {
              mime: f.mimetype,
              ext: f.originalname.split('.').pop() || 'jpg',
            },
          });
          dto.imageAbout = uploaded?.Location || null;
        }

        const entity = await tx.entity.create({ data: { type: 'about' } });
        const about = await tx.about.create({
          data: {
            entityId: entity.id,
            imageBanner: dto.imageBanner ?? null,
            imageAbout: dto.imageAbout ?? null,
            lastUpdateAuthorId: dto.lastUpdateAuthorId ?? null,
          },
        });

        const langValuesID = mapDtoToLangValues(dto, 'id_ID');
        const langValuesEN = mapDtoToLangValues(dto, 'en_US');

        const creates: Promise<any>[] = [];
        const createField = (
          languageId: number,
          field: TranslatableField,
          value?: string | null,
        ) => {
          if (value === undefined || value === null || value === '') return;
          creates.push(
            tx.translation.create({
              data: {
                entityId: entity.id,
                languageId,
                field,
                translation: value,
              },
            }),
          );
        };

        for (const field of TRANSLATABLE_FIELDS) {
          createField(langID.id, field, langValuesID[field]);
          createField(langEN.id, field, langValuesEN[field]);
        }
        await Promise.all(creates);

        return {
          id: about.id,
          entityId: about.entityId,
          images: {
            banner: about.imageBanner ?? null,
            about: about.imageAbout ?? null,
          },
          text: {
            id_ID: langValuesID,
            en_US: langValuesEN,
          },
          createdAt: about.createdAt,
          updatedAt: about.updatedAt,
          isNew: true,
        };
      });

      return {
        code: 201,
        message: created.isNew
          ? 'Successfully created about data'
          : 'About already exists',
        data: created,
      };
    } catch (error: any) {
      console.error('Error in createFirst:', error);
      throw new InternalServerErrorException({
        code: error.code || 500,
        message: error.message || 'Failed to create about data',
        data: null,
      });
    }
  }
}
