import { IsUUID, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateUserManualStepDto {
  @IsUUID()
  userManualId: string;

  @IsString()
  title: string;

  @IsInt()
  stepNumber: number;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  files?: string;
}
