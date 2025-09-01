import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsUrl,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

export class UpdateSubscriptionOrderDto {
  @ApiPropertyOptional({ example: 'ORD-2025-000123' })
  @IsOptional()
  @IsString({ message: 'orderCode harus berupa string.' })
  orderCode?: string;

  @ApiPropertyOptional({ example: 'uuid-customer-123' })
  @IsOptional()
  @IsUUID(undefined, { message: 'customerId harus berupa UUID yang valid.' })
  customerId?: string;

  @ApiPropertyOptional({
    example: 'uuid-voucher-456',
    description: 'Set nilai ke null untuk melepas voucher.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null) // kalau null, lewati validasi UUID
  @IsUUID(undefined, { message: 'voucherId harus berupa UUID yang valid.' })
  voucherId?: string | null;

  @ApiPropertyOptional({ example: 'uuid-invoice-789' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID(undefined, { message: 'invoiceId harus berupa UUID yang valid.' })
  invoiceId?: string | null;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsInt({ message: 'amount harus berupa bilangan bulat.' })
  @IsPositive({ message: 'amount harus lebih besar dari 0.' })
  amount?: number;

  @ApiPropertyOptional({ example: 3, description: 'Durasi dalam bulan.' })
  @IsOptional()
  @IsInt({ message: 'duration harus berupa bilangan bulat.' })
  @IsPositive({ message: 'duration harus lebih besar dari 0.' })
  duration?: number;

  @ApiPropertyOptional({ example: '2025-08-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'startDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-11-20T00:00:00.000Z' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString(
    {},
    { message: 'endDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  endDate?: string | null;

  @ApiPropertyOptional({ example: '2025-11-20T00:00:00.000Z' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString(
    {},
    { message: 'expiredDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  expiredDate?: string | null;

  @ApiPropertyOptional({ example: '2025-11-20T00:00:00.000Z' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString(
    {},
    { message: 'renewalDate harus berupa tanggal ISO 8601 yang valid.' },
  )
  renewalDate?: string | null;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'phone harus berupa string.' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'name harus berupa string.' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'pgw_123' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString({ message: 'paymentGatewayId harus berupa string.' })
  paymentGatewayId?: string | null;

  @ApiPropertyOptional({ example: 'https://xendit.co/pay/123' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl({}, { message: 'paymentUrl harus berupa URL yang valid.' })
  paymentUrl?: string | null;

  @ApiPropertyOptional({ example: 'COMPLETED', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'paymentStatus tidak valid.' })
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus, { message: 'subscriptionStatus tidak valid.' })
  subscriptionStatus?: SubscriptionStatus;
}
