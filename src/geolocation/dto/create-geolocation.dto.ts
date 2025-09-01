import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { GeolocationStatus } from '@prisma/client';

export class CreateGeolocationDto {
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  radius: number;

  @IsUUID()
  @IsNotEmpty()
  operatorId: string;

  @IsUUID()
  @IsNotEmpty()
  pointId: string;

  @IsEnum(GeolocationStatus)
  status: GeolocationStatus;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
