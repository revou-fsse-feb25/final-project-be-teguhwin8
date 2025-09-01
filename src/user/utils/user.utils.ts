export type MultiParam = string | string[] | null | undefined;

export const toArray = (v: MultiParam): string[] | null => {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);

  const s = String(v).trim();
  if (!s || s.toUpperCase() === 'ANY') return null;

  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

export const localPart = (email?: string | null) => {
  if (!email) return '';
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : email;
};

export function toDate(v: any): Date | null {
  if (v === undefined || v === null || v === '') return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

export function toNull<T = any>(v: T | undefined): T | null {
  return v === undefined ? null : (v as any);
}

export const toRel = (id: string | null | undefined) =>
  id === undefined
    ? undefined
    : id === null
    ? { disconnect: true }
    : { connect: { id } };

export function yyyymmddDots(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function toTypeCode(raw?: string | null) {
  if (!raw) return 'GEN';
  const code = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3);
  return code || 'GEN';
}

export function toUpdate<T = any>(value: T | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return value;
}
