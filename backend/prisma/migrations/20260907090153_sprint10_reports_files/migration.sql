-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADING', 'AVAILABLE', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('PROFILE_PHOTO', 'VERIFICATION_DOCUMENT', 'DIAGNOSTIC_REPORT', 'PRESCRIPTION_ATTACHMENT', 'PATIENT_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DiagnosticReportStatus" AS ENUM ('PENDING', 'AVAILABLE', 'REVIEWED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "FileObject" (
    "id" UUID NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(150) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "category" "FileCategory" NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'UPLOADING',
    "checksum" VARCHAR(128),
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticReport" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "encounterId" UUID NOT NULL,
    "investigationId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "reportDate" TIMESTAMP(3),
    "status" "DiagnosticReportStatus" NOT NULL DEFAULT 'AVAILABLE',
    "summary" TEXT,
    "findings" TEXT,
    "interpretation" TEXT,
    "aiSummary" TEXT,
    "aiAnalysis" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticReportFile" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileObject_storageKey_key" ON "FileObject"("storageKey");

-- CreateIndex
CREATE INDEX "FileObject_category_status_idx" ON "FileObject"("category", "status");

-- CreateIndex
CREATE INDEX "FileObject_uploadedById_idx" ON "FileObject"("uploadedById");

-- CreateIndex
CREATE INDEX "DiagnosticReport_patientId_reportDate_idx" ON "DiagnosticReport"("patientId", "reportDate");

-- CreateIndex
CREATE INDEX "DiagnosticReport_encounterId_idx" ON "DiagnosticReport"("encounterId");

-- CreateIndex
CREATE INDEX "DiagnosticReport_status_idx" ON "DiagnosticReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticReportFile_reportId_fileId_key" ON "DiagnosticReportFile"("reportId", "fileId");

-- AddForeignKey
ALTER TABLE "DiagnosticReport" ADD CONSTRAINT "DiagnosticReport_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticReport" ADD CONSTRAINT "DiagnosticReport_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticReport" ADD CONSTRAINT "DiagnosticReport_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticReportFile" ADD CONSTRAINT "DiagnosticReportFile_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DiagnosticReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticReportFile" ADD CONSTRAINT "DiagnosticReportFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
