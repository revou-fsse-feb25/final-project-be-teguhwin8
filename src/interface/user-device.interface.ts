export interface UserDeviceInterface {
  id: string;
  user_id?: string;
  app_id?: string;
  device_id?: string;
  language?: string;
  time_zone?: string;
  country?: string;
  first_active_at?: Date;
  last_active_at?: Date;
  subscription_type?: string;
  subscription_enabled?: boolean;
  subscription_app_version?: string;
  subscription_device_model?: string;
  subscription_os_version?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}
