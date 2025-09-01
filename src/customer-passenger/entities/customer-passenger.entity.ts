import { CustomerPassenger as CustomerPassengerModel } from '@prisma/client';

export default class CustomerPassengerEntity implements CustomerPassengerModel {
  id: string;
  customerId: string;
  name: string;
  phoneNumber: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
