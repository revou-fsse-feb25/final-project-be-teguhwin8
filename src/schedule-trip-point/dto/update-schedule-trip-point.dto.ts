import { PartialType } from '@nestjs/swagger';
import { CreateScheduleTripPointDto } from './create-schedule-trip-point.dto';

export class UpdateScheduleTripPointDto extends PartialType(CreateScheduleTripPointDto) {}
