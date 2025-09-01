import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFiles,
  Post,
  Query,
} from '@nestjs/common';
import { AboutsService } from './abouts.service';
import { UpdateAboutDto } from './dto/update-about.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateAboutDto } from './dto/create-about.dto';

@Controller('abouts')
export class AboutsController {
  constructor(private readonly aboutsService: AboutsService) {}

  @Get()
  findFirst(@Query('lang') lang: 'id_ID' | 'en_US' | 'multiple' = 'id_ID') {
    return this.aboutsService.findFirst(lang);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageBanner', maxCount: 1 },
      { name: 'imageAbout', maxCount: 1 },
    ]),
  )
  async create(
    @Body() dto: CreateAboutDto,
    @UploadedFiles()
    files: {
      imageBanner?: Express.Multer.File[];
      imageAbout?: Express.Multer.File[];
    },
  ) {
    return this.aboutsService.createFirst(dto, {
      imageBanner: files.imageBanner?.[0],
      imageAbout: files.imageAbout?.[0],
    });
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageBanner', maxCount: 1 },
      { name: 'imageAbout', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAboutDto,
    @UploadedFiles()
    files: {
      imageBanner?: Express.Multer.File[];
      imageAbout?: Express.Multer.File[];
    },
  ) {
    return this.aboutsService.updateFirst(id, dto, {
      imageBanner: files.imageBanner?.[0],
      imageAbout: files.imageAbout?.[0],
    });
  }
}
