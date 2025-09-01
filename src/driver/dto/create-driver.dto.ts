import {
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  Length,
  Matches,
  IsISO8601,
} from 'class-validator';

export class CreateDriverDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  shift?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Length(16, 16, { message: 'nik must be exactly 16 digits' })
  @Matches(/^\d+$/, { message: 'nik must contain only digits' })
  nik?: string;

  @IsOptional()
  @IsString()
  simNumber?: string;

  @IsOptional()
  @IsString()
  simPhotoUrl?: string;

  @IsOptional()
  @IsString()
  ktpPhotoUrl?: string;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'simExpiryDate must be ISO 8601 date string' },
  )
  simExpiryDate?: string;
}
