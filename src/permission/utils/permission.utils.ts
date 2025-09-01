/**
 * Cek apakah nilai dianggap "kosong" untuk kebutuhan filter/query.
 * Kosong = undefined, null, atau string: "", "any", "null", "undefined" (case-insensitive).
 */
export function isBlankish(v: any): boolean {
  return (
    v === undefined ||
    v === null ||
    (typeof v === 'string' &&
      ['', 'any', 'null', 'undefined'].includes(v.trim().toLowerCase()))
  );
}
