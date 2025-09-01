import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('sendEmail')
  sendEmail(@Body() body: any) {
    try {
      this.mailService.sendEmailResetPassword(body);

      return { message: 'Email berhasil dikirim' };
    } catch (e) {
      return e;
    }
  }
}
