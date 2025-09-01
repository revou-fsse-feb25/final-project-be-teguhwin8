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
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { ArticleStatus } from '@prisma/client';

type MulterFile = Express.Multer.File;

@Controller('article')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile() thumbnail?: MulterFile,
  ) {
    return this.articlesService.create({ ...createArticleDto, thumbnail });
  }

  @Get()
  findAll(@Query() request: any) {
    return this.articlesService.findAll(request);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('lang') lang: 'id_ID' | 'en_US' | 'multiple' = 'id_ID',
  ) {
    return this.articlesService.findOne(id, lang);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFile() thumbnail?: MulterFile,
  ) {
    return this.articlesService.update(id, { ...updateArticleDto, thumbnail });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }

  // Recovery Mode API
  @Get('deleted/list')
  findAllRecovery(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,
    @Query('page') page = '1',
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query('limit') limit = '10',
    @Query('lang') lang: 'id_ID' | 'en_US' = 'id_ID',
    @Query('status') status?: ArticleStatus,
  ) {
    return this.articlesService.findAllRecovery({
      category,
      search,
      authorId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sortBy: sortBy as 'createdAt' | 'updatedAt' | 'publishedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
      lang,
      status,
    });
  }

  @Patch('deleted/restore/:id')
  async restore(@Param('id') id: string) {
    return this.articlesService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  async destroy(@Param('id') id: string) {
    return this.articlesService.destroy(id);
  }
}
