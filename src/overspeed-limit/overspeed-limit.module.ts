import { Module } from '@nestjs/common';
import { OverspeedLimitService } from './overspeed-limit.service';
import { OverspeedLimitController } from './overspeed-limit.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [OverspeedLimitController],
  providers: [OverspeedLimitService, PrismaService, GlobalService],
})
export class OverspeedLimitModule {}
