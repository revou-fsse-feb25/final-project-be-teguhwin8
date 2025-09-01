import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateTestimonyDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  message?: string;
}
