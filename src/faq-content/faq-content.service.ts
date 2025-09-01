import { Injectable, BadRequestException } from '@nestjs/common';
import { UpdateFaqContentDto } from './dto/update-faq-content.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FaqContentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly globalService: GlobalService,
  ) {}

  async findOne(params?: {
    wantMultiple?: boolean;
    langCode?: 'id_ID' | 'en_US';
  }) {
    const wantMultiple = params?.wantMultiple ?? false;
    const targetLang = params?.langCode ?? (wantMultiple ? undefined : 'id_ID');
    const langWhere =
      wantMultiple || !targetLang ? {} : { language: { code: targetLang } };
    const data = await this.prisma.faqContent.findFirst({
      where: { deletedAt: null },
      include: {
        entity: {
          include: {
            translations: {
              include: { language: true },
              where: {
                ...langWhere,
                field: {
                  in: ['title', 'disclaimer', 'disclamer', 'description'],
                },
              },
            },
          },
        },
      },
    });

    if (!data) {
      return { message: 'FAQ content not found', data: null };
    }

    const T = data.entity?.translations ?? [];
    const getTranslation = (
      langCode: 'id_ID' | 'en_US',
      fieldName: 'title' | 'disclaimer',
    ) => {
      const fieldAliases: Record<string, string[]> = {
        title: ['title'],
        disclaimer: ['disclaimer', 'disclamer', 'description'],
      };
      const aliases = fieldAliases[fieldName];

      const row = T.find(
        (t) =>
          t.language?.code === langCode && aliases.includes(String(t.field)),
      );
      return row?.translation ?? '';
    };

    if (wantMultiple) {
      const translations = {
        id_ID: {
          title: getTranslation('id_ID', 'title'),
          disclamer: getTranslation('id_ID', 'disclaimer'),
        },
        en_US: {
          title: getTranslation('en_US', 'title'),
          disclamer: getTranslation('en_US', 'disclaimer'),
        },
      };

      return {
        message: 'FAQ content found',
        data: {
          id: data.id,
          entityId: data.entityId,
          link: data.link,
          image: data.image,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          translations,
        },
      };
    }

    const lang = targetLang as 'id_ID' | 'en_US';
    const title = getTranslation(lang, 'title');
    const disclamer = getTranslation(lang, 'disclaimer');

    return {
      message: 'FAQ content found',
      data: {
        id: data.id,
        entityId: data.entityId,
        link: data.link,
        image: data.image,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title,
        disclamer,
      },
    };
  }

  upsertTranslation = async (
    tx: Prisma.TransactionClient,
    entityId: string,
    langCode: 'id_ID' | 'en_US',
    field: 'title' | 'disclaimer',
    value?: string,
  ) => {
    if (value === undefined) return;

    const lang = await tx.language.findUnique({
      where: { code: langCode },
      select: { id: true },
    });
    if (!lang) throw new BadRequestException(`Language ${langCode} not found`);

    await tx.translation.upsert({
      where: {
        entityId_languageId_field: {
          entityId,
          languageId: lang.id,
          field,
        },
      },
      update: { translation: value ?? '' },
      create: {
        entityId,
        languageId: lang.id,
        field,
        translation: value ?? '',
      },
    });
  };

  async createORupdate(
    dto: UpdateFaqContentDto & { image?: Express.Multer.File },
  ) {
    try {
      const existing = await this.prisma.faqContent.findFirst({
        include: { entity: true },
      });
      let imageUrl = existing?.image || null;
      if (dto.image) {
        const file = dto.image;
        const mime = file.mimetype || 'application/octet-stream';
        const ext = file.originalname?.includes('.')
          ? file.originalname.split('.').pop()
          : '';
        if (imageUrl) {
          const fileKey = imageUrl.split('/').pop();
          if (fileKey) await this.globalService.deleteFileS3(fileKey);
        }
        const uploadResult = await this.globalService.uploadFile({
          buffer: file.buffer,
          fileType: { ext, mime },
        });
        imageUrl = uploadResult?.Location || null;
      }

      const result = await this.prisma.$transaction(async (tx) => {
        let entityId = existing?.entityId;
        if (!entityId) {
          const entity = await tx.entity.create({
            data: { type: 'FAQ' },
            select: { id: true },
          });
          entityId = entity.id;
        }
        const faq = existing
          ? await tx.faqContent.update({
              where: { id: existing.id },
              data: {
                entityId,
                link: dto.link ?? existing.link ?? null,
                image: imageUrl,
                updatedAt: new Date(),
              },
            })
          : await tx.faqContent.create({
              data: {
                entityId,
                link: dto.link ?? null,
                image: imageUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
        await this.upsertTranslation(
          tx,
          entityId,
          'id_ID',
          'title',
          dto.titleIndonesia,
        );
        await this.upsertTranslation(
          tx,
          entityId,
          'en_US',
          'title',
          dto.titleEnglish,
        );
        await this.upsertTranslation(
          tx,
          entityId,
          'id_ID',
          'disclaimer',
          dto.disclaimerIndonesia,
        );
        await this.upsertTranslation(
          tx,
          entityId,
          'en_US',
          'disclaimer',
          dto.disclaimerEnglish,
        );

        return tx.faqContent.findUnique({
          where: { id: faq.id },
          include: {
            entity: {
              include: {
                translations: {
                  include: { language: true },
                  where: {
                    field: { in: ['title', 'disclaimer'] },
                    language: { code: { in: ['id_ID', 'en_US'] } },
                  },
                },
              },
            },
          },
        });
      });

      return {
        message: existing
          ? 'FAQ content updated successfully'
          : 'FAQ content created successfully',
        data: result,
      };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to create or update FAQ content',
      );
    }
  }
}
