import { Permission as PermissionModel } from '@prisma/client';

export class PermissionEntity implements PermissionModel {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
