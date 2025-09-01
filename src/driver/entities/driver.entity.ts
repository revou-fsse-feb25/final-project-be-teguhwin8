import { $Enums, Driver as DriverModel } from '@prisma/client';

export default class DriverEntity implements DriverModel {
  userId: string | null;
  status: $Enums.SimCardStatus;
  id: string;
  operator: string;
  shift: string;
  code: string;
  name: string;
  vehicleId: string;
  mobilePhone: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  nik: string;
  simNumber: string;
  simPhotoUrl: string;
  ktpPhotoUrl: string;
  simExpiryDate: Date;
}
