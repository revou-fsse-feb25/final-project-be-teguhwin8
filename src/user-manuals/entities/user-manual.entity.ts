import { Features } from '../../features/entities/feature.entity';

class UserManualStep {
  id: string;
  userManualId: string;
  title: string;
  stepNumber: number;
  description: string;
  files: string | string[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserManual {
  id: string;
  title: string;
  featuresId?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  features?: Features;
  steps?: UserManualStep[];
}
