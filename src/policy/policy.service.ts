import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PolicyType, Prisma } from '@prisma/client';
import {
  formatPolicyWithLang,
  formatPolicyResponse,
  formatPolicyResponseWithClient,
} from './utils/policy.utils';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPolicyDto: CreatePolicyDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const allowedTypes = Object.values(PolicyType) as string[];
        if (!allowedTypes.includes(createPolicyDto.type)) {
          throw new BadRequestException(
            `Invalid policy type: ${
              createPolicyDto.type
            }. Allowed: ${allowedTypes.join(', ')}`,
          );
        }
        const totalExisting = await tx.policy.count();
        if (totalExisting >= allowedTypes.length) {
          throw new BadRequestException(
            `Maximum policy count reached (${allowedTypes.length}). You cannot add more.`,
          );
        }
        const existingByType = await tx.policy.findUnique({
          where: { type: createPolicyDto.type as PolicyType },
        });
        if (existingByType) {
          throw new BadRequestException(
            `Policy with type ${createPolicyDto.type} already exists`,
          );
        }
        const getLanguageIdTx = async (code: string): Promise<number> => {
          const lang = await tx.language.findUnique({ where: { code } });
          if (!lang)
            throw new BadRequestException(`Language ${code} not found`);
          return lang.id;
        };
        const entity = await tx.entity.create({ data: { type: 'policy' } });
        const policy = await tx.policy.create({
          data: {
            type: createPolicyDto.type as PolicyType,
            entityId: entity.id,
          },
        });
        const [idID, enUS] = await Promise.all([
          getLanguageIdTx('id_ID'),
          getLanguageIdTx('en_US'),
        ]);
        await tx.translation.createMany({
          data: [
            {
              entityId: entity.id,
              languageId: idID,
              field: 'title',
              translation: createPolicyDto.titleIndonesia ?? '',
            },
            {
              entityId: entity.id,
              languageId: idID,
              field: 'content',
              translation: createPolicyDto.contentIndonesia ?? '',
            },
            {
              entityId: entity.id,
              languageId: enUS,
              field: 'title',
              translation: createPolicyDto.titleEnglish ?? '',
            },
            {
              entityId: entity.id,
              languageId: enUS,
              field: 'content',
              translation: createPolicyDto.contentEnglish ?? '',
            },
          ],
        });

        return policy.id;
      });
      const data = await formatPolicyResponse(result);
      return {
        code: 201,
        message: 'Policy created successfully',
        data,
      };
    } catch (error: any) {
      if (
        error?.code === 'P2002' &&
        Array.isArray(error?.meta?.target) &&
        error.meta.target.includes('type')
      ) {
        throw new BadRequestException(
          `Policy with type ${String(error.meta?.target)} already exists`,
        );
      }
      throw new BadRequestException(
        error?.message || 'Failed to create policy',
      );
    }
  }

  async findAll(request: any) {
    try {
      const page: number = Math.max(parseInt(request?.page, 10) || 1, 1);
      const limit: number = Math.max(parseInt(request?.limit, 10) || 10, 1);
      const skip = (page - 1) * limit;
      const allowedSort = new Set<keyof Prisma.PolicyOrderByWithRelationInput>([
        'createdAt',
        'updatedAt',
        'type',
        'id',
      ]);
      const sortByRaw = String(request?.sortBy ?? 'createdAt');
      const sortBy = (
        allowedSort.has(sortByRaw as any) ? sortByRaw : 'createdAt'
      ) as keyof Prisma.PolicyOrderByWithRelationInput;
      const sortOrder =
        String(request?.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
      const search: string =
        typeof request?.search === 'string' ? request.search.trim() : '';
      const lang: string | undefined =
        typeof request?.lang === 'string' ? request.lang.trim() : undefined;
      const type: string | undefined =
        typeof request?.type === 'string' ? request.type.trim() : undefined;
      const AND: Prisma.PolicyWhereInput[] = [];
      if (search) {
        AND.push({
          entity: {
            is: {
              translations: {
                some: {
                  translation: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            },
          },
        });
      }
      if (type) {
        AND.push({ type: type as any });
      }
      const where: Prisma.PolicyWhereInput = AND.length > 0 ? { AND } : {};
      const [total, policies] = await this.prisma.$transaction([
        this.prisma.policy.count({ where }),
        this.prisma.policy.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            entity: {
              include: {
                translations: { include: { language: true } },
              },
            },
          },
        }),
      ]);
      const data = policies.map((p) => formatPolicyWithLang(p as any, lang));
      const totalPages = Math.ceil(total / limit);
      return {
        code: 200,
        message: 'Successfully retrieved policies',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        sort: { sortBy, sortOrder },
        filters: { search, type },
      };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to retrieve policies',
      );
    }
  }

  async findOne(id: string) {
    try {
      const policy = await this.prisma.policy.findUnique({
        where: { id },
        include: {
          entity: {
            include: {
              translations: {
                include: { language: true },
              },
            },
          },
        },
      });

      if (!policy) {
        throw new NotFoundException('Policy not found');
      }

      const formattedPolicy = {
        id: policy.id,
        type: policy.type,
        translations: {
          id_ID: {
            title: policy.entity.translations.find(
              (t) => t.language.code === 'id_ID' && t.field === 'title',
            )?.translation,
            content: policy.entity.translations.find(
              (t) => t.language.code === 'id_ID' && t.field === 'content',
            )?.translation,
          },
          en_US: {
            title: policy.entity.translations.find(
              (t) => t.language.code === 'en_US' && t.field === 'title',
            )?.translation,
            content: policy.entity.translations.find(
              (t) => t.language.code === 'en_US' && t.field === 'content',
            )?.translation,
          },
        },
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      };

      return {
        code: 200,
        message: 'Successfully retrieved policy',
        data: formattedPolicy,
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException('Failed to retrieve policy');
    }
  }

  async update(id: string, dto: UpdatePolicyDto) {
    try {
      const updatedId = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.policy.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Policy not found');
        const updateData: Prisma.PolicyUpdateInput = {};
        if (dto.type && dto.type !== existing.type) {
          const allowed = new Set(Object.values(PolicyType));
          if (!allowed.has(dto.type as PolicyType)) {
            throw new BadRequestException(
              `Invalid policy type: ${dto.type}. Allowed: ${[...allowed].join(
                ', ',
              )}`,
            );
          }
          const clash = await tx.policy.findUnique({
            where: { type: dto.type as PolicyType },
            select: { id: true },
          });
          if (clash && clash.id !== id) {
            throw new BadRequestException(
              `Policy with type ${dto.type} already exists`,
            );
          }
          updateData.type = dto.type as PolicyType;
        }
        if (Object.keys(updateData).length > 0) {
          await tx.policy.update({ where: { id }, data: updateData });
        }
        const needsIdID =
          dto.titleIndonesia !== undefined ||
          dto.contentIndonesia !== undefined;
        const needsEnUS =
          dto.titleEnglish !== undefined || dto.contentEnglish !== undefined;

        const getLanguageIdTx = async (code: string): Promise<number> => {
          const lang = await tx.language.findUnique({ where: { code } });
          if (!lang)
            throw new BadRequestException(`Language ${code} not found`);
          return lang.id;
        };

        const [idID, enUS] = await Promise.all([
          needsIdID
            ? getLanguageIdTx('id_ID')
            : Promise.resolve<number | null>(null),
          needsEnUS
            ? getLanguageIdTx('en_US')
            : Promise.resolve<number | null>(null),
        ]);

        const upserts: Array<ReturnType<typeof tx.translation.upsert>> = [];

        if (dto.titleIndonesia !== undefined) {
          if (!idID) throw new BadRequestException('Language id_ID not found');
          upserts.push(
            tx.translation.upsert({
              where: {
                entityId_languageId_field: {
                  entityId: existing.entityId,
                  languageId: idID,
                  field: 'title',
                },
              },
              update: { translation: dto.titleIndonesia },
              create: {
                entityId: existing.entityId,
                languageId: idID,
                field: 'title',
                translation: dto.titleIndonesia,
              },
            }),
          );
        }
        if (dto.contentIndonesia !== undefined) {
          if (!idID) throw new BadRequestException('Language id_ID not found');
          upserts.push(
            tx.translation.upsert({
              where: {
                entityId_languageId_field: {
                  entityId: existing.entityId,
                  languageId: idID,
                  field: 'content',
                },
              },
              update: { translation: dto.contentIndonesia },
              create: {
                entityId: existing.entityId,
                languageId: idID,
                field: 'content',
                translation: dto.contentIndonesia,
              },
            }),
          );
        }

        if (dto.titleEnglish !== undefined) {
          if (!enUS) throw new BadRequestException('Language en_US not found');
          upserts.push(
            tx.translation.upsert({
              where: {
                entityId_languageId_field: {
                  entityId: existing.entityId,
                  languageId: enUS,
                  field: 'title',
                },
              },
              update: { translation: dto.titleEnglish },
              create: {
                entityId: existing.entityId,
                languageId: enUS,
                field: 'title',
                translation: dto.titleEnglish,
              },
            }),
          );
        }
        if (dto.contentEnglish !== undefined) {
          if (!enUS) throw new BadRequestException('Language en_US not found');
          upserts.push(
            tx.translation.upsert({
              where: {
                entityId_languageId_field: {
                  entityId: existing.entityId,
                  languageId: enUS,
                  field: 'content',
                },
              },
              update: { translation: dto.contentEnglish },
              create: {
                entityId: existing.entityId,
                languageId: enUS,
                field: 'content',
                translation: dto.contentEnglish,
              },
            }),
          );
        }

        if (upserts.length > 0) {
          await Promise.all(upserts);
        }
        return id;
      });

      const data = await formatPolicyResponseWithClient(this.prisma, updatedId);
      return { code: 200, message: 'Policy updated successfully', data };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to update policy',
      );
    }
  }
}
