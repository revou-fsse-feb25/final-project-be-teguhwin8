import { Module } from '@nestjs/common';
import { CareerContentService } from './career-content.service';
import { CareerContentController } from './career-content.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [NestjsFormDataModule],
  controllers: [CareerContentController],
  providers: [CareerContentService, PrismaService, GlobalService],
})
export class CareerContentModule {}
