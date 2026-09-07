-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('NEW_PATIENT', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL,
    "appointmentCode" VARCHAR(50) NOT NULL,
    "chamberId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "type" "AppointmentType" NOT NULL DEFAULT 'NEW_PATIENT',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'BOOKED',
    "tokenNumber" INTEGER,
    "reason" TEXT,
    "notes" TEXT,
    "bookedByUserId" UUID,
    "checkedInAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_appointmentCode_key" ON "Appointment"("appointmentCode");

-- CreateIndex
CREATE INDEX "Appointment_chamberId_scheduledDate_status_idx" ON "Appointment"("chamberId", "scheduledDate", "status");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_scheduledAt_idx" ON "Appointment"("doctorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_patientId_scheduledAt_idx" ON "Appointment"("patientId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
