import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  findFirst() {
    return this.bannerService.findFirst();
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('imageBanner'))
  async updateFirst(
    @Param('id') id: string,
    @Body() dto: UpdateBannerDto,
    @UploadedFile() imageBanner: Express.Multer.File,
  ) {
    return this.bannerService.updateFirst(id, dto, imageBanner);
  }
}
