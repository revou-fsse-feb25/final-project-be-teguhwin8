/*
  Warnings:

  - You are about to drop the column `description` on the `Notifications` table. All the data in the column will be lost.
  - You are about to drop the column `read_at` on the `Notifications` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notifications` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Notifications` table. All the data in the column will be lost.
  - Added the required column `entityId` to the `Notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'WHATSAPP', 'SMS', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENDING', 'PARTIAL', 'SENT', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELED', 'READ');

-- CreateEnum
CREATE TYPE "AudienceScope" AS ENUM ('GLOBAL', 'ROLE', 'USER');

-- DropForeignKey
ALTER TABLE "Notifications" DROP CONSTRAINT "Notifications_user_id_fkey";

-- AlterTable
ALTER TABLE "Notifications" DROP COLUMN "description",
DROP COLUMN "read_at",
DROP COLUMN "title",
DROP COLUMN "user_id",
ADD COLUMN     "channels" "NotificationChannel"[],
ADD COLUMN     "data" JSONB,
ADD COLUMN     "entityId" TEXT NOT NULL,
ADD COLUMN     "scope" "AudienceScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "sendAt" TIMESTAMP(3),
ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "subjectId" TEXT,
ADD COLUMN     "subjectType" TEXT;

-- CreateTable
CREATE TABLE "NotificationAudienceRole" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "NotificationAudienceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAudienceUser" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "NotificationAudienceUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "provider" TEXT,
    "toAddress" TEXT,
    "templateKey" TEXT,
    "payload" JSONB,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationAudienceRole_roleId_idx" ON "NotificationAudienceRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAudienceRole_notificationId_roleId_key" ON "NotificationAudienceRole"("notificationId", "roleId");

-- CreateIndex
CREATE INDEX "NotificationAudienceUser_userId_idx" ON "NotificationAudienceUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationAudienceUser_notificationId_userId_key" ON "NotificationAudienceUser"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_createdAt_idx" ON "NotificationRecipient"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON "NotificationRecipient"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_recipientId_channel_idx" ON "NotificationDelivery"("recipientId", "channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_createdAt_idx" ON "NotificationDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Notifications_scope_sendAt_idx" ON "Notifications"("scope", "sendAt");

-- CreateIndex
CREATE INDEX "Notifications_status_createdAt_idx" ON "Notifications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Notifications_subjectType_subjectId_idx" ON "Notifications"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "Notifications_entityId_idx" ON "Notifications"("entityId");

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAudienceRole" ADD CONSTRAINT "NotificationAudienceRole_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAudienceRole" ADD CONSTRAINT "NotificationAudienceRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAudienceUser" ADD CONSTRAINT "NotificationAudienceUser_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAudienceUser" ADD CONSTRAINT "NotificationAudienceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "NotificationRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
