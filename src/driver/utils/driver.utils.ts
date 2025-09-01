export const isBlankish = (v: any) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export const toInsensitiveContains = (v: string) => ({
  contains: v.trim(),
  mode: 'insensitive' as const,
});

export const assertAllowed = (
  value: string,
  allowed: Set<string>,
  fallback: string,
) => (allowed.has(value) ? value : fallback);

export const ic = (v: string) => ({
  contains: v.trim(),
  mode: 'insensitive' as const,
});
