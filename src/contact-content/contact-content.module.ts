import { Module } from '@nestjs/common';
import { ContactContentService } from './contact-content.service';
import { ContactContentController } from './contact-content.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [ContactContentController],
  providers: [ContactContentService, PrismaService, GlobalService],
})
export class ContactContentModule {}
