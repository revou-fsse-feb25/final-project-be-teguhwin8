import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloads } from 'src/interface/event-types.interface';
import axios from 'axios';
import { UserDeviceService } from 'src/user-device/user-device.service';
@Injectable()
export class OneSignalAppService {
  constructor(private readonly userDeviceService: UserDeviceService) {}

  @OnEvent('oneSignal.createUser')
  async createUpdateUser(data: EventPayloads['oneSignal.createUser']) {
    const { identity, app_id } = data;

    const viewUser = await this.viewUser({
      app_id: app_id,
      alias_label: 'external_id',
      alias_id: identity.external_id,
    });

    console.log('viewUser', viewUser.status);

    if (viewUser.status === false) {
      await this.createUser(data);
    } else {
      await this.updateUser(data);
    }
  }

  async createUser(data: any) {
    const createUser = await this.makeRequest('POST', data.app_id, '/users', {
      properties: data.properties,
      identity: data.identity,
      subscriptions: data.subscriptions,
    });

    console.log('createUser', createUser);

    return createUser;
  }

  async updateUser(data: any) {
    const updateUser = await this.makeRequest(
      'PATCH',
      data.app_id,
      `/users/by/external_id/${data.identity.external_id}`,
      {
        properties: data.properties,
      },
    );

    return updateUser;
  }

  async viewUser(data: any) {
    const user = await this.makeRequest(
      'GET',
      data.app_id,
      `/users/by/${data.alias_label}/${data.alias_id}`,
    );

    return user;
  }

  @OnEvent('oneSignal.createDirectNotification')
  async createDirectNotification(
    data: EventPayloads['oneSignal.createDirectNotification'],
  ) {
    const user = await this.userDeviceService.findByUserId(data.user_id);
    if (!user) return;

    const exernalIds = [];
    exernalIds.push(user.user_id);

    const options = {
      method: 'POST',
      url: 'https://onesignal.com/api/v1/notifications',
      headers: {
        accept: 'application/json',
        Authorization: 'Basic YmQ2ZjdmZGUtNzVhYS00NzFiLTg3NmYtY2VhMjdkNjY5NDQx',
        'content-type': 'application/json',
      },
      data: {
        target_channel: 'push',
        app_id: user.app_id,
        // included_segments: ['Subscribed Users'],
        include_aliases: { external_id: exernalIds },
        contents: {
          en: data.description,
          id: data.description,
        },
        // external_id: data.external_id,
      },
    };

    const sendNotif = await this.makeRequest(
      'POST',
      user.app_id,
      '/notifications',
      null,
      options,
    );

    console.log('sendNotif', sendNotif);
    return sendNotif;
  }

  async makeRequest(
    method: string,
    app_id: string,
    endpoint: string = '',
    data: any = {},
    customOptions: any = null,
  ) {
    console.log('makeRequest', endpoint);
    const options = customOptions ?? {
      method: method,
      url: `https://onesignal.com/api/v1/apps/${app_id}${endpoint}`,
      headers: {
        accept: 'application/json',
        Authorization: 'Basic YmQ2ZjdmZGUtNzVhYS00NzFiLTg3NmYtY2VhMjdkNjY5NDQx',
      },
    };

    const postWithdata = ['POST', 'PATCH', 'PUT'];

    if (postWithdata.includes(method) && !customOptions) {
      options['data'] = data;
    }

    console.log('options', options);

    let result = { status: false, message: '', data: null, errors: null };
    try {
      const request = await axios.request(options);
      result = {
        status: true,
        message: 'Success',
        data: request.data,
        errors: null,
      };
    } catch (error) {
      console.log(error.response.data.errors);
      result = {
        status: false,
        message: error.message,
        data: null,
        errors: error.response.data.errors,
      };
    } finally {
      return result;
    }
  }
}
