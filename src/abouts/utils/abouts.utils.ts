export const TRANSLATABLE_FIELDS = [
  'titleBanner',
  'descriptionBanner',
  'titleAbout',
  'descriptionAbout',
] as const;

export type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number];

export const LANGS = ['id_ID', 'en_US'] as const;
export type LangCode = (typeof LANGS)[number];

export function mapDtoToLangValues(
  dto: any,
  lang: LangCode,
): Partial<Record<TranslatableField, string | null | undefined>> {
  const suffix = lang === 'id_ID' ? 'Indonesia' : 'English';
  return {
    titleBanner: dto[`titleBanner${suffix}`],
    descriptionBanner: dto[`descriptionBanner${suffix}`],
    titleAbout: dto[`titleAbout${suffix}`],
    descriptionAbout: dto[`descriptionAbout${suffix}`],
  };
}

export function indexTranslationsByField(
  translations: {
    field: string;
    translation: string;
    language: { code: string };
  }[],
  code: LangCode,
) {
  const map = new Map<string, string>();
  for (const t of translations) {
    if (t.language.code === code) map.set(t.field, t.translation);
  }
  return (field: TranslatableField) => map.get(field) ?? null;
}
