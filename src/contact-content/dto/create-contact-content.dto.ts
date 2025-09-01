import { ApiProperty } from '@nestjs/swagger';

export class CreateContactContentDto {
  @ApiProperty({
    example: 'Jl. Contoh No. 123, Jakarta',
    description: 'Alamat kantor atau tempat',
  })
  address?: string;

  @ApiProperty({
    example: 'contact@example.com',
    description: 'Email kontak',
  })
  email?: string;

  @ApiProperty({
    example: '+621234567890',
    description: 'Nomor telepon',
  })
  phone?: string;

  @ApiProperty({
    example: '+6281234567890',
    description: 'Nomor WhatsApp',
  })
  whatsapp?: string;

  @ApiProperty({
    example: 'https://instagram.com/example',
    description: 'Link atau username Instagram',
  })
  instagram?: string;

  @ApiProperty({
    example: 'https://facebook.com/example',
    description: 'Link Facebook',
  })
  facebook?: string;

  @ApiProperty({
    example: 'https://twitter.com/example',
    description: 'Link Twitter',
  })
  twitter?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@example',
    description: 'Link TikTok',
  })
  tiktok?: string;

  @ApiProperty({
    example: 'https://youtube.com/c/example',
    description: 'Link YouTube',
  })
  youtube?: string;

  @ApiProperty({
    example: 'https://www.example.com',
    description: 'Website resmi',
  })
  website?: string;

  @ApiProperty({
    example: -6.2088,
    description: 'Latitude lokasi',
  })
  latitude?: number;

  @ApiProperty({
    example: 106.8456,
    description: 'Longitude lokasi',
  })
  longitude?: number;
}
