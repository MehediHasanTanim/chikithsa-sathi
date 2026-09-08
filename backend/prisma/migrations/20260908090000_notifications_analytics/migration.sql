-- Durable, idempotent notification records for the Sprint 16 worker.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PATIENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PATIENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ENCOUNTER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ENCOUNTER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRESCRIPTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRESCRIPTION_REVIEWED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRESCRIPTION_FINALIZED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRESCRIPTION_DELIVERED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_REFUNDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AI_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AI_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AI_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_INVITED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'STAFF_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PERMISSIONS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'FILE_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'FILE_AVAILABLE';

CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "NotificationType" AS ENUM (
  'APPOINTMENT_CONFIRMATION',
  'APPOINTMENT_REMINDER',
  'QUEUE_UPDATE',
  'PRESCRIPTION_READY',
  'PAYMENT_RECEIPT',
  'STAFF_INVITATION'
);

CREATE TABLE "Notification" (
  "id" UUID NOT NULL,
  "chamberId" UUID,
  "recipientUserId" UUID,
  "recipientPhone" VARCHAR(30),
  "recipientEmail" VARCHAR(255),
  "type" "NotificationType" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "dedupeKey" VARCHAR(255) NOT NULL,
  "payload" JSONB NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_chamberId_createdAt_idx" ON "Notification"("chamberId", "createdAt");
CREATE INDEX "Notification_recipientUserId_createdAt_idx" ON "Notification"("recipientUserId", "createdAt");
CREATE INDEX "Notification_status_scheduledAt_idx" ON "Notification"("status", "scheduledAt");
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_chamberId_fkey"
  FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey"
  FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
