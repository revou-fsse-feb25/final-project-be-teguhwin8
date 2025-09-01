import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalService } from '../global/global.service';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, PrismaService, GlobalService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
