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
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CronGuard } from 'src/global/guards/cron.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() request: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehicleService.create(request, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.vehicleService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id') id: string,
    @Body() request: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehicleService.update(id, request, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehicleService.remove(id);
  }

  // Recovery Mode API
  @Get('deleted/list')
  findAllRecovery(@Query() request) {
    return this.vehicleService.findAllRecovery(request);
  }

  @Patch('deleted/restore/:id/:action')
  restore(@Param('id') id: string, @Param('action') action: string) {
    return this.vehicleService.restore(id, action);
  }

  @Delete('deleted/destroy/:id/:action')
  destroy(@Param('id') id: string, @Param('action') action: string) {
    return this.vehicleService.destroy(id, action);
  }

  // Cron Jobs
  @UseGuards(CronGuard)
  @Get('remind/service/:token')
  async remindService(@Param('token') token: string) {
    if (token !== process.env.CRON_SECRET_TOKEN) {
      throw new UnauthorizedException('Invalid cron token');
    }
    return this.vehicleService.remindService();
  }

  @UseGuards(CronGuard)
  @Get('remind/inspection/:token')
  async remindInspection(@Param('token') token: string) {
    if (token !== process.env.CRON_SECRET_TOKEN) {
      throw new UnauthorizedException('Invalid cron token');
    }
    return this.vehicleService.remindInspection();
  }

  @UseGuards(CronGuard)
  @Get('remind/registration/:token')
  async remindRegistration(@Param('token') token: string) {
    if (token !== process.env.CRON_SECRET_TOKEN) {
      throw new UnauthorizedException('Invalid cron token');
    }
    return this.vehicleService.remindRegistration();
  }

  @UseGuards(JwtAuthGuard)
  @Post('/reset/distance/:id')
  resetDistance(@Param('id') id: string, @Body() request: any) {
    return this.vehicleService.resetDistance(id, request);
  }
}
