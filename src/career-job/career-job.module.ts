import { Module } from '@nestjs/common';
import { CareerJobService } from './career-job.service';
import { CareerJobController } from './career-job.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [CareerJobController],
  providers: [CareerJobService, PrismaService, GlobalService],
})
export class CareerJobModule {}
