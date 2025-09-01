import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeviceLogsService } from './device-logs.service';
import { CreateDeviceLogDto } from './dto/create-device-log.dto';
import { UpdateDeviceLogDto } from './dto/update-device-log.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('device-logs')
export class DeviceLogsController {
  constructor(private readonly deviceLogsService: DeviceLogsService) {}

  @Post()
  create(@Body() createDeviceLogDto: CreateDeviceLogDto) {
    return this.deviceLogsService.create(createDeviceLogDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.deviceLogsService.findAll(request);
  }

  @Get('/vehicle')
  dataVehicle(@Query() request) {
    return this.deviceLogsService.dataVehicle(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceLogsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDeviceLogDto: UpdateDeviceLogDto,
  ) {
    return this.deviceLogsService.update(+id, updateDeviceLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceLogsService.remove(id);
  }
}
