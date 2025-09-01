import { UserDeviceInterface } from './user-device.interface';

export interface EventPayloads {
  'register.succeed': {
    name: string;
    otp: string;
    email: string;
  };
  'user.reset-password': { name: string; email: string; link: string };
  'success.reset-password': { name: string; email: string };
  'success.registration-daily': {
    name: string;
    email: string;
    date: string;
    members: Array<any>;
  };
  'success.invitation-registration-on-admin': {
    name: string;
    email: string;
    password: string;
  };
  'success.invitation-registration-on-parent': {
    name: string;
    email: string;
    password: string;
  };
  'success.invitation-registration-on-staff': {
    name: string;
    email: string;
    password: string;
  };
  'success.invitation-registration-on-approved-pickup': {
    name: string;
    email: string;
    password: string;
  };
  'success.payment-customer': {
    name: string;
    email: string;
    link: string;
  };
  'success.payment-finance': {
    name: string;
    email: string;
    link: string;
  };
  'success.payment-expired-reminder': {
    name: string;
    email: string;
    expired_date: string;
    link: string;
  };
  'success.invoice-reminder': {
    name: string;
    email: string;
    expired_date: string;
    link: string;
    amount: string;
  };

  'update-device': {
    user_id: string;
    subscription_details: UserDeviceInterface;
  };

  'oneSignal.createUser': {
    properties?: {
      tags?: { key: string; value: string };
      language: string;
      timezone_id: string;
      lat?: number;
      long?: number;
      country: string;
      first_active?: number;
      last_active?: number;
    };
    identity?: { external_id: string };
    app_id?: string;
    subscriptions?: Array<{
      type?: string;
      token?: string;
      enabled?: boolean;
      session_time?: number;
      session_count?: number;
      app_version?: string;
      device_model?: string;
      device_os?: string;
      sdk?: string;
      rooted?: boolean;
    }>;
  };

  'oneSignal.createDirectNotification': {
    user_id: string;
    description: string;
    title: string;
  };

  'notification.create': {
    user_id: string;
    title: string;
    description: string;
  };
}
