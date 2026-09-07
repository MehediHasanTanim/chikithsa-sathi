-- A doctor may have only one appointment at a given instant. Do not remove
-- historical duplicate appointments automatically: the unique-index creation
-- will fail visibly if data remediation is required before deployment.
DROP INDEX "Appointment_doctorId_scheduledAt_idx";

CREATE UNIQUE INDEX "Appointment_doctorId_scheduledAt_key"
  ON "Appointment"("doctorId", "scheduledAt");
