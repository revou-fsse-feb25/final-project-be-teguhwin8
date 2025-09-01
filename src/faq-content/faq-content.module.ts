import { Module } from '@nestjs/common';
import { FaqContentsService } from './faq-content.service';
import { FaqContentsController } from './faq-content.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [FaqContentsController],
  providers: [FaqContentsService, PrismaService, GlobalService],
})
export class FaqContentsModule {}
