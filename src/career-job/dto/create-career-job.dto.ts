import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class CreateCareerJobDto {
  @ApiPropertyOptional({ example: 'Rp 15–25 juta' })
  @IsOptional()
  @IsString({ message: 'salaryRange harus berupa string' })
  salaryRange?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive harus berupa boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2025-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'postedAt harus format ISO date string' })
  postedAt?: string;

  @ApiPropertyOptional({ example: '2025-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'expiredAt harus format ISO date string' })
  expiredAt?: string;

  @ApiPropertyOptional({ example: 'uuid-user' })
  @IsOptional()
  @IsString({ message: 'createdById harus berupa string' })
  createdById?: string;

  @ApiPropertyOptional({ example: 'uuid-user' })
  @IsOptional()
  @IsString({ message: 'lastUpdatedById harus berupa string' })
  lastUpdatedById?: string;

  // ====== TRANSLATABLE (INDONESIAN) ======
  @ApiProperty({
    example: 'Software Engineer',
    description: 'Judul (Indonesia)',
  })
  @IsString({ message: 'titleIndonesia harus berupa string' })
  @IsNotEmpty({ message: 'titleIndonesia wajib diisi' })
  titleIndonesia!: string;

  @ApiProperty({
    example: 'Bangun fitur end-to-end, review code, dan kolaborasi lintas tim.',
    description: 'Deskripsi (Indonesia)',
  })
  @IsString({ message: 'descriptionIndonesia harus berupa string' })
  @IsNotEmpty({ message: 'descriptionIndonesia wajib diisi' })
  descriptionIndonesia!: string;

  @ApiPropertyOptional({
    example: 'Penuh Waktu',
    description: 'Tipe kerja (Indonesia)',
  })
  @IsOptional()
  @IsString({ message: 'jobTypeIndonesia harus berupa string' })
  jobTypeIndonesia?: string;

  @ApiPropertyOptional({
    example: 'Teknologi',
    description: 'Departemen (Indonesia)',
  })
  @IsOptional()
  @IsString({ message: 'departmentIndonesia harus berupa string' })
  departmentIndonesia?: string;

  @ApiPropertyOptional({
    example: 'Jakarta, Indonesia',
    description: 'Lokasi (Indonesia)',
  })
  @IsOptional()
  @IsString({ message: 'locationIndonesia harus berupa string' })
  locationIndonesia?: string;

  @ApiPropertyOptional({
    example: '3+ tahun pengalaman, memahami Node.js/Go, paham SQL.',
    description: 'Kualifikasi/Requirements (Indonesia)',
  })
  @IsOptional()
  @IsString({ message: 'requirementsIndonesia harus berupa string' })
  requirementsIndonesia?: string;

  @ApiPropertyOptional({
    example: 'Tulis kode berkualitas, review PR, dan mentoring.',
    description: 'Tanggung jawab (Indonesia)',
  })
  @IsOptional()
  @IsString({ message: 'responsibilitiesIndonesia harus berupa string' })
  responsibilitiesIndonesia?: string;

  // ====== TRANSLATABLE (ENGLISH) ======
  @ApiProperty({ example: 'Software Engineer', description: 'Title (English)' })
  @IsString({ message: 'titleEnglish must be a string' })
  @IsNotEmpty({ message: 'titleEnglish is required' })
  titleEnglish!: string;

  @ApiProperty({
    example:
      'Build features end-to-end, review code, and collaborate across teams.',
    description: 'Description (English)',
  })
  @IsString({ message: 'descriptionEnglish must be a string' })
  @IsNotEmpty({ message: 'descriptionEnglish is required' })
  descriptionEnglish!: string;

  @ApiPropertyOptional({
    example: 'Full Time',
    description: 'Job type (English)',
  })
  @IsOptional()
  @IsString({ message: 'jobTypeEnglish must be a string' })
  jobTypeEnglish?: string;

  @ApiPropertyOptional({
    example: 'Engineering',
    description: 'Department (English)',
  })
  @IsOptional()
  @IsString({ message: 'departmentEnglish must be a string' })
  departmentEnglish?: string;

  @ApiPropertyOptional({
    example: 'Jakarta, Indonesia',
    description: 'Location (English)',
  })
  @IsOptional()
  @IsString({ message: 'locationEnglish must be a string' })
  locationEnglish?: string;

  @ApiPropertyOptional({
    example: '3+ years experience, proficient in Node.js/Go, solid SQL.',
    description: 'Requirements (English)',
  })
  @IsOptional()
  @IsString({ message: 'requirementsEnglish must be a string' })
  requirementsEnglish?: string;

  @ApiPropertyOptional({
    example: 'Write high-quality code, review PRs, and mentor.',
    description: 'Responsibilities (English)',
  })
  @IsOptional()
  @IsString({ message: 'responsibilitiesEnglish must be a string' })
  responsibilitiesEnglish?: string;
}
