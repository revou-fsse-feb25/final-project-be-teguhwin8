import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService, GlobalService],
  exports: [OrderService],
})
export class OrderModule {}
