import { DeviceLogs as DeviceLogs } from '@prisma/client';

export class DeviceLogsEntity implements DeviceLogs {
  id: string;
  batteryVoltage: string;
  engineIgnitionStatus: string;
  eventPriorityEnum: string;
  externalPowersourceVoltage: string;
  gnssStateEnum: string;
  gnssStatus: string;
  gsmOperatorCode: string;
  gsmSignalLevel: string;
  ident: string;
  movementStatus: string;
  positionAltitude: string;
  positionDirection: string;
  positionHdop: string;
  positionLatitude: string;
  positionLongitude: string;
  positionPdop: string;
  positionSatellites: string;
  positionSpeed: string;
  positionValid: string;
  serverTimestamp: string;
  sleepModeEnum: string;
  vehicleMileage: string;
  read_at: string;
  distance: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
