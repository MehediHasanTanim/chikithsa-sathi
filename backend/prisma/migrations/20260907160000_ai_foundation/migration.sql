-- CreateEnum
CREATE TYPE "AIRequestStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REJECTED');

-- CreateTable
CREATE TABLE "AIRequest" (
    "id" UUID NOT NULL,
    "chamberId" UUID NOT NULL,
    "patientId" UUID,
    "encounterId" UUID,
    "requestedById" UUID NOT NULL,
    "feature" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "model" VARCHAR(150) NOT NULL,
    "status" "AIRequestStatus" NOT NULL DEFAULT 'PENDING',
    "promptHash" VARCHAR(128) NOT NULL,
    "contextMetadata" JSONB,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "latencyMs" INTEGER,
    "errorCode" VARCHAR(100),
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "disclaimer" VARCHAR(500) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDraft" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "chamberId" UUID NOT NULL,
    "patientId" UUID,
    "encounterId" UUID,
    "draftType" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "disclaimer" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIRequest_chamberId_createdAt_idx" ON "AIRequest"("chamberId", "createdAt");
CREATE INDEX "AIRequest_patientId_createdAt_idx" ON "AIRequest"("patientId", "createdAt");
CREATE INDEX "AIRequest_encounterId_idx" ON "AIRequest"("encounterId");
CREATE INDEX "AIRequest_requestedById_createdAt_idx" ON "AIRequest"("requestedById", "createdAt");
CREATE INDEX "AIRequest_status_createdAt_idx" ON "AIRequest"("status", "createdAt");
CREATE UNIQUE INDEX "AIDraft_requestId_key" ON "AIDraft"("requestId");
CREATE INDEX "AIDraft_chamberId_createdAt_idx" ON "AIDraft"("chamberId", "createdAt");
CREATE INDEX "AIDraft_patientId_createdAt_idx" ON "AIDraft"("patientId", "createdAt");
CREATE INDEX "AIDraft_encounterId_idx" ON "AIDraft"("encounterId");

-- AddForeignKey
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AIRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_chamberId_fkey" FOREIGN KEY ("chamberId") REFERENCES "Chamber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIDraft" ADD CONSTRAINT "AIDraft_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
