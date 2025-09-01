/* eslint-disable @typescript-eslint/no-unused-vars */
import { OmitType } from '@nestjs/mapped-types';
import UserEntity from '../entities/user.entity';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateUserDto extends OmitType(UserEntity, ['id']) {
  @IsNotEmpty()
  email: string;
  password: string;
  roleId: string;
}
