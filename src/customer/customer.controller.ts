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
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() request: any) {
    return this.customerService.create(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request: any) {
    return this.customerService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.customerService.update(id, body, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  @Post('send-otp')
  async sendOtp(@Body() request: any) {
    return this.customerService.sendOtp(request);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body()
    body: any,
  ) {
    return this.customerService.verifyOtp(body);
  }

  // Recovery Mode API
  @Get('deleted/list')
  findAllRecovery(@Query() request: any) {
    return this.customerService.findAllRecovery(request);
  }

  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.customerService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.customerService.destroy(id);
  }

  // GOOGLE CALENDAR
  @Get('google/sync-calendar')
  @UseGuards(JwtAuthGuard)
  async syncGoogleCalendar(@Req() req) {
    console.log(req.user);
    const email = req.user.email;
    const data = await this.customerService.generateGoogleAuthUrl(email);
    return { data };
  }

  @Post('google/create-event')
  @UseGuards(JwtAuthGuard)
  async createGoogleCalendarEvent(@Req() req, @Body() body: any) {
    const email = req.user.email;
    const data = await this.customerService.createGoogleCalendarEvent(
      email,
      body,
    );
    return { data };
  }
}
