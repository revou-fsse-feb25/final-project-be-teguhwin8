import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  IsISO8601,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Express } from 'express';

export enum ArticleStatus {
  draft = 'draft',
  approved = 'approved',
  rejected = 'rejected',
  deleted = 'deleted',
}

const toBoolean = (v: any) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string')
    return ['true', '1', 'yes', 'on'].includes(v.toLowerCase());
  return undefined;
};

const toStringArray = (v: any): string[] | undefined => {
  if (Array.isArray(v))
    return v
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .map((x) => x.trim())
          .filter(Boolean);
      }
    } catch {}
    return s
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return undefined;
};

export class CreateArticleDto {
  @ApiPropertyOptional({ example: '5a2c8c6b-0c44-4d2b-9b4f-1f2e1f2e1f2e' })
  @IsOptional()
  @IsString({ message: 'authorId harus berupa string' })
  authorId?: string;

  @ApiPropertyOptional({ example: 'Judul Artikel (ID)' })
  @IsOptional()
  @IsString({ message: 'titleIndonesian harus berupa string' })
  titleIndonesian?: string;

  @ApiPropertyOptional({ example: 'Article Title (EN)' })
  @IsOptional()
  @IsString({ message: 'titleEnglish harus berupa string' })
  titleEnglish?: string;

  @ApiPropertyOptional({ example: 'Konten artikel dalam Bahasa Indonesia' })
  @IsOptional()
  @IsString({ message: 'contentIndonesian harus berupa string' })
  contentIndonesian?: string;

  @ApiPropertyOptional({ example: 'Article content in English' })
  @IsOptional()
  @IsString({ message: 'contentEnglish harus berupa string' })
  contentEnglish?: string;

  @ApiPropertyOptional({ example: 'Teknologi' })
  @IsOptional()
  @IsString({ message: 'categoryIndonesian harus berupa string' })
  categoryIndonesian?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString({ message: 'categoryEnglish harus berupa string' })
  categoryEnglish?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Security', 'Engineering'],
    description:
      'Bisa kirim array atau string dipisah koma. Contoh string: "Security, Engineering"',
  })
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray({ message: 'tags harus berupa array string' })
  @IsString({ each: true, message: 'Setiap tag harus berupa string' })
  tags?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'highlighted harus berupa boolean' })
  highlighted?: boolean;

  @ApiPropertyOptional({
    enum: ArticleStatus,
    example: ArticleStatus.draft,
  })
  @IsOptional()
  @IsEnum(ArticleStatus, {
    message: 'status tidak valid (pilihan: draft, approved, rejected, deleted)',
  })
  status?: ArticleStatus;

  @ApiPropertyOptional({
    example: '2025-08-13T09:00:00Z',
    description: 'Tanggal publikasi dalam format ISO 8601',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'publishedAt harus format tanggal ISO 8601' })
  publishedAt?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Thumbnail image (jpg/png/webp, dll)',
  })
  @IsOptional()
  @Type(() => Object)
  thumbnail?: Express.Multer.File;
}
