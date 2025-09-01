export const isBlank = (v: any) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export const toNull = <T>(v: T | null | undefined) => (isBlank(v) ? null : v);

export const toInt = (v: any, fallback: number | null = null) => {
  if (isBlank(v)) return fallback;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
};

export const toFloat = (v: any, fallback: number | null = null) => {
  if (isBlank(v)) return fallback;
  const n = Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

export const toDate = (v: any) => {
  if (isBlank(v)) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};
