import { PartialType } from '@nestjs/swagger';
import { CreateGeolocationDto } from './create-geolocation.dto';

export class UpdateGeolocationDto extends PartialType(CreateGeolocationDto) {}
