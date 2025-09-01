import { Module } from '@nestjs/common';
import { DeviceLogsService } from './device-logs.service';
import { DeviceLogsController } from './device-logs.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  controllers: [DeviceLogsController],
  providers: [DeviceLogsService, PrismaService, GlobalService],
})
export class DeviceLogsModule {}
