import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class BulkCreatePermissionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  names: string[];
}
