import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Controller('faq')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqsService.create(createFaqDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('lang') lang?: string,
  ) {
    return this.faqsService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
      search,
      category,
      lang,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.faqsService.findOne(id, lang);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.faqsService.update(id, updateFaqDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('hard') hard?: string) {
    return this.faqsService.remove(id, hard === 'true');
  }


  // Recovery Mode API
  @Get('deleted/list')
  findAllRecovery(@Query() request: any) {
    return this.faqsService.findAllRecovery(request);
  }

  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.faqsService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.faqsService.destroy(id);
  }
}
