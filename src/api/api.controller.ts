/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { ApiService } from './api.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('/get/token')
  getToken(@Body() request) {
    return this.apiService.getToken(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/sdpairs')
  dataSdPairs() {
    return this.apiService.dataSdPairs();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/search')
  listTrip(@Query() request) {
    return this.apiService.listTrip(request);
  }
}
