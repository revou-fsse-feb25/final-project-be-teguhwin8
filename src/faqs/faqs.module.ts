import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FaqsController],
  providers: [FaqsService, GlobalService, PrismaService],
})
export class FaqsModule {}
