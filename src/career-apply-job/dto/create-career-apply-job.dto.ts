import { IsString, IsOptional, IsEmail, IsUrl, IsUUID } from 'class-validator';

export class CreateCareerApplyJobDto {
  @IsUUID()
  jobId: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  portfolio?: string;

  @IsString()
  @IsOptional()
  portfolioFile?: string;

  @IsUrl()
  @IsOptional()
  linkedinLink?: string;
}
