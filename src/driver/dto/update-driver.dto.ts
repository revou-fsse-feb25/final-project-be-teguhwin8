import {
  IsOptional,
  IsString,
  IsEmail,
  Length,
  Matches,
  IsISO8601,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDriverDto {
  @IsOptional() @IsString() operator?: string;
  @IsOptional() @IsString() shift?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() vehicleId?: string | null;
  @IsOptional() @IsString() mobilePhone?: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional() @IsString() userId?: string | null;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() userPhone?: string;
  @IsOptional() @IsString() password?: string | null;
  @IsOptional() @IsString() userName?: string;

  @IsOptional()
  @Length(16, 16, { message: 'nik must be exactly 16 digits' })
  @Matches(/^\d+$/, { message: 'nik must contain only digits' })
  nik?: string | null;

  @IsOptional()
  @IsString()
  simNumber?: string | null;

  @IsOptional()
  @IsString()
  simPhotoUrl?: string | null;

  @IsOptional()
  @IsString()
  ktpPhotoUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsISO8601(
    { strict: true },
    { message: 'simExpiryDate must be ISO 8601 date string' },
  )
  simExpiryDate?: string | null;
}
