-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'AI_ASSISTED', 'REVIEW_REQUIRED', 'FINALIZED', 'DELIVERED', 'AMENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrescriptionItemType" AS ENUM ('MEDICINE', 'INSTRUCTION', 'INVESTIGATION', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicineFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'EVERY_MORNING', 'EVERY_NIGHT', 'EVERY_4_HOURS', 'EVERY_6_HOURS', 'EVERY_8_HOURS', 'EVERY_12_HOURS', 'BEFORE_MEAL', 'AFTER_MEAL', 'AS_NEEDED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'DOSE', 'CUSTOM');

-- CreateTable
CREATE TABLE "Medicine" (
    "id" UUID NOT NULL,
    "genericName" VARCHAR(255) NOT NULL,
    "genericNameBangla" VARCHAR(255),
    "brandName" VARCHAR(255),
    "manufacturer" VARCHAR(255),
    "strength" VARCHAR(100),
    "dosageForm" VARCHAR(100),
    "route" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorMedicineFavorite" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "medicineId" UUID NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorMedicineFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" UUID NOT NULL,
    "prescriptionNumber" VARCHAR(50) NOT NULL,
    "chamberId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "encounterId" UUID NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "language" VARCHAR(10) NOT NULL DEFAULT 'bn',
    "clinicalSummary" TEXT,
    "advice" TEXT,
    "followUpDate" TIMESTAMP(3),
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" UUID NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "medicineId" UUID,
    "itemType" "PrescriptionItemType" NOT NULL DEFAULT 'MEDICINE',
    "medicineName" VARCHAR(255),
    "strength" VARCHAR(100),
    "dosageForm" VARCHAR(100),
    "dosage" VARCHAR(100),
    "frequency" "MedicineFrequency",
    "frequencyText" VARCHAR(255),
    "duration" INTEGER,
    "durationUnit" "DurationUnit",
    "quantity" DECIMAL(10,2),
    "route" VARCHAR(100),
    "instructions" TEXT,
    "instructionsBangla" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Medicine_genericName_idx" ON "Medicine"("genericName");

-- CreateIndex
CREATE INDEX "Medicine_genericNameBangla_idx" ON "Medicine"("genericNameBangla");

-- CreateIndex
CREATE INDEX "Medicine_brandName_idx" ON "Medicine"("brandName");

-- CreateIndex
CREATE INDEX "Medicine_manufacturer_idx" ON "Medicine"("manufacturer");

-- CreateIndex
CREATE INDEX "DoctorMedicineFavorite_doctorId_usageCount_idx" ON "DoctorMedicineFavorite"("doctorId", "usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorMedicineFavorite_doctorId_medicineId_key" ON "DoctorMedicineFavorite"("doctorId", "medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNumber_key" ON "Prescription"("prescriptionNumber");

-- CreateIndex
CREATE INDEX "Prescription_patientId_createdAt_idx" ON "Prescription"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_doctorId_createdAt_idx" ON "Prescription"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_encounterId_idx" ON "Prescription"("encounterId");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_sortOrder_idx" ON "PrescriptionItem"("prescriptionId", "sortOrder");

-- CreateIndex
CREATE INDEX "PrescriptionItem_medicineId_idx" ON "PrescriptionItem"("medicineId");

-- AddForeignKey
ALTER TABLE "DoctorMedicineFavorite" ADD CONSTRAINT "DoctorMedicineFavorite_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorMedicineFavorite" ADD CONSTRAINT "DoctorMedicineFavorite_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
