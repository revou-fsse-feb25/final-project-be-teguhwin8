import { Controller, Get, Patch, Param, Delete } from '@nestjs/common';
import { UserDeviceService } from './user-device.service';

@Controller('user-device')
export class UserDeviceController {
  constructor(private readonly userDeviceService: UserDeviceService) {}

  @Get()
  findAll() {
    return this.userDeviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userDeviceService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userDeviceService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.userDeviceService.restore(id);
  }
}
