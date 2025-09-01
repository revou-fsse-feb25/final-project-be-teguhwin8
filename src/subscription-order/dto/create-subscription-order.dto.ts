import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';

export class CreateSubscriptionOrderDto {
  @ApiProperty({
    example: 'uuid-customer-123',
    description: 'UUID customer pembuat langganan. Wajib.',
  })
  @IsUUID(undefined, { message: 'customerId harus berupa UUID yang valid.' })
  customerId!: string;

  @ApiPropertyOptional({
    example: 'uuid-voucher-456',
    description: 'UUID voucher (jika ada). Opsional.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'voucherId harus berupa UUID yang valid.' })
  voucherId?: string;

  @ApiPropertyOptional({
    example: 'uuid-invoice-789',
    description: 'UUID invoice terkait (jika ada). Opsional.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'invoiceId harus berupa UUID yang valid.' })
  invoiceId?: string;

  @ApiProperty({
    example: 150000,
    description: 'Nominal pembayaran (Rupiah). Wajib.',
  })
  @IsInt({ message: 'amount harus berupa bilangan bulat.' })
  @IsPositive({ message: 'amount harus lebih besar dari 0.' })
  amount!: number;

  @ApiProperty({
    example: 1,
    description: 'Durasi langganan dalam bulan. Wajib.',
  })
  @IsInt({ message: 'duration harus berupa bilangan bulat.' })
  @IsPositive({ message: 'duration harus lebih besar dari 0.' })
  duration!: number;

  @ApiProperty({
    example: '2025-08-13T00:00:00.000Z',
    description: 'Tanggal mulai langganan (ISO 8601). Wajib.',
  })
  @IsDateString(
    {},
    { message: 'startDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  startDate!: string;

  @ApiPropertyOptional({
    example: '2025-09-13T00:00:00.000Z',
    description: 'Tanggal berakhir (ISO 8601). Opsional.',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'endDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  endDate?: string;

  @ApiPropertyOptional({
    example: '2025-09-13T00:00:00.000Z',
    description: 'Tanggal kedaluwarsa (ISO 8601). Opsional.',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'expiredDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  expiredDate?: string;

  @ApiPropertyOptional({
    example: '2025-09-13T00:00:00.000Z',
    description: 'Tanggal perpanjangan (ISO 8601). Opsional.',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'renewalDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  renewalDate?: string;

  @ApiProperty({
    example: '+6281234567890',
    description: 'Nomor telepon customer. Wajib.',
  })
  @IsString({ message: 'phone harus berupa string.' })
  phone!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Nama customer. Wajib.',
  })
  @IsString({ message: 'name harus berupa string.' })
  name!: string;

  @ApiPropertyOptional({
    example: 'pgw_123456',
    description: 'ID payment gateway (jika ada). Opsional.',
  })
  @IsOptional()
  @IsString({ message: 'paymentGatewayId harus berupa string.' })
  paymentGatewayId?: string;

  @ApiPropertyOptional({
    example: 'https://xendit.co/pay/123',
    description: 'URL pembayaran (jika ada). Opsional.',
  })
  @IsOptional()
  @IsUrl({}, { message: 'paymentUrl harus berupa URL yang valid.' })
  paymentUrl?: string;
}
