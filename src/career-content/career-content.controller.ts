import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  Post,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { CareerContentService } from './career-content.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('career-content')
export class CareerContentController {
  constructor(private readonly careerContentService: CareerContentService) {}

  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Post()
  create(@Body() request: any) {
    console.log('payload', request);
    return this.careerContentService.create(request);
  }

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('lang') lang?: 'id_ID' | 'en_US' | 'multiple',
    @Query('sectionType') sectionType?: string,
  ) {
    return this.careerContentService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sectionType,
      lang: lang,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.careerContentService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @FormDataRequest()
  async update(@Param('id') id: string, @Body() body: any) {
    console.log(body);
    return this.careerContentService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('image-data/:id')
  @FormDataRequest()
  async updateImageData(@Param('id') id: string, @Body() body: any) {
    console.log(body);
    return this.careerContentService.updateImageData(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('image-data/:id')
  @FormDataRequest()
  async createImageData(@Param('id') id: string, @Body() body: any) {
    console.log(body);
    return this.careerContentService.createImageData(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('image-data/:id')
  @FormDataRequest()
  async deleteImageData(@Param('id') id: string) {
    return this.careerContentService.deleteImageData(id);
  }
}
