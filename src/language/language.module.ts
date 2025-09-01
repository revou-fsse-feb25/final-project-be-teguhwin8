import { Module } from '@nestjs/common';
import { LanguageService } from './language.service';
import { LanguageController } from './language.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [LanguageController],
  providers: [LanguageService, PrismaService],
})
export class LanguageModule {}
