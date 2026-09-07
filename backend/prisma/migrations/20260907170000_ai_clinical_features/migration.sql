-- Persist the source AI request for every AI-assisted prescription so that
-- clinician review can display durable provenance.
ALTER TABLE "Prescription" ADD COLUMN "aiRequestId" UUID;

CREATE UNIQUE INDEX "Prescription_aiRequestId_key" ON "Prescription"("aiRequestId");

ALTER TABLE "Prescription"
  ADD CONSTRAINT "Prescription_aiRequestId_fkey"
  FOREIGN KEY ("aiRequestId") REFERENCES "AIRequest"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
