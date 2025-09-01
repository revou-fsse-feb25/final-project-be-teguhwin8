import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { JwtStrategy } from 'src/auth/strategy/jwt.Strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from 'src/auth/auth.module';
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
    AuthModule,
  ],
  controllers: [ApiController],
  providers: [
    ApiService,
    PrismaService,
    GlobalService,
    JwtStrategy,
    LocalAuthGuard,
    LocalStrategy,
    TypedEventEmitter,
  ],
})
export class ApiModule {}
