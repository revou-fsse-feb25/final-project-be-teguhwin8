/* eslint-disable @typescript-eslint/no-unused-vars */
import { OmitType } from '@nestjs/mapped-types';
import { PermissionEntity } from '../entities/permission.entity';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreatePermissionDto extends OmitType(PermissionEntity, ['id']) {
  @IsNotEmpty()
  name: string;
}
