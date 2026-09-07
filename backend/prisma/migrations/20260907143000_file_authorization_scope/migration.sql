-- Make file ownership and verification attachments referentially explicit.
-- Legacy verification links without a corresponding file cannot represent an
-- authorized attachment and must be removed before enforcing the foreign key.
DELETE FROM "VerificationDocument" AS verification_document
WHERE NOT EXISTS (
  SELECT 1
  FROM "FileObject" AS file_object
  WHERE file_object."id" = verification_document."fileId"
);

ALTER TABLE "FileObject"
  ADD CONSTRAINT "FileObject_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VerificationDocument"
  ADD CONSTRAINT "VerificationDocument_fileId_fkey"
  FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "DiagnosticReportFile_fileId_idx" ON "DiagnosticReportFile"("fileId");
CREATE INDEX "Receipt_fileId_idx" ON "Receipt"("fileId");
