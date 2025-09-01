import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SliderStatus } from '@prisma/client';

export class CreateSliderDto {
  @IsOptional()
  @IsString()
  titleIndonesia?: string;

  @IsOptional()
  @IsString()
  descriptionIndonesia?: string;

  @IsOptional()
  @IsString()
  titleEnglish?: string;

  @IsOptional()
  @IsString()
  descriptionEnglish?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsUUID()
  createdById?: string;

  @IsOptional()
  @IsUUID()
  lastUpdatedById?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  image?: any;

  @IsOptional()
  @IsEnum(SliderStatus, { message: 'status must be either DRAFT or PUBLISH' })
  status?: SliderStatus;
}
