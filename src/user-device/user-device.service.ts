import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GlobalService } from 'src/global/global.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloads } from 'src/interface/event-types.interface';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Injectable()
export class UserDeviceService {
  constructor(
    private prisma: PrismaService,
    private readonly globalService: GlobalService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}
  async create(device: EventPayloads['update-device']) {
    const { user_id, subscription_details } = device;

    const createDevice = await this.prisma.userDevice.create({
      data: {
        user_id: user_id,
        app_id: subscription_details.app_id,
        device_id: subscription_details.device_id,
        language: subscription_details.language,
        time_zone: subscription_details.time_zone,
        country: subscription_details.country,
        first_active_at: Math.floor(Date.now() / 1000),
        subscription_type: subscription_details.subscription_type,
        subscription_enabled: true,
        subscription_device_model:
          subscription_details.subscription_device_model,
        subscription_app_version: subscription_details.subscription_app_version,
        subscription_os_version: subscription_details.subscription_os_version,
      },
    });

    this.eventEmitter.emit('oneSignal.createUser', {
      properties: {
        language: subscription_details.language,
        timezone_id: subscription_details.time_zone,
        country: subscription_details.country,
        first_active: Math.floor(Date.now() / 1000),
        last_active: Math.floor(Date.now() / 1000),
      },
      identity: { external_id: user_id },
      app_id: subscription_details.app_id,
      subscriptions: [
        {
          type: subscription_details.subscription_type,
          token: subscription_details.device_id,
          enabled: true,
          app_version: subscription_details.subscription_app_version,
          device_model: subscription_details.subscription_device_model,
          device_os: subscription_details.subscription_os_version,
        },
      ],
    });

    return this.globalService.response('Successfully', createDevice);
  }

  async findAll() {
    return this.prisma.userDevice.findMany({ where: { deletedAt: null } });
  }

  async findOne(id: string) {
    return this.prisma.userDevice.findUnique({
      where: { id, deletedAt: null },
    });
  }

  update(device: EventPayloads['update-device']) {
    const { user_id, subscription_details } = device;

    if (subscription_details != undefined) {
      this.eventEmitter.emit('oneSignal.createUser', {
        properties: {
          language: subscription_details.language,
          timezone_id: subscription_details.time_zone,
          country: subscription_details.country,
          first_active: Math.floor(Date.now() / 1000),
          last_active: Math.floor(Date.now() / 1000),
        },
        identity: { external_id: user_id },
        app_id: subscription_details.app_id,
        subscriptions: [
          {
            type: subscription_details.subscription_type,
            token: subscription_details.device_id,
            enabled: true,
            app_version: subscription_details.subscription_app_version,
            device_model: subscription_details.subscription_device_model,
            device_os: subscription_details.subscription_os_version,
          },
        ],
      });
    }

    this.eventEmitter.emit('oneSignal.createDirectNotification', {
      user_id: user_id,
      description: 'Test Notification',
      title: 'TEST NOTIFICATION',
    });

    if (subscription_details) {
      return this.prisma.userDevice.update({
        where: { user_id: user_id },
        data: {
          app_id: subscription_details.app_id,
          device_id: subscription_details.device_id,
          language: subscription_details.language,
          time_zone: subscription_details.time_zone,
          country: subscription_details.country,
          last_active_at: Math.floor(Date.now() / 1000),
          subscription_type: subscription_details.subscription_type,
          subscription_enabled: true,
          subscription_device_model:
            subscription_details.subscription_device_model,
          subscription_app_version:
            subscription_details.subscription_app_version,
          subscription_os_version: subscription_details.subscription_os_version,
        },
      });
    }
  }

  async remove(id: string) {
    return this.prisma.userDevice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    try {
      const validate = await this.prisma.userDevice.findUnique({
        where: { id },
      });
      if (!validate || !validate.deletedAt) {
        return this.globalService.response(
          'Data Not Found or Not Deleted!',
          {},
        );
      }
      const restored = await this.prisma.userDevice.update({
        where: { id },
        data: { deletedAt: null },
      });
      return this.globalService.response('Successfully Restored', restored);
    } catch (error) {
      console.error('Something Wrong:', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }

  async findByUserId(userId: string) {
    return this.prisma.userDevice.findFirst({
      where: { user_id: userId, deletedAt: null },
    });
  }

  @OnEvent('update-device')
  async updateOrCreate(device: EventPayloads['update-device']) {
    const { user_id } = device;
    try {
      const checkExistingDevice = await this.findByUserId(user_id);

      if (checkExistingDevice) {
        return this.update(device);
      } else {
        return this.create(device);
      }
    } catch (error) {
      console.error('Something Wrong :', error);
      throw new InternalServerErrorException('Something Wrong!');
    }
  }
}
