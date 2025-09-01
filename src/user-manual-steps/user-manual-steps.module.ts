import { Module } from '@nestjs/common';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { UserManualStepsService } from './user-manual-steps.service';
import { UserManualStepsController } from './user-manual-steps.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';

@Module({
  imports: [NestjsFormDataModule],
  controllers: [UserManualStepsController],
  providers: [UserManualStepsService, PrismaService, GlobalService],
})
export class UserManualStepsModule {}
