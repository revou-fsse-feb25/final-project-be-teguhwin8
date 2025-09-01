import { Module } from '@nestjs/common';
import { UserDeviceService } from './user-device.service';
import { UserDeviceController } from './user-device.controller';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Module({
  controllers: [UserDeviceController],
  providers: [
    UserDeviceService,
    GlobalService,
    PrismaService,
    TypedEventEmitter,
  ],
})
export class UserDeviceModule {}
