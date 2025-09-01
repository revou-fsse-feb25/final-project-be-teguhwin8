import { OmitType } from '@nestjs/mapped-types';
import { UserDeviceEntity } from '../entities/user-device.entity';
import { IsNotEmpty } from '@nestjs/class-validator';

export class CreateUserDeviceDto extends OmitType(UserDeviceEntity, ['id']) {
  @IsNotEmpty()
  id: string;
  user_id: string;
  app_id: string;
  device_id: string;
  language: string;
  time_zone: string;
  country: string;
  first_active_at: number;
  last_active_at: number;
  subscription_type: string;
  subscription_enabled: boolean;
  subscription_app_vereion: string;
  subscription_device_model: string;
  subscription_os_version: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
}
