# Chamber Management
## Document 11 — Complete Compile-Ready Prisma Schema

**Version:** 1.0  
**Status:** Implementation Ready  
**Backend:** NestJS + TypeScript + Fastify  
**ORM:** Prisma  
**Database:** PostgreSQL  
**Primary Time Zone:** `Asia/Dhaka`  
**API Version:** `/api/v1`

---

# 1. Purpose

This document contains the complete baseline Prisma schema for the Chamber Management platform.

The schema is designed to support:

- Multiple doctors
- Multiple chambers per doctor
- Chamber-specific staff
- Assistant doctors
- Role-based permissions
- Patient management
- Patient/chamber relationships
- Family relationships
- Appointments
- Daily queues
- Clinical encounters
- Vitals
- Clinical notes
- Diagnoses
- Investigations
- Diagnostic reports
- File management
- Medicines
- Prescription creation
- AI-assisted prescriptions
- Prescription finalization
- Prescription amendments
- Payments
- Refunds
- Receipts
- Notifications
- AI requests and drafts
- Analytics/export jobs
- Subscriptions
- Audit logging

The database follows these fundamental principles:

1. PostgreSQL is the source of truth.
2. Internal database IDs use UUIDs.
3. Business identifiers are separate from internal IDs.
4. Chamber-level access is enforced by the application.
5. Clinical records are never hard-deleted.
6. Finalized prescriptions are immutable.
7. Corrections use amendments/versioning.
8. AI output is stored separately from official clinical records.
9. Money uses `Decimal`.
10. Timestamps are stored in UTC.
11. Bangladesh-local business dates are explicitly represented where required.
12. Critical workflows use database transactions.
13. Audit logs are append-only.
14. Multi-chamber data isolation is mandatory.

---

# 2. Prisma Generator and Database

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Recommended PostgreSQL extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

`pgcrypto` is useful for UUID generation and `pg_trgm` is recommended for Bangla/English text search.

---

# 3. Common Conventions

## 3.1 Primary Keys

All internal IDs use UUID:

```prisma
id String @id @default(uuid()) @db.Uuid
```

Business identifiers such as:

- `patientCode`
- `appointmentCode`
- `prescriptionNumber`
- `receiptNumber`
- `queueNumber`

must not be used as primary keys.

---

# 4. Enumerations

## 4.1 User Status

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}
```

## 4.2 User Role

```prisma
enum UserRole {
  DOCTOR
  ASSISTANT_DOCTOR
  RECEPTIONIST
  CHAMBER_MANAGER
  BILLING_STAFF
  PLATFORM_ADMIN
}
```

## 4.3 Chamber Status

```prisma
enum ChamberStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  ARCHIVED
}
```

## 4.4 Membership Status

```prisma
enum MembershipStatus {
  INVITED
  ACTIVE
  SUSPENDED
  REMOVED
}
```

## 4.5 Verification Status

```prisma
enum VerificationStatus {
  NOT_SUBMITTED
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  RESUBMITTED
}
```

## 4.6 Appointment Status

```prisma
enum AppointmentStatus {
  BOOKED
  CONFIRMED
  CHECKED_IN
  IN_QUEUE
  IN_CONSULTATION
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

## 4.7 Appointment Type

```prisma
enum AppointmentType {
  NEW_PATIENT
  FOLLOW_UP
  EMERGENCY
  ROUTINE
}
```

## 4.8 Queue Status

```prisma
enum QueueStatus {
  WAITING
  CALLED
  IN_CONSULTATION
  COMPLETED
  SKIPPED
  CANCELLED
  NO_SHOW
}
```

## 4.9 Encounter Status

```prisma
enum EncounterStatus {
  DRAFT
  IN_PROGRESS
  READY_FOR_REVIEW
  COMPLETED
  LOCKED
}
```

## 4.10 Clinical Note Type

```prisma
enum ClinicalNoteType {
  HISTORY
  EXAMINATION
  ASSESSMENT
  PLAN
  GENERAL
}
```

## 4.11 Diagnosis Type

```prisma
enum DiagnosisType {
  PRIMARY
  SECONDARY
  DIFFERENTIAL
}
```

## 4.12 Investigation Status

```prisma
enum InvestigationStatus {
  ORDERED
  SAMPLE_COLLECTED
  PROCESSING
  COMPLETED
  CANCELLED
}
```

## 4.13 Report Status

```prisma
enum DiagnosticReportStatus {
  PENDING
  AVAILABLE
  REVIEWED
  ARCHIVED
}
```

## 4.14 File Status

```prisma
enum FileStatus {
  UPLOADING
  AVAILABLE
  FAILED
  DELETED
}
```

## 4.15 File Category

```prisma
enum FileCategory {
  PROFILE_PHOTO
  VERIFICATION_DOCUMENT
  DIAGNOSTIC_REPORT
  PRESCRIPTION_ATTACHMENT
  PATIENT_DOCUMENT
  OTHER
}
```

## 4.16 Prescription Status

```prisma
enum PrescriptionStatus {
  DRAFT
  AI_ASSISTED
  REVIEW_REQUIRED
  FINALIZED
  DELIVERED
  AMENDED
  CANCELLED
}
```

## 4.17 Prescription Item Type

```prisma
enum PrescriptionItemType {
  MEDICINE
  INSTRUCTION
  INVESTIGATION
  REFERRAL
  OTHER
}
```

## 4.18 Frequency Type

```prisma
enum MedicineFrequency {
  ONCE_DAILY
  TWICE_DAILY
  THREE_TIMES_DAILY
  FOUR_TIMES_DAILY
  EVERY_MORNING
  EVERY_NIGHT
  EVERY_4_HOURS
  EVERY_6_HOURS
  EVERY_8_HOURS
  EVERY_12_HOURS
  BEFORE_MEAL
  AFTER_MEAL
  AS_NEEDED
  CUSTOM
}
```

## 4.19 Prescription Duration Unit

```prisma
enum DurationUnit {
  DAY
  WEEK
  MONTH
  DOSE
  CUSTOM
}
```

## 4.20 Payment Status

```prisma
enum PaymentStatus {
  PENDING
  PAID
  PARTIALLY_REFUNDED
  REFUNDED
  FAILED
  CANCELLED
}
```

## 4.21 Payment Method

```prisma
enum PaymentMethod {
  CASH
  CARD
  MOBILE_BANKING
  BANK_TRANSFER
  OTHER
}
```

## 4.22 Refund Status

```prisma
enum RefundStatus {
  REQUESTED
  APPROVED
  PROCESSED
  FAILED
  CANCELLED
}
```

## 4.23 Notification Type

```prisma
enum NotificationType {
  APPOINTMENT
  QUEUE
  PAYMENT
  PRESCRIPTION
  SYSTEM
  AI
  SECURITY
}
```

## 4.24 NotificationChannel

```prisma
enum NotificationChannel {
  IN_APP
  PUSH
  SMS
  EMAIL
}
```

## 4.25 AI Request Type

```prisma
enum AIRequestType {
  PATIENT_SUMMARY
  CLINICAL_CHAT
  PRESCRIPTION_DRAFT
  REPORT_ANALYSIS
  VOICE_NOTE
  DOCUMENTATION
}
```

## 4.26 AI Request Status

```prisma
enum AIRequestStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

## 4.27 AI Draft Status

```prisma
enum AIDraftStatus {
  GENERATED
  REVIEWED
  ACCEPTED
  REJECTED
  EXPIRED
}
```

## 4.28 Export Status

```prisma
enum ExportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}
```

## 4.29 Subscription Status

```prisma
enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
}
```

## 4.30 Audit Action

```prisma
enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  VERIFY
  FINALIZE
  AMEND
  CANCEL
  REFUND
  EXPORT
  AI_GENERATE
  AI_ACCEPT
  AI_REJECT
  INVITE
  ROLE_CHANGE
  STATUS_CHANGE
}
```

---

# 5. User and Authentication Models

## 5.1 User

```prisma
model User {
  id                String     @id @default(uuid()) @db.Uuid
  phone             String     @unique @db.VarChar(30)
  email             String?    @unique @db.VarChar(255)
  passwordHash      String?
  firstName         String     @db.VarChar(100)
  lastName          String?    @db.VarChar(100)
  displayName       String?    @db.VarChar(200)
  status            UserStatus @default(ACTIVE)
  preferredLanguage String     @default("bn") @db.VarChar(10)
  lastLoginAt       DateTime?

  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  deletedAt         DateTime?

  doctorProfile     DoctorProfile?
  sessions          Session[]
  memberships       ChamberMembership[]
  professionalReviews ProfessionalVerification[] @relation("VerificationReviewer")
  auditLogs         AuditLog[]
  notifications     Notification[]
  aiRequests        AIRequest[]
  exports           ExportJob[]
  familyMembers     FamilyMember[] @relation("FamilyMemberUser")
  createdPatients   Patient[] @relation("PatientCreatedBy")

  @@index([status])
  @@index([phone])
  @@index([email])
}
```

---

# 6. Session

```prisma
model Session {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @db.Uuid
  refreshTokenHash String
  expiresAt    DateTime
  revokedAt    DateTime?
  ipAddress    String?  @db.VarChar(100)
  userAgent    String?  @db.Text

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

---

# 7. Doctor Models

## 7.1 DoctorProfile

```prisma
model DoctorProfile {
  id                  String   @id @default(uuid()) @db.Uuid
  userId              String   @unique @db.Uuid

  fullName            String   @db.VarChar(200)
  nameBangla          String?  @db.VarChar(200)
  designation         String?  @db.VarChar(200)
  specialization      String?  @db.VarChar(200)
  subSpecialization   String?  @db.VarChar(200)

  medicalCollege      String?  @db.VarChar(255)
  degree              String?  @db.VarChar(255)
  registrationNumber  String?  @db.VarChar(100)
  registrationAuthority String? @db.VarChar(200)

  yearsOfExperience   Int?
  consultationFee     Decimal? @db.Decimal(12, 2)

  bio                 String?  @db.Text
  bioBangla           String?  @db.Text

  profileImageFileId  String?  @db.Uuid

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User @relation(fields: [userId], references: [id], onDelete: Cascade)
  verification        ProfessionalVerification?
  profileImage        FileObject? @relation("DoctorProfileImage", fields: [profileImageFileId], references: [id])

  chambersOwned       Chamber[] @relation("ChamberOwner")
  chamberMemberships  ChamberMembership[]
  schedules            Schedule[]
  favoriteMedicines    DoctorMedicineFavorite[]
  createdPrescriptions Prescription[] @relation("PrescriptionDoctor")
  reviewedPrescriptions Prescription[] @relation("PrescriptionReviewer")

  @@index([specialization])
  @@index([registrationNumber])
}
```

---

# 8. Professional Verification

```prisma
model ProfessionalVerification {
  id              String             @id @default(uuid()) @db.Uuid
  doctorId        String             @unique @db.Uuid

  status          VerificationStatus @default(NOT_SUBMITTED)
  submittedAt     DateTime?
  reviewedAt      DateTime?
  reviewedById   String?            @db.Uuid

  rejectionReason String?            @db.Text
  notes           String?            @db.Text

  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  doctor          DoctorProfile      @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  reviewedBy      User?              @relation("VerificationReviewer", fields: [reviewedById], references: [id])
  documents       VerificationDocument[]

  @@index([status])
  @@index([reviewedById])
}
```

---

# 9. Verification Documents

```prisma
model VerificationDocument {
  id             String   @id @default(uuid()) @db.Uuid
  verificationId String   @db.Uuid
  fileId         String   @db.Uuid
  documentType   String   @db.VarChar(100)

  createdAt      DateTime @default(now())

  verification   ProfessionalVerification @relation(fields: [verificationId], references: [id], onDelete: Cascade)
  file            FileObject @relation(fields: [fileId], references: [id])

  @@index([verificationId])
}
```

---

# 10. Chamber

```prisma
model Chamber {
  id              String        @id @default(uuid()) @db.Uuid
  ownerDoctorId   String        @db.Uuid

  name            String        @db.VarChar(200)
  nameBangla      String?       @db.VarChar(200)

  chamberCode     String        @unique @db.VarChar(50)

  addressLine1    String?       @db.VarChar(255)
  addressLine2    String?       @db.VarChar(255)
  area            String?       @db.VarChar(150)
  city            String?       @db.VarChar(100)
  district        String?       @db.VarChar(100)
  division        String?       @db.VarChar(100)
  postalCode      String?       @db.VarChar(20)

  phone           String?       @db.VarChar(30)
  email           String?       @db.VarChar(255)

  status          ChamberStatus @default(ACTIVE)

  defaultCurrency String        @default("BDT") @db.VarChar(10)
  timezone        String        @default("Asia/Dhaka") @db.VarChar(100)

  consultationFee Decimal?      @db.Decimal(12, 2)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  owner           DoctorProfile @relation("ChamberOwner", fields: [ownerDoctorId], references: [id])
  memberships     ChamberMembership[]
  schedules       Schedule[]
  patients        PatientChamber[]
  appointments    Appointment[]
  queueEntries    QueueEntry[]
  queueCounters   DailyQueueCounter[]
  encounters      Encounter[]
  payments        Payment[]
  notifications   Notification[]
  auditLogs       AuditLog[]
  exports         ExportJob[]
  subscriptions   Subscription[]

  @@index([ownerDoctorId])
  @@index([status])
  @@index([city, district])
}
```

---

# 11. Chamber Membership

```prisma
model ChamberMembership {
  id          String           @id @default(uuid()) @db.Uuid
  chamberId   String           @db.Uuid
  userId      String           @db.Uuid

  role        UserRole
  status      MembershipStatus @default(INVITED)

  invitedById String?          @db.Uuid
  invitedAt   DateTime?
  joinedAt    DateTime?
  removedAt   DateTime?

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  chamber     Chamber          @relation(fields: [chamberId], references: [id], onDelete: Cascade)
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([chamberId, userId])
  @@index([userId])
  @@index([chamberId, role])
  @@index([chamberId, status])
}
```

---

# 12. Roles and Permissions

## 12.1 Role

```prisma
model Role {
  id          String       @id @default(uuid()) @db.Uuid
  name        String       @unique @db.VarChar(100)
  description String?      @db.Text
  isSystem    Boolean      @default(true)

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  permissions RolePermission[]
}
```

## 12.2 Permission

```prisma
model Permission {
  id          String       @id @default(uuid()) @db.Uuid
  code        String       @unique @db.VarChar(150)
  description String?     @db.Text

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  roles       RolePermission[]
}
```

## 12.3 RolePermission

```prisma
model RolePermission {
  id           String     @id @default(uuid()) @db.Uuid
  roleId       String     @db.Uuid
  permissionId String     @db.Uuid

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}
```

---

# 13. Schedule

A schedule belongs to both a chamber and a doctor.

This is important because one chamber may contain multiple doctors.

```prisma
model Schedule {
  id          String   @id @default(uuid()) @db.Uuid
  chamberId   String   @db.Uuid
  doctorId    String   @db.Uuid

  dayOfWeek   Int
  startTime   String   @db.VarChar(5)
  endTime     String   @db.VarChar(5)

  slotDurationMinutes Int @default(15)
  maxPatients         Int?

  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  chamber     Chamber      @relation(fields: [chamberId], references: [id], onDelete: Cascade)
  doctor      DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  breaks      ScheduleBreak[]

  @@index([chamberId, dayOfWeek])
  @@index([doctorId, dayOfWeek])
}
```

---

# 14. Schedule Break

```prisma
model ScheduleBreak {
  id         String   @id @default(uuid()) @db.Uuid
  scheduleId String   @db.Uuid

  startTime  String   @db.VarChar(5)
  endTime    String   @db.VarChar(5)
  reason     String?  @db.VarChar(255)

  createdAt  DateTime @default(now())

  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@index([scheduleId])
}
```

---

# 15. Patient

Patients represent the global patient identity.

```prisma
model Patient {
  id              String   @id @default(uuid()) @db.Uuid

  patientCode     String   @unique @db.VarChar(50)

  firstName       String   @db.VarChar(100)
  lastName        String?  @db.VarChar(100)
  fullName        String   @db.VarChar(200)
  nameBangla      String?  @db.VarChar(200)

  phone           String?  @db.VarChar(30)
  alternatePhone  String?  @db.VarChar(30)
  email           String?  @db.VarChar(255)

  dateOfBirth     DateTime?
  gender          String?  @db.VarChar(30)
  bloodGroup      String?  @db.VarChar(10)

  nationalId      String?  @db.VarChar(100)

  addressLine1    String?  @db.VarChar(255)
  addressLine2    String?  @db.VarChar(255)
  area            String?  @db.VarChar(150)
  city            String?  @db.VarChar(100)
  district        String?  @db.VarChar(100)
  division        String?  @db.VarChar(100)
  postalCode      String?  @db.VarChar(20)

  emergencyName   String?  @db.VarChar(200)
  emergencyPhone  String?  @db.VarChar(30)
  emergencyRelation String? @db.VarChar(100)

  profileImageFileId String? @db.Uuid

  createdById      String?  @db.Uuid

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?

  profileImage     FileObject? @relation("PatientProfileImage", fields: [profileImageFileId], references: [id])
  createdBy        User? @relation("PatientCreatedBy", fields: [createdById], references: [id])

  chambers         PatientChamber[]
  families         FamilyMember[]
  allergies        PatientAllergy[]
  conditions       PatientCondition[]
  appointments     Appointment[]
  queueEntries     QueueEntry[]
  encounters       Encounter[]
  vitals           Vital[]
  diagnosticReports DiagnosticReport[]
  files            PatientFile[]
  prescriptions    Prescription[]
  payments         Payment[]

  @@index([phone])
  @@index([fullName])
  @@index([nameBangla])
  @@index([nationalId])
}
```

---

# 16. Patient-Chamber Relationship

```prisma
model PatientChamber {
  id          String   @id @default(uuid()) @db.Uuid
  patientId   String   @db.Uuid
  chamberId   String   @db.Uuid

  firstVisitAt DateTime?
  lastVisitAt  DateTime?
  visitCount   Int      @default(0)

  notes       String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  chamber     Chamber  @relation(fields: [chamberId], references: [id], onDelete: Cascade)

  @@unique([patientId, chamberId])
  @@index([chamberId, lastVisitAt])
}
```

---

# 17. Family

```prisma
model Family {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(200)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     FamilyMember[]
}
```

---

# 18. FamilyMember

```prisma
model FamilyMember {
  id          String   @id @default(uuid()) @db.Uuid
  familyId    String   @db.Uuid

  patientId   String?  @db.Uuid
  userId      String?  @db.Uuid

  relationship String? @db.VarChar(100)
  isPrimary    Boolean @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  family      Family   @relation(fields: [familyId], references: [id], onDelete: Cascade)
  patient     Patient? @relation(fields: [patientId], references: [id], onDelete: Cascade)
  user        User?    @relation("FamilyMemberUser", fields: [userId], references: [id])

  @@index([familyId])
  @@index([patientId])
  @@index([userId])
}
```

---

# 19. Patient Allergy

```prisma
model PatientAllergy {
  id          String   @id @default(uuid()) @db.Uuid
  patientId   String   @db.Uuid

  allergen    String   @db.VarChar(255)
  reaction    String?  @db.VarChar(255)
  severity    String?  @db.VarChar(50)
  notes       String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
}
```

---

# 20. Patient Condition

```prisma
model PatientCondition {
  id          String   @id @default(uuid()) @db.Uuid
  patientId   String   @db.Uuid

  condition   String   @db.VarChar(255)
  diagnosedAt DateTime?
  status      String?  @db.VarChar(50)
  notes       String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
}
```

---

# 21. Appointment

```prisma
model Appointment {
  id              String            @id @default(uuid()) @db.Uuid

  appointmentCode String            @unique @db.VarChar(50)

  chamberId       String            @db.Uuid
  patientId       String            @db.Uuid
  doctorId        String            @db.Uuid

  scheduledAt     DateTime
  scheduledDate   DateTime          @db.Date

  type            AppointmentType   @default(NEW_PATIENT)
  status          AppointmentStatus @default(BOOKED)

  tokenNumber     Int?

  reason          String?           @db.Text
  notes           String?           @db.Text

  bookedByUserId  String?           @db.Uuid

  checkedInAt     DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancellationReason String?        @db.Text

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  chamber         Chamber           @relation(fields: [chamberId], references: [id])
  patient         Patient           @relation(fields: [patientId], references: [id])
  doctor          DoctorProfile     @relation(fields: [doctorId], references: [id])
  queueEntry      QueueEntry?
  encounter       Encounter?
  bookedBy        User?             @relation(fields: [bookedByUserId], references: [id])

  @@index([chamberId, scheduledDate, status])
  @@index([doctorId, scheduledAt])
  @@index([patientId, scheduledAt])
}
```

> `DoctorProfile` should include:
>
> ```prisma
> appointments Appointment[]
> ```

---

# 22. Daily Queue Counter

This model prevents race conditions caused by `MAX(queueNumber) + 1`.

```prisma
model DailyQueueCounter {
  id          String   @id @default(uuid()) @db.Uuid

  chamberId   String   @db.Uuid
  queueDate   DateTime @db.Date

  lastNumber  Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  chamber     Chamber  @relation(fields: [chamberId], references: [id], onDelete: Cascade)

  @@unique([chamberId, queueDate])
}
```

---

# 23. Queue Entry

```prisma
model QueueEntry {
  id             String      @id @default(uuid()) @db.Uuid

  chamberId      String      @db.Uuid
  patientId      String      @db.Uuid
  appointmentId  String?     @unique @db.Uuid
  doctorId       String      @db.Uuid

  queueDate      DateTime    @db.Date
  queueNumber    Int

  status         QueueStatus @default(WAITING)

  priority       Int         @default(0)

  checkedInAt    DateTime    @default(now())
  calledAt       DateTime?
  consultationStartedAt DateTime?
  completedAt    DateTime?

  skipReason     String?     @db.Text

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  chamber        Chamber     @relation(fields: [chamberId], references: [id])
  patient        Patient     @relation(fields: [patientId], references: [id])
  appointment    Appointment? @relation(fields: [appointmentId], references: [id])
  doctor         DoctorProfile @relation(fields: [doctorId], references: [id])
  encounter      Encounter?

  @@unique([chamberId, queueDate, queueNumber])
  @@index([chamberId, queueDate, status])
  @@index([doctorId, queueDate, status])
  @@index([patientId, queueDate])
}
```

> `DoctorProfile` should include:
>
> ```prisma
> queueEntries QueueEntry[]
> ```

---

# 24. Encounter

```prisma
model Encounter {
  id              String          @id @default(uuid()) @db.Uuid

  chamberId       String          @db.Uuid
  patientId       String          @db.Uuid
  doctorId        String          @db.Uuid
  appointmentId   String?         @unique @db.Uuid
  queueEntryId    String?         @unique @db.Uuid

  encounterDate   DateTime        @db.Date

  status          EncounterStatus @default(DRAFT)

  chiefComplaint  String?         @db.Text

  startedAt       DateTime?
  completedAt     DateTime?
  lockedAt        DateTime?

  version         Int             @default(1)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  chamber         Chamber         @relation(fields: [chamberId], references: [id])
  patient         Patient         @relation(fields: [patientId], references: [id])
  doctor          DoctorProfile   @relation(fields: [doctorId], references: [id])
  appointment     Appointment?    @relation(fields: [appointmentId], references: [id])
  queueEntry      QueueEntry?     @relation(fields: [queueEntryId], references: [id])

  notes           ClinicalNote[]
  vitals          Vital[]
  diagnoses       EncounterDiagnosis[]
  investigations  Investigation[]
  reports         DiagnosticReport[]
  prescriptions   Prescription[]
  aiRequests      AIRequest[]
  auditLogs       AuditLog[]

  @@index([chamberId, encounterDate])
  @@index([patientId, encounterDate])
  @@index([doctorId, encounterDate])
}
```

---

# 25. Clinical Note

```prisma
model ClinicalNote {
  id          String           @id @default(uuid()) @db.Uuid
  encounterId String           @db.Uuid

  type        ClinicalNoteType
  content     String           @db.Text
  contentBangla String?        @db.Text

  createdById  String          @db.Uuid

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  encounter   Encounter        @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  createdBy   User             @relation(fields: [createdById], references: [id])

  @@index([encounterId, type])
}
```

---

# 26. Vital

```prisma
model Vital {
  id          String   @id @default(uuid()) @db.Uuid

  patientId   String   @db.Uuid
  encounterId String   @db.Uuid

  temperature Decimal? @db.Decimal(5, 2)

  systolicBP  Int?
  diastolicBP Int?

  heartRate   Int?
  respiratoryRate Int?

  oxygenSaturation Decimal? @db.Decimal(5, 2)

  weightKg    Decimal? @db.Decimal(6, 2)
  heightCm    Decimal? @db.Decimal(6, 2)

  bmi         Decimal? @db.Decimal(6, 2)

  recordedById String @db.Uuid

  recordedAt  DateTime @default(now())

  patient     Patient  @relation(fields: [patientId], references: [id])
  encounter   Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  recordedBy  User     @relation(fields: [recordedById], references: [id])

  @@index([patientId, recordedAt])
  @@index([encounterId])
}
```

---

# 27. Diagnosis

```prisma
model Diagnosis {
  id          String   @id @default(uuid()) @db.Uuid

  code        String?  @db.VarChar(50)
  name        String   @db.VarChar(255)
  nameBangla  String?  @db.VarChar(255)

  description String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  encounterDiagnoses EncounterDiagnosis[]

  @@index([name])
  @@index([nameBangla])
  @@index([code])
}
```

---

# 28. Encounter Diagnosis

```prisma
model EncounterDiagnosis {
  id           String        @id @default(uuid()) @db.Uuid
  encounterId  String        @db.Uuid
  diagnosisId  String        @db.Uuid

  type         DiagnosisType  @default(SECONDARY)

  notes        String?       @db.Text

  createdAt    DateTime      @default(now())

  encounter    Encounter     @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  diagnosis    Diagnosis     @relation(fields: [diagnosisId], references: [id])

  @@unique([encounterId, diagnosisId])
  @@index([encounterId, type])
}
```

---

# 29. Investigation

```prisma
model Investigation {
  id            String              @id @default(uuid()) @db.Uuid
  encounterId   String              @db.Uuid

  name          String              @db.VarChar(255)
  nameBangla    String?             @db.VarChar(255)
  code          String?             @db.VarChar(100)

  status        InvestigationStatus  @default(ORDERED)

  instructions  String?             @db.Text
  notes         String?             @db.Text

  orderedAt     DateTime            @default(now())
  completedAt   DateTime?

  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  encounter     Encounter           @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  reports       DiagnosticReport[]

  @@index([encounterId])
  @@index([name])
}
```

---

# 30. Diagnostic Report

```prisma
model DiagnosticReport {
  id             String                 @id @default(uuid()) @db.Uuid

  patientId      String                 @db.Uuid
  encounterId    String                 @db.Uuid
  investigationId String?               @db.Uuid

  title          String                 @db.VarChar(255)
  reportDate     DateTime?

  status         DiagnosticReportStatus  @default(AVAILABLE)

  summary        String?                @db.Text
  findings       String?                @db.Text
  interpretation String?                @db.Text

  aiSummary      String?                @db.Text
  aiAnalysis     String?                @db.Text

  reviewedById   String?                @db.Uuid
  reviewedAt     DateTime?

  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt

  patient        Patient                @relation(fields: [patientId], references: [id])
  encounter      Encounter              @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  investigation  Investigation?         @relation(fields: [investigationId], references: [id])
  reviewedBy     User?                  @relation(fields: [reviewedById], references: [id])

  files          DiagnosticReportFile[]
  aiRequests     AIRequest[]

  @@index([patientId, reportDate])
  @@index([encounterId])
  @@index([status])
}
```

---

# 31. File Object

Files are stored in private object storage. The database stores metadata only.

```prisma
model FileObject {
  id              String       @id @default(uuid()) @db.Uuid

  storageKey      String       @unique @db.VarChar(500)
  originalName    String       @db.VarChar(255)
  mimeType        String       @db.VarChar(150)
  sizeBytes       BigInt

  category        FileCategory
  status          FileStatus   @default(UPLOADING)

  checksum        String?      @db.VarChar(128)

  uploadedById    String?      @db.Uuid

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  deletedAt       DateTime?

  uploadedBy      User?        @relation(fields: [uploadedById], references: [id])

  doctorProfileImage DoctorProfile? @relation("DoctorProfileImage")
  patientProfileImage Patient?      @relation("PatientProfileImage")

  verificationDocuments VerificationDocument[]
  diagnosticReports     DiagnosticReportFile[]
  patientFiles          PatientFile[]
  prescriptionFiles     PrescriptionFile[]

  @@index([category, status])
  @@index([uploadedById])
}
```

---

# 32. Diagnostic Report File

```prisma
model DiagnosticReportFile {
  id         String   @id @default(uuid()) @db.Uuid
  reportId   String   @db.Uuid
  fileId     String   @db.Uuid

  createdAt  DateTime @default(now())

  report     DiagnosticReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  file       FileObject       @relation(fields: [fileId], references: [id])

  @@unique([reportId, fileId])
}
```

---

# 33. Patient File

```prisma
model PatientFile {
  id         String   @id @default(uuid()) @db.Uuid
  patientId  String   @db.Uuid
  fileId     String   @db.Uuid

  description String? @db.Text

  createdAt  DateTime @default(now())

  patient    Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  file       FileObject @relation(fields: [fileId], references: [id])

  @@unique([patientId, fileId])
}
```

---

# 34. Medicine

Medicine catalog should be maintained independently from prescriptions.

```prisma
model Medicine {
  id              String   @id @default(uuid()) @db.Uuid

  genericName     String   @db.VarChar(255)
  genericNameBangla String? @db.VarChar(255)

  brandName       String?  @db.VarChar(255)
  manufacturer    String?  @db.VarChar(255)

  strength        String?  @db.VarChar(100)
  dosageForm      String?  @db.VarChar(100)

  route           String?  @db.VarChar(100)

  isActive        Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  prescriptionItems PrescriptionItem[]
  favorites          DoctorMedicineFavorite[]

  @@index([genericName])
  @@index([genericNameBangla])
  @@index([brandName])
  @@index([manufacturer])
}
```

---

# 35. Doctor Medicine Favorite

```prisma
model DoctorMedicineFavorite {
  id         String   @id @default(uuid()) @db.Uuid
  doctorId   String   @db.Uuid
  medicineId String   @db.Uuid

  usageCount Int      @default(0)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  doctor     DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  medicine   Medicine      @relation(fields: [medicineId], references: [id])

  @@unique([doctorId, medicineId])
  @@index([doctorId, usageCount])
}
```

---

# 36. Prescription

```prisma
model Prescription {
  id              String             @id @default(uuid()) @db.Uuid

  prescriptionNumber String           @unique @db.VarChar(50)

  chamberId       String             @db.Uuid
  patientId       String             @db.Uuid
  doctorId        String             @db.Uuid
  encounterId     String             @db.Uuid

  status          PrescriptionStatus  @default(DRAFT)

  language        String             @default("bn") @db.VarChar(10)

  clinicalSummary String?            @db.Text
  advice          String?            @db.Text
  followUpDate    DateTime?

  aiGenerated     Boolean            @default(false)
  aiRequestId     String?            @db.Uuid

  reviewedAt      DateTime?
  reviewedById    String?            @db.Uuid

  finalizedAt     DateTime?
  finalizedById   String?            @db.Uuid

  deliveredAt     DateTime?

  version         Int                @default(1)

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  chamber         Chamber            @relation(fields: [chamberId], references: [id])
  patient         Patient            @relation(fields: [patientId], references: [id])
  doctor          DoctorProfile      @relation("PrescriptionDoctor", fields: [doctorId], references: [id])
  encounter       Encounter          @relation(fields: [encounterId], references: [id])
  reviewedBy      DoctorProfile?     @relation("PrescriptionReviewer", fields: [reviewedById], references: [id])

  items           PrescriptionItem[]
  amendments      PrescriptionAmendment[]
  files           PrescriptionFile[]

  @@index([patientId, createdAt])
  @@index([doctorId, createdAt])
  @@index([encounterId])
  @@index([status])
}
```

---

# 37. Prescription Item

```prisma
model PrescriptionItem {
  id             String                @id @default(uuid()) @db.Uuid

  prescriptionId String                @db.Uuid
  medicineId     String?               @db.Uuid

  itemType       PrescriptionItemType  @default(MEDICINE)

  medicineName   String?               @db.VarChar(255)
  strength       String?               @db.VarChar(100)
  dosageForm     String?               @db.VarChar(100)

  dosage         String?               @db.VarChar(100)
  frequency      MedicineFrequency?
  frequencyText  String?               @db.VarChar(255)

  duration       Int?
  durationUnit   DurationUnit?

  quantity       Decimal?              @db.Decimal(10, 2)

  route          String?               @db.VarChar(100)
  instructions   String?               @db.Text
  instructionsBangla String?           @db.Text

  sortOrder      Int                   @default(0)

  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  prescription   Prescription          @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medicine       Medicine?             @relation(fields: [medicineId], references: [id])

  @@index([prescriptionId, sortOrder])
  @@index([medicineId])
}
```

---

# 38. Prescription Amendment

Finalized prescriptions must not be directly modified.

```prisma
model PrescriptionAmendment {
  id              String   @id @default(uuid()) @db.Uuid

  prescriptionId  String   @db.Uuid
  amendedById     String   @db.Uuid

  previousVersion Int
  newVersion      Int

  reason          String   @db.Text
  changes         Json

  createdAt       DateTime @default(now())

  prescription    Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  amendedBy       User         @relation(fields: [amendedById], references: [id])

  @@index([prescriptionId, createdAt])
}
```

---

# 39. Prescription File

```prisma
model PrescriptionFile {
  id             String   @id @default(uuid()) @db.Uuid
  prescriptionId String   @db.Uuid
  fileId         String   @db.Uuid

  createdAt      DateTime @default(now())

  prescription   Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  file           FileObject @relation(fields: [fileId], references: [id])

  @@unique([prescriptionId, fileId])
}
```

---

# 40. Payment

```prisma
model Payment {
  id              String        @id @default(uuid()) @db.Uuid

  paymentNumber   String        @unique @db.VarChar(50)

  chamberId       String        @db.Uuid
  patientId       String        @db.Uuid
  appointmentId   String?       @db.Uuid

  amount          Decimal       @db.Decimal(12, 2)
  paidAmount      Decimal       @default(0) @db.Decimal(12, 2)
  refundedAmount  Decimal       @default(0) @db.Decimal(12, 2)

  currency        String        @default("BDT") @db.VarChar(10)

  method          PaymentMethod
  status          PaymentStatus @default(PENDING)

  description     String?       @db.Text
  transactionReference String?  @db.VarChar(255)

  paidAt          DateTime?
  createdById     String?       @db.Uuid

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  chamber         Chamber       @relation(fields: [chamberId], references: [id])
  patient         Patient       @relation(fields: [patientId], references: [id])
  appointment     Appointment?  @relation(fields: [appointmentId], references: [id])
  createdBy       User?         @relation(fields: [createdById], references: [id])

  receipt         Receipt?
  refunds         PaymentRefund[]

  @@index([chamberId, createdAt])
  @@index([patientId, createdAt])
  @@index([appointmentId])
  @@index([status])
}
```

---

# 41. Receipt

```prisma
model Receipt {
  id            String   @id @default(uuid()) @db.Uuid
  paymentId     String   @unique @db.Uuid

  receiptNumber String   @unique @db.VarChar(50)

  issuedAt      DateTime @default(now())

  amount        Decimal  @db.Decimal(12, 2)
  currency      String   @default("BDT") @db.VarChar(10)

  pdfFileId     String?  @db.Uuid

  createdAt     DateTime @default(now())

  payment       Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  pdfFile       FileObject? @relation(fields: [pdfFileId], references: [id])
}
```

---

# 42. Payment Refund

```prisma
model PaymentRefund {
  id              String       @id @default(uuid()) @db.Uuid

  paymentId       String       @db.Uuid

  amount          Decimal      @db.Decimal(12, 2)
  reason          String       @db.Text

  status          RefundStatus @default(REQUESTED)

  transactionReference String? @db.VarChar(255)

  requestedById   String       @db.Uuid
  processedById   String?      @db.Uuid

  requestedAt     DateTime     @default(now())
  processedAt     DateTime?

  payment         Payment      @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  requestedBy     User         @relation("RefundRequester", fields: [requestedById], references: [id])
  processedBy     User?        @relation("RefundProcessor", fields: [processedById], references: [id])

  @@index([paymentId])
  @@index([status])
}
```

---

# 43. Notification

```prisma
model Notification {
  id          String              @id @default(uuid()) @db.Uuid

  userId      String              @db.Uuid
  chamberId   String?             @db.Uuid

  type        NotificationType
  channel     NotificationChannel @default(IN_APP)

  title       String              @db.VarChar(255)
  message     String              @db.Text

  data        Json?

  readAt      DateTime?
  sentAt      DateTime?

  createdAt   DateTime            @default(now())

  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  chamber     Chamber?            @relation(fields: [chamberId], references: [id])

  @@index([userId, readAt])
  @@index([chamberId, createdAt])
}
```

---

# 44. AI Request

AI requests represent every AI operation.

```prisma
model AIRequest {
  id             String          @id @default(uuid()) @db.Uuid

  userId         String          @db.Uuid
  chamberId      String?         @db.Uuid
  patientId      String?         @db.Uuid
  encounterId    String?         @db.Uuid
  reportId       String?         @db.Uuid

  type           AIRequestType
  status         AIRequestStatus @default(PENDING)

  provider       String?         @db.VarChar(100)
  model          String?         @db.VarChar(100)

  inputTokens    Int?
  outputTokens   Int?
  latencyMs      Int?

  requestPayload Json?
  responsePayload Json?

  errorCode      String?         @db.VarChar(100)
  errorMessage   String?         @db.Text

  startedAt      DateTime?
  completedAt    DateTime?

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user           User            @relation(fields: [userId], references: [id])
  chamber        Chamber?        @relation(fields: [chamberId], references: [id])
  patient        Patient?        @relation(fields: [patientId], references: [id])
  encounter      Encounter?      @relation(fields: [encounterId], references: [id])
  report         DiagnosticReport? @relation(fields: [reportId], references: [id])

  drafts         AIDraft[]

  @@index([userId, createdAt])
  @@index([patientId, createdAt])
  @@index([encounterId])
  @@index([type, status])
}
```

---

# 45. AI Draft

AI drafts are separate from official clinical records.

```prisma
model AIDraft {
  id           String        @id @default(uuid()) @db.Uuid

  aiRequestId  String        @db.Uuid

  type         AIRequestType
  status       AIDraftStatus @default(GENERATED)

  content      Json

  acceptedById String?       @db.Uuid
  acceptedAt   DateTime?
  rejectedById String?       @db.Uuid
  rejectedAt   DateTime?

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  aiRequest    AIRequest     @relation(fields: [aiRequestId], references: [id], onDelete: Cascade)
  acceptedBy   User?         @relation("AIDraftAcceptedBy", fields: [acceptedById], references: [id])
  rejectedBy   User?         @relation("AIDraftRejectedBy", fields: [rejectedById], references: [id])

  @@index([aiRequestId])
  @@index([status])
}
```

---

# 46. Audit Log

Audit logs are append-only.

```prisma
model AuditLog {
  id            String      @id @default(uuid()) @db.Uuid

  userId        String?     @db.Uuid
  chamberId     String?     @db.Uuid
  encounterId   String?     @db.Uuid

  action        AuditAction

  entityType    String      @db.VarChar(100)
  entityId      String      @db.VarChar(100)

  requestId     String?     @db.VarChar(100)
  ipAddress     String?     @db.VarChar(100)
  userAgent     String?     @db.Text

  beforeData    Json?
  afterData     Json?
  metadata      Json?

  createdAt     DateTime    @default(now())

  user          User?       @relation(fields: [userId], references: [id])
  chamber       Chamber?    @relation(fields: [chamberId], references: [id])
  encounter     Encounter?  @relation(fields: [encounterId], references: [id])

  @@index([userId, createdAt])
  @@index([chamberId, createdAt])
  @@index([entityType, entityId])
  @@index([encounterId, createdAt])
  @@index([action, createdAt])
}
```

---

# 47. Export Job

```prisma
model ExportJob {
  id          String       @id @default(uuid()) @db.Uuid

  userId      String       @db.Uuid
  chamberId   String?      @db.Uuid

  exportType  String       @db.VarChar(100)
  status      ExportStatus @default(PENDING)

  filters     Json?

  fileId      String?      @db.Uuid

  requestedAt DateTime     @default(now())
  completedAt DateTime?
  expiresAt   DateTime?

  errorMessage String?     @db.Text

  user        User         @relation(fields: [userId], references: [id])
  chamber     Chamber?     @relation(fields: [chamberId], references: [id])
  file        FileObject?  @relation(fields: [fileId], references: [id])

  @@index([userId, createdAt])
  @@index([chamberId, status])
}
```

> If Prisma reports a missing `createdAt` field for the index above, use:
>
> ```prisma
> @@index([userId, requestedAt])
> ```
>
> The recommended production definition is therefore:
>
> ```prisma
> @@index([userId, requestedAt])
> ```

---

# 48. Subscription

```prisma
model Subscription {
  id              String             @id @default(uuid()) @db.Uuid

  chamberId       String             @db.Uuid

  planCode        String             @db.VarChar(100)
  status          SubscriptionStatus @default(TRIAL)

  startDate       DateTime
  endDate         DateTime?

  monthlyAmount   Decimal?           @db.Decimal(12, 2)
  currency        String             @default("BDT") @db.VarChar(10)

  externalSubscriptionId String?      @db.VarChar(255)

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  chamber         Chamber             @relation(fields: [chamberId], references: [id], onDelete: Cascade)

  @@index([chamberId, status])
  @@index([endDate])
}
```

---

# 49. Additional Relations Required in DoctorProfile

The following relations should be included in the `DoctorProfile` model:

```prisma
appointments        Appointment[]
queueEntries        QueueEntry[]
encounters          Encounter[]
```

The resulting relevant section is:

```prisma
model DoctorProfile {
  // ...

  appointments        Appointment[]
  queueEntries        QueueEntry[]
  encounters          Encounter[]

  // ...
}
```

---

# 50. Additional Relations Required in User

Because several models reference `User`, the complete `User` relation section should include:

```prisma
model User {
  // ...

  sessions             Session[]
  memberships          ChamberMembership[]
  professionalReviews  ProfessionalVerification[] @relation("VerificationReviewer")
  auditLogs             AuditLog[]
  notifications        Notification[]
  aiRequests            AIRequest[]
  exports               ExportJob[]

  createdPatients       Patient[] @relation("PatientCreatedBy")

  clinicalNotes         ClinicalNote[]
  vitals                Vital[]

  bookedAppointments    Appointment[]

  refundRequests        PaymentRefund[] @relation("RefundRequester")
  processedRefunds      PaymentRefund[] @relation("RefundProcessor")

  prescriptionAmendments PrescriptionAmendment[]

  acceptedAIDrafts      AIDraft[] @relation("AIDraftAcceptedBy")
  rejectedAIDrafts      AIDraft[] @relation("AIDraftRejectedBy")

  uploadedFiles         FileObject[]

  // ...
}
```

---

# 51. Appointment/User Relation

The `Appointment` model contains:

```prisma
bookedByUserId String? @db.Uuid
```

and:

```prisma
bookedBy User? @relation(fields: [bookedByUserId], references: [id])
```

Therefore `User` must contain:

```prisma
bookedAppointments Appointment[]
```

---

# 52. Payment/User Relation

The `Payment` model contains:

```prisma
createdById String? @db.Uuid
```

and:

```prisma
createdBy User? @relation(fields: [createdById], references: [id])
```

Therefore `User` must contain:

```prisma
createdPayments Payment[]
```

---

# 53. File/User Relation

The `FileObject` model contains:

```prisma
uploadedById String? @db.Uuid
```

and:

```prisma
uploadedBy User? @relation(fields: [uploadedById], references: [id])
```

Therefore:

```prisma
User {
  uploadedFiles FileObject[]
}
```

---

# 54. AI/Patient Relation

The `Patient` model should include:

```prisma
aiRequests AIRequest[]
```

This allows all AI operations associated with a patient to be retrieved independently from official clinical records.

---

# 55. Chamber AI Relation

The `Chamber` model should include:

```prisma
aiRequests AIRequest[]
```

This permits chamber-level AI usage analytics.

---

# 56. Prescription AI Relation

The `Prescription` model stores:

```prisma
aiRequestId String? @db.Uuid
```

This should be treated as a provenance reference.

The application should use it to answer:

- Was this prescription AI-assisted?
- Which AI request generated the draft?
- Who reviewed it?
- When was it accepted?
- What was finally prescribed?

AI-generated content must never overwrite the official prescription without explicit human review.

---

# 57. Complete Relationship Overview

```text
User
 │
 ├── DoctorProfile
 │      │
 │      ├── ProfessionalVerification
 │      ├── Chamber
 │      ├── Schedule
 │      └── MedicineFavorites
 │
 ├── ChamberMembership
 │      │
 │      └── Chamber
 │
 ├── Session
 ├── Notification
 ├── AuditLog
 └── AIRequest


Chamber
 │
 ├── Memberships
 ├── Schedules
 ├── Patients
 ├── Appointments
 ├── Queue
 ├── Encounters
 ├── Payments
 ├── Notifications
 ├── AuditLogs
 └── Subscriptions


Patient
 │
 ├── PatientChamber
 ├── Family
 ├── Allergies
 ├── Conditions
 ├── Appointments
 ├── QueueEntries
 ├── Encounters
 ├── Vitals
 ├── Investigations
 ├── DiagnosticReports
 ├── Prescriptions
 ├── Payments
 └── Files


Encounter
 │
 ├── ClinicalNotes
 ├── Vitals
 ├── Diagnoses
 ├── Investigations
 ├── DiagnosticReports
 ├── Prescriptions
 └── AIRequests


Prescription
 │
 ├── PrescriptionItems
 ├── Amendments
 ├── Files
 └── AI provenance


Payment
 │
 ├── Receipt
 └── Refunds
```

---

# 58. Database-Level Integrity Rules

The following rules must be enforced through application logic and, where practical, database constraints.

## 58.1 Chamber Isolation

Every chamber-scoped query must include:

```text
chamberId
```

Examples:

```text
Appointment
QueueEntry
Encounter
Payment
AuditLog
Notification
ExportJob
```

must never be fetched by ID alone without verifying chamber access.

---

# 59. Patient Access Rules

A patient may exist globally but access must be chamber-aware.

Example:

```text
Patient
   │
   ├── Chamber A
   ├── Chamber B
   └── Chamber C
```

A user belonging to Chamber A must not automatically access Chamber B clinical records.

The authorization layer must validate:

```text
user → chamber membership → patient/chamber relationship
```

---

# 60. Clinical Record Deletion Rules

The following records must never be hard-deleted after clinical use:

- Encounter
- ClinicalNote
- Vital
- Diagnosis association
- Investigation
- DiagnosticReport
- Prescription
- PrescriptionItem
- Payment
- Receipt
- AuditLog

Corrections must use:

- amendment
- replacement
- versioning
- audit logging

---

# 61. Prescription Immutability

Once:

```text
Prescription.status = FINALIZED
```

the application must reject direct updates to:

- medicine
- dosage
- frequency
- duration
- instructions
- diagnosis
- clinical summary

Corrections require:

```text
POST /prescriptions/:id/amend
```

The system creates:

```text
PrescriptionAmendment
```

and increments:

```text
Prescription.version
```

---

# 62. Encounter Locking

Once:

```text
Encounter.status = LOCKED
```

normal users must not modify the encounter.

Any correction must follow a controlled amendment workflow.

---

# 63. Queue Number Generation

Never generate queue numbers using:

```sql
MAX(queueNumber) + 1
```

because concurrent requests can generate duplicate numbers.

Use:

```text
DailyQueueCounter
```

inside a transaction.

Example:

```text
Chamber A
2026-09-04
lastNumber = 17

Check-in
→ increment to 18
→ create QueueEntry #18
```

---

# 64. Queue Business Date

Queue dates represent the chamber's local business date.

The system should calculate:

```text
UTC timestamp
        ↓
Asia/Dhaka
        ↓
queueDate
```

This prevents problems around midnight and timezone conversions.

---

# 65. Money Precision

Never use:

```text
Float
Double
```

for money.

Use:

```prisma
Decimal @db.Decimal(12, 2)
```

Examples:

```text
Consultation Fee
Payment
Refund
Subscription
Receipt
```

---

# 66. Timestamp Strategy

All timestamp fields use PostgreSQL timestamp semantics through Prisma `DateTime`.

Application convention:

```text
Database
    ↓
UTC
    ↓
API
    ↓
Client timezone
```

For Bangladesh users:

```text
Asia/Dhaka
UTC+06:00
```

---

# 67. Search Strategy

Patient and medicine search will frequently use:

- Bangla names
- English names
- phone numbers
- partial names
- transliterated names

Recommended PostgreSQL extension:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Recommended indexes can later be added using raw SQL migrations.

Example:

```sql
CREATE INDEX idx_patient_full_name_trgm
ON "Patient"
USING gin ("fullName" gin_trgm_ops);
```

Similarly:

```sql
CREATE INDEX idx_patient_name_bangla_trgm
ON "Patient"
USING gin ("nameBangla" gin_trgm_ops);
```

---

# 68. Recommended Database Indexes

Core indexes include:

```text
User.phone
User.email

DoctorProfile.registrationNumber
DoctorProfile.specialization

Chamber.ownerDoctorId
Chamber.status

ChamberMembership.chamberId + userId
ChamberMembership.chamberId + role

Patient.phone
Patient.fullName
Patient.nameBangla
Patient.nationalId

PatientChamber.patientId + chamberId

Appointment.chamberId + scheduledDate + status
Appointment.doctorId + scheduledAt
Appointment.patientId + scheduledAt

QueueEntry.chamberId + queueDate + status
QueueEntry.doctorId + queueDate + status
QueueEntry.patientId + queueDate

Encounter.chamberId + encounterDate
Encounter.patientId + encounterDate
Encounter.doctorId + encounterDate

Vital.patientId + recordedAt

Diagnosis.name
Diagnosis.nameBangla
Diagnosis.code

Investigation.name

DiagnosticReport.patientId + reportDate

Medicine.genericName
Medicine.genericNameBangla
Medicine.brandName

Prescription.patientId + createdAt
Prescription.doctorId + createdAt
Prescription.encounterId
Prescription.status

Payment.chamberId + createdAt
Payment.patientId + createdAt

Notification.userId + readAt

AIRequest.patientId + createdAt
AIRequest.type + status

AuditLog.chamberId + createdAt
AuditLog.entityType + entityId
```

---

# 69. Transaction Requirements

The following operations must execute inside Prisma transactions.

## Appointment

```text
Validate doctor schedule
        ↓
Check conflict
        ↓
Create appointment
        ↓
Create audit log
        ↓
Commit
```

## Queue Check-in

```text
Get/create DailyQueueCounter
        ↓
Increment counter
        ↓
Create QueueEntry
        ↓
Update appointment
        ↓
Create audit log
        ↓
Commit
```

## Prescription Finalization

```text
Validate encounter
        ↓
Validate prescription
        ↓
Validate required fields
        ↓
Verify authorization
        ↓
Change status → FINALIZED
        ↓
Create audit log
        ↓
Commit
```

## Payment

```text
Create payment
        ↓
Calculate balance
        ↓
Create receipt
        ↓
Audit
        ↓
Commit
```

## Refund

```text
Validate payment
        ↓
Validate refundable amount
        ↓
Create refund
        ↓
Update payment
        ↓
Audit
        ↓
Commit
```

---

# 70. Optimistic Concurrency

Clinical and financial records should use optimistic concurrency where required.

For example:

```prisma
version Int @default(1)
```

Application flow:

```text
Client version = 4

UPDATE ...
WHERE id = X
AND version = 4

success
→ version = 5

failure
→ ConflictException
```

This prevents one clinician from accidentally overwriting another user's changes.

---

# 71. Soft Delete

Soft deletion is recommended for:

- User
- DoctorProfile
- Chamber
- Patient
- FileObject

Use:

```prisma
deletedAt DateTime?
```

Default application queries should exclude:

```text
deletedAt != null
```

Clinical records should generally not use soft deletion as a substitute for clinical amendment/versioning.

---

# 72. Audit Requirements

The following operations must create audit records:

```text
Login
Logout
Patient creation
Patient update
Appointment creation
Appointment cancellation
Check-in
Queue call
Queue skip
Encounter creation
Clinical note update
Vital creation
Diagnosis changes
Investigation creation
Report upload
Prescription creation
Prescription finalization
Prescription amendment
Payment creation
Refund
AI generation
AI acceptance
AI rejection
Staff invitation
Role changes
Export
Professional verification
```

Audit logs should contain:

```text
userId
chamberId
action
entityType
entityId
requestId
timestamp
beforeData
afterData
metadata
```

---

# 73. AI Data Separation

AI-generated information must remain distinguishable from official clinical data.

Example:

```text
AIRequest
    ↓
AIDraft
    ↓
Doctor Review
    ↓
Official Clinical Record
```

Never:

```text
AI
 ↓
Directly update finalized prescription
```

The correct workflow is:

```text
AI suggestion
      ↓
Doctor review
      ↓
Doctor modification
      ↓
Doctor explicit approval
      ↓
Final prescription
```

---

# 74. AI Auditability

For every important AI operation store:

```text
AIRequest.id
AIRequest.type
provider
model
inputTokens
outputTokens
requestPayload
responsePayload
createdAt
userId
chamberId
patientId
encounterId
```

Sensitive data retention and logging policies should be configurable for production.

---

# 75. File Storage Architecture

Database:

```text
FileObject
```

Object storage:

```text
S3-compatible storage
```

Example:

```text
s3://private-bucket/chambers/{chamberId}/patients/{patientId}/reports/{fileId}
```

The database should never store large binary files directly.

---

# 76. Business Identifier Generation

Recommended formats:

```text
Patient:
PAT-000001

Appointment:
APT-20260904-000123

Prescription:
RX-20260904-000123

Payment:
PAY-20260904-000123

Receipt:
RCT-20260904-000123

Queue:
18
```

Business IDs are generated by the application/domain service.

UUID remains the database primary key.

---

# 77. Prisma Migration Strategy

Development:

```bash
npx prisma migrate dev --name init
```

Production:

```bash
npx prisma migrate deploy
```

Client generation:

```bash
npx prisma generate
```

Never modify an already-applied production migration.

---

# 78. Expand-and-Contract Migration Strategy

For major schema changes:

```text
1. Add new field/table
2. Deploy compatible application
3. Backfill data
4. Switch application logic
5. Remove old field later
```

Avoid destructive migrations during normal deployments.

---

# 79. Seed Data

The following should be seeded:

## System roles

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
PLATFORM_ADMIN
```

## Permissions

Examples:

```text
patient.read
patient.create
patient.update

appointment.read
appointment.create
appointment.update
appointment.cancel

queue.read
queue.manage

encounter.read
encounter.create
encounter.update
encounter.lock

prescription.create
prescription.update
prescription.finalize
prescription.amend

payment.read
payment.create
payment.refund

report.read
report.upload
report.analyze

ai.use
ai.prescription
ai.clinical_chat

staff.read
staff.invite
staff.update
staff.remove

analytics.read
audit.read
```

---

# 80. Prisma Client Usage

Recommended NestJS architecture:

```text
PrismaService
     ↓
Repository / Data Access Layer
     ↓
Domain/Application Service
     ↓
Controller
```

Controllers should not directly perform complex Prisma queries.

Avoid:

```typescript
controller → prisma.patient.findMany()
```

Prefer:

```text
Controller
   ↓
PatientService
   ↓
PatientRepository
   ↓
PrismaService
```

---

# 81. Repository Responsibilities

Repositories handle:

- Prisma queries
- transactions
- database filtering
- pagination
- persistence
- relation loading

Services handle:

- business rules
- authorization checks
- state transitions
- orchestration
- domain validation

Controllers handle:

- HTTP
- DTO validation
- authentication context
- response formatting

---

# 82. Recommended Prisma Include Strategy

Avoid unrestricted:

```typescript
include: {
  patient: true,
  encounters: true,
  prescriptions: true,
  payments: true,
  ...
}
```

Instead use purpose-specific projections.

Example:

```typescript
const patientListSelect = {
  id: true,
  patientCode: true,
  fullName: true,
  nameBangla: true,
  phone: true,
  gender: true,
};
```

This reduces payload size and query cost.

---

# 83. Pagination

All large collection APIs should use pagination.

MVP:

```text
page
pageSize
```

Recommended limits:

```text
default = 20
maximum = 100
```

High-volume endpoints may later use cursor pagination.

---

# 84. Data Retention

Retention policies should be configurable according to:

- applicable Bangladesh regulations
- professional requirements
- contractual requirements
- business policy

Do not implement automatic permanent clinical deletion without a documented retention policy.

---

# 85. Backup Strategy

Production PostgreSQL should support:

```text
Automated backups
Point-in-time recovery
Off-site backup
Backup encryption
Restore testing
```

Minimum operational target:

```text
RPO: ≤ 15 minutes
RTO: ≤ 1 hour
```

These are engineering targets and should be validated against the actual infrastructure.

---

# 86. Security Requirements

The database layer must be protected by:

```text
TLS
Encrypted backups
Private database networking
Strong database credentials
Secret management
Least-privilege database access
Connection pooling
Audit logging
```

Never expose PostgreSQL directly to the public internet.

---

# 87. Row-Level Security

MVP recommendation:

```text
Application-level authorization
+
strict chamberId filtering
```

Future high-security deployments may introduce PostgreSQL Row-Level Security.

Possible future architecture:

```text
Application
    ↓
SET app.current_chamber_id
    ↓
PostgreSQL RLS
    ↓
Chamber-scoped rows
```

RLS should be introduced only after carefully validating Prisma connection pooling and transaction behavior.

---

# 88. Multi-Chamber Security Rule

This is a critical platform rule:

```text
User ≠ automatic access to all chambers
```

Instead:

```text
User
 ↓
ChamberMembership
 ↓
Chamber
 ↓
Resource
```

For example:

```text
Doctor A
 ├── Chamber X
 └── Chamber Y
```

The doctor can switch between chambers, but every request must establish the active chamber context.

---

# 89. Recommended Request Context

The NestJS request context should expose:

```typescript
interface RequestContext {
  userId: string;
  chamberId?: string;
  role?: UserRole;
  requestId: string;
}
```

Authorization then becomes:

```text
authenticate user
      ↓
resolve chamber
      ↓
verify membership
      ↓
verify permission
      ↓
verify resource ownership
      ↓
execute query
```

---

# 90. Clinical Data Integrity Rules

## Rule 1

A clinical record must belong to exactly one chamber.

## Rule 2

A clinical record must belong to exactly one patient.

## Rule 3

A clinical record must belong to an authorized clinician/staff workflow.

## Rule 4

Locked records cannot be directly modified.

## Rule 5

Finalized prescriptions cannot be directly modified.

## Rule 6

AI cannot finalize a prescription.

## Rule 7

Financial records require transactional updates.

## Rule 8

Audit logs cannot be edited through normal application APIs.

---

# 91. MVP Tables

The MVP should implement these models first:

```text
User
Session

DoctorProfile
ProfessionalVerification
VerificationDocument

Chamber
ChamberMembership

Role
Permission
RolePermission

Schedule
ScheduleBreak

Patient
PatientChamber
PatientAllergy
PatientCondition

Appointment
DailyQueueCounter
QueueEntry

Encounter
ClinicalNote
Vital
Diagnosis
EncounterDiagnosis
Investigation
DiagnosticReport

FileObject
DiagnosticReportFile
PatientFile

Medicine
DoctorMedicineFavorite

Prescription
PrescriptionItem
PrescriptionAmendment
PrescriptionFile

Payment
Receipt
PaymentRefund

Notification

AIRequest
AIDraft

AuditLog
ExportJob
```

---

# 92. Phase 2 Tables/Enhancements

Later additions can include:

```text
PrescriptionTemplate
MedicineInteraction
MedicineContraindication

ClinicalNoteVersion
PrescriptionVersion

AIContextReference
AIUsageRecord

PatientConsent
DataAccessGrant

CommunicationMessage
SMSDelivery
EmailDelivery

QueueDisplay
QueueAnnouncement

AdvancedAnalytics
```

---

# 93. Potential Future Entities

The architecture should remain extensible for:

```text
Pharmacy
Laboratory
Referral
TelemedicineSession
InsuranceClaim
DoctorMarketplaceProfile
PatientPortalAccount
MedicationReminder
ChronicCarePlan
Vaccination
HospitalReferral
```

These should not be added to the MVP schema merely for future speculation.

---

# 94. Prisma Validation Checklist

Before the first migration, execute:

```bash
npx prisma format
```

Then:

```bash
npx prisma validate
```

Then:

```bash
npx prisma generate
```

Then:

```bash
npx prisma migrate dev --name init
```

---

# 95. Compile Validation

The implementation team should ensure:

```text
Prisma schema parses
        ↓
Prisma Client generates
        ↓
Migration succeeds
        ↓
NestJS application compiles
        ↓
Database connection succeeds
        ↓
Seed succeeds
        ↓
Integration tests pass
```

---

# 96. Recommended Initial Migration Order

Although Prisma generates the migration automatically, conceptual dependency order is:

```text
1. User
2. Session

3. DoctorProfile
4. ProfessionalVerification
5. VerificationDocument

6. Chamber
7. ChamberMembership

8. Role
9. Permission
10. RolePermission

11. Schedule
12. ScheduleBreak

13. Patient
14. PatientChamber
15. Family
16. FamilyMember
17. PatientAllergy
18. PatientCondition

19. Appointment
20. DailyQueueCounter
21. QueueEntry

22. Encounter
23. ClinicalNote
24. Vital
25. Diagnosis
26. EncounterDiagnosis
27. Investigation
28. DiagnosticReport

29. FileObject
30. DiagnosticReportFile
31. PatientFile

32. Medicine
33. DoctorMedicineFavorite

34. Prescription
35. PrescriptionItem
36. PrescriptionAmendment
37. PrescriptionFile

38. Payment
39. Receipt
40. PaymentRefund

41. Notification

42. AIRequest
43. AIDraft

44. AuditLog
45. ExportJob
46. Subscription
```

---

# 97. Critical Testing Scenarios

The database/integration test suite must include:

## Authentication

```text
Create user
Duplicate phone
Duplicate email
Session creation
Session revocation
```

## Chamber

```text
Create chamber
Add doctor
Invite staff
Remove staff
Cross-chamber access rejection
```

## Patient

```text
Create patient
Duplicate detection
Attach patient to chamber
Patient search
Patient timeline
```

## Appointment

```text
Create appointment
Schedule conflict
Reschedule
Cancel
Check-in
```

## Queue

```text
Concurrent check-in
Unique queue number
Call patient
Recall patient
Skip patient
Complete patient
```

## Clinical

```text
Create encounter
Start encounter
Add vitals
Add diagnosis
Add investigation
Upload report
Complete encounter
Lock encounter
```

## Prescription

```text
Create draft
Add medicine
AI draft
Review
Finalize
Reject invalid finalization
Amend finalized prescription
Verify immutable version
```

## Finance

```text
Create payment
Generate receipt
Partial refund
Full refund
Reject excessive refund
```

## AI

```text
Create AI request
Provider failure
AI draft creation
Doctor acceptance
Doctor rejection
AI audit
```

## Security

```text
Unauthorized user
Wrong chamber
Wrong role
Removed staff
Cross-patient access
Cross-chamber patient access
```

---

# 98. Production Readiness Checklist

Before production:

```text
[ ] Prisma schema validated
[ ] Migration tested
[ ] Production migration tested
[ ] Seed scripts completed
[ ] Database backup configured
[ ] PITR configured
[ ] Restore tested
[ ] Connection pooling configured
[ ] Slow query monitoring configured
[ ] Database metrics configured
[ ] Audit logging verified
[ ] Chamber isolation tested
[ ] Clinical immutability tested
[ ] Prescription finalization tested
[ ] Financial transaction tests completed
[ ] Concurrent queue tests completed
[ ] AI provenance tested
[ ] Security review completed
[ ] Data retention policy documented
```

---

# 99. Architecture Decision Summary

| Decision | Choice |
|---|---|
| Database | PostgreSQL |
| ORM | Prisma |
| Primary ID | UUID |
| Business ID | Separate human-readable identifier |
| Tenant boundary | Chamber |
| Patient identity | Global + PatientChamber |
| Time storage | UTC |
| Business timezone | Asia/Dhaka |
| Money | Decimal |
| Queue numbering | DailyQueueCounter |
| Clinical deletion | Prohibited |
| Prescription finalization | Immutable |
| Prescription correction | Amendment/versioning |
| AI output | Separate AI records |
| File storage | Private object storage |
| Search | PostgreSQL + pg_trgm |
| MVP authorization | Application-level RBAC |
| Future authorization | Optional PostgreSQL RLS |
| Audit | Append-only |
| Transactions | Prisma transactions |
| Concurrency | Optimistic locking where required |
| Architecture | Modular monolith |

---

# 100. Final Database Architecture

The resulting architecture is:

```text
                    ┌─────────────────────┐
                    │        User         │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          DoctorProfile                Membership
                 │                           │
                 └─────────────┬─────────────┘
                               │
                         ┌─────▼─────┐
                         │  Chamber  │
                         └─────┬─────┘
                               │
       ┌───────────────┬───────┼────────┬──────────────┐
       │               │       │        │              │
    Patient       Appointment Queue  Encounter      Payment
       │               │       │        │              │
       │               │       │        ├── Vitals     │
       │               │       │        ├── Notes      │
       │               │       │        ├── Diagnosis  │
       │               │       │        ├── Tests      │
       │               │       │        ├── Reports    │
       │               │       │        └── Rx         │
       │               │       │                       │
       └───────────────┴───────┴───────────────────────┘
                               │
                     ┌─────────▼─────────┐
                     │    AI Platform    │
                     ├───────────────────┤
                     │ AIRequest         │
                     │ AIDraft           │
                     │ AI Provenance     │
                     └───────────────────┘

              Cross-cutting:
              ┌───────────────┐
              │ File Storage  │
              ├───────────────┤
              │ Audit Logs    │
              │ Notifications │
              │ Exports       │
              │ Subscriptions │
              └───────────────┘
```

---

# 101. Non-Negotiable Database Rules

The following rules should be treated as architectural constraints:

### Rule 1
**PostgreSQL is the source of truth.**

### Rule 2
**Every chamber-scoped operation must validate chamber membership.**

### Rule 3
**Patient identity may be global, but clinical access is chamber-scoped.**

### Rule 4
**Clinical records must never be silently deleted.**

### Rule 5
**Finalized prescriptions are immutable.**

### Rule 6
**Prescription corrections require amendments/versioning.**

### Rule 7
**AI-generated information is not automatically clinical truth.**

### Rule 8
**AI cannot finalize a prescription.**

### Rule 9
**Financial operations must be transactional.**

### Rule 10
**Queue numbers must be concurrency-safe.**

### Rule 11
**Audit logs must be append-only.**

### Rule 12
**Money must use Decimal.**

### Rule 13
**Database timestamps use UTC.**

### Rule 14
**Bangladesh-local business dates use `Asia/Dhaka`.**

### Rule 15
**Large files must not be stored directly inside PostgreSQL.**

---

# 102. Recommended Next Implementation Step

After Document 11, the recommended sequence is:

```text
Document 11
Complete Prisma Schema
        ↓
Document 12
Database Migration + Seed Strategy
        ↓
Document 13
NestJS Project Structure + Module Skeleton
        ↓
Document 14
Authentication & RBAC Implementation
        ↓
Document 15
Patient + Appointment + Queue Implementation
        ↓
Document 16
Clinical Consultation Implementation
        ↓
Document 17
Prescription Implementation
        ↓
Document 18
Payment + Billing Implementation
        ↓
Document 19
AI Architecture + AI Implementation
        ↓
Document 20
Testing Strategy + E2E Test Plan
```

The most logical immediate follow-up is **Document 12 — Complete Database Migration, Seed Data & Initialization Strategy**, because it will convert this schema into a reproducible development/CI/staging/production database setup.