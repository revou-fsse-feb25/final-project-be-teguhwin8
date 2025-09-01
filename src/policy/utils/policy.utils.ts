import { BadRequestException } from '@nestjs/common';
import { PrismaClient, Policy } from '@prisma/client';

const prisma = new PrismaClient();

export async function getLanguageId(code: string): Promise<number> {
  const language = await prisma.language.findUnique({ where: { code } });
  if (!language) throw new BadRequestException(`Language ${code} not found`);
  return language.id;
}

export function formatPolicyWithLang(
  policy: Policy & {
    entity: {
      translations: {
        field: string;
        translation: string;
        language: { code: string };
      }[];
    };
  },
  langQuery?: string,
) {
  const translations = policy.entity?.translations ?? [];
  const findT = (code: string, field: string) =>
    translations.find((t) => t.language.code === code && t.field === field)
      ?.translation;
  const langs = langQuery
    ? langQuery
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  if (langs.length === 1) {
    const code = langs[0];
    return {
      id: policy.id,
      type: policy.type,
      title: findT(code, 'title'),
      content: findT(code, 'content'),
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }

  return {
    id: policy.id,
    type: policy.type,
    translations: {
      id_ID: {
        title: findT('id_ID', 'title'),
        content: findT('id_ID', 'content'),
      },
      en_US: {
        title: findT('en_US', 'title'),
        content: findT('en_US', 'content'),
      },
    },
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

export async function formatPolicyResponse(id: string) {
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

  return {
    id: policy.id,
    type: policy.type,
    translations: {
      id_ID: {
        title: policy.entity.translations.find(
          (t: { language: { code: string }; field: string }) =>
            t.language.code === 'id_ID' && t.field === 'title',
        )?.translation,
        content: policy.entity.translations.find(
          (t: { language: { code: string }; field: string }) =>
            t.language.code === 'id_ID' && t.field === 'content',
        )?.translation,
      },
      en_US: {
        title: policy.entity.translations.find(
          (t: { language: { code: string }; field: string }) =>
            t.language.code === 'en_US' && t.field === 'title',
        )?.translation,
        content: policy.entity.translations.find(
          (t: { language: { code: string }; field: string }) =>
            t.language.code === 'en_US' && t.field === 'content',
        )?.translation,
      },
    },
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

export async function formatPolicyResponseWithClient(
  prisma: PrismaClient,
  id: string,
) {
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      entity: {
        include: {
          translations: { include: { language: true } },
        },
      },
    },
  });
  if (!policy) return null;

  const findT = (code: string, field: string) =>
    policy.entity?.translations.find(
      (t) => t.language.code === code && t.field === field,
    )?.translation;

  return {
    id: policy.id,
    type: policy.type,
    translations: {
      id_ID: {
        title: findT('id_ID', 'title'),
        content: findT('id_ID', 'content'),
      },
      en_US: {
        title: findT('en_US', 'title'),
        content: findT('en_US', 'content'),
      },
    },
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}
