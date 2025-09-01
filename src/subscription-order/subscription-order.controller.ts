import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SubscriptionOrderService } from './subscription-order.service';
import { CreateSubscriptionOrderDto } from './dto/create-subscription-order.dto';
import { UpdateSubscriptionOrderDto } from './dto/update-subscription-order.dto';
import { ListSubscriptionOrderDto } from './dto/list-subscription-order.dto';
import { SubscriptionPaymentService } from './utils/subscription-payment.service';

@Controller('subscription-orders')
export class SubscriptionOrderController {
  constructor(
    private readonly service: SubscriptionOrderService,
    private readonly payment: SubscriptionPaymentService,
  ) {}

  @Post()
  create(@Body() dto: CreateSubscriptionOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: ListSubscriptionOrderDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Post('xendit/callback')
  xenditCallback(@Body() payload: any) {
    return this.payment.xenditCallback(payload);
  }
}
