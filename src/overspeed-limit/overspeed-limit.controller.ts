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
import { OverspeedLimitService } from './overspeed-limit.service';
import { CreateOverspeedLimitDto } from './dto/create-overspeed-limit.dto';
import { UpdateOverspeedLimitDto } from './dto/update-overspeed-limit.dto';

@Controller('overspeed-limit')
export class OverspeedLimitController {
  constructor(private readonly overspeedLimitService: OverspeedLimitService) {}

  @Post()
  create(@Body() createOverspeedLimitDto: CreateOverspeedLimitDto) {
    return this.overspeedLimitService.create(createOverspeedLimitDto);
  }

  @Get()
  findAll(@Query() request: any) {
    return this.overspeedLimitService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.overspeedLimitService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOverspeedLimitDto: UpdateOverspeedLimitDto,
  ) {
    return this.overspeedLimitService.update(id, updateOverspeedLimitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.overspeedLimitService.remove(id);
  }
}
