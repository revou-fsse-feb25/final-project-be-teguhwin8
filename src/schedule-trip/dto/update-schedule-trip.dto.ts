import { PartialType } from '@nestjs/swagger';
import { CreateScheduleTripDto } from './create-schedule-trip.dto';

export class UpdateScheduleTripDto extends PartialType(CreateScheduleTripDto) {}
