import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionNameDto {
  @IsString()
  name: string;
}

export class AssignRolePermissionDto {
  @IsString()
  role: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionNameDto)
  permissions: PermissionNameDto[];
}
