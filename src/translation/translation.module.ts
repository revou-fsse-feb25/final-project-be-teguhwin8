import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TranslationController],
  providers: [TranslationService, GlobalService, PrismaService],
})
export class TranslationModule {}
