import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { CareerApplyJobService } from './career-apply-job.service';
import { CreateCareerApplyJobDto } from './dto/create-career-apply-job.dto';
import { UpdateCareerApplyJobDto } from './dto/update-career-apply-job.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('career-apply-job')
export class CareerApplyJobController {
  constructor(private readonly careerApplyJobService: CareerApplyJobService) { }

  @Post()
  @UseInterceptors(FileInterceptor('portfolioFile'))
  async create(
    @Body() createCareerApplyJobDto: CreateCareerApplyJobDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.careerApplyJobService.create(createCareerApplyJobDto, file);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('lang') lang: 'id_ID' | 'en_US' | 'multiple' = 'id_ID',
  ) {
    return this.careerApplyJobService.findAll(page, limit, search, lang);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('lang', new ParseEnumPipe(['id_ID', 'en_US', 'multiple'] as const))
    lang: 'id_ID' | 'en_US' | 'multiple' = 'id_ID',
  ) {
    return this.careerApplyJobService.findOne(id, lang);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('portfolioFile'))
  async update(
    @Param('id') id: string,
    @Body() updateCareerApplyJobDto: UpdateCareerApplyJobDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.careerApplyJobService.update(id, updateCareerApplyJobDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.careerApplyJobService.remove(id);
  }

  // Recovery Mode API
  @Get('deleted/list')
  findAllRecovery(@Query() request: any) {
    return this.careerApplyJobService.findAllRecovery(request);
  }

  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.careerApplyJobService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.careerApplyJobService.destroy(id);
  }


}
