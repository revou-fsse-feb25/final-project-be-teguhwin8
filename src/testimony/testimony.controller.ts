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
import { TestimonyService } from './testimony.service';
import { CreateTestimonyDto } from './dto/create-testimony.dto';
import { UpdateTestimonyDto } from './dto/update-testimony.dto';

@Controller('testimony')
export class TestimonyController {
  constructor(private readonly testimonyService: TestimonyService) {}

  @Post()
  create(@Body() createTestimonyDto: CreateTestimonyDto) {
    return this.testimonyService.create(createTestimonyDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    return this.testimonyService.findAll(pageNum, limitNum, search);
  }

  @Get('deleted')
  async findDeleted(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    return this.testimonyService.findDeleted(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testimonyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTestimonyDto: UpdateTestimonyDto,
  ) {
    return this.testimonyService.update(id, updateTestimonyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testimonyService.remove(id);
  }

  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.testimonyService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.testimonyService.destroy(id);
  }
}
