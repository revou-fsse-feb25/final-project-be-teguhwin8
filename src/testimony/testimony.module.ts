import { Module } from '@nestjs/common';
import { TestimonyService } from './testimony.service';
import { TestimonyController } from './testimony.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [TestimonyController],
  providers: [TestimonyService, PrismaService, GlobalService],
})
export class TestimonyModule {}
