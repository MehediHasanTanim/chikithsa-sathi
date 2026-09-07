-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DOCTOR', 'ASSISTANT_DOCTOR', 'RECEPTIONIST', 'CHAMBER_MANAGER', 'BILLING_STAFF', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "ChamberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMITTED');

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OtpVerification" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserSession" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "nameBangla" VARCHAR(200),
    "designation" VARCHAR(200),
    "specialization" VARCHAR(200),
    "subSpecialization" VARCHAR(200),
    "qualifications" JSONB,
    "medicalCollege" VARCHAR(255),
    "bmdcNumber" VARCHAR(100),
    "registrationAuthority" VARCHAR(200),
    "yearsOfExperience" INTEGER,
    "consultationFee" DECIMAL(12,2),
    "bio" TEXT,
    "bioBangla" TEXT,
    "profileImageFileId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalVerification" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" UUID NOT NULL,
    "verificationId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "documentType" VARCHAR(100) NOT NULL,
    "fileName" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamber" (
    "id" UUID NOT NULL,
    "ownerDoctorId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "nameBangla" VARCHAR(200),
    "chamberCode" VARCHAR(50) NOT NULL,
    "addressLine1" VARCHAR(255),
    "addressLine2" VARCHAR(255),
    "area" VARCHAR(150),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "division" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "status" "ChamberStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultCurrency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Dhaka',
    "consultationFee" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Chamber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChamberMembership" (
    "id" UUID NOT NULL,
    "chamberId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invitedById" UUID,
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "doctorProfileId" UUID,

    CONSTRAINT "ChamberMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" UUID NOT NULL,
    "chamberId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "maxPatients" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleBreak" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");

-- CreateIndex
CREATE INDEX "DoctorProfile_specialization_idx" ON "DoctorProfile"("specialization");

-- CreateIndex
CREATE INDEX "DoctorProfile_bmdcNumber_idx" ON "DoctorProfile"("bmdcNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalVerification_doctorId_key" ON "ProfessionalVerification"("doctorId");

-- CreateIndex
CREATE INDEX "ProfessionalVerification_status_idx" ON "ProfessionalVerification"("status");

-- CreateIndex
CREATE INDEX "VerificationDocument_verificationId_idx" ON "VerificationDocument"("verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Chamber_chamberCode_key" ON "Chamber"("chamberCode");

-- CreateIndex
CREATE INDEX "Chamber_ownerDoctorId_idx" ON "Chamber"("ownerDoctorId");

-- CreateIndex
CREATE INDEX "Chamber_status_idx" ON "Chamber"("status");

-- CreateIndex
CREATE INDEX "Chamber_city_district_idx" ON "Chamber"("city", "district");

-- CreateIndex
CREATE INDEX "ChamberMembership_userId_idx" ON "ChamberMembership"("userId");

-- CreateIndex
CREATE INDEX "ChamberMembership_chamberId_role_idx" ON "ChamberMembership"("chamberId", "role");

-- CreateIndex
CREATE INDEX "ChamberMembership_chamberId_status_idx" ON "ChamberMembership"("chamberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChamberMembership_chamberId_userId_key" ON "ChamberMembership"("chamberId", "userId");

-- CreateIndex
CREATE INDEX "Schedule_chamberId_dayOfWeek_idx" ON "Schedule"("chamberId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Schedule_doctorId_dayOfWeek_idx" ON "Schedule"("doctorId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ScheduleBreak_scheduleId_idx" ON "ScheduleBreak"("scheduleId");

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalVerification" ADD CONSTRAINT "ProfessionalVerification_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "ProfessionalVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamber" ADD CONSTRAINT "Chamber_ownerDoctorId_fkey" FOREIGN KEY ("ownerDoctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamberMembership" ADD CONSTRAINT "ChamberMembership_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamberMembership" ADD CONSTRAINT "ChamberMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamberMembership" ADD CONSTRAINT "ChamberMembership_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBreak" ADD CONSTRAINT "ScheduleBreak_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
