/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-auth.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { GlobalService } from 'src/global/global.service';
import { MailService } from '../mail/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailService: MailService,
    private readonly authService: AuthService,
    private readonly globalService: GlobalService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    return await this.authService.register(body);
  }

  // @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() LoginDto: LoginDto) {
    try {
      const result = await this.authService.login(LoginDto);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    try {
      const result = this.mailService.sendEmailResetPassword(body);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    try {
      const result = this.authService.resetPassword(body);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }

  @Post('login-google')
  async loginByGoogle(@Body() body: any) {
    try {
      const result = await this.authService.loginByGoogle(body);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }

  @Post('login-apple')
  async loginByApple(@Body() body: any) {
    try {
      const result = await this.authService.loginByApple(body);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }

  async generateRandomNumber(): Promise<string> {
    const min = 100000;
    const max = 999999;
    const randomOTP = Math.floor(Math.random() * (max - min + 1)) + min;

    return randomOTP.toString();
  }

  @Post('resend-otp')
  async resendOTP(@Body() body: any) {
    try {
      const result = this.mailService.sendEmailResetPassword(body);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }

  @Post('login-whatsapp')
  async loginByWhatsapp(@Body() data: any) {
    try {
      const otp = await this.generateRandomNumber();
      data.otp = otp;
      const result = await this.authService.loginByWhatsapp(data);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }
  
  @Post('verify-otp')
  async verifyOtp(@Body() data: any) {
    return this.authService.verifyOtp(data);
  }

  @Post('verify-pin')
  async verifyPin(@Body() data: any) {
    return this.authService.verifyPin(data);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('merge-account')
  async mergeAccount(@Body() body: { targetUserId: string; sourceUserId: string }) {
    // targetUserId = userId utama (yang dipilih user), sourceUserId = userId sekunder (yang akan di-merge)
    try {
      const result = await this.authService.mergeAccount(body.targetUserId, body.sourceUserId);
      return result;
    } catch (error) {
      console.error('Merge account error:', error);
      throw error;
    }
  }
}
