# Chamber Management
## Backend Architecture & API Specification

**Document:** Backend Architecture & API Specification  
**Version:** 1.0  
**Product:** AI-Powered Chamber & Prescription Management Platform  
**Target Market:** Bangladesh  
**Status:** Technical Design Baseline  
**Primary Architecture:** Modular Monolith  
**Recommended Backend:** NestJS + TypeScript  
**Primary Database:** PostgreSQL  
**Cache / Queue:** Redis  
**Object Storage:** S3-compatible storage  
**API Style:** REST  
**API Version:** `/api/v1`

---

# 1. Purpose

This document defines the backend architecture, modules, APIs, data boundaries, security model, background processing, AI integration, and operational requirements for the Chamber Management platform.

The backend must support:

```text
Doctor
   ↓
Chambers
   ↓
Staff / Assistant Doctors
   ↓
Patients
   ↓
Appointments
   ↓
Daily Queue
   ↓
Consultation
   ↓
Clinical Records
   ↓
Prescription
   ↓
Payment
   ↓
Follow-up
   ↓
Reports
   ↓
AI Assistance
```

The backend must prioritize:

- Clinical data integrity
- Strong authorization
- Auditability
- Multi-chamber support
- Fast consultation workflows
- Bangladesh-first requirements
- AI safety
- Extensibility
- Operational reliability

---

# 2. Architecture Decision

## 2.1 Recommended Architecture

The MVP should use a **Modular Monolith**.

```text
                         ┌─────────────────────┐
                         │   Mobile / Web Apps  │
                         └──────────┬──────────┘
                                    │
                               HTTPS / REST
                                    │
                         ┌──────────▼──────────┐
                         │    API Gateway /     │
                         │    NestJS Backend    │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
   Identity Modules          Clinical Modules          Operations
   ────────────────          ────────────────          ───────────
   Auth                      Patients                  Appointments
   Users                     Encounters                 Queue
   RBAC                      Vitals                    Payments
   Verification              Diagnoses                  Notifications
                             Investigations
                             Prescriptions
                                    │
                                    ▼
                              AI Orchestration
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                 LLM API         RAG/Search      AI Safety
                                   
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
      PostgreSQL                  Redis                  Object Storage
      Primary Data             Cache/Queue              Reports/Files
```

---

# 3. Why Modular Monolith

A modular monolith is preferred for MVP because:

- The product is still evolving.
- Clinical workflows are highly interconnected.
- Transactions span multiple domains.
- Deployment is simpler.
- Operational cost is lower.
- Debugging is easier.
- Development velocity is higher.
- The team can maintain clear domain boundaries.

The architecture must nevertheless enforce module boundaries.

Example:

```text
PrescriptionModule
      ↓
ClinicalModule

PrescriptionModule
      ↓
PatientModule

PrescriptionModule
      ↓
AuditModule
```

Modules should communicate through:

- Public services
- Domain events
- Well-defined interfaces

They should not directly manipulate another module's database tables.

---

# 4. Technology Stack

## 4.1 Backend

Recommended:

```text
Node.js
TypeScript
NestJS
Fastify
```

NestJS modules should represent business domains.

---

## 4.2 Database

```text
PostgreSQL
```

PostgreSQL should be the system of record for:

- Users
- Doctors
- Chambers
- Patients
- Appointments
- Queues
- Encounters
- Clinical records
- Prescriptions
- Payments
- Audit logs

---

## 4.3 ORM

Recommended:

```text
Prisma ORM
```

Prisma should be used for:

- Type-safe queries
- Migrations
- Transactions
- Repository implementation

Complex reporting queries may use raw SQL where justified.

---

# 5. Redis

Redis should support:

- Session-related temporary data
- Rate limiting
- OTP throttling
- API caching
- Queue state caching
- Distributed locks
- Background job infrastructure

Example:

```text
Redis
 ├── OTP rate limits
 ├── API rate limits
 ├── Queue cache
 ├── Distributed locks
 └── Background jobs
```

Redis must not become the source of truth for clinical records.

---

# 6. Object Storage

Use S3-compatible object storage for:

- Diagnostic reports
- Prescription PDFs
- Doctor profile photos
- Patient attachments
- Generated documents

Recommended structure:

```text
/{environment}/
    doctors/
    chambers/
    patients/
    reports/
    prescriptions/
    exports/
```

Database stores metadata, not large binary files.

---

# 7. Module Architecture

Recommended backend modules:

```text
src/
├── auth/
├── users/
├── doctors/
├── verification/
├── chambers/
├── schedules/
├── staff/
├── permissions/
├── patients/
├── appointments/
├── queue/
├── encounters/
├── vitals/
├── diagnoses/
├── investigations/
├── reports/
├── prescriptions/
├── medicines/
├── payments/
├── notifications/
├── ai/
├── files/
├── analytics/
├── audit/
├── subscriptions/
├── health/
└── common/
```

---

# 8. Identity and Authentication Module

Responsibilities:

- Account registration
- Login
- OTP verification
- Password management
- Refresh tokens
- Session management
- Device management
- Account status

---

# 9. User Roles

Supported roles:

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
PLATFORM_ADMIN
```

A user may have different roles in different chambers.

Example:

```text
User
 ├── Chamber A → Receptionist
 └── Chamber B → Chamber Manager
```

---

# 10. Authentication Flow

## Signup

```text
POST /api/v1/auth/register
```

Request:

```json
{
  "phone": "017XXXXXXXX",
  "email": "doctor@example.com",
  "password": "********",
  "language": "bn"
}
```

Response:

```json
{
  "userId": "usr_123",
  "status": "OTP_REQUIRED"
}
```

---

# 11. OTP Verification

```text
POST /api/v1/auth/verify-otp
```

Request:

```json
{
  "phone": "017XXXXXXXX",
  "otp": "123456"
}
```

Response:

```json
{
  "verified": true,
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "usr_123",
    "status": "ACTIVE"
  }
}
```

OTP requirements:

- Expiration
- Attempt limit
- Resend cooldown
- IP/device throttling
- Audit logging

---

# 12. Login

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "phone": "017XXXXXXXX",
  "password": "********"
}
```

Response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 900
}
```

---

# 13. Refresh Token

```text
POST /api/v1/auth/refresh
```

Refresh tokens should be:

- Rotated
- Revocable
- Device-associated
- Stored securely

---

# 14. Logout

```text
POST /api/v1/auth/logout
```

The backend should invalidate the relevant refresh token/session.

---

# 15. Doctor Module

Responsibilities:

- Doctor profile
- Professional information
- BMDC information
- Specialization
- Qualifications
- Experience
- Profile image

Endpoints:

```text
GET    /api/v1/doctors/me
PATCH  /api/v1/doctors/me
GET    /api/v1/doctors/me/professional
PATCH  /api/v1/doctors/me/professional
```

---

# 16. Professional Verification

Endpoints:

```text
POST /api/v1/verification/bmdc
GET  /api/v1/verification/status
```

Verification states:

```text
PENDING
VERIFIED
MANUAL_REVIEW
FAILED
EXPIRED
```

Verification must be auditable.

---

# 17. Chamber Module

Responsibilities:

- Chamber creation
- Chamber update
- Chamber activation/deactivation
- Chamber configuration
- Chamber settings

Endpoints:

```text
POST   /api/v1/chambers
GET    /api/v1/chambers
GET    /api/v1/chambers/:chamberId
PATCH  /api/v1/chambers/:chamberId
DELETE /api/v1/chambers/:chamberId
```

---

# 18. Chamber Context

Every chamber-specific API should validate:

```text
Authenticated User
        ↓
Chamber Membership
        ↓
Role
        ↓
Permission
        ↓
Resource Ownership
```

Never trust `chamberId` supplied by the client without authorization validation.

---

# 19. Schedule Module

Endpoints:

```text
GET   /api/v1/chambers/:chamberId/schedules
POST  /api/v1/chambers/:chamberId/schedules
PATCH /api/v1/chambers/:chamberId/schedules/:scheduleId
DELETE /api/v1/chambers/:chamberId/schedules/:scheduleId
```

Schedule model should support:

- Day
- Start time
- End time
- Appointment duration
- Maximum patients
- Breaks
- Doctor availability

---

# 20. Staff Module

Responsibilities:

- Staff invitation
- Staff membership
- Role assignment
- Permission configuration
- Staff activation/deactivation

Endpoints:

```text
POST   /api/v1/chambers/:chamberId/staff/invitations
GET    /api/v1/chambers/:chamberId/staff
PATCH  /api/v1/chambers/:chamberId/staff/:staffId
DELETE /api/v1/chambers/:chamberId/staff/:staffId
```

---

# 21. Permission Model

Use:

```text
RBAC + Resource-Level Authorization
```

Example:

```text
RECEPTIONIST
 ├── patients:create
 ├── patients:read
 ├── appointments:create
 ├── appointments:update
 ├── queue:manage
 └── payments:create

No:
 ├── prescriptions:finalize
 ├── clinical_notes:read
 └── diagnosis:update
```

---

# 22. Clinical Authorization

Clinical records require stricter permissions.

Example:

```text
Assistant Doctor
    ↓
Can create clinical notes
    ↓
Can create prescription draft
    ↓
Cannot finalize prescription unless explicitly permitted
```

Final prescription authorization should normally belong to the doctor.

---

# 23. Patient Module

Responsibilities:

- Patient registration
- Search
- Profile
- Demographics
- Contact information
- Emergency contact
- Allergies
- Medical history
- Family grouping

Endpoints:

```text
POST /api/v1/patients
GET  /api/v1/patients
GET  /api/v1/patients/:patientId
PATCH /api/v1/patients/:patientId
```

---

# 24. Patient Search

```text
GET /api/v1/patients/search?q=rahim
```

Supported search fields:

```text
Name
Phone
Patient ID
```

Search should support Bangla names.

Example:

```text
GET /api/v1/patients/search?q=রহিম
```

---

# 25. Duplicate Patient Detection

When creating a patient:

```text
POST /api/v1/patients
```

The backend should check:

- Phone
- Name similarity
- Date of birth
- Existing patient ID

Possible response:

```json
{
  "duplicateWarning": true,
  "matches": [
    {
      "patientId": "pat_123",
      "name": "Rahim Ahmed",
      "phone": "017XXXXXXXX"
    }
  ]
}
```

The system should not automatically merge records.

---

# 26. Family / Household Support

Optional MVP+ capability.

Structure:

```text
Family
 ├── Primary Member
 ├── Spouse
 ├── Child
 └── Parent
```

Endpoints:

```text
POST /api/v1/families
POST /api/v1/families/:familyId/members
GET  /api/v1/families/:familyId
```

---

# 27. Appointment Module

Responsibilities:

- Appointment creation
- Rescheduling
- Cancellation
- Appointment status
- Calendar
- Doctor availability

Endpoints:

```text
POST   /api/v1/appointments
GET    /api/v1/appointments
GET    /api/v1/appointments/:appointmentId
PATCH  /api/v1/appointments/:appointmentId
DELETE /api/v1/appointments/:appointmentId
```

---

# 28. Appointment Status

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

State transitions must be validated server-side.

---

# 29. Appointment Conflict Prevention

The backend must prevent:

- Double booking
- Booking outside schedule
- Booking against inactive chamber
- Booking against unavailable doctor

Database-level constraints should be used wherever possible.

Application checks alone are insufficient.

---

# 30. Queue Module

Responsibilities:

- Check-in
- Queue creation
- Queue numbering
- Call next patient
- Start consultation
- Skip
- Complete

Endpoints:

```text
POST /api/v1/chambers/:chamberId/queue/check-in
GET  /api/v1/chambers/:chamberId/queue/today
POST /api/v1/queue/:queueId/call
POST /api/v1/queue/:queueId/start
POST /api/v1/queue/:queueId/skip
POST /api/v1/queue/:queueId/complete
```

---

# 31. Queue State Machine

```text
CHECKED_IN
    ↓
WAITING
    ↓
CALLED
    ↓
IN_CONSULTATION
    ↓
COMPLETED
```

Alternative:

```text
WAITING → SKIPPED
WAITING → CANCELLED
CALLED → WAITING
```

---

# 32. Queue Numbering

Queue numbers should normally reset per chamber per day.

Example:

```text
03 Sep 2026

#1
#2
#3
...
#24
```

Use a transactional mechanism to prevent duplicate queue numbers.

---

# 33. Consultation / Encounter Module

An encounter represents a clinical consultation.

Endpoints:

```text
POST /api/v1/encounters
GET  /api/v1/encounters/:encounterId
PATCH /api/v1/encounters/:encounterId
POST /api/v1/encounters/:encounterId/complete
```

An encounter belongs to:

```text
Patient
Doctor
Chamber
Appointment / Queue
```

---

# 34. Encounter Lifecycle

```text
DRAFT
   ↓
IN_PROGRESS
   ↓
READY_FOR_REVIEW
   ↓
COMPLETED
   ↓
LOCKED
```

Completed clinical records should be immutable except through controlled amendments.

---

# 35. Clinical Notes API

```text
GET   /api/v1/encounters/:encounterId/notes
PUT   /api/v1/encounters/:encounterId/notes
```

Example:

```json
{
  "chiefComplaint": "Fever for 3 days",
  "historyOfPresentIllness": "...",
  "examination": "...",
  "assessment": "...",
  "plan": "...",
  "additionalNotes": "..."
}
```

---

# 36. Vitals API

```text
POST /api/v1/encounters/:encounterId/vitals
GET  /api/v1/patients/:patientId/vitals
```

Example:

```json
{
  "weightKg": 72,
  "heightCm": 170,
  "systolicBp": 130,
  "diastolicBp": 85,
  "pulseBpm": 78,
  "temperature": 98.6,
  "temperatureUnit": "F",
  "spo2": 98
}
```

The backend must validate clinically reasonable ranges and reject malformed values.

---

# 37. Diagnosis API

```text
POST   /api/v1/encounters/:encounterId/diagnoses
GET    /api/v1/encounters/:encounterId/diagnoses
DELETE /api/v1/encounters/:encounterId/diagnoses/:diagnosisId
```

Diagnosis should support:

- Name
- Code
- Primary/secondary classification
- Notes

---

# 38. Investigation API

```text
POST /api/v1/encounters/:encounterId/investigations
GET  /api/v1/encounters/:encounterId/investigations
```

Example:

```json
{
  "name": "CBC",
  "priority": "ROUTINE",
  "notes": "Repeat after 7 days"
}
```

---

# 39. Diagnostic Report Module

Reports may be attached to patients and/or encounters.

Endpoints:

```text
POST /api/v1/patients/:patientId/reports
GET  /api/v1/patients/:patientId/reports
GET  /api/v1/reports/:reportId
DELETE /api/v1/reports/:reportId
```

---

# 40. File Upload Flow

Files should not be uploaded directly through the main application server when unnecessary.

Recommended:

```text
Client
  ↓
Request Upload URL
  ↓
Backend
  ↓
Pre-signed URL
  ↓
Object Storage
  ↓
Upload Complete
  ↓
Backend Metadata Confirmation
```

Endpoint:

```text
POST /api/v1/files/presign
```

---

# 41. Report Security

Diagnostic reports are sensitive clinical information.

Requirements:

- Private object storage
- Short-lived signed URLs
- Access authorization before URL generation
- Audit logging
- No public buckets

---

# 42. Prescription Module

Responsibilities:

- Prescription drafts
- Prescription items
- Templates
- Favorites
- AI drafts
- Review
- Finalization
- PDF generation

Endpoints:

```text
POST /api/v1/encounters/:encounterId/prescriptions
GET  /api/v1/prescriptions/:prescriptionId
PATCH /api/v1/prescriptions/:prescriptionId
POST /api/v1/prescriptions/:prescriptionId/finalize
POST /api/v1/prescriptions/:prescriptionId/pdf
```

---

# 43. Prescription Lifecycle

```text
DRAFT
   ↓
AI_ASSISTED (optional)
   ↓
REVIEW_REQUIRED
   ↓
FINALIZED
   ↓
DELIVERED
```

A finalized prescription cannot be silently modified.

---

# 44. Prescription Item

Example:

```json
{
  "medicineId": "med_123",
  "medicineName": "Paracetamol 500 mg",
  "dosage": "1 tablet",
  "frequency": "1+1+1",
  "duration": "5 days",
  "route": "ORAL",
  "instruction": "After food"
}
```

---

# 45. Medicine Module

Responsibilities:

- Medicine catalog
- Generic name
- Brand name
- Strength
- Form
- Route
- Search
- Doctor favorites

Endpoints:

```text
GET  /api/v1/medicines/search?q=paracetamol
GET  /api/v1/medicines/:medicineId
GET  /api/v1/doctors/me/medicine-favorites
POST /api/v1/doctors/me/medicine-favorites
DELETE /api/v1/doctors/me/medicine-favorites/:medicineId
```

---

# 46. Prescription Templates

Doctors can save reusable prescription structures.

```text
POST /api/v1/prescription-templates
GET  /api/v1/prescription-templates
PATCH /api/v1/prescription-templates/:templateId
DELETE /api/v1/prescription-templates/:templateId
```

Templates must never automatically finalize a prescription.

---

# 47. Prescription Finalization

Endpoint:

```text
POST /api/v1/prescriptions/:prescriptionId/finalize
```

Server must verify:

1. User is authenticated.
2. User has clinical authorization.
3. Prescription belongs to an accessible encounter.
4. Encounter belongs to the correct chamber.
5. Required fields are complete.
6. No blocking safety validation exists.
7. Prescription has not already been finalized.

Finalization must be transactional.

---

# 48. Prescription Immutability

After finalization:

```text
Prescription
    ↓
Immutable Clinical Record
```

If correction is required:

```text
Original Prescription
        ↓
Amendment / Replacement
        ↓
New Version
```

The original must remain auditable.

---

# 49. Payment Module

Responsibilities:

- Consultation fees
- Discounts
- Payments
- Receipts
- Refunds
- Payment status

Endpoints:

```text
POST /api/v1/payments
GET  /api/v1/payments/:paymentId
POST /api/v1/payments/:paymentId/refund
GET  /api/v1/chambers/:chamberId/payments
```

---

# 50. Payment Status

```text
PENDING
PAID
PARTIALLY_PAID
REFUNDED
CANCELLED
```

---

# 51. Payment Methods

Initial supported methods:

```text
CASH
CARD
MOBILE_PAYMENT
BANK_TRANSFER
OTHER
```

Payment gateway integrations can be added later.

---

# 52. Receipt API

```text
GET /api/v1/payments/:paymentId/receipt
POST /api/v1/payments/:paymentId/receipt/pdf
```

Receipt should include:

- Chamber
- Doctor
- Patient
- Amount
- Discount
- Payment method
- Date/time
- Receipt number

---

# 53. AI Architecture

AI should be implemented as an orchestration layer rather than directly inside clinical modules.

```text
Clinical Module
       ↓
AI Orchestrator
       ↓
Context Builder
       ↓
Safety Layer
       ↓
LLM Provider
       ↓
Output Validator
       ↓
AI Response
```

---

# 54. AI Module Responsibilities

The AI module should manage:

- Patient summary
- Clinical chat
- Clinical documentation
- Prescription drafting
- Diagnostic report analysis
- Voice-to-note
- AI audit metadata
- Prompt/version management
- Safety checks

---

# 55. AI Patient Context

The AI context builder may retrieve:

```text
Patient demographics
Relevant allergies
Medical history
Previous encounters
Recent diagnoses
Recent investigations
Recent prescriptions
Current encounter
Current vitals
```

Only necessary data should be sent to the AI provider.

---

# 56. AI Patient Summary API

```text
POST /api/v1/ai/patients/:patientId/summary
```

Request:

```json
{
  "period": "6_MONTHS"
}
```

Response:

```json
{
  "type": "PATIENT_SUMMARY",
  "status": "REVIEW_REQUIRED",
  "content": "...",
  "sources": [
    "enc_123",
    "report_456"
  ]
}
```

---

# 57. AI Clinical Chat API

```text
POST /api/v1/ai/chat
```

Request:

```json
{
  "patientId": "pat_123",
  "encounterId": "enc_123",
  "message": "Summarize the recent clinical history."
}
```

The backend must enforce authorization before constructing patient context.

---

# 58. AI Prescription Draft API

```text
POST /api/v1/ai/prescriptions/draft
```

Request:

```json
{
  "encounterId": "enc_123"
}
```

Response:

```json
{
  "draftId": "aidraft_123",
  "status": "REVIEW_REQUIRED",
  "suggestions": [
    {
      "medicine": "Medicine A",
      "reason": "...",
      "confidence": "..."
    }
  ]
}
```

AI output is never directly saved as a finalized prescription.

---

# 59. AI Safety Pipeline

Every clinical AI request should pass through:

```text
Input Validation
      ↓
Authorization
      ↓
Context Filtering
      ↓
Prompt Construction
      ↓
AI Provider
      ↓
Output Validation
      ↓
Safety Rules
      ↓
Doctor Review
```

---

# 60. AI Safety Rules

The backend must enforce:

### Rule 1

AI cannot finalize prescriptions.

### Rule 2

AI cannot modify finalized clinical records.

### Rule 3

AI-generated content must carry provenance.

### Rule 4

AI requests must be auditable.

### Rule 5

Patient data must not be exposed to unauthorized users.

### Rule 6

Prompt injection attempts should be detected where practical.

### Rule 7

AI provider failures must not corrupt clinical workflows.

---

# 61. AI Audit Record

Store:

```text
AI Request ID
User ID
Patient ID
Encounter ID
Feature
Prompt Version
Model
Timestamp
Input Context References
Output
Safety Status
User Action
```

Avoid storing unnecessary sensitive prompt data if it is not required.

---

# 62. AI Voice-to-Note

Advanced feature.

Flow:

```text
Doctor Speech
      ↓
Audio Upload
      ↓
Speech-to-Text
      ↓
Clinical Structuring
      ↓
AI Draft
      ↓
Doctor Review
      ↓
Save
```

Endpoint:

```text
POST /api/v1/ai/voice-notes
GET  /api/v1/ai/voice-notes/:id
```

---

# 63. Notification Module

Supports:

- In-app notifications
- SMS
- Push notifications
- Email
- Future messaging integrations

Endpoints:

```text
GET /api/v1/notifications
POST /api/v1/notifications/:id/read
POST /api/v1/notifications/read-all
```

---

# 64. Notification Events

Examples:

```text
APPOINTMENT_CREATED
APPOINTMENT_CANCELLED
PATIENT_CHECKED_IN
PATIENT_WAITING
PRESCRIPTION_READY
PAYMENT_RECEIVED
FOLLOW_UP_DUE
VERIFICATION_COMPLETED
```

---

# 65. Background Jobs

Use Redis-backed workers.

Recommended jobs:

```text
OTP delivery
Notification delivery
Prescription PDF generation
Report processing
AI report analysis
AI summarization
Voice transcription
Analytics aggregation
Data export
Backup
Cleanup
```

Example:

```text
API
 ↓
Create Job
 ↓
Redis
 ↓
Worker
 ↓
Process
 ↓
Update Status
```

---

# 66. Job Reliability

Jobs should support:

- Retry
- Exponential backoff
- Dead-letter handling
- Idempotency
- Failure logging
- Monitoring

Never allow a failed background job to silently lose a clinical record.

---

# 67. Reporting Module

Reports should include:

### Operational

- Daily patient count
- Appointment count
- Queue statistics
- Average waiting time
- Average consultation time

### Financial

- Daily revenue
- Monthly revenue
- Payment method breakdown
- Outstanding payments

### Clinical

- New vs returning patients
- Common diagnoses
- Investigation frequency
- Follow-up rate

---

# 68. Reporting APIs

```text
GET /api/v1/reports/dashboard
GET /api/v1/reports/patients
GET /api/v1/reports/appointments
GET /api/v1/reports/revenue
GET /api/v1/reports/clinical
```

Filters:

```text
chamberId
doctorId
startDate
endDate
```

---

# 69. Analytics Data Strategy

MVP can query PostgreSQL directly using optimized queries.

For larger scale:

```text
PostgreSQL
     ↓
Event Stream / ETL
     ↓
Analytics Store
     ↓
Reporting
```

Do not introduce a separate data warehouse prematurely.

---

# 70. Audit Module

Every sensitive action should be auditable.

Examples:

```text
Patient created
Patient updated
Clinical note created
Diagnosis added
Prescription finalized
Prescription amended
Report viewed
Report downloaded
Payment created
Payment refunded
Staff permission changed
AI request generated
```

---

# 71. Audit API

Audit logs should generally be internal/admin-facing.

```text
GET /api/v1/audit-logs
GET /api/v1/patients/:patientId/audit-history
```

Audit records should not be editable by normal users.

---

# 72. Audit Record

Example:

```json
{
  "actorId": "usr_123",
  "action": "PRESCRIPTION_FINALIZED",
  "resourceType": "PRESCRIPTION",
  "resourceId": "rx_123",
  "chamberId": "ch_123",
  "timestamp": "2026-09-03T18:00:00Z",
  "metadata": {}
}
```

---

# 73. API Response Standard

Successful response:

```json
{
  "data": {},
  "meta": {}
}
```

List response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

# 74. Error Response Standard

All APIs should return a consistent structure.

Example:

```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "The requested patient could not be found.",
    "details": {}
  },
  "requestId": "req_123"
}
```

Never expose:

- Stack traces
- Database errors
- SQL
- Internal service details

in production responses.

---

# 75. HTTP Status Codes

Recommended:

```text
200 OK
201 Created
202 Accepted
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

---

# 76. Validation

Use schema validation at the API boundary.

Recommended:

```text
Zod
```

or NestJS DTO validation where appropriate.

Validate:

- Phone numbers
- Dates
- IDs
- Numeric values
- Enum values
- Required fields
- File metadata
- Request size

---

# 77. Pagination

All potentially large list endpoints should support:

```text
?page=1&limit=20
```

Maximum limit:

```text
100
```

Never allow unrestricted database queries from API clients.

---

# 78. Filtering

Example:

```text
GET /api/v1/appointments
    ?chamberId=ch_123
    &date=2026-09-03
    &status=BOOKED
```

Filtering must be implemented server-side.

---

# 79. Sorting

Example:

```text
?sortBy=createdAt&sortOrder=desc
```

Only whitelisted fields may be used.

Never directly interpolate client-provided sort fields into SQL.

---

# 80. Idempotency

Idempotency is required for operations such as:

```text
Payment creation
Appointment creation
Prescription finalization
File confirmation
Notification requests
```

Example header:

```text
Idempotency-Key: 01J...
```

The backend should return the original result for repeated requests using the same key.

---

# 81. Database Transactions

Transactions are required for critical workflows.

Example prescription finalization:

```text
BEGIN

Validate prescription
Validate authorization
Validate safety rules
Update prescription
Create audit event
Create domain event

COMMIT
```

If any critical step fails:

```text
ROLLBACK
```

---

# 82. Domain Events

Recommended internal events:

```text
PatientRegistered
AppointmentCreated
PatientCheckedIn
QueuePatientCalled
ConsultationStarted
ConsultationCompleted
PrescriptionFinalized
PaymentReceived
ReportUploaded
AIRequestCompleted
```

Events can trigger asynchronous work.

---

# 83. Example Domain Event

```json
{
  "event": "PrescriptionFinalized",
  "eventId": "evt_123",
  "occurredAt": "2026-09-03T18:00:00Z",
  "payload": {
    "prescriptionId": "rx_123",
    "patientId": "pat_123",
    "doctorId": "doc_123",
    "chamberId": "ch_123"
  }
}
```

---

# 84. Security Architecture

Security layers:

```text
TLS
 ↓
Authentication
 ↓
Authorization
 ↓
Input Validation
 ↓
Rate Limiting
 ↓
Resource Access Control
 ↓
Audit Logging
 ↓
Encryption
```

---

# 85. Authentication Security

Requirements:

- Secure password hashing
- Refresh-token rotation
- Session revocation
- OTP throttling
- Login throttling
- Device/session tracking
- Suspicious login detection

Passwords must never be stored in plain text.

---

# 86. Sensitive Data Protection

Clinical data should be treated as highly sensitive.

Use:

- TLS in transit
- Encryption at rest
- Private object storage
- Least-privilege access
- Audit logging
- Data minimization

---

# 87. Authorization Middleware

Recommended request pipeline:

```text
Request
 ↓
JWT Guard
 ↓
User Context
 ↓
Chamber Context
 ↓
Role Guard
 ↓
Permission Guard
 ↓
Resource Authorization
 ↓
Controller
```

Resource-level authorization is mandatory for patient and clinical data.

---

# 88. Multi-Chamber Data Isolation

Every chamber-specific record should contain a chamber reference where applicable.

Example:

```text
patients
appointments
encounters
prescriptions
payments
staff_memberships
```

Queries must always enforce the authorized chamber scope.

---

# 89. Cross-Chamber Doctor Access

A doctor may access multiple chambers.

Example:

```text
Doctor
 ├── Chamber A
 │     └── Data
 │
 ├── Chamber B
 │     └── Data
 │
 └── Chamber C
       └── Data
```

The API should not assume that the doctor's global identity grants unrestricted access to every resource.

---

# 90. Patient Data Sharing Between Chambers

This requires an explicit product policy.

Recommended MVP approach:

```text
Patient Identity
      ↓
Doctor-owned patient relationship
      ↓
Chamber-specific encounters
```

A doctor may see their own patient's history across chambers if authorized.

Other doctors should not automatically gain access.

---

# 91. Soft Delete

Soft deletion should be used for important business entities.

Examples:

```text
Patient
Doctor
Chamber
Staff
Appointment
Prescription Template
```

Clinical records should generally be retained rather than deleted.

---

# 92. Clinical Record Amendments

Do not overwrite finalized clinical information.

Instead:

```text
Original Record
      ↓
Amendment
      ↓
Reason
      ↓
Actor
      ↓
Timestamp
```

This preserves clinical history.

---

# 93. API Versioning

Use:

```text
/api/v1/...
```

Future breaking changes:

```text
/api/v2/...
```

Avoid breaking existing mobile clients unnecessarily.

---

# 94. API Documentation

Use OpenAPI/Swagger.

Recommended:

```text
/api/docs
```

Documentation should contain:

- Endpoint
- Authentication
- Request schema
- Response schema
- Error responses
- Permission requirements
- Example payloads

---

# 95. Correlation / Request ID

Every request should have a request ID.

Example:

```text
X-Request-ID: req_01...
```

If the client does not provide one, the backend generates it.

Use it in:

- Logs
- Errors
- Audit records
- Support investigations

---

# 96. Logging

Structured JSON logging should include:

```text
timestamp
level
requestId
userId
chamberId
route
method
statusCode
duration
errorCode
```

Do not log:

- Passwords
- OTPs
- Access tokens
- Full medical records
- Sensitive patient information unnecessarily

---

# 97. Monitoring

Monitor:

### Infrastructure

- CPU
- Memory
- Disk
- Database connections
- Redis health

### API

- Request count
- Latency
- Error rate
- 5xx rate

### Business

- Appointments created
- Patients registered
- Consultations completed
- Prescriptions finalized
- Payments completed

### AI

- Request count
- Latency
- Failure rate
- Token usage
- Estimated cost

---

# 98. Health Checks

Endpoints:

```text
GET /health
GET /health/live
GET /health/ready
```

Readiness should verify critical dependencies such as:

```text
PostgreSQL
Redis
```

External AI providers should not necessarily make the entire application unhealthy.

---

# 99. Configuration Management

Environment variables should contain:

```text
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_BUCKET
OBJECT_STORAGE_ACCESS_KEY
OBJECT_STORAGE_SECRET_KEY
AI_PROVIDER_KEY
SMS_PROVIDER_KEY
```

Secrets must not be committed to Git.

---

# 100. Environment Strategy

Support:

```text
development
test
staging
production
```

Example:

```text
.env.development
.env.test
.env.staging
.env.production
```

Production secrets should be managed through a secrets manager rather than source-controlled files.

---

# 101. Database Migration Strategy

Use Prisma migrations.

Development:

```text
npx prisma migrate dev
```

Production:

```text
npx prisma migrate deploy
```

Every schema change must be reviewed.

Destructive migrations require additional care.

---

# 102. Database Backup

Production PostgreSQL must support:

- Automated backups
- Point-in-time recovery where possible
- Backup encryption
- Backup retention
- Restore testing

A backup is not considered reliable until restoration has been tested.

---

# 103. Data Export

Doctors should eventually be able to export chamber data.

Example:

```text
Patient data
Appointments
Clinical records
Prescriptions
Reports metadata
Payments
```

Export should run asynchronously.

```text
POST /api/v1/exports
GET  /api/v1/exports/:exportId
```

---

# 104. Offline Architecture

Offline-first should be introduced after the core online workflow is stable.

Recommended:

```text
Mobile App
   ↓
Local Database
   ↓
Sync Engine
   ↓
REST API
```

The backend should support:

- Client-generated IDs
- Idempotency
- Version numbers
- Updated timestamps
- Conflict detection

---

# 105. Sync Strategy

Example:

```text
Client Change
    ↓
Local Outbox
    ↓
Sync Request
    ↓
Server
    ↓
Conflict Check
    ↓
Accepted / Conflict
```

Clinical finalized records should have strict conflict rules.

---

# 106. API Rate Limiting

Rate limits should be applied per:

```text
IP
User
Endpoint
Device
```

Especially protect:

```text
Login
OTP
Password reset
AI endpoints
File upload
Search
```

---

# 107. AI Rate Limiting

AI endpoints should have separate limits because they are:

- Expensive
- Resource intensive
- Potentially abuse-prone

Example:

```text
AI requests / user / minute
AI requests / chamber / day
```

Limits should be configurable.

---

# 108. File Upload Restrictions

Validate:

- MIME type
- File extension
- File size
- File signature where practical

Example allowed types:

```text
PDF
JPEG
PNG
WEBP
```

Malicious or unexpected file types must be rejected.

---

# 109. Prescription PDF Generation

Recommended asynchronous flow:

```text
Prescription Finalized
        ↓
Domain Event
        ↓
PDF Job
        ↓
Worker
        ↓
Generate PDF
        ↓
Object Storage
        ↓
Metadata Update
```

The doctor should not need to wait for PDF generation before the clinical record is finalized.

---

# 110. API Endpoint Summary

## Authentication

```text
POST /auth/register
POST /auth/verify-otp
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

## Doctor

```text
GET   /doctors/me
PATCH /doctors/me
GET   /doctors/me/professional
PATCH /doctors/me/professional
```

## Verification

```text
POST /verification/bmdc
GET  /verification/status
```

## Chambers

```text
POST   /chambers
GET    /chambers
GET    /chambers/:id
PATCH  /chambers/:id
DELETE /chambers/:id
```

## Staff

```text
POST   /chambers/:id/staff/invitations
GET    /chambers/:id/staff
PATCH  /chambers/:id/staff/:staffId
DELETE /chambers/:id/staff/:staffId
```

## Patients

```text
POST  /patients
GET   /patients
GET   /patients/search
GET   /patients/:id
PATCH /patients/:id
```

## Appointments

```text
POST   /appointments
GET    /appointments
GET    /appointments/:id
PATCH  /appointments/:id
DELETE /appointments/:id
```

## Queue

```text
POST /chambers/:id/queue/check-in
GET  /chambers/:id/queue/today
POST /queue/:id/call
POST /queue/:id/start
POST /queue/:id/skip
POST /queue/:id/complete
```

## Encounters

```text
POST  /encounters
GET   /encounters/:id
PATCH /encounters/:id
POST  /encounters/:id/complete
```

## Clinical

```text
POST /encounters/:id/vitals
POST /encounters/:id/diagnoses
POST /encounters/:id/investigations
```

## Reports

```text
POST   /patients/:id/reports
GET    /patients/:id/reports
GET    /reports/:id
DELETE /reports/:id
```

## Prescriptions

```text
POST /encounters/:id/prescriptions
GET  /prescriptions/:id
PATCH /prescriptions/:id
POST /prescriptions/:id/finalize
POST /prescriptions/:id/pdf
```

## Payments

```text
POST /payments
GET  /payments/:id
POST /payments/:id/refund
GET  /chambers/:id/payments
```

## AI

```text
POST /ai/chat
POST /ai/patients/:id/summary
POST /ai/prescriptions/draft
POST /ai/voice-notes
```

## Notifications

```text
GET  /notifications
POST /notifications/:id/read
POST /notifications/read-all
```

## Reports / Analytics

```text
GET /reports/dashboard
GET /reports/patients
GET /reports/appointments
GET /reports/revenue
GET /reports/clinical
```

## Files

```text
POST /files/presign
POST /files/complete
```

---

# 111. Recommended Database Domain Model

High-level entity relationship:

```text
User
 │
 ├── DoctorProfile
 │
 └── ChamberMembership
          │
          ▼
       Chamber
          │
    ┌─────┼──────────────┐
    ▼     ▼              ▼
Schedule Staff       Appointments
                         │
                         ▼
                       Queue
                         │
                         ▼
                      Encounter
                    ┌────┼─────┐
                    ▼    ▼     ▼
                 Vitals Dx  Investigation
                                │
                                ▼
                              Report

Encounter
    │
    ▼
Prescription
    │
    ▼
PrescriptionItem
    │
    ▼
Medicine

Encounter
    │
    ▼
Payment

Patient
    │
    ├── Encounters
    ├── Reports
    ├── Prescriptions
    ├── Appointments
    └── Payments
```

---

# 112. Core Database Entities

Minimum MVP entities:

```text
User
UserSession
DoctorProfile
ProfessionalVerification

Chamber
ChamberMembership
Role
Permission
RolePermission

Schedule
ScheduleBreak

Patient
PatientContact
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
PrescriptionTemplate

Payment
Receipt

Notification
AuditLog

AIRequest
AIDraft
```

---

# 113. Important Database Constraints

Examples:

### User

```text
phone UNIQUE
email UNIQUE where applicable
```

### Chamber Membership

```text
(userId, chamberId) UNIQUE
```

### Queue

```text
(chamberId, queueDate, queueNumber) UNIQUE
```

### Appointment

Use constraints/locking to prevent conflicting appointments.

### Prescription

Only one active finalized prescription version for a defined encounter/version relationship where appropriate.

---

# 114. Clinical Data Ownership

A clinical record should have clear ownership references:

```text
Patient
Doctor
Chamber
Encounter
```

Never rely only on the authenticated user to determine ownership.

---

# 115. Transaction Example — Patient Check-in

When checking in:

```text
BEGIN

Validate appointment
Validate chamber
Validate appointment status
Validate payment rules if applicable

Create queue entry
Update appointment status
Create audit event

COMMIT
```

This prevents inconsistent states such as:

```text
Appointment = CHECKED_IN
Queue = missing
```

---

# 116. Transaction Example — Prescription Finalization

```text
BEGIN

Load prescription
Lock prescription row

Validate user permission
Validate encounter
Validate prescription contents
Run blocking safety checks

Update status = FINALIZED
Create audit log
Create PrescriptionFinalized event

COMMIT
```

---

# 117. Consultation Completion

Recommended flow:

```text
Validate encounter
      ↓
Validate required clinical information
      ↓
Validate prescription state
      ↓
Save completion timestamp
      ↓
Update queue
      ↓
Create audit event
      ↓
Emit ConsultationCompleted
```

Payment should remain a separate business operation unless the chamber explicitly configures consultation completion to require payment.

---

# 118. Testing Strategy

Testing layers:

```text
Unit Tests
    ↓
Integration Tests
    ↓
API Tests
    ↓
Database Tests
    ↓
End-to-End Tests
```

---

# 119. Critical Unit Tests

Test:

- Permission evaluation
- Appointment conflict detection
- Queue numbering
- Prescription validation
- Prescription finalization
- Payment calculation
- AI safety rules
- Patient duplicate detection

---

# 120. Critical Integration Tests

Test complete workflows:

### Doctor

```text
Signup
→ OTP
→ Profile
→ Chamber
→ Schedule
```

### Receptionist

```text
Patient
→ Appointment
→ Check-in
→ Queue
→ Payment
```

### Doctor

```text
Queue
→ Encounter
→ Vitals
→ Notes
→ Diagnosis
→ Prescription
→ Finalize
```

### AI

```text
Encounter
→ AI Draft
→ Review
→ Doctor Approval
→ Final Prescription
```

---

# 121. End-to-End Test

The most important E2E scenario:

```text
Doctor Login
    ↓
Open Chamber
    ↓
Open Today's Queue
    ↓
Call Patient
    ↓
Start Consultation
    ↓
Record Vitals
    ↓
Record Notes
    ↓
Add Diagnosis
    ↓
Create Prescription
    ↓
AI Draft
    ↓
Review
    ↓
Finalize
    ↓
Complete Consultation
    ↓
Payment
    ↓
Receipt
```

This workflow should be automated in CI.

---

# 122. CI/CD

Recommended:

```text
GitHub
   ↓
Pull Request
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Build
   ↓
Security Scan
   ↓
Deploy Staging
   ↓
Smoke Tests
   ↓
Production Approval
   ↓
Production
```

---

# 123. Deployment Architecture

Initial production architecture:

```text
                  Internet
                     │
                     ▼
                Load Balancer
                     │
             ┌───────┴───────┐
             ▼               ▼
        API Instance 1   API Instance 2
             │               │
             └───────┬───────┘
                     ▼
                 PostgreSQL
                     │
             ┌───────┴───────┐
             ▼               ▼
           Redis          Object Storage
             │
             ▼
           Workers
```

API instances should remain stateless.

---

# 124. Horizontal Scaling

The backend should support:

```text
API 1
API 2
API 3
...
```

without requiring sticky sessions.

Session state should not be stored in process memory.

---

# 125. Future Microservice Boundaries

If the system grows, potential extraction candidates are:

```text
AI Service
Notification Service
File Processing Service
Reporting Service
Payment Service
Search Service
```

The core clinical domain should remain consolidated until there is a strong reason to split it.

---

# 126. Search Architecture

MVP:

```text
PostgreSQL
   ↓
Indexed search
```

Future:

```text
PostgreSQL
    ↓
Search Index
    ↓
OpenSearch / Elasticsearch
```

Do not introduce a search cluster before search scale requires it.

---

# 127. Caching Strategy

Cache:

- Medicine search
- Doctor profile
- Chamber configuration
- Schedule configuration
- Static reference data

Do not aggressively cache:

- Current clinical notes
- Prescription state
- Payment state
- Authorization decisions

Clinical correctness takes priority over cache performance.

---

# 128. API Performance Targets

Initial target:

```text
Simple API p95 < 500 ms
Complex clinical read p95 < 1 sec
Search p95 < 500 ms
```

AI endpoints are excluded from normal API latency targets because external model latency varies.

---

# 129. Availability Targets

Initial production target:

```text
99.5% monthly availability
```

Future target:

```text
99.9%+
```

Critical clinical workflows should degrade gracefully where possible.

---

# 130. Graceful Degradation

If AI is unavailable:

```text
AI unavailable
      ↓
Doctor continues normal consultation
      ↓
Manual prescription remains available
```

If notification service is unavailable:

```text
Core clinical workflow continues
```

If analytics fails:

```text
Clinical workflow continues
```

No non-critical dependency should block patient consultation.

---

# 131. Security Incident Handling

The system should support:

- Suspicious login detection
- Session revocation
- Account suspension
- Audit investigation
- File access monitoring
- AI abuse monitoring

Platform administrators should have restricted security-management capabilities.

---

# 132. Platform Admin APIs

Admin endpoints should be separated from normal user APIs.

Example:

```text
/api/v1/admin/users
/api/v1/admin/doctors
/api/v1/admin/chambers
/api/v1/admin/verifications
/api/v1/admin/audit-logs
```

All admin actions must be audited.

---

# 133. API Documentation by Role

Swagger/OpenAPI should indicate required permissions.

Example:

```text
POST /prescriptions/:id/finalize

Permission:
prescriptions:finalize

Allowed:
DOCTOR
Authorized Assistant Doctor
```

---

# 134. MVP Backend Scope

The MVP backend should prioritize:

```text
P0

Authentication
Doctor Profile
Verification
Chamber
Schedule
Staff/RBAC
Patient
Appointment
Queue
Encounter
Vitals
Clinical Notes
Diagnosis
Investigation
Prescription
Payment
Receipt
Basic Reports
Audit
AI Patient Summary
AI Prescription Draft
AI Clinical Chat
```

---

# 135. Phase 2 Backend Scope

Add:

```text
AI Voice-to-Note
Advanced Report Analysis
Offline Sync
Patient Communication
Advanced Analytics
Patient Portal
Advanced Queue
Prescription Templates
Advanced Notifications
Cloud Export
```

---

# 136. Phase 3 Backend Scope

Potential future capabilities:

```text
Telemedicine
Lab Integration
Pharmacy Integration
Payment Gateway Ecosystem
Insurance
Referral Network
Healthcare Marketplace
Predictive Analytics
Enterprise Multi-Branch Management
```

---

# 137. Recommended Implementation Order

## Phase 1 — Foundation

```text
Project setup
Configuration
Database
Prisma
Authentication
Users
RBAC
Logging
Error handling
```

## Phase 2 — Chamber Operations

```text
Doctor
Verification
Chamber
Schedule
Staff
Patient
Appointment
Queue
```

## Phase 3 — Clinical

```text
Encounter
Vitals
Clinical Notes
Diagnosis
Investigation
Reports
```

## Phase 4 — Prescription

```text
Medicine
Favorites
Templates
Prescription
Finalization
PDF
```

## Phase 5 — Finance

```text
Payments
Receipts
Revenue reports
```

## Phase 6 — AI

```text
AI Orchestrator
Context Builder
Clinical Chat
Patient Summary
Prescription Draft
Safety Layer
AI Audit
```

## Phase 7 — Production Hardening

```text
Security
Monitoring
Backups
Performance
Load testing
Disaster recovery
CI/CD
```

---

# 138. Recommended NestJS Structure

Example:

```text
src/
├── app.module.ts
│
├── common/
│   ├── guards/
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   ├── middleware/
│   ├── errors/
│   └── utils/
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   └── dto/
│
├── patients/
│   ├── patients.module.ts
│   ├── patients.controller.ts
│   ├── patients.service.ts
│   ├── repositories/
│   └── dto/
│
├── appointments/
├── queue/
├── encounters/
├── prescriptions/
├── payments/
├── ai/
├── reports/
├── notifications/
├── files/
└── audit/
```

---

# 139. Service Layer Rule

Controllers should remain thin.

Preferred:

```text
Controller
    ↓
Service
    ↓
Domain Logic
    ↓
Repository
    ↓
Prisma
```

Avoid:

```text
Controller
    ↓
Prisma directly
```

---

# 140. Repository Pattern

Repositories should encapsulate persistence operations.

Example:

```text
PatientRepository
AppointmentRepository
EncounterRepository
PrescriptionRepository
PaymentRepository
```

This makes business logic easier to test and persistence easier to evolve.

---

# 141. Domain Service Examples

Complex business logic should live in domain/application services.

Examples:

```text
AppointmentSchedulingService
QueueManagementService
PrescriptionFinalizationService
PatientDuplicateDetectionService
AIClinicalContextService
PaymentService
```

---

# 142. API Security Checklist

Before production:

```text
[ ] HTTPS
[ ] JWT security
[ ] Refresh token rotation
[ ] Password hashing
[ ] OTP throttling
[ ] API rate limiting
[ ] RBAC
[ ] Resource authorization
[ ] Input validation
[ ] SQL injection protection
[ ] XSS protection
[ ] CORS configuration
[ ] File validation
[ ] Audit logging
[ ] Secret management
[ ] Database encryption/backups
[ ] Security headers
```

---

# 143. Clinical Safety Checklist

```text
[ ] AI clearly labeled
[ ] AI output review required
[ ] AI cannot finalize prescription
[ ] Finalized prescription immutable
[ ] Amendments auditable
[ ] Patient access controlled
[ ] Chamber isolation enforced
[ ] Clinical actions audited
[ ] Report access audited
[ ] Critical workflows transactional
```

---

# 144. Final Backend Architecture

The target architecture can be summarized as:

```text
                         CLIENTS
                 ┌──────────┴──────────┐
                 │                     │
              Flutter              Web App
                 │                     │
                 └──────────┬──────────┘
                            │
                           HTTPS
                            │
                  ┌─────────▼─────────┐
                  │   NestJS/Fastify  │
                  │  Modular Monolith │
                  └─────────┬─────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
     Identity           Operations          Clinical
        │                   │                   │
   Auth / RBAC        Appointment          Encounter
   Doctor             Queue                Vitals
   Staff              Payment              Diagnosis
   Verification       Notification         Investigation
                                            Prescription
                                                │
                                                ▼
                                               AI
                                                │
                                  ┌─────────────┼─────────────┐
                                  ▼             ▼             ▼
                                LLM          Context       Safety
                              Provider       Builder       Layer

        ┌───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
   PostgreSQL                 Redis                 Object Storage
   System of Record         Cache/Jobs               Clinical Files

                            │
                            ▼
                       Audit / Events
                            │
                            ▼
                      Analytics / Reports
```

---

# 145. Final Architectural Principles

The backend must follow these principles:

1. **Clinical data integrity over convenience.**
2. **Authorization must be enforced server-side.**
3. **Chamber boundaries must be explicit.**
4. **Finalized clinical records must be auditable and effectively immutable.**
5. **AI is an assistant, never the final clinical decision-maker.**
6. **Core consultation workflows must not depend on AI availability.**
7. **Critical multi-step operations must be transactional.**
8. **Background processing must be retryable and idempotent.**
9. **The MVP should remain a modular monolith.**
10. **Design module boundaries so future service extraction remains possible.**
11. **Patient and clinical data must be treated as highly sensitive.**
12. **Every important clinical and administrative action must be auditable.**
13. **The API must remain mobile-friendly and resilient to unreliable connectivity.**
14. **Bangladesh-specific requirements such as Bangla input, BDT, local phone formats, and variable connectivity must be first-class considerations.**
15. **The backend should optimize for the core workflow:**

```text
Patient
   ↓
Appointment
   ↓
Check-in
   ↓
Queue
   ↓
Consultation
   ↓
Clinical Record
   ↓
Prescription
   ↓
Payment
   ↓
Follow-up
```

---

# 146. Next Technical Document

The next recommended document is:

## Document 8 — Database Architecture & Prisma Schema Specification

It should define:

- Complete ER model
- Entity relationships
- PostgreSQL schema
- Prisma models
- Primary/foreign keys
- Unique constraints
- Indexes
- Enum definitions
- Soft-delete strategy
- Audit tables
- Clinical record versioning
- Prescription versioning
- Chamber isolation
- User/role/permission schema
- Appointment/queue schema
- AI request/draft schema
- Payment schema
- Notification schema
- File metadata schema
- Migration strategy
- Seed data
- Sample Prisma queries
- Transaction patterns
- Database performance strategy