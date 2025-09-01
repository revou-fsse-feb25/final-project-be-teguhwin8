import { Module } from '@nestjs/common';
import { CareerApplyJobService } from './career-apply-job.service';
import { CareerApplyJobController } from './career-apply-job.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [CareerApplyJobController],
  providers: [CareerApplyJobService, PrismaService, GlobalService],
})
export class CareerApplyJobModule {}
