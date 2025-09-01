import { Module } from '@nestjs/common';
import { ScheduleTripPointService } from './schedule-trip-point.service';
import { ScheduleTripPointController } from './schedule-trip-point.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [ScheduleTripPointController],
  providers: [ScheduleTripPointService, PrismaService, GlobalService],
})
export class ScheduleTripPointModule {}
