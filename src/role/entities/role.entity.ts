import { Role as RoleModel } from '@prisma/client';

export class RoleEntity implements RoleModel {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
