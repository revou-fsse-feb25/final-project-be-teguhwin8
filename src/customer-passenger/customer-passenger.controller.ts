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
import { CustomerPassengerService } from './customer-passenger.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('customer-passenger')
export class CustomerPassengerController {
  constructor(
    private readonly customerPassengerService: CustomerPassengerService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    body: {
      customerId: string;
      name?: string;
      phoneNumber?: string;
      address?: string;
    },
  ) {
    return this.customerPassengerService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('customerId') customerId: string) {
    return this.customerPassengerService.findAll(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerPassengerService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; phoneNumber?: string; address?: string },
  ) {
    return this.customerPassengerService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerPassengerService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.customerPassengerService.restore(id);
  }
}
