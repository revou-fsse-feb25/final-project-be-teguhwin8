import {
  $Enums,
  Notifications as NotificationModel,
  Prisma,
} from '@prisma/client';
export class NotificationEntity implements NotificationModel {
  entityId: string;
  data: Prisma.JsonValue;
  channels: $Enums.NotificationChannel[];
  status: $Enums.NotificationStatus;
  scope: $Enums.AudienceScope;
  sendAt: Date;
  subjectType: string;
  subjectId: string;
  id: string;
  title: string;
  description: string;
  read_at: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
