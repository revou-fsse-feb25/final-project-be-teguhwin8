import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ScheduleTripPointService } from './schedule-trip-point.service';

@Controller('schedule-trip-point')
export class ScheduleTripPointController {
  constructor(
    private readonly scheduleTripPointService: ScheduleTripPointService,
  ) {}

  @Post()
  create(@Body() createScheduleTripPointDto: any) {
    return this.scheduleTripPointService.create(createScheduleTripPointDto);
  }

  @Get()
  findAll(@Query() request) {
    return this.scheduleTripPointService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleTripPointService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScheduleTripPointDto: any) {
    return this.scheduleTripPointService.update(id, updateScheduleTripPointDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleTripPointService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.scheduleTripPointService.restore(id);
  }
}
