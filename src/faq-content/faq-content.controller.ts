import {
  Controller,
  Get,
  Body,
  Patch,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaqContentsService } from './faq-content.service';
import { UpdateFaqContentDto } from './dto/update-faq-content.dto';

@Controller('faq-content')
export class FaqContentsController {
  constructor(private readonly faqContentsService: FaqContentsService) {}

  @Get()
  findOne(@Query() request: any) {
    return this.faqContentsService.findOne(request);
  }

  @Patch()
  @UseInterceptors(FileInterceptor('image'))
  createORupdate(
    @Body() updateFaqContentDto: UpdateFaqContentDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.faqContentsService.createORupdate({
      ...updateFaqContentDto,
      image,
    });
  }
}
