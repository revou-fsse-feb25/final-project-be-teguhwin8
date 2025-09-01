import { Prisma } from '@prisma/client';
import { LANGS, TRANSLATABLE_FIELDS } from '../utils/abouts.utils';

export type LangParam = 'id_ID' | 'en_US' | 'multiple';

export const buildFindFirstAboutArgs = (
  lang: LangParam = 'id_ID',
): Prisma.AboutFindFirstArgs => {
  const langFilter = lang === 'multiple' ? LANGS : [lang];

  return {
    where: { deletedAt: null },
    include: {
      entity: {
        include: {
          translations: {
            where: {
              language: { code: { in: langFilter as string[] } },
              field: { in: TRANSLATABLE_FIELDS as unknown as string[] },
            },
            include: { language: true },
          },
        },
      },
    },
  };
};
