import { Module } from '@nestjs/common';
import { OneSignalAppService } from './one-signal-app.service';
import { UserDeviceService } from 'src/user-device/user-device.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Module({
  providers: [
    PrismaService,
    GlobalService,
    TypedEventEmitter,
    OneSignalAppService,
    UserDeviceService,
  ],
})
export class OneSignalAppModule {}
