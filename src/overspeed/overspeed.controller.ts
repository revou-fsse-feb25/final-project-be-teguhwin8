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
import { OverspeedService } from './overspeed.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('overspeed')
export class OverspeedController {
  constructor(private readonly overspeedService: OverspeedService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() request: any) {
    return this.overspeedService.create(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.overspeedService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.overspeedService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() request: any) {
    return this.overspeedService.update(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.overspeedService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.overspeedService.restore(id);
  }
}
