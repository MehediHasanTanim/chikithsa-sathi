# Chamber Management
## Database Architecture & Prisma Schema Specification

**Document:** Database Architecture & Prisma Schema Specification  
**Version:** 1.0  
**Product:** AI-Powered Chamber & Prescription Management Platform  
**Target Market:** Bangladesh  
**Status:** Technical Design Baseline  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Backend:** NestJS + TypeScript  
**Architecture:** Modular Monolith  

---

# 1. Purpose

This document defines the database architecture and Prisma data model for Chamber Management.

The database must support:

- Multiple chambers per doctor
- Chamber-specific staff
- Assistant doctors
- Patient management
- Appointments
- Daily queue
- Clinical encounters
- Vitals
- Diagnoses
- Investigations
- Diagnostic reports
- Prescriptions
- Medicines
- Payments
- Notifications
- AI requests and drafts
- Audit logging
- File management
- Reporting
- Future offline synchronization

The database is the **system of record** for all critical business and clinical data.

---

# 2. Database Design Principles

The database must follow these principles:

1. PostgreSQL is the authoritative source of truth.
2. Clinical records must be auditable.
3. Finalized prescriptions must not be silently modified.
4. Chamber access must be explicitly controlled.
5. Users and roles must be separated from chamber membership.
6. Important workflows must use transactions.
7. Foreign-key relationships should be enforced at database level.
8. Frequently queried fields must be indexed.
9. Sensitive data must have controlled access.
10. Soft deletion should be used where appropriate.
11. Database IDs should not expose sequential business identifiers.
12. Business-readable identifiers should be separate from internal primary keys.
13. The schema should support future multi-tenant scaling.

---

# 3. Database Architecture

High-level architecture:

```text
                        PostgreSQL
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
    Identity             Chamber              Clinical
        │                   │                    │
     User               Chamber             Encounter
     Session            Membership           Vitals
     Role                Schedule             Diagnosis
     Permission          Staff                Investigation
                                               Prescription
        │                                      Reports
        └──────────────────┬───────────────────────┘
                           │
                           ▼
                       Operations
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         Appointment      Queue       Payment

                           │
                           ▼
                          AI
                           │
                    AI Request / Draft

                           │
                           ▼
                         Audit
```

---

# 4. ID Strategy

Use UUIDs for internal primary keys.

Recommended:

```text
UUID
```

Example:

```text
User.id
DoctorProfile.id
Chamber.id
Patient.id
Encounter.id
Prescription.id
```

Business-facing identifiers should be separate.

Examples:

```text
PAT-000124
RX-2026-000123
APT-2026-00125
RCPT-2026-00129
```

This prevents exposing database identifiers to users.

---

# 5. PostgreSQL Extensions

Recommended extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

For future advanced search:

```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

`pg_trgm` is useful for searching:

- Patient names
- Bangla names
- Medicine names

---

# 6. Naming Convention

Database:

```text
snake_case
```

Prisma:

```text
camelCase
```

Example:

```text
database:
created_at

Prisma:
createdAt
```

Table names should use singular model names through Prisma mappings where appropriate.

---

# 7. Common Audit Fields

Most entities should contain:

```text
id
createdAt
updatedAt
```

Business entities that support soft deletion:

```text
deletedAt
```

Example:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
deletedAt DateTime?
```

---

# 8. User Model

The `User` entity represents an authenticated platform user.

```text
User
 ├── DoctorProfile
 ├── Sessions
 ├── ChamberMemberships
 ├── Notifications
 └── AuditLogs
```

Important fields:

```text
id
phone
email
passwordHash
status
language
lastLoginAt
createdAt
updatedAt
```

---

# 9. User Status

```text
REGISTERED
PHONE_VERIFIED
ACTIVE
SUSPENDED
DEACTIVATED
```

Doctor-specific professional status should be maintained separately.

---

# 10. User Session

A user may have multiple active sessions.

Example:

```text
User
 ├── iPhone
 ├── MacBook
 └── Android Tablet
```

Fields:

```text
id
userId
refreshTokenHash
deviceId
deviceName
ipAddress
userAgent
expiresAt
revokedAt
createdAt
```

Never store raw refresh tokens.

---

# 11. Doctor Profile

A doctor profile extends a normal user account.

Relationship:

```text
User 1 ───── 1 DoctorProfile
```

Fields:

```text
id
userId
fullName
displayName
title
gender
dateOfBirth
profileImageId
bio
createdAt
updatedAt
```

---

# 12. Professional Information

Professional details should be represented separately.

Fields:

```text
doctorId
specialization
qualifications
bmdcRegistrationNumber
yearsOfExperience
verificationStatus
```

This makes verification lifecycle easier to manage.

---

# 13. Professional Verification

Entity:

```text
ProfessionalVerification
```

Fields:

```text
id
doctorId
registrationNumber
status
submittedAt
verifiedAt
reviewedAt
reviewedBy
failureReason
createdAt
updatedAt
```

Verification status:

```text
PENDING
VERIFIED
MANUAL_REVIEW
FAILED
EXPIRED
```

---

# 14. Chamber

A chamber is a doctor's physical practice location.

Fields:

```text
id
ownerDoctorId
name
address
phone
description
status
createdAt
updatedAt
deletedAt
```

Status:

```text
ACTIVE
INACTIVE
CLOSED
```

---

# 15. Chamber Membership

A user can have different roles in different chambers.

Relationship:

```text
User
  │
  ├── Chamber A → Receptionist
  ├── Chamber B → Manager
  └── Chamber C → Assistant Doctor
```

Entity:

```text
ChamberMembership
```

Fields:

```text
id
userId
chamberId
roleId
status
joinedAt
invitedBy
```

Unique constraint:

```text
(userId, chamberId)
```

---

# 16. Role

Roles should be database entities rather than hard-coded authorization logic.

Default roles:

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
PLATFORM_ADMIN
```

---

# 17. Permission

Permissions represent individual capabilities.

Examples:

```text
patients:create
patients:read
patients:update

appointments:create
appointments:update
appointments:cancel

queue:manage

clinical_notes:create
clinical_notes:read

prescriptions:create
prescriptions:finalize

payments:create
payments:refund

reports:view
```

---

# 18. Role Permission

Many-to-many relationship:

```text
Role
  │
  ├── Permission
  ├── Permission
  └── Permission
```

Entity:

```text
RolePermission
```

Unique:

```text
(roleId, permissionId)
```

---

# 19. Patient

The patient is a global patient identity within the platform.

Fields:

```text
id
patientNumber
firstName
lastName
fullName
dateOfBirth
gender
phone
email
address
emergencyContactName
emergencyContactPhone
createdAt
updatedAt
deletedAt
```

Business identifier:

```text
PAT-000001
```

---

# 20. Patient Chamber Relationship

Because a patient can visit different chambers, create an explicit relationship.

```text
Patient
   │
   ├── Chamber A
   ├── Chamber B
   └── Chamber C
```

Entity:

```text
PatientChamber
```

Fields:

```text
id
patientId
chamberId
firstVisitAt
lastVisitAt
status
```

Unique:

```text
(patientId, chamberId)
```

This provides explicit chamber-level patient access.

---

# 21. Patient Allergies

Entity:

```text
PatientAllergy
```

Fields:

```text
id
patientId
allergen
reaction
severity
notes
recordedBy
recordedAt
```

Severity:

```text
MILD
MODERATE
SEVERE
UNKNOWN
```

Allergies should remain visible in clinical workflows.

---

# 22. Patient Conditions

Entity:

```text
PatientCondition
```

Fields:

```text
id
patientId
conditionName
diagnosisCode
status
onsetDate
notes
recordedBy
```

Status:

```text
ACTIVE
RESOLVED
HISTORICAL
```

---

# 23. Family

Optional MVP+ entity.

```text
Family
```

Fields:

```text
id
name
primaryPatientId
createdAt
updatedAt
```

---

# 24. Family Member

```text
FamilyMember
```

Fields:

```text
id
familyId
patientId
relationship
```

Relationships:

```text
SELF
SPOUSE
CHILD
PARENT
SIBLING
OTHER
```

---

# 25. Appointment

Appointment represents a scheduled visit.

Fields:

```text
id
appointmentNumber
patientId
doctorId
chamberId
scheduledDate
startTime
endTime
appointmentType
status
reason
notes
createdBy
createdAt
updatedAt
cancelledAt
cancelledBy
cancellationReason
```

Appointment types:

```text
NEW
FOLLOW_UP
EMERGENCY
OTHER
```

---

# 26. Appointment Status

```text
BOOKED
CONFIRMED
CHECKED_IN
WAITING
IN_CONSULTATION
COMPLETED
CANCELLED
NO_SHOW
```

Status transitions must be validated by the application.

---

# 27. Queue Entry

The queue represents the actual physical chamber waiting line.

Fields:

```text
id
chamberId
patientId
appointmentId
queueDate
queueNumber
status
priority
checkedInAt
calledAt
startedAt
completedAt
createdBy
```

Queue status:

```text
WAITING
CALLED
IN_CONSULTATION
COMPLETED
SKIPPED
CANCELLED
```

---

# 28. Queue Constraints

Important constraint:

```text
UNIQUE(chamber_id, queue_date, queue_number)
```

This prevents duplicate queue numbers.

Queue numbers should be generated transactionally.

---

# 29. Encounter

An encounter represents a clinical consultation.

Fields:

```text
id
encounterNumber
patientId
doctorId
chamberId
appointmentId
queueEntryId
assistantDoctorId
status
startedAt
completedAt
createdAt
updatedAt
```

Status:

```text
DRAFT
IN_PROGRESS
READY_FOR_REVIEW
COMPLETED
LOCKED
```

---

# 30. Encounter Ownership

Every encounter should reference:

```text
Patient
Doctor
Chamber
```

This is important for authorization.

Never determine encounter ownership only from the current authenticated user.

---

# 31. Clinical Notes

Entity:

```text
ClinicalNote
```

Fields:

```text
id
encounterId
chiefComplaint
historyOfPresentIllness
examination
assessment
plan
additionalNotes
createdBy
updatedBy
createdAt
updatedAt
version
```

Once the encounter is completed, modifications should use an amendment/versioning mechanism.

---

# 32. Clinical Note Versioning

Recommended:

```text
ClinicalNote
    │
    ├── Version 1
    ├── Version 2
    └── Version 3
```

Each version should preserve:

```text
content
author
timestamp
reason
```

---

# 33. Vital

Vitals belong to an encounter.

Fields:

```text
id
encounterId
patientId
weightKg
heightCm
bmi
systolicBp
diastolicBp
pulseBpm
temperature
temperatureUnit
respiratoryRate
spo2
bloodGlucose
recordedBy
recordedAt
```

Store patient ID as well where useful for efficient historical queries.

---

# 34. Diagnosis

Diagnosis reference entity:

```text
Diagnosis
```

Fields:

```text
id
name
code
codeSystem
description
status
```

Examples of code systems:

```text
ICD-10
SNOMED
CUSTOM
```

---

# 35. Encounter Diagnosis

Many-to-many relationship:

```text
Encounter
   │
   ├── Diagnosis
   ├── Diagnosis
   └── Diagnosis
```

Fields:

```text
id
encounterId
diagnosisId
isPrimary
notes
```

Unique:

```text
(encounterId, diagnosisId)
```

---

# 36. Investigation

Investigation ordered during consultation.

Fields:

```text
id
encounterId
patientId
name
code
priority
notes
status
orderedBy
orderedAt
```

Status:

```text
ORDERED
SAMPLE_COLLECTED
COMPLETED
CANCELLED
```

---

# 37. Diagnostic Report

A diagnostic report contains actual results or uploaded reports.

Fields:

```text
id
patientId
encounterId
investigationId
title
laboratoryName
reportDate
reportType
notes
aiAnalysisStatus
createdBy
createdAt
updatedAt
```

---

# 38. Report Files

A diagnostic report can contain multiple files.

```text
DiagnosticReport
      │
      ├── PDF
      ├── Image
      └── Image
```

Files should be represented by `FileObject`.

---

# 39. File Object

Fields:

```text
id
storageProvider
bucket
objectKey
originalFileName
mimeType
sizeBytes
checksum
uploadedBy
createdAt
deletedAt
```

The database should not store the binary content.

---

# 40. Medicine

Medicine catalog entity:

```text
Medicine
```

Fields:

```text
id
genericName
brandName
strength
form
route
manufacturer
status
createdAt
updatedAt
```

Example:

```text
Generic:
Paracetamol

Brand:
Napa

Strength:
500 mg

Form:
Tablet
```

---

# 41. Doctor Medicine Favorite

Many-to-many relationship:

```text
Doctor
  │
  ├── Medicine
  ├── Medicine
  └── Medicine
```

Entity:

```text
DoctorMedicineFavorite
```

Unique:

```text
(doctorId, medicineId)
```

---

# 42. Prescription

Prescription belongs to an encounter.

Fields:

```text
id
prescriptionNumber
encounterId
patientId
doctorId
chamberId
status
version
notes
followUpDate
finalizedAt
finalizedBy
createdAt
updatedAt
```

Status:

```text
DRAFT
REVIEW_REQUIRED
FINALIZED
DELIVERED
CANCELLED
```

---

# 43. Prescription Item

Fields:

```text
id
prescriptionId
medicineId
medicineNameSnapshot
strengthSnapshot
dosage
frequency
duration
route
instruction
sortOrder
```

Important:

`medicineNameSnapshot` and `strengthSnapshot` should be stored because medicine catalog information may change later.

---

# 44. Prescription Versioning

A finalized prescription should never be overwritten.

Recommended model:

```text
Prescription
    │
    ├── Version 1 → FINALIZED
    │
    └── Version 2 → AMENDED
```

Alternative implementation:

```text
Prescription
PrescriptionVersion
PrescriptionItem
```

For the first implementation, using `version` on the prescription plus immutable amendment records is acceptable.

---

# 45. Prescription Amendment

Entity:

```text
PrescriptionAmendment
```

Fields:

```text
id
prescriptionId
previousVersion
newVersion
reason
createdBy
createdAt
```

This preserves history.

---

# 46. Prescription Template

Fields:

```text
id
doctorId
name
description
createdAt
updatedAt
deletedAt
```

Template items:

```text
PrescriptionTemplateItem
```

must reference medicines and standard instructions.

Templates never directly finalize prescriptions.

---

# 47. Payment

Payment entity:

```text
Payment
```

Fields:

```text
id
paymentNumber
patientId
chamberId
doctorId
appointmentId
encounterId
amount
discount
totalAmount
currency
method
status
paidAt
receivedBy
createdAt
updatedAt
```

Currency:

```text
BDT
```

---

# 48. Payment Method

```text
CASH
CARD
MOBILE_PAYMENT
BANK_TRANSFER
OTHER
```

---

# 49. Receipt

Fields:

```text
id
receiptNumber
paymentId
pdfFileId
issuedAt
```

Receipt number should be unique.

Example:

```text
RCPT-2026-000129
```

---

# 50. Refund

Optional but recommended.

```text
PaymentRefund
```

Fields:

```text
id
paymentId
amount
reason
status
processedBy
processedAt
createdAt
```

---

# 51. Notification

Fields:

```text
id
userId
type
title
message
data
readAt
createdAt
```

Notification types:

```text
APPOINTMENT_CREATED
APPOINTMENT_CANCELLED
PATIENT_WAITING
PRESCRIPTION_READY
PAYMENT_RECEIVED
FOLLOW_UP_DUE
VERIFICATION_COMPLETED
SYSTEM
```

---

# 52. AI Request

Every AI operation should create an auditable AI request.

Fields:

```text
id
userId
patientId
encounterId
chamberId
feature
provider
model
promptVersion
status
startedAt
completedAt
errorCode
createdAt
```

Status:

```text
PENDING
PROCESSING
COMPLETED
FAILED
BLOCKED
```

---

# 53. AI Request Context

Do not rely exclusively on storing raw prompt text.

Store references to source records.

Example:

```text
AIRequest
   │
   ├── Encounter 123
   ├── Encounter 119
   ├── Report 456
   └── Prescription 789
```

This allows auditability without unnecessarily duplicating sensitive clinical information.

---

# 54. AI Draft

AI-generated clinical suggestions should be stored separately from official records.

Fields:

```text
id
aiRequestId
type
status
content
createdBy
reviewedBy
reviewedAt
rejectionReason
createdAt
```

Types:

```text
PATIENT_SUMMARY
PRESCRIPTION_DRAFT
CLINICAL_NOTE
REPORT_ANALYSIS
```

Status:

```text
GENERATED
REVIEWED
ACCEPTED
REJECTED
EXPIRED
```

---

# 55. AI Draft Safety

An AI draft must never become a finalized clinical record automatically.

The relationship must remain:

```text
AI Draft
   ↓
Doctor Review
   ↓
Human-created Clinical Record
```

---

# 56. Audit Log

Audit logging is a first-class database domain.

Fields:

```text
id
actorUserId
chamberId
action
resourceType
resourceId
patientId
metadata
ipAddress
userAgent
createdAt
```

Examples:

```text
PATIENT_CREATED
PATIENT_UPDATED
REPORT_VIEWED
REPORT_DOWNLOADED
PRESCRIPTION_CREATED
PRESCRIPTION_FINALIZED
PRESCRIPTION_AMENDED
PAYMENT_CREATED
PAYMENT_REFUNDED
AI_REQUEST_CREATED
AI_DRAFT_ACCEPTED
STAFF_PERMISSION_CHANGED
```

---

# 57. Audit Immutability

Audit records should never be updated or deleted by normal application workflows.

Only controlled administrative retention processes should operate on them.

---

# 58. Export Job

For future data export:

```text
ExportJob
```

Fields:

```text
id
userId
chamberId
type
status
fileId
requestedAt
completedAt
expiresAt
```

Types:

```text
PATIENT_DATA
CHAMBER_DATA
FINANCIAL_DATA
FULL_EXPORT
```

---

# 59. Background Job Tracking

Optional application-level job tracking:

```text
JobExecution
```

Fields:

```text
id
jobType
status
attempts
startedAt
completedAt
error
createdAt
```

Redis remains the job queue; PostgreSQL stores business-important job state.

---

# 60. Subscription

Future SaaS functionality.

```text
SubscriptionPlan
Subscription
```

Plan fields:

```text
id
name
price
currency
billingPeriod
limits
features
status
```

Subscription fields:

```text
id
doctorId
planId
status
startsAt
endsAt
cancelledAt
```

---

# 61. Important Relationships

High-level relationship diagram:

```text
User
 │
 ├──────── DoctorProfile
 │
 ├──────── UserSession
 │
 ├──────── ChamberMembership ───── Chamber
 │                                      │
 │                                      ├── Schedule
 │                                      ├── Appointment
 │                                      ├── QueueEntry
 │                                      ├── Payment
 │                                      └── Staff
 │
 └──────── Notification

DoctorProfile
 │
 ├── ProfessionalVerification
 └── MedicineFavorites

Patient
 │
 ├── PatientChamber
 ├── Allergy
 ├── Condition
 ├── Appointment
 ├── QueueEntry
 ├── Encounter
 ├── DiagnosticReport
 ├── Prescription
 └── Payment

Encounter
 │
 ├── ClinicalNote
 ├── Vital
 ├── Diagnosis
 ├── Investigation
 └── Prescription

Prescription
 │
 ├── PrescriptionItem
 └── PrescriptionAmendment

AIRequest
 │
 └── AIDraft

AuditLog
 │
 ├── User
 ├── Chamber
 └── Patient
```

---

# 62. Recommended Prisma Enums

```prisma
enum UserStatus {
  REGISTERED
  PHONE_VERIFIED
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum ChamberStatus {
  ACTIVE
  INACTIVE
  CLOSED
}

enum MembershipStatus {
  INVITED
  ACTIVE
  SUSPENDED
  REMOVED
}

enum VerificationStatus {
  PENDING
  VERIFIED
  MANUAL_REVIEW
  FAILED
  EXPIRED
}

enum AppointmentStatus {
  BOOKED
  CONFIRMED
  CHECKED_IN
  WAITING
  IN_CONSULTATION
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum AppointmentType {
  NEW
  FOLLOW_UP
  EMERGENCY
  OTHER
}

enum QueueStatus {
  WAITING
  CALLED
  IN_CONSULTATION
  COMPLETED
  SKIPPED
  CANCELLED
}

enum EncounterStatus {
  DRAFT
  IN_PROGRESS
  READY_FOR_REVIEW
  COMPLETED
  LOCKED
}

enum PrescriptionStatus {
  DRAFT
  REVIEW_REQUIRED
  FINALIZED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  REFUNDED
  CANCELLED
}

enum PaymentMethod {
  CASH
  CARD
  MOBILE_PAYMENT
  BANK_TRANSFER
  OTHER
}

enum AIRequestStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  BLOCKED
}

enum AIDraftStatus {
  GENERATED
  REVIEWED
  ACCEPTED
  REJECTED
  EXPIRED
}
```

---

# 63. Core Prisma Schema

The following represents the recommended foundation.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String     @id @default(uuid())
  phone        String     @unique
  email        String?    @unique
  passwordHash String?
  status       UserStatus @default(REGISTERED)
  language     String     @default("bn")
  lastLoginAt  DateTime?

  doctorProfile       DoctorProfile?
  sessions            UserSession[]
  chamberMemberships  ChamberMembership[]
  notifications      Notification[]
  auditLogs           AuditLog[] @relation("AuditActor")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
}

model UserSession {
  id               String   @id @default(uuid())
  userId           String
  refreshTokenHash String   @unique
  deviceId         String?
  deviceName       String?
  ipAddress        String?
  userAgent        String?
  expiresAt        DateTime
  revokedAt        DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}

model DoctorProfile {
  id                     String   @id @default(uuid())
  userId                 String   @unique
  fullName               String
  displayName            String?
  title                  String?
  gender                 String?
  dateOfBirth            DateTime?
  profileImageId         String?
  specialization         String?
  qualifications         String?
  bmdcRegistrationNumber String?  @unique
  yearsOfExperience      Int?
  bio                    String?

  user                  User @relation(fields: [userId], references: [id], onDelete: Cascade)
  ownedChambers         Chamber[]
  verifications         ProfessionalVerification[]
  medicineFavorites     DoctorMedicineFavorite[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ProfessionalVerification {
  id                 String             @id @default(uuid())
  doctorId           String
  registrationNumber String
  status             VerificationStatus @default(PENDING)
  submittedAt        DateTime           @default(now())
  verifiedAt         DateTime?
  reviewedAt         DateTime?
  reviewedBy         String?
  failureReason      String?

  doctor DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([doctorId])
  @@index([status])
}

model Chamber {
  id            String         @id @default(uuid())
  ownerDoctorId String
  name          String
  address       String
  phone         String?
  description   String?
  status        ChamberStatus  @default(ACTIVE)
  deletedAt     DateTime?

  owner         DoctorProfile @relation(fields: [ownerDoctorId], references: [id])
  memberships   ChamberMembership[]
  schedules     Schedule[]
  patients      PatientChamber[]
  appointments  Appointment[]
  queueEntries  QueueEntry[]
  encounters    Encounter[]
  prescriptions Prescription[]
  payments      Payment[]
  auditLogs     AuditLog[]
  aiRequests    AIRequest[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerDoctorId])
  @@index([status])
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?

  memberships ChamberMembership[]
  permissions RolePermission[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Permission {
  id          String   @id @default(uuid())
  code        String   @unique
  description String?

  roles RolePermission[]

  createdAt DateTime @default(now())
}

model RolePermission {
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model ChamberMembership {
  id        String           @id @default(uuid())
  userId    String
  chamberId String
  roleId    String
  status    MembershipStatus @default(INVITED)
  invitedBy String?
  joinedAt  DateTime?

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  chamber Chamber @relation(fields: [chamberId], references: [id], onDelete: Cascade)
  role    Role    @relation(fields: [roleId], references: [id])

  @@unique([userId, chamberId])
  @@index([chamberId])
  @@index([userId])
}

model Schedule {
  id                 String   @id @default(uuid())
  chamberId          String
  dayOfWeek          Int
  startTime          String
  endTime            String
  appointmentMinutes Int      @default(10)
  maxPatients        Int?
  isActive           Boolean  @default(true)

  chamber Chamber @relation(fields: [chamberId], references: [id], onDelete: Cascade)
  breaks  ScheduleBreak[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([chamberId, dayOfWeek])
}

model ScheduleBreak {
  id         String   @id @default(uuid())
  scheduleId String
  startTime  String
  endTime    String
  reason     String?

  schedule Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
}

model Patient {
  id                    String   @id @default(uuid())
  patientNumber         String   @unique
  firstName             String
  lastName              String?
  fullName              String
  dateOfBirth           DateTime?
  gender                String?
  phone                 String?
  email                 String?
  address               String?
  emergencyContactName  String?
  emergencyContactPhone String?
  deletedAt             DateTime?

  chambers      PatientChamber[]
  allergies     PatientAllergy[]
  conditions    PatientCondition[]
  appointments  Appointment[]
  queueEntries  QueueEntry[]
  encounters    Encounter[]
  reports       DiagnosticReport[]
  payments      Payment[]
  prescriptions Prescription[]
  aiRequests    AIRequest[]
  auditLogs     AuditLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([phone])
  @@index([fullName])
}

model PatientChamber {
  id           String   @id @default(uuid())
  patientId    String
  chamberId    String
  firstVisitAt DateTime?
  lastVisitAt  DateTime?
  status       String   @default("ACTIVE")

  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)
  chamber Chamber @relation(fields: [chamberId], references: [id], onDelete: Cascade)

  @@unique([patientId, chamberId])
  @@index([chamberId])
}

model PatientAllergy {
  id         String   @id @default(uuid())
  patientId  String
  allergen   String
  reaction   String?
  severity   String?
  notes      String?
  recordedBy String
  recordedAt DateTime @default(now())

  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
}

model PatientCondition {
  id            String   @id @default(uuid())
  patientId     String
  conditionName String
  diagnosisCode String?
  status        String   @default("ACTIVE")
  onsetDate     DateTime?
  notes         String?
  recordedBy    String

  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
}

model Appointment {
  id               String            @id @default(uuid())
  appointmentNumber String           @unique
  patientId        String
  doctorId         String
  chamberId        String
  scheduledDate    DateTime
  startTime        String
  endTime          String
  appointmentType  AppointmentType
  status           AppointmentStatus @default(BOOKED)
  reason           String?
  notes            String?
  createdBy        String
  cancelledAt      DateTime?
  cancelledBy      String?
  cancellationReason String?

  patient Patient @relation(fields: [patientId], references: [id])
  chamber Chamber @relation(fields: [chamberId], references: [id])

  queueEntry QueueEntry?
  encounter  Encounter?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([chamberId, scheduledDate])
  @@index([patientId])
  @@index([doctorId, scheduledDate])
  @@index([status])
}

model QueueEntry {
  id            String      @id @default(uuid())
  chamberId     String
  patientId     String
  appointmentId String?     @unique
  queueDate     DateTime
  queueNumber   Int
  status        QueueStatus @default(WAITING)
  priority      Int         @default(0)
  checkedInAt   DateTime    @default(now())
  calledAt      DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  createdBy     String

  chamber     Chamber      @relation(fields: [chamberId], references: [id])
  patient     Patient      @relation(fields: [patientId], references: [id])
  appointment Appointment?  @relation(fields: [appointmentId], references: [id])
  encounter   Encounter?

  createdAt DateTime @default(now())

  @@unique([chamberId, queueDate, queueNumber])
  @@index([chamberId, queueDate, status])
}

model Encounter {
  id               String          @id @default(uuid())
  encounterNumber  String          @unique
  patientId        String
  doctorId         String
  chamberId        String
  appointmentId    String?         @unique
  queueEntryId     String?         @unique
  assistantDoctorId String?
  status           EncounterStatus @default(DRAFT)
  startedAt        DateTime?
  completedAt      DateTime?

  patient      Patient      @relation(fields: [patientId], references: [id])
  chamber      Chamber      @relation(fields: [chamberId], references: [id])
  appointment  Appointment? @relation(fields: [appointmentId], references: [id])
  queueEntry   QueueEntry?  @relation(fields: [queueEntryId], references: [id])

  clinicalNote ClinicalNote?
  vitals      Vital[]
  diagnoses   EncounterDiagnosis[]
  investigations Investigation[]
  prescriptions Prescription[]
  payments    Payment[]
  aiRequests  AIRequest[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([patientId, createdAt])
  @@index([chamberId, createdAt])
  @@index([doctorId, createdAt])
}

model ClinicalNote {
  id                    String   @id @default(uuid())
  encounterId           String   @unique
  chiefComplaint        String?
  historyOfPresentIllness String?
  examination           String?
  assessment            String?
  plan                  String?
  additionalNotes       String?
  createdBy             String
  updatedBy             String?
  version               Int      @default(1)

  encounter Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Vital {
  id               String   @id @default(uuid())
  encounterId      String
  patientId        String
  weightKg         Decimal?
  heightCm         Decimal?
  bmi              Decimal?
  systolicBp       Int?
  diastolicBp      Int?
  pulseBpm         Int?
  temperature      Decimal?
  temperatureUnit  String?
  respiratoryRate  Int?
  spo2             Decimal?
  bloodGlucose     Decimal?
  recordedBy       String
  recordedAt       DateTime @default(now())

  encounter Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  patient   Patient   @relation(fields: [patientId], references: [id])

  @@index([patientId, recordedAt])
  @@index([encounterId])
}

model Diagnosis {
  id          String   @id @default(uuid())
  name        String
  code        String?
  codeSystem  String?
  description String?
  status      String   @default("ACTIVE")

  encounters EncounterDiagnosis[]

  @@index([name])
  @@index([code])
}

model EncounterDiagnosis {
  id           String  @id @default(uuid())
  encounterId  String
  diagnosisId  String
  isPrimary    Boolean @default(false)
  notes        String?

  encounter Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  diagnosis Diagnosis @relation(fields: [diagnosisId], references: [id])

  @@unique([encounterId, diagnosisId])
  @@index([encounterId])
}

model Investigation {
  id          String   @id @default(uuid())
  encounterId String
  patientId   String
  name        String
  code        String?
  priority    String   @default("ROUTINE")
  notes       String?
  status      String   @default("ORDERED")
  orderedBy   String
  orderedAt   DateTime @default(now())

  encounter Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  patient   Patient   @relation(fields: [patientId], references: [id])

  reports DiagnosticReport[]

  @@index([patientId, orderedAt])
  @@index([encounterId])
}

model FileObject {
  id               String   @id @default(uuid())
  storageProvider   String
  bucket            String
  objectKey         String   @unique
  originalFileName  String
  mimeType          String
  sizeBytes         BigInt
  checksum          String?
  uploadedBy        String
  deletedAt         DateTime?

  createdAt DateTime @default(now())
}

model DiagnosticReport {
  id               String   @id @default(uuid())
  patientId        String
  encounterId      String?
  investigationId  String?
  title            String
  laboratoryName   String?
  reportDate       DateTime?
  reportType       String?
  notes            String?
  aiAnalysisStatus String?
  createdBy        String

  patient       Patient       @relation(fields: [patientId], references: [id])
  investigation Investigation? @relation(fields: [investigationId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([patientId, reportDate])
  @@index([investigationId])
}

model Medicine {
  id           String   @id @default(uuid())
  genericName  String
  brandName    String?
  strength     String?
  form         String?
  route        String?
  manufacturer String?
  status       String   @default("ACTIVE")

  favorites DoctorMedicineFavorite[]
  items     PrescriptionItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([genericName])
  @@index([brandName])
}

model DoctorMedicineFavorite {
  doctorId   String
  medicineId String

  doctor   DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  medicine Medicine      @relation(fields: [medicineId], references: [id], onDelete: Cascade)

  @@id([doctorId, medicineId])
}

model Prescription {
  id                 String             @id @default(uuid())
  prescriptionNumber String             @unique
  encounterId        String
  patientId          String
  doctorId           String
  chamberId          String
  status             PrescriptionStatus @default(DRAFT)
  version            Int                @default(1)
  notes              String?
  followUpDate       DateTime?
  finalizedAt        DateTime?
  finalizedBy        String?

  encounter Encounter @relation(fields: [encounterId], references: [id])
  patient   Patient   @relation(fields: [patientId], references: [id])
  chamber   Chamber   @relation(fields: [chamberId], references: [id])

  items       PrescriptionItem[]
  amendments  PrescriptionAmendment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([patientId, createdAt])
  @@index([encounterId])
  @@index([chamberId, createdAt])
}

model PrescriptionItem {
  id                   String  @id @default(uuid())
  prescriptionId       String
  medicineId           String?
  medicineNameSnapshot String
  strengthSnapshot     String?
  dosage               String?
  frequency            String?
  duration             String?
  route                String?
  instruction          String?
  sortOrder            Int

  prescription Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medicine     Medicine?    @relation(fields: [medicineId], references: [id])

  @@index([prescriptionId])
}

model PrescriptionAmendment {
  id             String   @id @default(uuid())
  prescriptionId String
  previousVersion Int
  newVersion      Int
  reason         String
  createdBy      String

  prescription Prescription @relation(fields: [prescriptionId], references: [id])

  createdAt DateTime @default(now())

  @@index([prescriptionId])
}

model Payment {
  id            String        @id @default(uuid())
  paymentNumber String        @unique
  patientId     String
  chamberId     String
  doctorId      String
  appointmentId String?
  encounterId   String?
  amount        Decimal
  discount      Decimal       @default(0)
  totalAmount   Decimal
  currency      String        @default("BDT")
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  paidAt        DateTime?
  receivedBy    String

  patient     Patient      @relation(fields: [patientId], references: [id])
  chamber     Chamber      @relation(fields: [chamberId], references: [id])
  encounter   Encounter?   @relation(fields: [encounterId], references: [id])

  receipt Receipt?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([chamberId, createdAt])
  @@index([patientId, createdAt])
  @@index([status])
}

model Receipt {
  id           String   @id @default(uuid())
  receiptNumber String  @unique
  paymentId    String   @unique
  pdfFileId    String?
  issuedAt     DateTime @default(now())

  payment Payment @relation(fields: [paymentId], references: [id])
}

model Notification {
  id        String    @id @default(uuid())
  userId    String
  type      String
  title     String
  message   String
  data      Json?
  readAt    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([userId, readAt, createdAt])
}

model AIRequest {
  id            String          @id @default(uuid())
  userId        String
  patientId     String?
  encounterId   String?
  chamberId     String?
  feature       String
  provider      String?
  model         String?
  promptVersion String?
  status        AIRequestStatus @default(PENDING)
  startedAt     DateTime?
  completedAt   DateTime?
  errorCode     String?

  patient   Patient?   @relation(fields: [patientId], references: [id])
  chamber   Chamber?   @relation(fields: [chamberId], references: [id])
  encounter Encounter? @relation(fields: [encounterId], references: [id])

  drafts AIDraft[]

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([patientId, createdAt])
  @@index([encounterId])
}

model AIDraft {
  id             String        @id @default(uuid())
  aiRequestId    String
  type           String
  status         AIDraftStatus @default(GENERATED)
  content        Json
  reviewedBy     String?
  reviewedAt     DateTime?
  rejectionReason String?

  aiRequest AIRequest @relation(fields: [aiRequestId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([aiRequestId])
  @@index([status])
}

model AuditLog {
  id            String   @id @default(uuid())
  actorUserId   String?
  chamberId     String?
  patientId     String?
  action        String
  resourceType  String
  resourceId    String?
  metadata      Json?
  ipAddress     String?
  userAgent     String?

  actor   User?    @relation("AuditActor", fields: [actorUserId], references: [id])
  chamber Chamber? @relation(fields: [chamberId], references: [id])
  patient Patient? @relation(fields: [patientId], references: [id])

  createdAt DateTime @default(now())

  @@index([actorUserId, createdAt])
  @@index([chamberId, createdAt])
  @@index([patientId, createdAt])
  @@index([resourceType, resourceId])
}
```

---

# 63. Important Schema Improvement

The initial Prisma schema above should be considered the **baseline**, not blindly copied into production.

Before implementation, the engineering team should resolve several details.

## 63.1 Doctor vs Chamber Schedule

If assistant doctors can have separate schedules, schedule ownership should be expanded:

```text
Schedule
 ├── Chamber
 └── Doctor
```

rather than only:

```text
Schedule → Chamber
```

This is recommended for the production schema.

---

# 64. Doctor Schedule Model

Recommended:

```text
Schedule
    chamberId
    doctorId
    dayOfWeek
    startTime
    endTime
```

This supports:

```text
Chamber A
 ├── Doctor A → 5 PM–9 PM
 └── Doctor B → 6 PM–10 PM
```

---

# 65. Appointment Doctor Relationship

The appointment must explicitly identify the doctor.

```text
Appointment
 ├── chamberId
 ├── doctorId
 └── patientId
```

This is especially important when a chamber has:

- Main doctor
- Assistant doctors
- Multiple consulting doctors

---

# 66. Consultation Assistant

An encounter may contain:

```text
doctorId
assistantDoctorId
```

The assistant can prepare the consultation while the doctor remains the final clinical authority.

---

# 67. Clinical Record Access

Database relationships alone are not sufficient to protect clinical information.

The API must validate:

```text
User
 ↓
Chamber Membership
 ↓
Clinical Permission
 ↓
Patient-Chamber Relationship
 ↓
Encounter
```

---

# 68. Multi-Chamber Isolation

Recommended query pattern:

```text
SELECT *
FROM encounters
WHERE id = ?
AND chamber_id IN (
    SELECT chamber_id
    FROM chamber_memberships
    WHERE user_id = ?
);
```

Prisma should encapsulate this through service/repository methods.

---

# 69. Row-Level Security

PostgreSQL Row-Level Security may be considered later.

For MVP:

```text
Application-level authorization
+
Database foreign keys
+
Audit logging
```

is sufficient if implemented correctly.

For larger enterprise deployments:

```text
PostgreSQL RLS
```

could provide an additional security layer.

---

# 70. Indexing Strategy

Important indexes:

## Patients

```text
phone
fullName
patientNumber
```

## Appointments

```text
chamberId + scheduledDate
doctorId + scheduledDate
status
patientId
```

## Queue

```text
chamberId + queueDate + status
chamberId + queueDate + queueNumber
```

## Encounters

```text
patientId + createdAt
doctorId + createdAt
chamberId + createdAt
```

## Prescriptions

```text
patientId + createdAt
encounterId
chamberId + createdAt
```

## Payments

```text
chamberId + createdAt
patientId + createdAt
status
```

---

# 71. Patient Search Index

For Bangla/English search, PostgreSQL should eventually use:

```text
pg_trgm
```

Example:

```sql
CREATE INDEX patient_full_name_trgm_idx
ON patients
USING gin (full_name gin_trgm_ops);
```

This improves partial and fuzzy matching.

---

# 72. Financial Precision

Never use floating-point numbers for money.

Use:

```prisma
Decimal
```

Example:

```text
amount = Decimal
discount = Decimal
totalAmount = Decimal
```

Currency:

```text
BDT
```

---

# 73. Date and Time Strategy

Store timestamps in:

```text
UTC
```

Convert to:

```text
Asia/Dhaka
```

at the application/UI layer.

For chamber schedules, store local time values appropriately because schedules are recurring local business rules.

---

# 74. Business Date

Queue numbering should use a chamber-local business date.

Example:

```text
03 Sep 2026
```

All queue operations for that chamber/day should use the same logical business date.

---

# 75. Queue Number Generation

Recommended transactional approach:

```text
BEGIN

SELECT current queue counter
FOR UPDATE

increment counter

create queue entry

COMMIT
```

Alternative:

Use a dedicated:

```text
DailyQueueCounter
```

entity.

---

# 76. Daily Queue Counter

Recommended entity:

```text
DailyQueueCounter
```

Fields:

```text
id
chamberId
queueDate
lastNumber
```

Unique:

```text
(chamberId, queueDate)
```

This is safer than calculating:

```text
MAX(queueNumber) + 1
```

under concurrency.

---

# 77. Business Identifier Generation

Use database-backed sequences/counters for:

```text
Patient Number
Appointment Number
Encounter Number
Prescription Number
Payment Number
Receipt Number
```

Avoid generating these identifiers using application timestamps alone.

---

# 78. Soft Delete Strategy

Use soft delete for:

```text
Patient
Chamber
Doctor
Staff Membership
Prescription Template
Medicine
```

Do not physically delete clinical records through normal application operations.

---

# 79. Clinical Retention

Clinical records should follow a defined retention policy.

At minimum:

```text
Encounter
ClinicalNote
Diagnosis
Investigation
DiagnosticReport
Prescription
Payment
AuditLog
```

should remain recoverable.

The exact legal retention period should be established separately before production deployment.

---

# 80. Referential Integrity

Recommended PostgreSQL behavior:

```text
User
  ↓
Session
CASCADE

Patient
  ↓
Encounter
RESTRICT / preserve

Encounter
  ↓
Prescription
RESTRICT / preserve
```

Do not use cascading deletes on critical clinical records unless the business policy explicitly permits it.

---

# 81. Transaction Boundaries

Critical operations:

### Appointment creation

```text
Validate availability
+
Create appointment
+
Audit
```

### Check-in

```text
Update appointment
+
Create queue
+
Audit
```

### Consultation completion

```text
Validate encounter
+
Complete encounter
+
Update queue
+
Audit
```

### Prescription finalization

```text
Validate
+
Finalize
+
Audit
+
Event
```

### Payment

```text
Validate amount
+
Create payment
+
Create receipt metadata
+
Audit
```

---

# 82. Database Transaction Example

Prisma:

```typescript
await prisma.$transaction(async (tx) => {
  const prescription = await tx.prescription.findUnique({
    where: { id: prescriptionId },
  });

  // Validate authorization and state.

  await tx.prescription.update({
    where: { id: prescriptionId },
    data: {
      status: "FINALIZED",
      finalizedAt: new Date(),
      finalizedBy: userId,
    },
  });

  await tx.auditLog.create({
    data: {
      actorUserId: userId,
      action: "PRESCRIPTION_FINALIZED",
      resourceType: "PRESCRIPTION",
      resourceId: prescriptionId,
    },
  });
});
```

The actual implementation should use row locking or equivalent concurrency protection where required.

---

# 83. Optimistic Concurrency

For clinical drafts, consider:

```text
version
updatedAt
```

Example:

```text
Client version = 4
Server version = 5
```

Response:

```text
409 CONFLICT
```

This prevents one user's changes from silently overwriting another user's changes.

---

# 84. Offline Sync Preparation

If offline support is introduced later, important entities should support:

```text
updatedAt
version
clientId
syncStatus
```

Potential future entity:

```text
SyncEvent
```

The MVP does not need a full sync engine.

---

# 85. Database Seed Data

The seed process should create:

### Roles

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
PLATFORM_ADMIN
```

### Permissions

Examples:

```text
patients:create
patients:read
patients:update
appointments:create
appointments:read
appointments:update
queue:manage
clinical_notes:create
clinical_notes:read
prescriptions:create
prescriptions:finalize
payments:create
payments:refund
reports:view
ai:use
```

---

# 86. Medicine Seed Data

Development environment should contain a small medicine catalog for testing.

Example:

```text
Paracetamol 500 mg
Omeprazole 20 mg
Amoxicillin 500 mg
```

Production medicine data should come from an approved data source.

---

# 87. Diagnosis Seed Data

Development can contain common diagnoses:

```text
Hypertension
Type 2 Diabetes
Upper Respiratory Tract Infection
Fever
Gastritis
```

Production coding should eventually use a controlled diagnosis dictionary.

---

# 88. Database Migration Strategy

All schema changes must be version controlled.

Workflow:

```text
Developer
    ↓
Schema Change
    ↓
Prisma Migration
    ↓
Code Review
    ↓
Automated Tests
    ↓
Staging
    ↓
Production
```

Never manually modify production tables without an emergency/change-management process.

---

# 89. Migration Safety

Before destructive changes:

```text
Backup
 ↓
Migration
 ↓
Validation
 ↓
Smoke Tests
```

Prefer expand-and-contract migrations.

Example:

```text
Release 1
Add new column

Release 2
Start writing new column

Release 3
Backfill data

Release 4
Read new column

Release 5
Remove old column
```

---

# 90. Database Performance

Initial target:

```text
Normal queries: <100 ms
Complex clinical queries: <300 ms
Dashboard queries: <500 ms
```

Use:

- Proper indexes
- Pagination
- Selective fields
- Avoiding N+1 queries
- Aggregation queries
- Connection pooling

---

# 91. Prisma Query Guidelines

Avoid:

```typescript
include: {
  everything: true
}
```

Prefer:

```typescript
select: {
  id: true,
  patientNumber: true,
  fullName: true,
}
```

This is particularly important for patient and clinical data.

---

# 92. N+1 Prevention

Use:

```text
include
select
batch queries
DataLoader where appropriate
```

Avoid loading:

```text
Patient
 → Encounters
   → Prescriptions
     → Items
       → Medicine
```

individually for every patient in a list.

---

# 93. Reporting Queries

Reporting queries should not load complete clinical objects.

Example:

```text
SELECT
  COUNT(*) AS total_patients,
  DATE(created_at) AS date
FROM encounters
WHERE chamber_id = ?
GROUP BY DATE(created_at);
```

Return aggregated data only.

---

# 94. Sensitive Query Protection

The application should avoid returning sensitive data by default.

Example patient list:

```text
id
patientNumber
name
age
phone
```

Clinical history should require an explicit clinical permission.

---

# 95. Database Security

Production database should use:

- Private networking
- Strong credentials
- Encryption at rest
- TLS
- Restricted inbound access
- Separate application database user
- Migration user with elevated privileges
- Regular backups

---

# 96. Database Users

Recommended:

```text
app_user
migration_user
readonly_reporting_user
```

The application should not use a superuser.

---

# 97. Backup Strategy

Minimum:

```text
Daily full backup
+
Continuous/PITR where available
```

Retention should be configured according to business and compliance requirements.

Restore testing should be performed regularly.

---

# 98. Disaster Recovery

Define:

```text
RPO
Recovery Point Objective

RTO
Recovery Time Objective
```

Initial target:

```text
RPO: < 24 hours
RTO: < 4 hours
```

These should become stricter as the product matures.

---

# 99. Database Monitoring

Monitor:

```text
Connection count
Query latency
Slow queries
Locks
Deadlocks
CPU
Memory
Disk usage
Replication lag
Backup status
```

---

# 100. Database Architecture — Final Recommendation

The production database should follow:

```text
PostgreSQL
      │
      ├── Identity
      │     ├── User
      │     ├── Session
      │     ├── Role
      │     └── Permission
      │
      ├── Practice
      │     ├── Doctor
      │     ├── Chamber
      │     ├── Membership
      │     └── Schedule
      │
      ├── Patient
      │     ├── Patient
      │     ├── Allergy
      │     ├── Condition
      │     └── Family
      │
      ├── Operations
      │     ├── Appointment
      │     ├── Queue
      │     └── Payment
      │
      ├── Clinical
      │     ├── Encounter
      │     ├── ClinicalNote
      │     ├── Vital
      │     ├── Diagnosis
      │     ├── Investigation
      │     └── DiagnosticReport
      │
      ├── Prescription
      │     ├── Medicine
      │     ├── Prescription
      │     ├── PrescriptionItem
      │     └── Amendment
      │
      ├── AI
      │     ├── AIRequest
      │     └── AIDraft
      │
      ├── Files
      │     └── FileObject
      │
      └── Governance
            ├── AuditLog
            ├── Notification
            └── ExportJob
```

---

# 101. Database Implementation Priority

## P0 — MVP

Implement first:

```text
User
UserSession
DoctorProfile
ProfessionalVerification

Role
Permission
RolePermission
ChamberMembership

Chamber
Schedule

Patient
PatientChamber
PatientAllergy
PatientCondition

Appointment
QueueEntry

Encounter
ClinicalNote
Vital
Diagnosis
EncounterDiagnosis
Investigation
DiagnosticReport

FileObject

Medicine
DoctorMedicineFavorite
Prescription
PrescriptionItem
PrescriptionAmendment

Payment
Receipt

Notification
AuditLog

AIRequest
AIDraft
```

---

# 102. P1 — MVP+

Add:

```text
PrescriptionTemplate
PrescriptionTemplateItem
Family
FamilyMember
PaymentRefund
ExportJob
```

---

# 103. P2 — Advanced

Add:

```text
SyncEvent
ClinicalNoteVersion
PrescriptionVersion
AIContextReference
AIUsageRecord
Advanced analytics tables
```

---

# 104. Final Database Rules

The engineering team should treat the following as non-negotiable:

```text
1. PostgreSQL is the source of truth.

2. Clinical records must be auditable.

3. Finalized prescriptions must not be silently modified.

4. Chamber access must be enforced server-side.

5. User role ≠ chamber membership.

6. Patient access must be authorized.

7. Financial values use Decimal.

8. Internal IDs use UUID.

9. Business IDs are separate from database IDs.

10. Critical workflows use transactions.

11. Queue numbers require concurrency protection.

12. Audit logs are immutable.

13. Sensitive files remain private.

14. AI drafts remain separate from official clinical records.

15. AI cannot finalize prescriptions.

16. Database backups must be tested through restoration.

17. Destructive migrations require controlled rollout.

18. Clinical data should not be physically deleted through normal APIs.
```

---

# 105. Final Data Flow

The complete data flow is:

```text
USER
 │
 ▼
AUTHENTICATION
 │
 ▼
CHAMBER MEMBERSHIP
 │
 ▼
PATIENT
 │
 ▼
APPOINTMENT
 │
 ▼
QUEUE
 │
 ▼
ENCOUNTER
 ├── VITALS
 ├── CLINICAL NOTES
 ├── DIAGNOSIS
 ├── INVESTIGATION
 │       │
 │       ▼
 │    REPORT
 │
 └── PRESCRIPTION
         │
         ├── MEDICINES
         └── AI DRAFT
                │
                ▼
           DOCTOR REVIEW
                │
                ▼
            FINALIZED
                │
                ▼
              PAYMENT
                │
                ▼
             RECEIPT
```

This structure provides a strong foundation for the Chamber Management MVP while preserving clear paths toward offline synchronization, advanced AI, analytics, and multi-branch practice management.