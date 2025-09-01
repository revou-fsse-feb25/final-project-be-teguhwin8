import { PartialType } from '@nestjs/swagger';
import { CreateVehicleSeatDto } from './create-vehicle-seat.dto';

export class UpdateVehicleSeatDto extends PartialType(CreateVehicleSeatDto) {}
