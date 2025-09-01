export const isBlankish = (v: any) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
