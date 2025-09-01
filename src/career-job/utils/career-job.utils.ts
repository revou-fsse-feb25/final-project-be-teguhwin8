export const isBlankish = (v: any) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export type CareerSortBy = 'deletedAt' | 'postedAt' | 'createdAt' | 'updatedAt';
export enum CareerSortDataBy {
  deletedAt = 'deletedAt',
  postedAt = 'postedAt',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}
export type SortOrder = 'asc' | 'desc';
export enum SortOrderData {
  asc = 'asc',
  desc = 'desc',
}
export enum LangEnum {
  id_ID = 'id_ID',
  en_US = 'en_US',
}
