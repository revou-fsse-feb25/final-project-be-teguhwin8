import { PartialType } from '@nestjs/swagger';
import { CreateScheduleTripSeatDto } from './create-schedule-trip-seat.dto';

export class UpdateScheduleTripSeatDto extends PartialType(CreateScheduleTripSeatDto) {}
