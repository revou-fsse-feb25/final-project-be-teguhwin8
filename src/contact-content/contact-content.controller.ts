import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { ContactContentService } from './contact-content.service';
import { UpdateContactContentDto } from './dto/update-contact-content.dto';

@Controller('contact-content')
export class ContactContentController {
  constructor(private readonly contactContentService: ContactContentService) {}

  @Get()
  findFirst() {
    return this.contactContentService.findFirst();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContactContentDto: UpdateContactContentDto,
  ) {
    return this.contactContentService.update(id, updateContactContentDto);
  }
}
