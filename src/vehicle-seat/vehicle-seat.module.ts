import { Module } from '@nestjs/common';
import { VehicleSeatService } from './vehicle-seat.service';
import { VehicleSeatController } from './vehicle-seat.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [VehicleSeatController],
  providers: [VehicleSeatService, PrismaService, GlobalService],
})
export class VehicleSeatModule {}
