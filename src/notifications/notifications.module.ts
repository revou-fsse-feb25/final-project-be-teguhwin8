import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    GlobalService,
    PrismaService,
    TypedEventEmitter,
  ],
})
export class NotificationsModule {}
