import { Module } from '@nestjs/common';
import { ContactMessageService } from './contact-message.service';
import { ContactMessageController } from './contact-message.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [ContactMessageController],
  providers: [ContactMessageService, PrismaService, GlobalService],
})
export class ContactMessageModule {}
