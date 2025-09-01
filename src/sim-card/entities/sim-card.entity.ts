import { $Enums, SimCard as SimCardModel } from '@prisma/client';

export default class SimCardEntity implements SimCardModel {
  status: $Enums.SimCardStatus;
  operator: string;
  id: string;
  deviceId: string;
  telco: string;
  type: string;
  msisdNumber: string;
  simNumber: string;
  description: string;
  activeUntil: string;
  lastUsage: string;
  lastUsageDate: string;
  initialQuota: string;
  lastQuota: string;
  lastQuotaBalance: string;
  lastPulsaBalace: number;
  lastPulsaDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
