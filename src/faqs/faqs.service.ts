import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFaqDto: CreateFaqDto) {
    const {
      authorId,
      category,
      status,
      titleIndonesia,
      descriptionIndonesia,
      titleEnglish,
      descriptionEnglish,
    } = createFaqDto;

    const required: Record<string, any> = {
      titleIndonesia,
      descriptionIndonesia,
      titleEnglish,
      descriptionEnglish,
    };
    for (const [k, v] of Object.entries(required)) {
      if (!v || String(v).trim() === '') {
        throw new BadRequestException(`Missing ${k}`);
      }
    }

    const wanted = ['id_ID', 'id-ID', 'id', 'en_US', 'en-US', 'en'];
    const langs = await this.prisma.language.findMany({
      where: { code: { in: wanted } },
      select: { id: true, code: true },
    });
    const map = new Map(langs.map((l) => [l.code, l.id]));
    const getLangId = (prefer: string[]) => {
      for (const c of prefer) if (map.has(c)) return map.get(c)!;
      return undefined;
    };
    const idID = getLangId(['id_ID', 'id-ID', 'id']);
    const enUS = getLangId(['en_US', 'en-US', 'en']);
    if (!idID || !enUS) {
      throw new BadRequestException(
        'Required languages (id_ID, en_US) not found',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 3a) Validasi authorId (optional)
        let authorIdToUse: string | null = null;
        if (authorId?.trim()) {
          const author = await tx.user.findUnique({
            where: { id: authorId.trim() },
          });
          if (!author) {
            throw new BadRequestException('Author not found');
          }
          authorIdToUse = authorId.trim();
        }

        // 3b) Entity
        const entity = await tx.entity.create({ data: { type: 'Faq' } });

        // 3c) Faq
        const faq = await tx.faq.create({
          data: {
            entityId: entity.id,
            authorId: authorIdToUse,
            category: category ?? null,
            status: (status as any) ?? 'draft',
          },
        });

        await tx.translation.createMany({
          data: [
            {
              entityId: entity.id,
              languageId: idID,
              field: 'title',
              translation: titleIndonesia.trim(),
            },
            {
              entityId: entity.id,
              languageId: idID,
              field: 'description',
              translation: descriptionIndonesia.trim(),
            },
            {
              entityId: entity.id,
              languageId: enUS,
              field: 'title',
              translation: titleEnglish.trim(),
            },
            {
              entityId: entity.id,
              languageId: enUS,
              field: 'description',
              translation: descriptionEnglish.trim(),
            },
          ],
          skipDuplicates: true,
        });

        const tr = await tx.translation.findMany({
          where: { entityId: entity.id, languageId: { in: [idID, enUS] } },
          select: { field: true, translation: true, languageId: true },
        });

        const codeById = new Map([
          ...langs.map((l) => [l.id, l.code] as [string | number, string]),
          [idID, 'id_ID'] as [string | number, string],
          [enUS, 'en_US'] as [string | number, string],
        ]);

        const grouped = tr.reduce<Record<string, Record<string, string>>>(
          (acc, t) => {
            const code =
              codeById.get(t.languageId) === 'id' ||
              codeById.get(t.languageId) === 'id-ID'
                ? 'id_ID'
                : codeById.get(t.languageId) === 'en' ||
                  codeById.get(t.languageId) === 'en-US'
                ? 'en_US'
                : (codeById.get(t.languageId) as string);
            acc[code] ??= {};
            acc[code][t.field] = t.translation;
            return acc;
          },
          {},
        );

        return {
          message: 'FAQ created successfully',
          data: {
            id: faq.id,
            authorId: faq.authorId,
            category: faq.category,
            status: faq.status,
            createdAt: faq.createdAt,
            updatedAt: faq.updatedAt,
            entityId: entity.id,
            translations: grouped,
          },
        };
      });
    } catch (e) {
      throw new BadRequestException(e?.message || 'Failed to create FAQ');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    category?: string,
    lang: string = 'id_ID',
  ) {
    try {
      const skip = (page - 1) * limit;

      // filter dasar
      const whereFaq: any = { deletedAt: null };
      if (category) whereFaq.category = category;

      // filter search via Entity Hub
      const translationFilter = {
        language: { code: lang },
        field: { in: ['title', 'description'] as const },
        translation: { contains: search ?? '', mode: 'insensitive' as const },
      };

      if (search && search.trim().length > 0) {
        whereFaq.entity = {
          translations: { some: translationFilter },
        };
      }

      const [faqs, total] = await Promise.all([
        this.prisma.faq.findMany({
          where: whereFaq,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: true,
            entity: {
              include: {
                translations: {
                  where: {
                    language: { code: lang },
                    field: { in: ['title', 'description'] },
                  },
                },
              },
            },
          },
        }),
        this.prisma.faq.count({ where: whereFaq }),
      ]);

      const data = faqs.map((f) => {
        const tMap = new Map(
          f.entity.translations.map((t) => [t.field, t.translation]),
        );
        return {
          id: f.id,
          authorId: f.authorId,
          category: f.category,
          status: f.status,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
          author: f.author ?? null,
          title: tMap.get('title') ?? null,
          description: tMap.get('description') ?? null,
          lang,
        };
      });

      return {
        message: 'All FAQs',
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to fetch FAQs');
    }
  }

  async findOne(id: string, lang: string = 'id_ID') {
    try {
      const whereTranslation =
        lang === 'multiple'
          ? { field: { in: ['title', 'description'] } }
          : {
              language: { code: lang },
              field: { in: ['title', 'description'] },
            };

      const faq = await this.prisma.faq.findFirst({
        where: { id, deletedAt: null },
        include: {
          author: true,
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

      if (!faq) {
        throw new BadRequestException('FAQ not found');
      }

      let result;
      if (lang === 'multiple') {
        result = faq.entity.translations.reduce<
          Record<string, Record<string, string>>
        >((acc, t) => {
          const code = t.language?.code || 'unknown';
          acc[code] ??= {};
          acc[code][t.field] = t.translation;
          return acc;
        }, {});
      } else {
        const tMap = new Map(
          faq.entity.translations.map((t) => [t.field, t.translation]),
        );
        result = {
          title: tMap.get('title') ?? null,
          description: tMap.get('description') ?? null,
        };
      }

      return {
        message: 'FAQ detail',
        data: {
          id: faq.id,
          authorId: faq.authorId,
          category: faq.category,
          status: faq.status,
          createdAt: faq.createdAt,
          updatedAt: faq.updatedAt,
          author: faq.author ?? null,
          translations: result,
          lang,
        },
      };
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to fetch FAQ');
    }
  }

  async update(id: string, updateFaqDto: UpdateFaqDto) {
    try {
      const faqExist = await this.prisma.faq.findUnique({
        where: { id },
        select: { id: true, entityId: true, deletedAt: true, status: true },
      });
      if (!faqExist || faqExist.deletedAt) {
        throw new NotFoundException('FAQ not found');
      }

      const {
        authorId,
        category,
        status,
        titleIndonesia,
        descriptionIndonesia,
        titleEnglish,
        descriptionEnglish,
      } = updateFaqDto;

      const required = {
        titleIndonesia,
        descriptionIndonesia,
        titleEnglish,
        descriptionEnglish,
      };
      for (const [k, v] of Object.entries(required)) {
        if (!v) throw new BadRequestException(`Missing ${k}`);
      }

      const langs = await this.prisma.language.findMany({
        where: { code: { in: ['id_ID', 'en_US'] } },
        select: { id: true, code: true },
      });
      const langByCode = new Map(langs.map((l) => [l.code, l.id]));
      if (!langByCode.has('id_ID') || !langByCode.has('en_US')) {
        throw new BadRequestException(
          'Required languages (id_ID, en_US) not found',
        );
      }
      const idID = langByCode.get('id_ID')!;
      const enUS = langByCode.get('en_US')!;
      const eid = faqExist.entityId;

      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.faq.update({
          where: { id },
          data: {
            authorId: authorId ?? null,
            category: category ?? null,
            status: status ?? faqExist.status ?? 'draft',
          },
        });

        await tx.translation.upsert({
          where: {
            entityId_languageId_field: {
              entityId: eid,
              languageId: idID,
              field: 'title',
            },
          },
          update: { translation: titleIndonesia!.trim() },
          create: {
            entityId: eid,
            languageId: idID,
            field: 'title',
            translation: titleIndonesia!.trim(),
          },
        });
        await tx.translation.upsert({
          where: {
            entityId_languageId_field: {
              entityId: eid,
              languageId: idID,
              field: 'description',
            },
          },
          update: { translation: descriptionIndonesia!.trim() },
          create: {
            entityId: eid,
            languageId: idID,
            field: 'description',
            translation: descriptionIndonesia!.trim(),
          },
        });

        await tx.translation.upsert({
          where: {
            entityId_languageId_field: {
              entityId: eid,
              languageId: enUS,
              field: 'title',
            },
          },
          update: { translation: titleEnglish!.trim() },
          create: {
            entityId: eid,
            languageId: enUS,
            field: 'title',
            translation: titleEnglish!.trim(),
          },
        });
        await tx.translation.upsert({
          where: {
            entityId_languageId_field: {
              entityId: eid,
              languageId: enUS,
              field: 'description',
            },
          },
          update: { translation: descriptionEnglish!.trim() },
          create: {
            entityId: eid,
            languageId: enUS,
            field: 'description',
            translation: descriptionEnglish!.trim(),
          },
        });

        return tx.faq.findUnique({
          where: { id },
          include: {
            author: true,
            entity: {
              include: {
                translations: {
                  where: {
                    languageId: { in: [idID, enUS] },
                    field: { in: ['title', 'description'] },
                  },
                },
              },
            },
          },
        });
      });

      const codeById = new Map(langs.map((l) => [l.id, l.code]));
      const grouped = updated!.entity.translations.reduce<
        Record<string, Record<string, string>>
      >((acc, t) => {
        const code = codeById.get(t.languageId)!;
        acc[code] ??= {};
        acc[code][t.field] = t.translation;
        return acc;
      }, {});

      return {
        message: 'FAQ updated successfully',
        data: {
          id: updated!.id,
          authorId: updated!.authorId,
          category: updated!.category,
          status: updated!.status,
          createdAt: updated!.createdAt,
          updatedAt: updated!.updatedAt,
          author: updated!.author ?? null,
          entityId: updated!.entityId,
          translations: grouped,
        },
      };
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to update FAQ');
    }
  }

  async remove(id: string, hard = false) {
    try {
      const existing = await this.prisma.faq.findUnique({
        where: { id },
        select: { id: true, entityId: true, deletedAt: true },
      });
      if (!existing || existing.deletedAt) {
        throw new NotFoundException('FAQ not found');
      }

      if (!hard) {
        const deleted = await this.prisma.faq.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        return { message: 'FAQ soft deleted', data: deleted };
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const removedFaq = await tx.faq.delete({ where: { id } });
        await tx.entity.delete({ where: { id: existing.entityId } });
        return removedFaq;
      });

      return { message: 'FAQ hard deleted', data: result };
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to delete FAQ');
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
