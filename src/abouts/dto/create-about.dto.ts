import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAboutDto {
  // Banner
  @ApiPropertyOptional({
    description: 'Judul banner (Indonesia)',
    example: 'Tentang Kami',
  })
  @IsOptional()
  @IsString()
  titleBannerIndonesia?: string;

  @ApiPropertyOptional({
    description: 'Judul banner (English)',
    example: 'About Us',
  })
  @IsOptional()
  @IsString()
  titleBannerEnglish?: string;

  @ApiPropertyOptional({
    description: 'Deskripsi banner (Indonesia)',
    example: 'Kami hadir untuk membantu ...',
  })
  @IsOptional()
  @IsString()
  descriptionBannerIndonesia?: string;

  @ApiPropertyOptional({
    description: 'Deskripsi banner (English)',
    example: 'We are here to help ...',
  })
  @IsOptional()
  @IsString()
  descriptionBannerEnglish?: string;

  @ApiPropertyOptional({
    description: 'Gambar banner (jpg, jpeg, png, max 5 MB)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  imageBanner?: any;

  // About
  @ApiPropertyOptional({
    description: 'Judul about (Indonesia)',
    example: 'Visi & Misi',
  })
  @IsOptional()
  @IsString()
  titleAboutIndonesia?: string;

  @ApiPropertyOptional({
    description: 'Judul about (English)',
    example: 'Vision & Mission',
  })
  @IsOptional()
  @IsString()
  titleAboutEnglish?: string;

  @ApiPropertyOptional({
    description: 'Deskripsi about (Indonesia)',
    example: 'Visi kami adalah ...',
  })
  @IsOptional()
  @IsString()
  descriptionAboutIndonesia?: string;

  @ApiPropertyOptional({
    description: 'Deskripsi about (English)',
    example: 'Our vision is ...',
  })
  @IsOptional()
  @IsString()
  descriptionAboutEnglish?: string;

  @ApiPropertyOptional({
    description: 'Gambar about (jpg, jpeg, png, max 5 MB)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  imageAbout?: any;

  // Metadata
  @ApiPropertyOptional({
    description: 'User ID yang terakhir mengubah',
    example: '7b2e52e0-54d7-4c21-9f3a-75a1a0f28c2a',
  })
  @IsOptional()
  @IsUUID()
  lastUpdateAuthorId?: string;
}
