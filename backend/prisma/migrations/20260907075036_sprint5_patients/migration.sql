-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "patientCode" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100),
    "fullName" VARCHAR(200) NOT NULL,
    "nameBangla" VARCHAR(200),
    "phone" VARCHAR(30),
    "alternatePhone" VARCHAR(30),
    "email" VARCHAR(255),
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(30),
    "bloodGroup" VARCHAR(10),
    "nationalId" VARCHAR(100),
    "addressLine1" VARCHAR(255),
    "addressLine2" VARCHAR(255),
    "area" VARCHAR(150),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "division" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "emergencyName" VARCHAR(200),
    "emergencyPhone" VARCHAR(30),
    "emergencyRelation" VARCHAR(100),
    "profileImageFileId" UUID,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientChamber" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "chamberId" UUID NOT NULL,
    "firstVisitAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientChamber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "allergen" VARCHAR(255) NOT NULL,
    "reaction" VARCHAR(255),
    "severity" VARCHAR(50),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientCondition" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "condition" VARCHAR(255) NOT NULL,
    "diagnosedAt" TIMESTAMP(3),
    "status" VARCHAR(50),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientCode_key" ON "Patient"("patientCode");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE INDEX "Patient_fullName_idx" ON "Patient"("fullName");

-- CreateIndex
CREATE INDEX "Patient_nameBangla_idx" ON "Patient"("nameBangla");

-- CreateIndex
CREATE INDEX "Patient_nationalId_idx" ON "Patient"("nationalId");

-- CreateIndex
CREATE INDEX "PatientChamber_chamberId_lastVisitAt_idx" ON "PatientChamber"("chamberId", "lastVisitAt");

-- CreateIndex
CREATE UNIQUE INDEX "PatientChamber_patientId_chamberId_key" ON "PatientChamber"("patientId", "chamberId");

-- CreateIndex
CREATE INDEX "PatientAllergy_patientId_idx" ON "PatientAllergy"("patientId");

-- CreateIndex
CREATE INDEX "PatientCondition_patientId_idx" ON "PatientCondition"("patientId");

-- AddForeignKey
ALTER TABLE "PatientChamber" ADD CONSTRAINT "PatientChamber_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientChamber" ADD CONSTRAINT "PatientChamber_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCondition" ADD CONSTRAINT "PatientCondition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
