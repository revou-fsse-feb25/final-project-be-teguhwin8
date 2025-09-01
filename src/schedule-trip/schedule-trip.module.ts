import { Module } from '@nestjs/common';
import { ScheduleTripService } from './schedule-trip.service';
import { ScheduleTripController } from './schedule-trip.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [ScheduleTripController],
  providers: [ScheduleTripService, PrismaService, GlobalService],
})
export class ScheduleTripModule {}
