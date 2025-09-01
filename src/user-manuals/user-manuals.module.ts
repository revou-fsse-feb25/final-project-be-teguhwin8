import { Module } from '@nestjs/common';
import { UserManualsService } from './user-manuals.service';
import { UserManualsController } from './user-manuals.controller';
import { GlobalService } from 'src/global/global.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [NestjsFormDataModule],
  controllers: [UserManualsController],
  providers: [UserManualsService, PrismaService, GlobalService],
})
export class UserManualsModule {}
