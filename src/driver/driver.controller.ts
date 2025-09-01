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
  UseInterceptors,
  UploadedFiles,
  UnauthorizedException,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CreateDriverDto } from './dto/create-driver.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { CronGuard } from 'src/global/guards/cron.guard';

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'simPhotoUrl', maxCount: 1 },
      { name: 'ktpPhotoUrl', maxCount: 1 },
    ]),
  )
  create(
    @Body() body: CreateDriverDto,
    @UploadedFiles()
    files: {
      simPhotoUrl?: Express.Multer.File[];
      ktpPhotoUrl?: Express.Multer.File[];
    },
  ) {
    return this.driverService.create(body, {
      simPhoto: files?.simPhotoUrl?.[0],
      ktpPhoto: files?.ktpPhotoUrl?.[0],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.driverService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'simPhotoUrl', maxCount: 1 },
      { name: 'ktpPhotoUrl', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() body: UpdateDriverDto,
    @UploadedFiles()
    files: {
      simPhotoUrl?: Express.Multer.File[];
      ktpPhotoUrl?: Express.Multer.File[];
    },
  ) {
    return this.driverService.update(id, body, {
      simPhoto: files?.simPhotoUrl?.[0],
      ktpPhoto: files?.ktpPhotoUrl?.[0],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverService.remove(id);
  }

  // Recovery Mode API
  @UseGuards(JwtAuthGuard)
  @Get('deleted/list')
  findAllRecovery(@Query() request) {
    return this.driverService.findAllRecovery(request);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.driverService.restore(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.driverService.destroy(id);
  }

  // CRON Schedule
  @UseGuards(CronGuard)
  @Get('remind/sim-driver/:token')
  async remindSIMDriver(@Param('token') token: string) {
    if (token !== process.env.CRON_SECRET_TOKEN) {
      throw new UnauthorizedException('Invalid cron token');
    }
    return this.driverService.remindSIMDriver();
  }
}
