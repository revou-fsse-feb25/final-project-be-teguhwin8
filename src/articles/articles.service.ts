import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleStatus, Prisma } from '@prisma/client';
import {
  toSlug,
  toBool,
  normalizeTags,
  pickTranslation,
  isBlankish,
} from './utils/articles.utils';

type FindAllFilter = {
  category?: string;
  search?: string;
  authorId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
  lang?: 'id_ID' | 'en_US';
  status?: ArticleStatus;
};

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async create(dto: CreateArticleDto) {
    try {
      if (!dto.titleIndonesian?.trim()) {
        throw new BadRequestException({
          code: 400,
          message: 'Judul (Indonesia) wajib diisi',
        });
      }
      if (!dto.contentIndonesian?.trim()) {
        throw new BadRequestException({
          code: 400,
          message: 'Konten (Indonesia) wajib diisi',
        });
      }

      const langs = await this.prisma.language.findMany({
        where: { code: { in: ['id_ID', 'en_US'] } },
        select: { id: true, code: true },
      });
      const byCode = new Map(langs.map((l) => [l.code, l.id]));
      if (!byCode.has('id_ID') || !byCode.has('en_US')) {
        throw new BadRequestException({
          code: 400,
          message: 'Required languages (id_ID, en_US) not found',
        });
      }
      const ID = byCode.get('id_ID')!;
      const EN = byCode.get('en_US')!;

      const titleID = dto.titleIndonesian!.trim();
      const contentID = dto.contentIndonesian!.trim();
      const categoryID = dto.categoryIndonesian?.trim();

      const titleEN = dto.titleEnglish?.trim() || titleID;
      const contentEN = dto.contentEnglish?.trim() || contentID;
      const categoryEN = dto.categoryEnglish?.trim() || categoryID;

      let thumbnailUrl: string | null = null;
      if ((dto as any).thumbnail?.buffer) {
        const thumb: Express.Multer.File = (dto as any).thumbnail;
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowed.includes(thumb.mimetype)) {
          throw new BadRequestException({
            code: 400,
            message: 'Invalid thumbnail type. Only JPG, PNG, WEBP are allowed.',
          });
        }
        const s3 = await this.globalService.uploadFile({
          buffer: thumb.buffer,
          fileType: {
            mime: thumb.mimetype,
            ext: thumb.originalname.split('.').pop() || 'jpg',
          },
        });
        thumbnailUrl = (s3 as any)?.Location || null;
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const entity = await tx.entity.create({ data: { type: 'article' } });

        const highlightedBool = toBool(dto.highlighted);
        const publishedAtDate = dto.publishedAt
          ? new Date(dto.publishedAt)
          : null;
        const rawTags = (dto as any).tags ?? (dto as any)['tags[]'];
        const tagNames = [...new Set(normalizeTags(rawTags))];

        if (dto.authorId && dto.authorId.trim() !== '') {
          const author = await tx.user.findUnique({
            where: { id: dto.authorId },
            select: { id: true },
          });
          if (!author) {
            throw new BadRequestException({
              code: 400,
              message: 'Author tidak ditemukan. Periksa kembali authorId.',
              error: 'Invalid authorId',
            });
          }
        }

        const article = await tx.articles.create({
          data: {
            entityId: entity.id,
            authorId: dto.authorId ?? null,
            highlighted: highlightedBool ?? false,
            status: dto.status ?? ArticleStatus.draft,
            publishedAt: publishedAtDate,
            thumbnailUrl,
          },
          include: { author: true },
        });

        const translations: Array<{
          entityId: string;
          languageId: number;
          field: string;
          translation: string;
        }> = [
          {
            entityId: entity.id,
            languageId: ID,
            field: 'title',
            translation: titleID,
          },
          {
            entityId: entity.id,
            languageId: ID,
            field: 'content',
            translation: contentID,
          },
          {
            entityId: entity.id,
            languageId: EN,
            field: 'title',
            translation: titleEN,
          },
          {
            entityId: entity.id,
            languageId: EN,
            field: 'content',
            translation: contentEN,
          },
        ];
        if (categoryID) {
          translations.push({
            entityId: entity.id,
            languageId: ID,
            field: 'category',
            translation: categoryID,
          });
        }
        if (categoryEN) {
          translations.push({
            entityId: entity.id,
            languageId: EN,
            field: 'category',
            translation: categoryEN,
          });
        }

        if (translations.length) {
          await tx.translation.createMany({
            data: translations,
            skipDuplicates: true,
          });
        }

        if (tagNames.length) {
          for (const name of tagNames) {
            const slug = toSlug(name);
            const tag = await tx.tag.upsert({
              where: { slug },
              update: {},
              create: {
                slug,
                entity: { create: { type: 'tag' } },
              },
              include: { entity: true },
            });
            await tx.translation.createMany({
              data: [
                {
                  entityId: tag.entityId,
                  languageId: ID,
                  field: 'tag_name',
                  translation: name,
                },
                {
                  entityId: tag.entityId,
                  languageId: EN,
                  field: 'tag_name',
                  translation: name,
                },
              ],
              skipDuplicates: true,
            });
            await tx.articleTag.upsert({
              where: {
                articleId_tagId: { articleId: article.id, tagId: tag.id },
              },
              update: {},
              create: { articleId: article.id, tagId: tag.id },
            });
          }
        }

        const full = await tx.articles.findUnique({
          where: { id: article.id },
          include: {
            author: true,
            entity: {
              include: {
                translations: { where: { languageId: { in: [ID, EN] } } },
              },
            },
            articleTags: {
              include: {
                tag: {
                  include: {
                    entity: {
                      include: {
                        translations: {
                          where: { languageId: { in: [ID, EN] } },
                        },
                      },
                    },
                  },
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

      const tagsDto = result.articleTags.map((at) => {
        const t = at.tag.entity.translations;
        const nameEN = t.find(
          (x) => x.field === 'tag_name' && x.languageId === EN,
        )?.translation;
        const nameID = t.find(
          (x) => x.field === 'tag_name' && x.languageId === ID,
        )?.translation;
        return {
          slug: at.tag.slug,
          name: {
            en_US: nameEN ?? nameID ?? '',
            id_ID: nameID ?? nameEN ?? '',
          },
        };
      });

      return this.globalService.response('Article created successfully', {
        id: result.id,
        entityId: result.entityId,
        authorId: result.authorId,
        highlighted: result.highlighted,
        status: result.status,
        publishedAt: result.publishedAt,
        thumbnailUrl: result.thumbnailUrl,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        translations: grouped,
        tags: tagsDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException({
          code: 400,
          message: 'Data duplikat terdeteksi (unik constraint)',
          error: (error.meta as any)?.target,
        });
      }
      if (error instanceof BadRequestException) throw error;

      console.error('[ArticlesService][create] Error:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to create article',
      });
    }
  }

  async findAll(filter: FindAllFilter) {
    try {
      const _sortBy = (filter?.sortBy as any) ?? 'createdAt';
      const _sortOrder = (filter?.sortOrder as any) ?? 'desc';
      const baseWhere: any = {
        deletedAt: null,
        ...(filter?.authorId ? { authorId: filter.authorId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      };
      const and: any[] = [];
      if (filter?.category) {
        and.push({
          entity: {
            translations: {
              some: {
                field: 'category',
                translation: { contains: filter.category, mode: 'insensitive' },
              },
            },
          },
        });
      }
      if (filter?.search) {
        and.push({
          entity: {
            translations: {
              some: {
                field: { in: ['title', 'content', 'category'] },
                translation: { contains: filter.search, mode: 'insensitive' },
              },
            },
          },
        });
      }
      const where = and.length ? { ...baseWhere, AND: and } : baseWhere;
      const pageNum = Math.max(1, filter?.page ?? 1);
      const take = Math.min(100, Math.max(1, filter?.limit ?? 10));
      const skip = (pageNum - 1) * take;
      const primaryCode = filter?.lang ?? 'id_ID';
      const fallbackCode = primaryCode === 'id_ID' ? 'en_US' : 'id_ID';
      const langs = await this.prisma.language.findMany({
        where: { code: { in: [primaryCode, fallbackCode] } },
        select: { id: true, code: true },
      });
      const codeToId = new Map(langs.map((l) => [l.code, l.id]));
      const primaryId = codeToId.get(primaryCode)!;
      const fallbackId = codeToId.get(fallbackCode)!;
      const [rows, total] = await Promise.all([
        this.prisma.articles.findMany({
          where,
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
          include: {
            author: true,
            entity: {
              include: {
                translations: {
                  where: { languageId: { in: [primaryId, fallbackId] } },
                },
              },
            },
            articleTags: {
              include: {
                tag: {
                  include: {
                    entity: {
                      include: {
                        translations: {
                          where: {
                            languageId: { in: [primaryId, fallbackId] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.articles.count({ where }),
      ]);
      const datas = rows.map((a) => {
        const tr = a.entity.translations;
        const title = pickTranslation(tr, 'title', primaryId, fallbackId);
        const content = pickTranslation(tr, 'content', primaryId, fallbackId);
        const category = pickTranslation(tr, 'category', primaryId, fallbackId);
        const tags = (a.articleTags ?? []).map((at) => ({
          slug: at.tag.slug,
          name: pickTranslation(
            at.tag.entity.translations,
            'tag_name',
            primaryId,
            fallbackId,
          ),
        }));
        return {
          id: a.id,
          entityId: a.entityId,
          author: a.author,
          highlighted: a.highlighted,
          status: a.status,
          publishedAt: a.publishedAt,
          thumbnailUrl: a.thumbnailUrl,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          deletedAt: a.deletedAt,
          title,
          content,
          category,
          tags,
          lang: primaryCode,
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
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          search: isBlankish(filter?.search) ? '' : filter!.search!,
          category: isBlankish(filter?.category) ? '' : filter!.category!,
          authorId: isBlankish(filter?.authorId) ? '' : filter!.authorId!,
          status: filter?.status ?? '',
          lang: primaryCode,
          deleted: false,
        },
      };
    } catch (error) {
      console.error('[ArticlesService][findAll] Error:', error);
      throw new InternalServerErrorException('Failed to fetch articles');
    }
  }

  async findOne(id: string, lang: 'id_ID' | 'en_US' | 'multiple' = 'id_ID') {
    try {
      const neededCodes =
        lang === 'multiple'
          ? ['id_ID', 'en_US']
          : [lang, lang === 'id_ID' ? 'en_US' : 'id_ID'];

      const langs = await this.prisma.language.findMany({
        where: { code: { in: neededCodes } },
        select: { id: true, code: true },
      });
      const codeToId = new Map(langs.map((l) => [l.code, l.id]));
      const idID = codeToId.get('id_ID');
      const enUS = codeToId.get('en_US');
      if (!idID || !enUS) {
        return {
          message: 'Required languages (id_ID, en_US) not found',
          data: null,
        };
      }
      const article = await this.prisma.articles.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, name: true, email: true } },
          entity: {
            include: {
              translations: { where: { languageId: { in: [idID, enUS] } } },
            },
          },
          articleTags: {
            include: {
              tag: {
                include: {
                  entity: {
                    include: {
                      translations: {
                        where: { languageId: { in: [idID, enUS] } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!article || article.deletedAt) {
        return { message: 'Article not found', data: null };
      }

      if (lang === 'multiple') {
        const grouped = article.entity.translations.reduce<
          Record<string, Record<string, string>>
        >((acc, t) => {
          const code = t.languageId === idID ? 'id_ID' : 'en_US';
          acc[code] ??= {};
          acc[code][t.field] = t.translation;
          return acc;
        }, {});

        const tags = (article.articleTags ?? []).map((at) => {
          const tr = at.tag.entity.translations;
          const nameID = tr.find(
            (x) => x.field === 'tag_name' && x.languageId === idID,
          )?.translation;
          const nameEN = tr.find(
            (x) => x.field === 'tag_name' && x.languageId === enUS,
          )?.translation;
          return {
            slug: at.tag.slug,
            name: {
              id_ID: nameID ?? nameEN ?? '',
              en_US: nameEN ?? nameID ?? '',
            },
          };
        });

        return {
          message: 'Article retrieved successfully',
          data: {
            id: article.id,
            entityId: article.entityId,
            author: article.author,
            highlighted: article.highlighted,
            status: article.status,
            publishedAt: article.publishedAt,
            thumbnailUrl: article.thumbnailUrl,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            translations: grouped,
            tags,
          },
        };
      }

      const primaryId = lang === 'id_ID' ? idID : enUS;
      const fallbackId = lang === 'id_ID' ? enUS : idID;

      const tr = article.entity.translations;
      const title = pickTranslation(tr, 'title', primaryId, fallbackId);
      const content = pickTranslation(tr, 'content', primaryId, fallbackId);
      const category = pickTranslation(tr, 'category', primaryId, fallbackId);

      const tags = (article.articleTags ?? []).map((at) => ({
        slug: at.tag.slug,
        name: pickTranslation(
          at.tag.entity.translations,
          'tag_name',
          primaryId,
          fallbackId,
        ),
      }));
      return {
        message: 'Article retrieved successfully',
        data: {
          id: article.id,
          entityId: article.entityId,
          author: article.author,
          highlighted: article.highlighted,
          status: article.status,
          publishedAt: article.publishedAt,
          thumbnailUrl: article.thumbnailUrl,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          title,
          content,
          category,
          tags,
          lang,
        },
      };
    } catch (error) {
      console.error('[ArticlesService][findOne] Error:', error);
      throw new Error('Failed to fetch article');
    }
  }

  async update(id: string, dto: any) {
    try {
      const current = await this.prisma.articles.findUnique({
        where: { id },
        select: { id: true, entityId: true, thumbnailUrl: true },
      });
      if (!current) {
        throw new NotFoundException({
          code: 404,
          message: 'Article not found',
        });
      }

      const langs = await this.prisma.language.findMany({
        where: { code: { in: ['id_ID', 'en_US'] } },
        select: { id: true, code: true },
      });
      const byCode = new Map(langs.map((l) => [l.code, l.id]));
      const ID = byCode.get('id_ID')!;
      const EN = byCode.get('en_US')!;

      let thumbnailUrl: string | null | undefined = undefined;
      if ((dto as any).thumbnail?.buffer) {
        const thumb: Express.Multer.File = (dto as any).thumbnail;
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowed.includes(thumb.mimetype)) {
          throw new BadRequestException({
            code: 400,
            message: 'Invalid thumbnail type. Only JPG, PNG, WEBP are allowed.',
          });
        }
        if (current.thumbnailUrl) {
          try {
            const url = new URL(current.thumbnailUrl);
            const key = url.pathname.startsWith('/')
              ? url.pathname.slice(1)
              : url.pathname;
            if (key) await this.globalService.deleteFileS3(key);
          } catch {}
        }
        const s3 = await this.globalService.uploadFile({
          buffer: thumb.buffer,
          fileType: {
            mime: thumb.mimetype,
            ext: thumb.originalname.split('.').pop() || 'jpg',
          },
        });
        thumbnailUrl = (s3 as any)?.Location || null;
      }

      const highlightedBool =
        dto.highlighted === undefined
          ? undefined
          : toBool(dto.highlighted) ?? false;
      const publishedAtDate =
        dto.publishedAt === undefined
          ? undefined
          : dto.publishedAt
          ? new Date(dto.publishedAt)
          : null;

      const tagsFieldProvided = 'tags' in dto || 'tags[]' in dto;
      const rawTags = (dto as any).tags ?? (dto as any)['tags[]'];
      const tagNames = tagsFieldProvided
        ? [...new Set(normalizeTags(rawTags))]
        : [];

      if (
        dto.authorId !== undefined &&
        dto.authorId !== null &&
        String(dto.authorId).trim() !== ''
      ) {
        const exists = await this.prisma.user.findUnique({
          where: { id: dto.authorId },
          select: { id: true },
        });
        if (!exists) {
          throw new BadRequestException({
            code: 400,
            message: 'Author tidak ditemukan. Periksa kembali authorId.',
            error: 'Invalid authorId',
          });
        }
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const article = await tx.articles.update({
          where: { id },
          data: {
            ...(dto.authorId !== undefined
              ? { authorId: dto.authorId || null }
              : {}),
            ...(highlightedBool !== undefined
              ? { highlighted: highlightedBool }
              : {}),
            ...(dto.status !== undefined
              ? { status: dto.status as ArticleStatus }
              : {}),
            ...(publishedAtDate !== undefined
              ? { publishedAt: publishedAtDate }
              : {}),
            ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
          },
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        });

        const transOps: any[] = [];
        const pushUpsert = (
          languageId: number,
          field: string,
          val?: string,
        ) => {
          if (val === undefined) return;
          const v = String(val ?? '').trim();
          if (v === '') return;
          transOps.push({
            where: {
              entityId_languageId_field: {
                entityId: current.entityId,
                languageId,
                field,
              },
            },
            update: { translation: v },
            create: {
              entityId: current.entityId,
              languageId,
              field,
              translation: v,
            },
          } as any);
        };

        pushUpsert(ID, 'title', dto.titleIndonesian);
        pushUpsert(ID, 'content', dto.contentIndonesian);
        pushUpsert(ID, 'category', dto.categoryIndonesian);
        pushUpsert(EN, 'title', dto.titleEnglish);
        pushUpsert(EN, 'content', dto.contentEnglish);
        pushUpsert(EN, 'category', dto.categoryEnglish);

        for (const op of transOps) {
          await tx.translation.upsert(op as any);
        }

        if (tagsFieldProvided) {
          await tx.articleTag.deleteMany({ where: { articleId: article.id } });

          for (const name of tagNames) {
            const slug = toSlug(name);
            const tag = await tx.tag.upsert({
              where: { slug },
              update: {},
              create: {
                slug,
                entity: { create: { type: 'tag' } },
              },
              include: { entity: true },
            });
            await tx.translation.createMany({
              data: [
                {
                  entityId: tag.entityId,
                  languageId: ID,
                  field: 'tag_name',
                  translation: name,
                },
                {
                  entityId: tag.entityId,
                  languageId: EN,
                  field: 'tag_name',
                  translation: name,
                },
              ],
              skipDuplicates: true,
            });
            await tx.articleTag.create({
              data: { articleId: article.id, tagId: tag.id },
            });
          }
        }

        const full = await tx.articles.findUnique({
          where: { id: article.id },
          include: {
            author: { select: { id: true, name: true, email: true } },
            entity: {
              include: {
                translations: { where: { languageId: { in: [ID, EN] } } },
              },
            },
            articleTags: {
              include: {
                tag: {
                  include: {
                    entity: {
                      include: {
                        translations: {
                          where: { languageId: { in: [ID, EN] } },
                        },
                      },
                    },
                  },
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

      const tagsDto = result.articleTags.map((at) => {
        const t = at.tag.entity.translations;
        const nameEN = t.find(
          (x) =>
            x.field === 'tag_name' && codeById.get(x.languageId) === 'en_US',
        )?.translation;
        const nameID = t.find(
          (x) =>
            x.field === 'tag_name' && codeById.get(x.languageId) === 'id_ID',
        )?.translation;
        return {
          slug: at.tag.slug,
          name: {
            en_US: nameEN ?? nameID ?? '',
            id_ID: nameID ?? nameEN ?? '',
          },
        };
      });

      return this.globalService.response('Article updated successfully', {
        id: result.id,
        entityId: result.entityId,
        author: result.author,
        highlighted: result.highlighted,
        status: result.status,
        publishedAt: result.publishedAt,
        thumbnailUrl: result.thumbnailUrl,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        translations: grouped,
        tags: tagsDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (
          error.code === 'P2003' &&
          (error.meta as any)?.field_name?.includes('Articles_authorId_fkey')
        ) {
          throw new BadRequestException({
            code: 400,
            message: 'authorId tidak valid (User tidak ditemukan).',
            error: 'Invalid authorId',
          });
        }
        if (error.code === 'P2002') {
          throw new BadRequestException({
            code: 400,
            message: 'Data duplikat terdeteksi (unik constraint)',
            error: (error.meta as any)?.target,
          });
        }
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;

      console.error('[ArticlesService][update] Error:', error);
      throw new InternalServerErrorException({
        code: 500,
        message: 'Failed to update article',
      });
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.articles.findUnique({
        where: { id },
        select: { id: true, deletedAt: true },
      });
      if (!existing || existing.deletedAt) {
        throw new NotFoundException({
          code: 404,
          message: 'Article not found',
        });
      }

      const article = await this.prisma.articles.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        message: 'Article deleted successfully',
        data: article,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException({
          code: 404,
          message: 'Article not found',
        });
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('[ArticlesService][remove] Error:', error);
      throw new InternalServerErrorException('Failed to delete article');
    }
  }

  // Recovery Mode API
  async findAllRecovery(filter: FindAllFilter) {
    try {
      const _sortBy = (filter?.sortBy as any) ?? 'deletedAt';
      const _sortOrder = (filter?.sortOrder as any) ?? 'desc';
      const baseWhere: any = {
        deletedAt: { not: null },
        ...(filter?.authorId ? { authorId: filter.authorId } : {}),
        ...(filter?.status ? { status: filter.status } : {}), // <== filter status
      };

      const and: any[] = [];
      if (filter?.category) {
        and.push({
          entity: {
            translations: {
              some: {
                field: 'category',
                translation: { contains: filter.category, mode: 'insensitive' },
              },
            },
          },
        });
      }
      if (filter?.search) {
        and.push({
          entity: {
            translations: {
              some: {
                field: { in: ['title', 'content', 'category'] },
                translation: { contains: filter.search, mode: 'insensitive' },
              },
            },
          },
        });
      }
      const where = and.length ? { ...baseWhere, AND: and } : baseWhere;

      const pageNum = Math.max(1, filter?.page ?? 1);
      const take = Math.min(100, Math.max(1, filter?.limit ?? 10));
      const skip = (pageNum - 1) * take;

      const primaryCode = filter?.lang ?? 'id_ID';
      const fallbackCode = primaryCode === 'id_ID' ? 'en_US' : 'id_ID';
      const langs = await this.prisma.language.findMany({
        where: { code: { in: [primaryCode, fallbackCode] } },
        select: { id: true, code: true },
      });
      const codeToId = new Map(langs.map((l) => [l.code, l.id]));
      const primaryId = codeToId.get(primaryCode)!;
      const fallbackId = codeToId.get(fallbackCode)!;

      const [rows, total] = await Promise.all([
        this.prisma.articles.findMany({
          where,
          orderBy: { [_sortBy]: _sortOrder },
          skip,
          take,
          include: {
            author: true,
            entity: {
              include: {
                translations: {
                  where: { languageId: { in: [primaryId, fallbackId] } },
                },
              },
            },
            articleTags: {
              include: {
                tag: {
                  include: {
                    entity: {
                      include: {
                        translations: {
                          where: {
                            languageId: { in: [primaryId, fallbackId] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.articles.count({ where }),
      ]);

      const datas = rows.map((a) => {
        const tr = a.entity.translations;
        const title = pickTranslation(tr, 'title', primaryId, fallbackId);
        const content = pickTranslation(tr, 'content', primaryId, fallbackId);
        const category = pickTranslation(tr, 'category', primaryId, fallbackId);
        const tags = (a.articleTags ?? []).map((at) => ({
          slug: at.tag.slug,
          name: pickTranslation(
            at.tag.entity.translations,
            'tag_name',
            primaryId,
            fallbackId,
          ),
        }));
        return {
          id: a.id,
          entityId: a.entityId,
          author: a.author,
          highlighted: a.highlighted,
          status: a.status,
          publishedAt: a.publishedAt,
          thumbnailUrl: a.thumbnailUrl,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          deletedAt: a.deletedAt,
          title,
          content,
          category,
          tags,
          lang: primaryCode,
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
        sort: { sortBy: _sortBy, sortOrder: _sortOrder },
        filters: {
          search: isBlankish(filter?.search) ? '' : filter!.search!,
          category: isBlankish(filter?.category) ? '' : filter!.category!,
          authorId: isBlankish(filter?.authorId) ? '' : filter!.authorId!,
          status: filter?.status ?? '',
          lang: primaryCode,
          deleted: true,
        },
      };
    } catch (error) {
      console.error('[ArticlesService][findAllRecovery] Error:', error);
      throw new InternalServerErrorException(
        'Failed to fetch deleted articles',
      );
    }
  }

  async restore(id: string) {
    try {
      const article = await this.prisma.articles.update({
        where: { id },
        data: { deletedAt: null },
        include: { author: true },
      });
      return {
        message: 'Article restored successfully',
        data: article,
      };
    } catch (error) {
      console.error('[ArticlesService][restore] Error:', error);
      throw new Error('Failed to restore article');
    }
  }

  async destroy(id: string) {
    try {
      const old = await this.prisma.articles.findUnique({
        where: { id },
        select: {
          id: true,
          entityId: true,
          thumbnailUrl: true,
        },
      });
      if (!old) {
        throw new NotFoundException({
          code: 404,
          message: 'Article not found',
        });
      }

      let oldThumbnailKey: string | undefined;
      if (old.thumbnailUrl) {
        try {
          const url = new URL(old.thumbnailUrl);
          oldThumbnailKey = url.pathname.startsWith('/')
            ? url.pathname.slice(1)
            : url.pathname;
        } catch {
          oldThumbnailKey = undefined;
        }
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.articles.delete({ where: { id: old.id } });
        await tx.entity.delete({ where: { id: old.entityId } });
      });

      if (oldThumbnailKey) {
        await this.globalService.deleteFileS3(oldThumbnailKey);
      }

      return {
        message: 'Article permanently deleted',
        data: { id },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException({
          code: 404,
          message: 'Article not found',
        });
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('[ArticlesService][hardDelete] Error:', error);
      throw new InternalServerErrorException('Failed to hard delete article');
    }
  }
}
