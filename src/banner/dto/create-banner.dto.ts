import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  badgeBanner?: string;

  @IsOptional()
  @IsString()
  titleBanner?: string;

  @IsOptional()
  @IsString()
  descriptionBanner?: string;

  @IsOptional()
  @IsString()
  imageBanner?: string;

  @IsOptional()
  @IsUUID()
  lastUpdateAuthorId?: string;
}
