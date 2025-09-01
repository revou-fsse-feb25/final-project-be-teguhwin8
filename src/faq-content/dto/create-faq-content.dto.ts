import { ApiProperty } from '@nestjs/swagger';

export class CreateFaqContentDto {
  @ApiProperty({ example: 'uuid', description: 'Unique identifier' })
  id: string;

  @ApiProperty({
    example: 'Judul FAQ (Bahasa Indonesia)',
    required: false,
    description: 'Title of the FAQ content in Bahasa Indonesia',
  })
  titleIndonesia?: string;

  @ApiProperty({
    example: 'FAQ Title (English)',
    required: false,
    description: 'Title of the FAQ content in English',
  })
  titleEnglish?: string;

  @ApiProperty({
    example: 'Teks disclaimer dalam Bahasa Indonesia',
    required: false,
    description: 'Disclaimer of the FAQ content in Bahasa Indonesia',
  })
  disclaimerIndonesia?: string;

  @ApiProperty({
    example: 'Disclaimer text (English)',
    required: false,
    description: 'Disclaimer of the FAQ content in English',
  })
  disclaimerEnglish?: string;

  @ApiProperty({
    example: 'https://example.com',
    required: false,
    description: 'Link related to the FAQ content',
  })
  link?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Image file for the FAQ content (multipart/form-data)',
  })
  image?: Express.Multer.File;

  @ApiProperty({
    example: '2025-07-10T12:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-07-10T12:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    example: '2025-07-10T12:00:00.000Z',
    required: false,
    description: 'Soft delete timestamp',
  })
  deletedAt?: Date;
}
