import { Library as LibraryModel } from '@prisma/client';

export default class LibraryEntity implements LibraryModel {
  id: string;
  code: string;
  master: string;
  values: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
