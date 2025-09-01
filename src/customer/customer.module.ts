import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { LocalAuthGuard } from 'src/auth/guard/local-auth.guard';
import { LocalStrategy } from 'src/auth/strategy/local.Strategy';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: process.env.EXPIRED_TOKEN },
    }),
    PassportModule,
    PassportModule,
    AuthModule,
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    PrismaService,
    GlobalService,
    LocalAuthGuard,
    LocalStrategy,
    TypedEventEmitter,
  ],
})
export class CustomerModule {}
