import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GoogleService } from './google.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateGoogleDto } from './dto/create-google.dto';

@Controller('google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post('calendar')
  @UseGuards(JwtAuthGuard)
  async createGoogleCalendarEvent(
    @Req() req,
    @Body() eventData: CreateGoogleDto,
  ) {
    const email = req.user.email;
    const data = await this.googleService.createGoogleCalendarEvent(
      email,
      eventData,
    );
    return { data };
  }

  @Get('calendar')
  @UseGuards(JwtAuthGuard)
  async getGoogleCalendarData(@Req() req) {
    const email = req.user.email;
    const data = await this.googleService.getGoogleCalendarData(email);
    return { data };
  }

  @Delete('calendar')
  @UseGuards(JwtAuthGuard)
  async deleteGoogleCalendarEvent(
    @Req() req,
    @Query('googleEventId') googleEventId: string,
  ) {
    const email = req.user.email;
    const data = await this.googleService.deleteGoogleCalendarEvent(
      email,
      googleEventId,
    );
    return { data };
  }

  @Patch('calendar')
  @UseGuards(JwtAuthGuard)
  async editGoogleCalendarEvent(
    @Req() req,
    @Query('googleEventId') googleEventId: string,
    @Body() eventData: CreateGoogleDto,
  ) {
    const email = req.user.email;
    const data = await this.googleService.editGoogleCalendarEvent(
      email,
      googleEventId,
      eventData,
    );
    return { data };
  }

  // CALLBACK PERMISSION
  @Get('callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const data = await this.googleService.handleGoogleCallback(code, state);
    return { data };
  }
}
