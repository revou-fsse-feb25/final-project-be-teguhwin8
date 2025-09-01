import { Customer as CustomerModel } from '@prisma/client';

export default class CustomerEntity implements CustomerModel {
  id: string;
  code: string;
  userId: string;
  nik: string;
  image: string;
  address: string;
  city: string;
  birthdayDate: string;
  emergencyNumber: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
