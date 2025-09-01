import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseEnumPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CareerJobService } from './career-job.service';
import { CreateCareerJobDto } from './dto/create-career-job.dto';
import { UpdateCareerJobDto } from './dto/update-career-job.dto';
import {
  CareerSortBy,
  SortOrder,
  LangEnum,
  CareerSortDataBy,
  SortOrderData,
} from './utils/career-job.utils';

@Controller('career-job')
export class CareerJobController {
  constructor(private readonly careerJobService: CareerJobService) {}

  @Post()
  create(@Body() createCareerJobDto: CreateCareerJobDto) {
    return this.careerJobService.create(createCareerJobDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query(
      'lang',
      new DefaultValuePipe(LangEnum.id_ID),
      new ParseEnumPipe(LangEnum),
    )
    lang?: LangEnum,
    @Query(
      'sortBy',
      new DefaultValuePipe(CareerSortDataBy.deletedAt),
      new ParseEnumPipe(CareerSortDataBy),
    )
    sortBy?: CareerSortBy,
    @Query(
      'sortOrder',
      new DefaultValuePipe(SortOrderData.desc),
      new ParseEnumPipe(SortOrderData),
    )
    sortOrder?: SortOrder,
  ) {
    return this.careerJobService.findAll(
      page,
      limit,
      search,
      lang!,
      sortBy!,
      sortOrder!,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.careerJobService.findOne(id, lang);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCareerJobDto: UpdateCareerJobDto,
  ) {
    return this.careerJobService.update(id, updateCareerJobDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('hard') hard?: string) {
    return this.careerJobService.remove(id, hard === 'true');
  }

  // Recovery Mode API
  @Get('deleted/list')
  async findAllRecovery(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query(
      'lang',
      new DefaultValuePipe(LangEnum.id_ID),
      new ParseEnumPipe(LangEnum),
    )
    lang?: LangEnum,
    @Query(
      'sortBy',
      new DefaultValuePipe(CareerSortDataBy.deletedAt),
      new ParseEnumPipe(CareerSortDataBy),
    )
    sortBy?: CareerSortBy,
    @Query(
      'sortOrder',
      new DefaultValuePipe(SortOrderData.desc),
      new ParseEnumPipe(SortOrderData),
    )
    sortOrder?: SortOrder,
  ) {
    return this.careerJobService.findAllRecovery(
      page,
      limit,
      search,
      lang!,
      sortBy!,
      sortOrder!,
    );
  }

  @Patch('deleted/restore/:id')
  async restore(@Param('id') id: string) {
    return this.careerJobService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  async destroy(@Param('id') id: string) {
    return this.careerJobService.destroy(id);
  }
}
