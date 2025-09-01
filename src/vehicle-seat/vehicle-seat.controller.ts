import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { VehicleSeatService } from './vehicle-seat.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('vehicle-seat')
export class VehicleSeatController {
  constructor(private readonly vehicleSeatService: VehicleSeatService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createVehicleSeatDto: any) {
    return this.vehicleSeatService.create(createVehicleSeatDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.vehicleSeatService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleSeatService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleSeatDto: any) {
    return this.vehicleSeatService.update(id, updateVehicleSeatDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehicleSeatService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.vehicleSeatService.restore(id);
  }
}
