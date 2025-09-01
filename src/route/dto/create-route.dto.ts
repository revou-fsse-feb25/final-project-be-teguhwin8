import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsUUID()
  operator: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  numberOfDriver?: number;

  @IsOptional()
  @IsNumber()
  numberOfToll?: number;

  @IsOptional()
  @IsNumber()
  numberOfFuel?: number;

  @IsOptional()
  @IsNumber()
  numberOfOther?: number;

  @IsOptional()
  @IsNumber()
  feeDriver?: number;

  @IsOptional()
  @IsNumber()
  feeToll?: number;

  @IsOptional()
  @IsNumber()
  feeFuel?: number;

  @IsOptional()
  @IsNumber()
  feeOther?: number;

  @IsOptional()
  @IsNumber()
  totalFeeDriver?: number;

  @IsOptional()
  @IsNumber()
  totalFeeToll?: number;

  @IsOptional()
  @IsNumber()
  totalFeeFuel?: number;

  @IsOptional()
  @IsNumber()
  totalFeeOther?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pointIds?: string[];
}
