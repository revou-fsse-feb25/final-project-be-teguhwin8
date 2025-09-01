/* eslint-disable @typescript-eslint/no-unused-vars */
import { OmitType } from '@nestjs/mapped-types';
import { RoleEntity } from '../entities/role.entity';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateRoleDto extends OmitType(RoleEntity, ['id']) {
  @IsNotEmpty()
  name: string;
}
