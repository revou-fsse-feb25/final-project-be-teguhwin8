import { Module } from '@nestjs/common';
import { ScheduleTripSeatService } from './schedule-trip-seat.service';
import { ScheduleTripSeatController } from './schedule-trip-seat.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [ScheduleTripSeatController],
  providers: [ScheduleTripSeatService, PrismaService, GlobalService],
})
export class ScheduleTripSeatModule {}
