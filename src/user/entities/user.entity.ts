import { User as UserModel } from '@prisma/client';

export default class UserEntity implements UserModel {
  operatorId: string;
  id: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  phoneNumber: string;
  type: string;
  otp: number;
  isVerifiedOTP: boolean;
  pin: string;
  emailVerifiedAt: Date;
  phoneVerifiedAt: Date;
  googleId: string;
  googleAccessToken: string;
  googleRefreshToken: string;
  googleScopes: string;
  googleTokenExpiryDate: Date;
  syncWithGoogleCalendar: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
