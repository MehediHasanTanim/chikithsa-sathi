-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedById" UUID,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" UUID;

-- CreateTable
CREATE TABLE "PrescriptionAmendment" (
    "id" UUID NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "amendedById" UUID NOT NULL,
    "previousVersion" INTEGER NOT NULL,
    "newVersion" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrescriptionAmendment_prescriptionId_createdAt_idx" ON "PrescriptionAmendment"("prescriptionId", "createdAt");

-- AddForeignKey
ALTER TABLE "PrescriptionAmendment" ADD CONSTRAINT "PrescriptionAmendment_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
