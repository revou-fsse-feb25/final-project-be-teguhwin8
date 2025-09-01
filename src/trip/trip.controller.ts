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
import { TripService } from './trip.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() request: any) {
    return this.tripService.create(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.tripService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Query() request) {
    return this.tripService.findOne(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() request: any) {
    return this.tripService.update(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/generate')
  generate(@Body() request: any) {
    return this.tripService.generate(request);
  }

  @Get('/data/list')
  list(@Query() request) {
    return this.tripService.list(request);
  }

  @Get('/data/get/:id')
  getData(@Param('id') id: string) {
    return this.tripService.getData(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/seat/availability')
  setSeatAvailability(
    @Body('tripSeatIds') tripSeatIds: string[],
    @Body('isAvail') isAvail: boolean,
  ) {
    return this.tripService.setSeatAvailability(tripSeatIds, isAvail);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.tripService.restore(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/data/scheduler')
  listScheduler(@Query() request) {
    return this.tripService.listScheduler(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/update/scheduler')
  updateScheduler(@Body() request: any) {
    return this.tripService.updateScheduler(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/data/manifest')
  listManifest(@Query() request) {
    return this.tripService.listManifest(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/data/reservation')
  listReservation(@Query() request) {
    return this.tripService.listReservation(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create/reservation')
  createReservation(@Body() request: any) {
    return this.tripService.createReservation(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/data/reservation/passenger')
  listPassenger(@Query() request: any) {
    return this.tripService.listPassenger(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/data/manifest/spj')
  dataSPJ(@Query() request: any) {
    return this.tripService.dataSPJ(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/update/trip-seat')
  updateTripSeat(@Body() request: any) {
    return this.tripService.updateTripSeat(request);
  }
}
