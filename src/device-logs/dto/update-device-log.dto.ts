import { PartialType } from '@nestjs/swagger';
import { CreateDeviceLogDto } from './create-device-log.dto';

export class UpdateDeviceLogDto extends PartialType(CreateDeviceLogDto) {}
