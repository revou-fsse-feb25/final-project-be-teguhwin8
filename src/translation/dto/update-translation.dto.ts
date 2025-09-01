import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LANGS, LangCode } from '../utils/translation.utils';

export class TranslationItemDto {
  @IsInt()
  translationId: number;

  @IsEnum(LANGS)
  lang: LangCode;

  @IsString()
  field: string;

  @IsString()
  value: string;
}

export class UpdateTranslationDto {
  @IsString()
  entityId: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translation: TranslationItemDto[];
}
