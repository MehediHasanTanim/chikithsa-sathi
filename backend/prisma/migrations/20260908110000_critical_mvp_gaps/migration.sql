-- Mobile password-reset OTPs, payment balances, notification read state,
-- reusable prescription templates, and generated prescription artifacts.
ALTER TYPE "AuditAction" ADD VALUE 'AUTH_PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'AUTH_PASSWORD_RESET_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'APPOINTMENT_NO_SHOW';
ALTER TYPE "AuditAction" ADD VALUE 'APPOINTMENT_FOLLOW_UP_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'NOTIFICATION_READ';
ALTER TYPE "AuditAction" ADD VALUE 'AUDIT_LOG_EXPORTED';
ALTER TYPE "OtpPurpose" ADD VALUE 'PASSWORD_RESET';
CREATE TYPE "OtpDeliveryChannel" AS ENUM ('SMS', 'EMAIL');

ALTER TABLE "Chamber" ADD COLUMN "followUpFee" DECIMAL(12,2), ADD COLUMN "emergencyDailyCapacity" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Notification" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "Payment"
  ADD COLUMN "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "dueAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "feeAmount" DECIMAL(12,2);
ALTER TABLE "Prescription" ADD COLUMN "pdfFileId" UUID;
ALTER TABLE "OtpVerification" ADD COLUMN "channel" "OtpDeliveryChannel" NOT NULL DEFAULT 'SMS';
ALTER TABLE "AuditLog" ADD COLUMN "chamberId" UUID;
CREATE INDEX "AuditLog_chamberId_createdAt_idx" ON "AuditLog"("chamberId", "createdAt");

-- The application role can append entries only; any mutation or deletion is rejected.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TABLE "PrescriptionTemplate" (
  "id" UUID NOT NULL,
  "doctorId" UUID NOT NULL,
  "chamberId" UUID,
  "name" VARCHAR(150) NOT NULL,
  "clinicalSummary" TEXT,
  "advice" TEXT,
  "followUpDays" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrescriptionTemplateItem" (
  "id" UUID NOT NULL,
  "templateId" UUID NOT NULL,
  "medicineId" UUID,
  "itemType" "PrescriptionItemType" NOT NULL DEFAULT 'MEDICINE',
  "medicineName" VARCHAR(255),
  "strength" VARCHAR(100),
  "dosageForm" VARCHAR(100),
  "dosage" VARCHAR(100),
  "frequency" "MedicineFrequency",
  "frequencyText" VARCHAR(255),
  "durationDays" INTEGER,
  "durationText" VARCHAR(255),
  "instruction" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrescriptionTemplateItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrescriptionTemplate_doctorId_chamberId_isActive_idx" ON "PrescriptionTemplate"("doctorId", "chamberId", "isActive");
CREATE INDEX "PrescriptionTemplateItem_templateId_sortOrder_idx" ON "PrescriptionTemplateItem"("templateId", "sortOrder");
CREATE INDEX "Notification_recipientUserId_readAt_createdAt_idx" ON "Notification"("recipientUserId", "readAt", "createdAt");
CREATE UNIQUE INDEX "Prescription_pdfFileId_key" ON "Prescription"("pdfFileId");

ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_pdfFileId_fkey" FOREIGN KEY ("pdfFileId") REFERENCES "FileObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrescriptionTemplate" ADD CONSTRAINT "PrescriptionTemplate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrescriptionTemplate" ADD CONSTRAINT "PrescriptionTemplate_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrescriptionTemplateItem" ADD CONSTRAINT "PrescriptionTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrescriptionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrescriptionTemplateItem" ADD CONSTRAINT "PrescriptionTemplateItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
