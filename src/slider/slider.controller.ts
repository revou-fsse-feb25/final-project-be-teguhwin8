import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SliderService } from './slider.service';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('slider')
export class SliderController {
  constructor(private readonly sliderService: SliderService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createSliderDto: CreateSliderDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.sliderService.create(createSliderDto, file);
  }

  @Get()
  findAll(@Query() request) {
    return this.sliderService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sliderService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateSliderDto: UpdateSliderDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.sliderService.update(id, updateSliderDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sliderService.remove(id);
  }

  // Recovery Mode API
  @Get('deleted/list')
  findAllRecovery(@Query() request) {
    return this.sliderService.findAllRecovery(request);
  }

  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.sliderService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.sliderService.destroy(id);
  }
}
