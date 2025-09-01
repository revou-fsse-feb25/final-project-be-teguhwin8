import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TranslationService } from './translation.service';
import { UpdateTranslationDto } from './dto/update-translation.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() request) {
    return this.translationService.findAll(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.translationService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTranslationDto: UpdateTranslationDto,
  ) {
    return this.translationService.update(id, updateTranslationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.translationService.remove(id);
  }
}
