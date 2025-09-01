import { Module } from '@nestjs/common';
import { OverspeedService } from './overspeed.service';
import { OverspeedController } from './overspeed.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [OverspeedController],
  providers: [OverspeedService, PrismaService, GlobalService],
})
export class OverspeedModule {}
