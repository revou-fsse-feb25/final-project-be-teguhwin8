import { Module } from '@nestjs/common';
import { SubscriptionOrderService } from './subscription-order.service';
import { SubscriptionOrderController } from './subscription-order.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { SubscriptionPaymentService } from './utils/subscription-payment.service';

@Module({
  controllers: [SubscriptionOrderController],
  providers: [
    SubscriptionOrderService,
    PrismaService,
    GlobalService,
    SubscriptionPaymentService,
  ],
  exports: [SubscriptionPaymentService],
})
export class SubscriptionOrderModule {}
