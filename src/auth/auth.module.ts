import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategy/local.Strategy';
import { JwtStrategy } from './strategy/jwt.Strategy';
import { GlobalService } from 'src/global/global.service';
import { MailService } from 'src/mail/mail/mail.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: process.env.EXPIRED_TOKEN },
    }),
    PassportModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    PrismaService,
    LocalAuthGuard,
    LocalStrategy,
    JwtStrategy,
    GlobalService,
    TypedEventEmitter,
  ],
  exports: [AuthService],
})
export class AuthModule {}
