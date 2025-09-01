import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { EmailService } from './email.service';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  @Post('test')
  async test(@Body() body: any) {
    try {
      this.eventEmitter.emit(body.event_name, body.params);
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException();
    }
  }
}
