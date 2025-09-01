export function toSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    return ['true', '1', 'yes', 'on'].includes(v.trim().toLowerCase());
  }
  return undefined;
}

export function normalizeTags(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (val == null) return [];

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .map((x) => x.trim())
          .filter(Boolean);
      }
    } catch {}
    const inner = s.startsWith('[') && s.endsWith(']') ? s.slice(1, -1) : s;
    return inner
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  if (typeof val === 'object') {
    return Object.values(val)
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

export function extractTagsFromDto(dto: any): string[] {
  const raw = dto?.tags ?? dto?.['tags[]'];
  return normalizeTags(raw);
}

export function pickTranslation(
  translations: { field: string; languageId: number; translation: string }[],
  field: 'title' | 'content' | 'category' | 'tag_name',
  primaryId: number,
  fallbackId: number,
) {
  const byField = translations.filter((t) => t.field === field);
  const primary = byField.find((t) => t.languageId === primaryId)?.translation;
  const fallback = byField.find((t) => t.languageId === fallbackId)
    ?.translation;
  return primary ?? fallback ?? '';
}

export const isBlankish = (v: any) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
