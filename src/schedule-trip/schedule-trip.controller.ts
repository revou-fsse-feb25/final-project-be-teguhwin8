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
import { ScheduleTripService } from './schedule-trip.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('schedule-trip')
export class ScheduleTripController {
  constructor(private readonly scheduleTripService: ScheduleTripService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createScheduleTripDto: any) {
    return this.scheduleTripService.create(createScheduleTripDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.scheduleTripService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleTripService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScheduleTripDto: any) {
    return this.scheduleTripService.update(id, updateScheduleTripDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleTripService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.scheduleTripService.restore(id);
  }
}
