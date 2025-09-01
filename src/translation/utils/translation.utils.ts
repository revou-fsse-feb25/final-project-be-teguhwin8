export const LANGS = ['id_ID', 'en_US'] as const;
export type LangCode = (typeof LANGS)[number];

export interface Translation {
  field: string;
  translation: string | null;
  language: {
    code: LangCode;
  };
}

/**
 * Creates a function to map translation fields to their values for a specific language.
 * @param translations - Array of translation records from Prisma
 * @param lang - Language code (e.g., 'id_ID', 'en_US')
 * @returns A function that takes a field name and returns its translated value
 */
export const indexTranslationsByField = (
  translations: any[],
  lang: LangCode,
): ((field: string) => string | null) => {
  const translationMap = new Map<string, string | null>();
  translations
    .filter((t) => t.language.code === lang)
    .forEach((t) => {
      translationMap.set(t.field, t.translation);
    });
  return (field: string) => translationMap.get(field) ?? null;
};
