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
import { GeolocationService } from './geolocation.service';
import { CreateGeolocationDto } from './dto/create-geolocation.dto';
import { UpdateGeolocationDto } from './dto/update-geolocation.dto';

@Controller('geolocation')
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @Post()
  create(@Body() createGeolocationDto: CreateGeolocationDto) {
    return this.geolocationService.create(createGeolocationDto);
  }

  @Get()
  findAll(@Query() request: any) {
    return this.geolocationService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.geolocationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGeolocationDto: UpdateGeolocationDto,
  ) {
    return this.geolocationService.update(id, updateGeolocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.geolocationService.remove(id);
  }
}
