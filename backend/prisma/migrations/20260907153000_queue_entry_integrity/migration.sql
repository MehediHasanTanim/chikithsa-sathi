-- A patient may have at most one active entry in a chamber's queue on a date.
-- Completed, skipped, cancelled, and no-show entries remain as history. The
-- index creation intentionally fails if existing active duplicates require
-- manual clinical-data reconciliation before deployment.
CREATE UNIQUE INDEX "QueueEntry_activePatientPerDay_key"
  ON "QueueEntry"("chamberId", "patientId", "queueDate")
  WHERE "status" IN ('WAITING', 'CALLED', 'IN_CONSULTATION');
