import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Patch,
  Query,
  Body,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() request): any {
    return this.notificationsService.findAll(request);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('lang') lang?: string,
    @Query('userId') userId?: string,
  ) {
    return this.notificationsService.findOne(id, lang, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  // Recovery Mode API
  @Get('deleted/list')
  @UseGuards(JwtAuthGuard)
  findAllRecovery(@Query() request) {
    return this.notificationsService.findAllRecovery(request);
  }

  @Patch('deleted/restore/:id')
  restore(@Param('id') id: string) {
    return this.notificationsService.restore(id);
  }

  @Delete('deleted/destroy/:id')
  destroy(@Param('id') id: string) {
    return this.notificationsService.destroy(id);
  }

  @Post('mark-read/:notificationId')
  markAsRead(
    @Param('notificationId') notificationId: string,
    @Body() body: any,
  ) {
    return this.notificationsService.markAsRead(notificationId, body.userId);
  }

  @Post('bulk-mark-read')
  bulkMarkAsRead(@Body() body: any) {
    return this.notificationsService.bulkMarkAsRead(
      body.notificationIds,
      body.userId,
    );
  }
}
