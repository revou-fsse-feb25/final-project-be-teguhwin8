import { OmitType } from '@nestjs/mapped-types';
import { NotificationEntity } from '../entities/notification.entity';
import { IsNotEmpty } from '@nestjs/class-validator';
import { UserExists } from 'src/validators/user-exists.validator';

export class CreateNotificationDto extends OmitType(NotificationEntity, [
  'id',
]) {
  @UserExists()
  @IsNotEmpty()
  user_id: string;
  @IsNotEmpty()
  title: string;
  @IsNotEmpty()
  description: string;
  read_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
