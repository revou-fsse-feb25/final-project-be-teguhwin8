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
import { RouteService } from './route.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() request: CreateRouteDto) {
    return this.routeService.create(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.routeService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() request: UpdateRouteDto) {
    return this.routeService.update(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create/point')
  createPoint(@Body() request: any) {
    return this.routeService.createPoint(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update/point')
  updatePoint(@Body() request: any) {
    return this.routeService.updatePoint(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete/point')
  deletePoint(@Body() request: any) {
    return this.routeService.deletePoint(request);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.routeService.restore(id);
  }
}
