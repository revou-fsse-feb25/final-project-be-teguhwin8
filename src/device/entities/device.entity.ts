import { $Enums, Device as DeviceModel } from '@prisma/client';

export default class DeviceEntity implements DeviceModel {
  status: $Enums.SimCardStatus;
  operator: string;
  id: string;
  simcardId: string;
  brand: string;
  type: string;
  name: string;
  imei: string;
  code: string;
  lastLat: string;
  lastLong: string;
  lastLongDate: string;
  initialLat: string;
  initialLong: string;
  initialDate: string;
  mac: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
