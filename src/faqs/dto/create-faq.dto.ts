import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateFaqDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'Author user id' })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ example: 'Pemesanan', description: 'FAQ category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'draft',
    enum: ['draft', 'approved', 'rejected', 'deleted'],
    description: 'FAQ status',
  })
  @IsEnum(['draft', 'approved', 'rejected', 'deleted'])
  @IsOptional()
  status?: 'draft' | 'approved' | 'rejected' | 'deleted';

  @ApiProperty({
    example: 'Bagaimana cara pesan tiket?',
    description: 'FAQ title in Indonesian',
  })
  @IsString()
  titleIndonesia: string;

  @ApiProperty({
    example: 'Silakan klik tombol pesan di halaman utama.',
    description: 'FAQ description in Indonesian',
  })
  @IsString()
  descriptionIndonesia: string;

  @ApiProperty({
    example: 'How to book a ticket?',
    description: 'FAQ title in English',
  })
  @IsString()
  titleEnglish: string;

  @ApiProperty({
    example: 'Click the book button on the homepage.',
    description: 'FAQ description in English',
  })
  @IsString()
  descriptionEnglish: string;
}
