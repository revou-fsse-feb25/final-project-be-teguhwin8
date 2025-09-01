import { Vehicle as VehicleModel } from '@prisma/client';

export default class VehicleEntity implements VehicleModel {
  id: string;
  driverId: string;
  deviceId: string;
  deviceImei: string;
  operator: string;
  type: string;
  name: string;
  licensePlate: string;
  routeId: string;
  description: string;
  totalDistanceMeter: number;
  totalDistanceKiloMeter: number;
  statusDevice: string;
  limitOverSpeed: number;
  seat: number;
  latDateDevice: Date;
  odometerKm: number;
  serviceReminderIntervalKm: number;
  inspectionExpiryDate: Date;
  registrationExpiryDate: Date;
  statusFleet: string;
  thumbnail: string;
  serviceLastNotifiedCycleIndex: number;
  serviceLastNotifiedKm: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
