import { Module } from '@nestjs/common';
import { CustomerBankService } from './customer-bank.service';
import { CustomerBankController } from './customer-bank.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [CustomerBankController],
  providers: [CustomerBankService, PrismaService, GlobalService],
})
export class CustomerBankModule {}
