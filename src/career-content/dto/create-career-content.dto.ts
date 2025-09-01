import { IsOptional, IsString } from 'class-validator';

export class CreateCareerContentDto {
  @IsOptional()
  @IsString()
  sectionType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  lastUpdatedById?: string;
}
