import { Module } from '@nestjs/common';
import { SimCardService } from './sim-card.service';
import { SimCardController } from './sim-card.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [SimCardController],
  providers: [SimCardService, PrismaService, GlobalService],
})
export class SimCardModule {}
