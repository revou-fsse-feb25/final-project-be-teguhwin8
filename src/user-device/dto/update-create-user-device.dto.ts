import { PartialType } from '@nestjs/swagger';
import { CreateUserDeviceDto } from './create-user-device.dto';

export class UpdateCreateUserDeviceDto extends PartialType(
  CreateUserDeviceDto,
) {}
