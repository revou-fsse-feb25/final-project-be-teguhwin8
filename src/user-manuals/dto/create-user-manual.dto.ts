import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateUserManualDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUUID()
  @IsOptional()
  featuresId?: string;
}
