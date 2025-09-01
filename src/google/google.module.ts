import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleController } from './google.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [GoogleController],
  providers: [GoogleService, GlobalService, PrismaService],
})
export class GoogleModule {}
