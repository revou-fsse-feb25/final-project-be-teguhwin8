import { Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PolicyController],
  providers: [PolicyService, GlobalService, PrismaService],
})
export class PolicyModule {}
