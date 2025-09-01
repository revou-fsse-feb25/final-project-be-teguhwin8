import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any) {
    return this.orderService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('externalId') externalId?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.orderService.findAll({
      customerId,
      externalId,
      search,
      page: Number(page),
      limit: Number(limit),
      status,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get('check-ticket/:externalId')
  checkTicket(@Param('externalId') externalId: string) {
    return this.orderService.checkTicket(externalId);
  }

  @Get('remind/departure/:token')
  reminderDeparture(@Param('token') token: string) {
    if (token !== process.env.CRON_SECRET_TOKEN) {
      throw new UnauthorizedException('Invalid cron token');
    }
    return this.orderService.reminderDeparture();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.orderService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.orderService.restore(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/invoice')
  xenditCreate(@Body() body: any) {
    return this.orderService.xenditCreate(body);
  }

  @Post('/invoice/callback')
  xenditCallback(@Req() req, @Body() body: any) {
    return this.orderService.xenditCallback(body);
  }

  @Post('/cancel')
  cancel(@Req() req, @Body() body: any) {
    return this.orderService.cancel(body);
  }
}
