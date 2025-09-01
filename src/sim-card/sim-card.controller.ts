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
import { SimCardService } from './sim-card.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('sim-card')
export class SimCardController {
  constructor(private readonly simCardService: SimCardService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() request: any) {
    return this.simCardService.create(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.simCardService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simCardService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() request: any) {
    return this.simCardService.update(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simCardService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.simCardService.restore(id);
  }
}
