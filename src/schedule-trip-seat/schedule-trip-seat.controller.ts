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
import { ScheduleTripSeatService } from './schedule-trip-seat.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('schedule-trip-seat')
export class ScheduleTripSeatController {
  constructor(
    private readonly scheduleTripSeatService: ScheduleTripSeatService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createScheduleTripSeatDto: any) {
    return this.scheduleTripSeatService.create(createScheduleTripSeatDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.scheduleTripSeatService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleTripSeatService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScheduleTripSeatDto: any) {
    return this.scheduleTripSeatService.update(id, updateScheduleTripSeatDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleTripSeatService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.scheduleTripSeatService.restore(id);
  }
}
