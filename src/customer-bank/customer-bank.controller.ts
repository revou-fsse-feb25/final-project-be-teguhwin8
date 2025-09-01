import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CustomerBankService } from './customer-bank.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('customer-bank')
export class CustomerBankController {
  constructor(private readonly customerBankService: CustomerBankService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() request: any) {
    return this.customerBankService.create(request);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.customerBankService.findAll(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerBankService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() request: any) {
    return this.customerBankService.update(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerBankService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.customerBankService.restore(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bank/code')
  bankCode() {
    return this.customerBankService.bankCode();
  }
}
