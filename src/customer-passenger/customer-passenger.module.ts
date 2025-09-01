import { Module } from '@nestjs/common';
import { CustomerPassengerService } from './customer-passenger.service';
import { CustomerPassengerController } from './customer-passenger.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [CustomerPassengerController],
  providers: [CustomerPassengerService, PrismaService, GlobalService],
  exports: [CustomerPassengerService],
})
export class CustomerPassengerModule {}
