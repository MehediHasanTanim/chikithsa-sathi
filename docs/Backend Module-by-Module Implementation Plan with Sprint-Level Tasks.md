# Chamber Management
## Backend Module-by-Module Implementation Plan — Detailed Sprint Tasks

**Document:** 9 — Updated  
**Product:** AI-Powered Chamber & Prescription Management  
**Backend:** NestJS + TypeScript + Fastify  
**Database:** PostgreSQL + Prisma  
**Cache / Queue:** Redis + BullMQ  
**Storage:** S3-compatible Object Storage  
**API:** REST `/api/v1`  
**Target Market:** Bangladesh  
**Sprint Duration:** 2 weeks  
**Primary Goal:** Production-ready MVP backend

---

# 1. Purpose

This document translates the backend architecture into a **sprint-by-sprint engineering execution plan**.

Each sprint contains:

- Sprint objective
- Modules covered
- Detailed development tasks
- Database tasks
- API tasks
- Security/authorization tasks
- Background-job tasks
- Testing tasks
- Documentation tasks
- DevOps tasks
- Dependencies
- Sprint deliverables
- Definition of Done

The plan assumes approximately **3–5 backend engineers**, supported by frontend, QA, UI/UX, DevOps and product team members.

---

# 2. Sprint Strategy

The implementation follows the actual doctor workflow:

```text
Foundation
    ↓
Authentication
    ↓
Doctor & Chamber Setup
    ↓
Staff & RBAC
    ↓
Patient Management
    ↓
Appointments
    ↓
Queue
    ↓
Consultation
    ↓
Clinical Records
    ↓
Prescription
    ↓
Payment
    ↓
AI
    ↓
Notifications
    ↓
Analytics
    ↓
Production Hardening
```

The objective is to have a progressively usable backend rather than building isolated modules for months.

---

# 3. Sprint Overview

| Sprint | Primary Focus | Major Outcome |
|---|---|---|
| Sprint 1 | Backend Foundation | Running NestJS platform |
| Sprint 2 | Authentication & Users | Secure account system |
| Sprint 3 | Doctor & Chamber | Practice setup |
| Sprint 4 | Staff & RBAC | Multi-user chamber |
| Sprint 5 | Patients | Patient management |
| Sprint 6 | Appointments | Appointment management |
| Sprint 7 | Queue | Daily chamber queue |
| Sprint 8 | Consultation | Encounter workflow |
| Sprint 9 | Clinical Records | Vitals, notes, diagnosis, investigations |
| Sprint 10 | Reports & Files | Diagnostic reports & storage |
| Sprint 11 | Medicines & Prescription | Prescription creation |
| Sprint 12 | Prescription Finalization | Clinical-safe prescription workflow |
| Sprint 13 | Payments | Billing & receipts |
| Sprint 14 | AI Foundation | AI infrastructure |
| Sprint 15 | AI Clinical Features | AI assistant & prescription drafts |
| Sprint 16 | Notifications & Analytics | Operational intelligence |
| Sprint 17 | Integration & E2E | Complete workflow |
| Sprint 18 | Production Hardening | Production-ready MVP |

**Estimated MVP backend timeline: ~36 weeks.**

A larger team can parallelize several sprints and reduce calendar time.

---

# 4. Sprint 1 — Backend Foundation

## Objective

Establish the technical foundation required by every subsequent module.

## Modules

```text
Common
Prisma
Redis
Config
Health
Infrastructure
```

## Tasks

### 4.1 NestJS Project

- [ ] Create NestJS project
- [ ] Configure TypeScript
- [ ] Configure Fastify adapter
- [ ] Configure project aliases
- [ ] Configure ESLint
- [ ] Configure Prettier
- [ ] Configure Husky/pre-commit hooks
- [ ] Configure lint-staged
- [ ] Establish source directory structure

### 4.2 Configuration

Create centralized configuration for:

```text
Application
Database
Redis
JWT
Storage
AI
Notifications
Email
SMS
```

Tasks:

- [ ] Create configuration module
- [ ] Implement environment validation
- [ ] Define `.env.example`
- [ ] Prevent application startup with invalid configuration

### 4.3 PostgreSQL

- [ ] Create local PostgreSQL environment
- [ ] Configure Prisma
- [ ] Configure database connection
- [ ] Create initial migration
- [ ] Configure connection pooling
- [ ] Configure development database

### 4.4 Prisma

- [ ] Create Prisma module
- [ ] Create PrismaService
- [ ] Implement lifecycle management
- [ ] Add transaction helper patterns
- [ ] Configure Prisma logging

### 4.5 Redis

- [ ] Create Redis module
- [ ] Create RedisService
- [ ] Configure connection
- [ ] Add health check
- [ ] Establish key naming conventions

### 4.6 Common Infrastructure

Implement:

- [ ] Global exception filter
- [ ] Validation pipe
- [ ] Request ID middleware/interceptor
- [ ] Logging interceptor
- [ ] Pagination utilities
- [ ] Date/time utilities
- [ ] Bangladesh phone validation
- [ ] Common error codes
- [ ] API response structure

### 4.7 Health

Implement:

```text
GET /health
GET /health/live
GET /health/ready
```

Readiness should check:

```text
PostgreSQL
Redis
```

### 4.8 Docker

- [ ] Backend Dockerfile
- [ ] Docker Compose
- [ ] PostgreSQL container
- [ ] Redis container
- [ ] Local development configuration

### 4.9 Testing

- [ ] Jest configuration
- [ ] Unit test setup
- [ ] Integration test database
- [ ] Basic health E2E test

## Sprint Deliverable

```text
Developer
 ↓
git clone
 ↓
docker compose up
 ↓
NestJS API
 ↓
PostgreSQL
 ↓
Redis
```

---

# 5. Sprint 2 — Authentication & Users

## Objective

Implement secure account registration and authentication.

## Modules

```text
Auth
Users
Sessions
OTP
```

## Tasks

### 5.1 Database

Create:

- [ ] User
- [ ] UserSession
- [ ] OTP/verification record
- [ ] Account status fields

### 5.2 Registration

Implement:

```text
POST /auth/register
```

Tasks:

- [ ] Validate phone/email
- [ ] Check existing account
- [ ] Hash password
- [ ] Create user
- [ ] Generate OTP
- [ ] Store OTP securely
- [ ] Apply OTP expiry
- [ ] Queue OTP delivery

### 5.3 OTP

Implement:

```text
POST /auth/verify-otp
POST /auth/resend-otp
```

Tasks:

- [ ] OTP generation
- [ ] OTP hashing
- [ ] OTP expiry
- [ ] Attempt counter
- [ ] Rate limiting
- [ ] OTP invalidation after successful verification

### 5.4 Login

Implement:

```text
POST /auth/login
```

Tasks:

- [ ] Credential validation
- [ ] Password verification
- [ ] Access token
- [ ] Refresh token
- [ ] Session creation
- [ ] Login audit event

### 5.5 Refresh

Implement:

```text
POST /auth/refresh
```

Tasks:

- [ ] Refresh token validation
- [ ] Rotation
- [ ] Session validation
- [ ] Token revocation

### 5.6 Logout

```text
POST /auth/logout
```

Tasks:

- [ ] Session revocation
- [ ] Refresh token invalidation
- [ ] Audit logging

### 5.7 User Profile

```text
GET /users/me
PATCH /users/me
```

### 5.8 Security

- [ ] Argon2id password hashing
- [ ] JWT strategy
- [ ] Authentication guard
- [ ] Rate limiting
- [ ] Secure token handling
- [ ] Sensitive-data logging review

### 5.9 Testing

- [ ] Registration tests
- [ ] OTP tests
- [ ] Login tests
- [ ] Refresh tests
- [ ] Logout tests
- [ ] Brute-force protection tests
- [ ] Expired token tests

## Sprint Deliverable

A user can:

```text
Register
 ↓
Verify OTP
 ↓
Login
 ↓
Receive JWT
 ↓
Refresh session
 ↓
Logout
```

---

# 6. Sprint 3 — Doctor & Chamber

## Objective

Allow a doctor to create and configure their practice.

## Modules

```text
Doctors
Verification
Chambers
Schedules
```

## Tasks

### 6.1 Doctor Profile

- [ ] DoctorProfile schema
- [ ] Doctor profile API
- [ ] Specialization
- [ ] Qualifications
- [ ] BMDC information
- [ ] Consultation settings

### 6.2 Verification

Implement:

```text
POST /verification/submit
GET /verification/status
```

Tasks:

- [ ] Verification status
- [ ] Document metadata
- [ ] Submission workflow
- [ ] Resubmission
- [ ] Admin review foundation

### 6.3 Chamber

Implement:

```text
POST /chambers
GET /chambers
GET /chambers/:id
PATCH /chambers/:id
```

Tasks:

- [ ] Chamber creation
- [ ] Chamber owner membership
- [ ] Chamber address
- [ ] Contact information
- [ ] Consultation fee
- [ ] Chamber status

### 6.4 Schedule

Implement:

```text
GET /chambers/:id/schedules
POST /chambers/:id/schedules
PATCH /schedules/:id
DELETE /schedules/:id
```

Tasks:

- [ ] Weekly schedules
- [ ] Start/end time
- [ ] Breaks
- [ ] Appointment duration
- [ ] Daily capacity
- [ ] Bangladesh timezone handling

### 6.5 Chamber Authorization

Implement:

```text
ChamberAccessGuard
```

Validate:

```text
User
 ↓
Membership
 ↓
Chamber
```

### 6.6 Testing

- [ ] Chamber CRUD
- [ ] Doctor ownership
- [ ] Schedule validation
- [ ] Unauthorized chamber access
- [ ] Multi-chamber doctor tests

## Sprint Deliverable

Doctor can:

```text
Create profile
 ↓
Create chamber
 ↓
Configure schedule
 ↓
Configure consultation settings
```

---

# 7. Sprint 4 — Staff & RBAC

## Objective

Allow doctors to operate chambers with staff.

## Modules

```text
Staff
Roles
Permissions
Authorization
```

## Tasks

### 7.1 Database

- [ ] ChamberMembership
- [ ] Role
- [ ] Permission
- [ ] RolePermission
- [ ] Staff invitation

### 7.2 Default Roles

Seed:

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
```

### 7.3 Permissions

Define permissions such as:

```text
patients.read
patients.create
patients.update

appointments.read
appointments.create
appointments.update

queue.read
queue.manage

encounters.read
encounters.create
encounters.update

prescriptions.create
prescriptions.finalize

payments.create
payments.read
```

### 7.4 Staff APIs

```text
GET /chambers/:id/staff
POST /chambers/:id/staff/invite
PATCH /staff/:id
DELETE /staff/:id
```

### 7.5 Guards

Implement:

```text
JwtAuthGuard
ChamberAccessGuard
PermissionGuard
```

### 7.6 Authorization Tests

Create a permission matrix test suite.

Example:

```text
Receptionist
  ✓ Patient registration
  ✓ Appointment creation
  ✓ Queue management
  ✗ Prescription finalization
  ✗ Clinical record deletion
```

## Sprint Deliverable

Multiple staff members can securely operate the same chamber.

---

# 8. Sprint 5 — Patient Management

## Objective

Build the patient master record.

## Module

```text
Patients
```

## Tasks

### 8.1 Patient Database

Implement:

- [ ] Patient
- [ ] PatientChamber
- [ ] PatientAllergy
- [ ] PatientCondition

### 8.2 Patient Registration

```text
POST /patients
```

Tasks:

- [ ] Name
- [ ] Bangla name
- [ ] Phone
- [ ] Date of birth
- [ ] Gender
- [ ] Address
- [ ] Emergency contact
- [ ] Patient identifier

### 8.3 Search

```text
GET /patients/search
```

Support:

- [ ] Name
- [ ] Bangla name
- [ ] Phone
- [ ] Patient ID
- [ ] DOB

### 8.4 Duplicate Detection

Implement:

```text
phone
+
name
+
date of birth
```

Return:

```text
Potential duplicate
```

Do not automatically merge.

### 8.5 Patient Profile

Implement:

```text
GET /patients/:id
PATCH /patients/:id
```

### 8.6 Timeline Foundation

Implement API structure for:

```text
Patient
 ↓
Appointments
 ↓
Encounters
 ↓
Prescriptions
 ↓
Investigations
```

### 8.7 Testing

- [ ] CRUD
- [ ] Search
- [ ] Duplicate detection
- [ ] Chamber isolation
- [ ] Authorization

## Sprint Deliverable

Receptionist can register and find patients quickly.

---

# 9. Sprint 6 — Appointments

## Objective

Implement appointment scheduling.

## Module

```text
Appointments
```

## Tasks

### 9.1 Database

Implement:

- [ ] Appointment
- [ ] appointment statuses
- [ ] indexes

### 9.2 APIs

```text
POST /appointments
GET /appointments
GET /appointments/:id
PATCH /appointments/:id
POST /appointments/:id/cancel
POST /appointments/:id/reschedule
```

### 9.3 Scheduling Logic

Implement:

- [ ] Schedule validation
- [ ] Time-slot validation
- [ ] Capacity validation
- [ ] Appointment conflict detection
- [ ] Doctor/chamber validation

### 9.4 Appointment Status

```text
BOOKED
CONFIRMED
CHECKED_IN
IN_QUEUE
IN_CONSULTATION
COMPLETED
CANCELLED
NO_SHOW
```

### 9.5 Testing

Test:

- [ ] valid appointment
- [ ] duplicate slot
- [ ] outside schedule
- [ ] cancellation
- [ ] rescheduling
- [ ] wrong chamber
- [ ] concurrent booking

## Sprint Deliverable

Staff can schedule and manage daily appointments.

---

# 10. Sprint 7 — Queue Management

## Objective

Implement the live daily chamber queue.

## Module

```text
Queue Management
```

## Tasks

### 10.1 Database

Implement:

- [ ] QueueEntry
- [ ] DailyQueueCounter
- [ ] Queue indexes

### 10.2 Check-in

```text
POST /queue/check-in
```

Tasks:

- [ ] Validate appointment
- [ ] Validate patient
- [ ] Generate queue number
- [ ] Create queue entry
- [ ] Update appointment status

### 10.3 Queue Operations

Implement:

```text
GET /queue/today
POST /queue/:id/call
POST /queue/:id/recall
POST /queue/:id/skip
POST /queue/:id/start
POST /queue/:id/complete
```

### 10.4 Concurrency

Test:

```text
Receptionist A → check-in
Receptionist B → check-in
```

Expected:

```text
Patient A → Q001
Patient B → Q002
```

No duplicate queue numbers.

### 10.5 Queue Events

Emit:

```text
PatientCheckedIn
PatientCalled
ConsultationStarted
QueueEntryCompleted
```

### 10.6 Testing

- [ ] State transitions
- [ ] Concurrent check-ins
- [ ] Duplicate check-in
- [ ] Skip
- [ ] Recall
- [ ] Wrong chamber

## Sprint Deliverable

A chamber can operate its complete daily queue.

---

# 11. Sprint 8 — Consultation / Encounter

## Objective

Create the clinical encounter workflow.

## Module

```text
Encounters
```

## Tasks

### 11.1 Encounter Database

Implement:

- [ ] Encounter
- [ ] Encounter status
- [ ] queue relationship

### 11.2 Encounter APIs

```text
POST /encounters
GET /encounters/:id
PATCH /encounters/:id
POST /encounters/:id/start
POST /encounters/:id/complete
POST /encounters/:id/lock
```

### 11.3 Encounter State

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

### 11.4 Consultation Rules

Implement:

- [ ] Only authorized clinical users can edit
- [ ] Patient/chamber validation
- [ ] Encounter ownership/access
- [ ] Locking
- [ ] Audit events

### 11.5 Testing

- [ ] Encounter lifecycle
- [ ] Unauthorized edit
- [ ] Lock behavior
- [ ] Concurrent updates
- [ ] Audit

## Sprint Deliverable

Doctor can start and complete a patient consultation.

---

# 12. Sprint 9 — Clinical Records

## Objective

Implement the actual clinical information captured during consultation.

## Modules

```text
Vitals
Clinical Notes
Diagnoses
Investigations
```

## Tasks

### 12.1 Vitals

Implement:

```text
POST /encounters/:id/vitals
GET /encounters/:id/vitals
PATCH /vitals/:id
```

Support:

```text
Weight
Height
BP
Pulse
Temperature
SpO2
Respiratory Rate
```

### 12.2 Clinical Notes

Implement:

```text
POST /encounters/:id/notes
GET /encounters/:id/notes
PATCH /notes/:id
```

Structure:

```text
Chief Complaint
History
Examination
Assessment
Plan
Additional Notes
```

### 12.3 Diagnoses

Implement:

```text
GET /diagnoses/search
POST /encounters/:id/diagnoses
DELETE /encounters/:id/diagnoses/:id
```

### 12.4 Investigations

Implement:

```text
GET /investigations/catalog
POST /encounters/:id/investigations
GET /encounters/:id/investigations
PATCH /investigations/:id
```

### 12.5 Catalog Seeds

Create initial:

- [ ] diagnosis catalog
- [ ] investigation catalog
- [ ] common units

### 12.6 Testing

- [ ] Vitals CRUD
- [ ] Notes CRUD
- [ ] Diagnosis assignment
- [ ] Investigation assignment
- [ ] Encounter lock restrictions
- [ ] Clinical authorization

## Sprint Deliverable

Doctor/assistant can record complete basic clinical information.

---

# 13. Sprint 10 — Reports & Files

## Objective

Implement diagnostic report uploads and secure file storage.

## Modules

```text
Files
Reports
Object Storage
```

## Tasks

### 13.1 Object Storage

- [ ] Configure S3-compatible storage
- [ ] Create private bucket
- [ ] Configure credentials
- [ ] Generate pre-signed upload URL

### 13.2 File APIs

```text
POST /files/upload-url
POST /files/complete
GET /files/:id
```

### 13.3 File Validation

Validate:

- [ ] MIME type
- [ ] extension
- [ ] file size
- [ ] ownership
- [ ] resource authorization

### 13.4 Diagnostic Reports

Implement:

```text
POST /encounters/:id/reports
GET /encounters/:id/reports
GET /reports/:id
```

### 13.5 Security

- [ ] Private object storage
- [ ] Signed download URLs
- [ ] File access authorization
- [ ] Malware scanning architecture
- [ ] Audit file access

### 13.6 Testing

- [ ] Upload
- [ ] Download
- [ ] Invalid file
- [ ] Oversized file
- [ ] Unauthorized access

## Sprint Deliverable

Doctors can securely attach diagnostic reports to patient records.

---

# 14. Sprint 11 — Medicines & Prescription Builder

## Objective

Implement prescription creation.

## Modules

```text
Medicines
Prescriptions
Doctor Favorites
```

## Tasks

### 14.1 Medicine Database

Implement:

- [ ] Medicine
- [ ] Generic name
- [ ] Brand name
- [ ] Form
- [ ] Strength
- [ ] Route

### 14.2 Medicine Search

```text
GET /medicines/search
```

Support:

- [ ] Brand
- [ ] Generic
- [ ] partial search
- [ ] Bangla/transliterated search

### 14.3 Doctor Favorites

```text
GET /doctors/me/medicine-favorites
POST /doctors/me/medicine-favorites
DELETE /doctors/me/medicine-favorites/:id
```

### 14.4 Prescription

Implement:

```text
POST /encounters/:id/prescriptions
GET /prescriptions/:id
PATCH /prescriptions/:id
```

### 14.5 Prescription Items

Support:

```text
Medicine
Dose
Frequency
Route
Duration
Instructions
Quantity
```

### 14.6 Testing

- [ ] Medicine search
- [ ] Favorites
- [ ] Prescription creation
- [ ] Prescription editing
- [ ] Invalid medicine
- [ ] Wrong encounter access

## Sprint Deliverable

Doctor can build a prescription digitally.

---

# 15. Sprint 12 — Prescription Review & Finalization

## Objective

Implement the clinically safe prescription lifecycle.

## Tasks

### 15.1 State Machine

```text
DRAFT
 ↓
REVIEW_REQUIRED
 ↓
FINALIZED
 ↓
DELIVERED
```

AI-assisted prescriptions additionally support:

```text
AI_ASSISTED
```

### 15.2 Review API

```text
POST /prescriptions/:id/review
```

### 15.3 Finalization API

```text
POST /prescriptions/:id/finalize
```

### 15.4 Finalization Transaction

Transaction must:

```text
Validate prescription
 ↓
Validate encounter
 ↓
Validate user permission
 ↓
Validate prescription state
 ↓
Finalize
 ↓
Create audit event
 ↓
Create domain event
```

### 15.5 Immutability

After finalization:

```text
PATCH prescription
      ↓
DENIED
```

Corrections require:

```text
Prescription Amendment
```

### 15.6 Amendment

Implement:

```text
POST /prescriptions/:id/amend
GET /prescriptions/:id/history
```

### 15.7 PDF

Queue:

```text
PrescriptionFinalized
 ↓
PDF Job
 ↓
PDF generated
```

### 15.8 Testing

Extensive tests:

- [ ] finalization
- [ ] double finalization
- [ ] unauthorized finalization
- [ ] immutable record
- [ ] amendment
- [ ] concurrent finalization
- [ ] audit event
- [ ] PDF job

## Sprint Deliverable

A clinically safe, auditable prescription lifecycle exists.

---

# 16. Sprint 13 — Payments & Receipts

## Objective

Implement chamber billing.

## Module

```text
Payments
Receipts
Refunds
```

## Tasks

### 16.1 Payment Database

Implement:

- [ ] Payment
- [ ] Receipt
- [ ] PaymentRefund

### 16.2 Payment APIs

```text
POST /payments
GET /payments
GET /payments/:id
```

### 16.3 Payment Methods

```text
CASH
BANK
MOBILE_PAYMENT
OTHER
```

### 16.4 Receipt

Implement:

```text
GET /payments/:id/receipt
```

### 16.5 Refund

```text
POST /payments/:id/refund
```

### 16.6 Financial Integrity

Use:

```text
Decimal
```

Never use floating-point arithmetic for money.

### 16.7 Testing

- [ ] Payment creation
- [ ] Duplicate payment
- [ ] Receipt
- [ ] Refund
- [ ] Double refund
- [ ] Permission checks
- [ ] Decimal precision

## Sprint Deliverable

Complete payment and receipt workflow.

---

# 17. Sprint 14 — AI Foundation

## Objective

Create the AI platform without yet integrating it deeply into clinical workflows.

## Module

```text
AI
```

## Tasks

### 17.1 Provider Abstraction

Create:

```typescript
interface AIProvider {
  generate(request: AIRequest): Promise<AIResponse>;
}
```

### 17.2 Provider Implementation

Implement initial provider adapter.

Tasks:

- [ ] API client
- [ ] timeout
- [ ] retry
- [ ] error handling
- [ ] model configuration
- [ ] token tracking

### 17.3 AI Orchestrator

Implement:

```text
AIOrchestratorService
```

Responsibilities:

- [ ] authorization
- [ ] context
- [ ] safety
- [ ] provider selection
- [ ] output validation

### 17.4 AI Request Database

Implement:

- [ ] AIRequest
- [ ] AIDraft
- [ ] AI usage metadata

### 17.5 Context Builder

Implement:

```text
Patient
 ↓
Relevant Clinical Data
 ↓
Context Builder
 ↓
AI
```

### 17.6 Safety Layer

Implement:

- [ ] data minimization
- [ ] prompt injection defenses
- [ ] output validation
- [ ] medical disclaimer metadata
- [ ] review-required flag

### 17.7 Testing

- [ ] Provider mock
- [ ] timeout
- [ ] provider failure
- [ ] malformed response
- [ ] safety failure
- [ ] authorization

## Sprint Deliverable

AI infrastructure is ready for clinical features.

---

# 18. Sprint 15 — AI Clinical Features

## Objective

Integrate AI into doctor workflows.

## Features

```text
Patient Summary
Clinical Chat
AI Prescription Draft
```

## 18.1 Patient Summary

API:

```text
POST /ai/patient-summary
```

Tasks:

- [ ] Build patient context
- [ ] Generate structured summary
- [ ] Validate output
- [ ] Display provenance
- [ ] Store AI metadata

## 18.2 Clinical Chat

API:

```text
POST /ai/clinical-chat
```

Tasks:

- [ ] Conversation context
- [ ] Patient context
- [ ] Safety layer
- [ ] Output validation
- [ ] Usage tracking

## 18.3 AI Prescription Draft

API:

```text
POST /ai/prescription-draft
```

Flow:

```text
Patient Context
      ↓
AI
      ↓
Structured Draft
      ↓
Validation
      ↓
Doctor Review
      ↓
Doctor Edit
      ↓
Doctor Finalize
```

## 18.4 Critical Rule

AI must never:

```text
Finalize prescription
Modify finalized prescription
Lock encounter
Create payment
```

## 18.5 Testing

- [ ] AI summary
- [ ] clinical chat
- [ ] prescription draft
- [ ] malformed AI response
- [ ] unsafe output
- [ ] doctor review requirement
- [ ] AI failure fallback

## Sprint Deliverable

AI meaningfully assists doctors without taking clinical control away from them.

---

# 19. Sprint 16 — Notifications & Analytics

## Objective

Implement operational automation.

## Modules

```text
Notifications
Analytics
Audit
```

## 19.1 Notification Infrastructure

Create:

```text
NotificationService
NotificationQueue
NotificationWorker
```

### Channels

MVP:

```text
Push
Email
SMS abstraction
```

### Events

Implement:

- [ ] appointment confirmation
- [ ] appointment reminder
- [ ] queue update
- [ ] prescription ready
- [ ] payment receipt
- [ ] staff invitation

## 19.2 BullMQ

Create queues:

```text
notifications
pdf
ai
```

Implement:

- [ ] retries
- [ ] exponential backoff
- [ ] failed job handling
- [ ] job idempotency

## 19.3 Analytics

Implement:

```text
GET /analytics/dashboard
GET /analytics/revenue
GET /analytics/patients
```

Metrics:

- [ ] today's patients
- [ ] appointments
- [ ] completed consultations
- [ ] revenue
- [ ] no-shows
- [ ] average consultation time

## 19.4 Audit

Complete audit coverage for:

```text
Patient
Encounter
Prescription
Payment
AI
Staff
Permissions
Files
```

## Sprint Deliverable

Operational notifications and dashboard analytics are functional.

---

# 20. Sprint 17 — Full Integration & E2E

## Objective

Integrate every backend module into the complete doctor workflow.

## Main E2E Flow

```text
Doctor Registration
       ↓
OTP Verification
       ↓
Doctor Profile
       ↓
Create Chamber
       ↓
Schedule
       ↓
Add Staff
       ↓
Register Patient
       ↓
Appointment
       ↓
Check-in
       ↓
Queue
       ↓
Consultation
       ↓
Vitals
       ↓
Clinical Notes
       ↓
Diagnosis
       ↓
Investigation
       ↓
AI Assistance
       ↓
Prescription
       ↓
Doctor Review
       ↓
Prescription Finalization
       ↓
Payment
       ↓
Receipt
       ↓
Prescription Delivery
       ↓
Encounter Completion
```

## Tasks

### Integration

- [ ] Verify every API dependency
- [ ] Verify authorization across modules
- [ ] Verify transaction boundaries
- [ ] Verify domain events
- [ ] Verify background jobs

### E2E Tests

Create automated test suites for:

- [ ] Doctor onboarding
- [ ] Staff workflow
- [ ] Patient registration
- [ ] Appointment
- [ ] Queue
- [ ] Consultation
- [ ] Prescription
- [ ] Payment
- [ ] AI
- [ ] Multi-chamber isolation

### Negative Testing

Test:

```text
Unauthorized user
Wrong chamber
Expired session
Invalid patient
Locked encounter
Finalized prescription
Duplicate payment
AI failure
Database failure
Redis failure
```

## Sprint Deliverable

The complete backend workflow works end-to-end.

---

# 21. Sprint 18 — Production Hardening

## Objective

Prepare the backend for real doctors and clinical data.

## 21.1 Security

- [ ] Security audit
- [ ] Dependency scan
- [ ] JWT review
- [ ] RBAC review
- [ ] Chamber isolation review
- [ ] File security review
- [ ] API rate limits
- [ ] Input validation review
- [ ] Secret management

## 21.2 Performance

Load-test:

```text
Patient Search
Appointment Creation
Queue Check-in
Queue Operations
Consultation
Prescription
Payment
Dashboard
```

Targets:

```text
CRUD p95 < 300ms
Normal API p95 < 500ms
Queue operations < 300ms
```

AI requests are excluded from standard synchronous API latency targets.

## 21.3 Database

- [ ] Index review
- [ ] Slow query analysis
- [ ] Connection pool review
- [ ] Transaction review
- [ ] Backup verification
- [ ] Restore test

## 21.4 Redis

- [ ] Connection resilience
- [ ] Queue retry
- [ ] Failed jobs
- [ ] Memory policy
- [ ] Monitoring

## 21.5 Observability

Implement:

- [ ] structured logging
- [ ] metrics
- [ ] health checks
- [ ] request IDs
- [ ] error monitoring
- [ ] queue monitoring

## 21.6 Deployment

- [ ] Production Docker image
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Database migration pipeline
- [ ] Rollback strategy
- [ ] Environment secrets

## 21.7 Disaster Recovery

Test:

```text
Database Backup
 ↓
Database Restore
 ↓
Application Restart
 ↓
Redis Recovery
 ↓
File Access
```

## Sprint Deliverable

Backend passes the MVP production-readiness checklist.

---

# 22. Sprint Dependency Map

```text
Sprint 1
Foundation
   ↓
Sprint 2
Auth
   ↓
Sprint 3
Doctor + Chamber
   ↓
Sprint 4
Staff + RBAC
   ↓
Sprint 5
Patients
   ↓
Sprint 6
Appointments
   ↓
Sprint 7
Queue
   ↓
Sprint 8
Encounters
   ↓
Sprint 9
Clinical Records
   ↓
Sprint 10
Reports + Files
   ↓
Sprint 11
Prescription Builder
   ↓
Sprint 12
Prescription Finalization
   ↓
Sprint 13
Payments
   ↓
Sprint 14
AI Foundation
   ↓
Sprint 15
AI Clinical
   ↓
Sprint 16
Notifications + Analytics
   ↓
Sprint 17
Integration
   ↓
Sprint 18
Production
```

---

# 23. Parallel Development Opportunities

Not every task must be strictly sequential.

After Sprint 1:

```text
                 ┌── Auth
                 │
                 ├── Doctor
                 │
Foundation ──────┼── Database
                 │
                 └── Common
```

After chamber architecture is stable:

```text
Patients
   │
   ├── Appointments
   │
   └── Queue
```

Clinical development can then proceed:

```text
Encounters
   ├── Vitals
   ├── Notes
   ├── Diagnosis
   └── Investigations
```

Prescription and payment can partially proceed in parallel once the encounter model is stable.

AI infrastructure can start before the core clinical workflow is complete, but AI clinical features should not be integrated until the underlying clinical data model is stable.

---

# 24. Jira Epic Structure

The backend work can be converted into these Jira epics:

```text
CM-BE-01 Backend Foundation
CM-BE-02 Authentication
CM-BE-03 User Management
CM-BE-04 Doctor Management
CM-BE-05 Verification
CM-BE-06 Chamber Management
CM-BE-07 Schedule Management
CM-BE-08 Staff & RBAC
CM-BE-09 Patient Management
CM-BE-10 Appointment Management
CM-BE-11 Queue Management
CM-BE-12 Consultation
CM-BE-13 Clinical Records
CM-BE-14 Diagnostic Reports
CM-BE-15 File Management
CM-BE-16 Medicine Management
CM-BE-17 Prescription
CM-BE-18 Payments
CM-BE-19 Notifications
CM-BE-20 AI Platform
CM-BE-21 Analytics
CM-BE-22 Audit
CM-BE-23 Production Hardening
```

---

# 25. Example Jira Story Breakdown

## Epic: Patient Management

### Story 1

**Create Patient Database Model**

Tasks:

```text
Create Prisma model
Add indexes
Create migration
Add repository
Add unit tests
```

### Story 2

**Create Patient API**

Tasks:

```text
Create DTO
Create controller
Create service
Implement authorization
Implement validation
Add API tests
Add Swagger documentation
```

### Story 3

**Patient Search**

Tasks:

```text
Search DTO
Search repository
PostgreSQL trigram configuration
Search ranking
Pagination
Tests
```

### Story 4

**Duplicate Patient Detection**

Tasks:

```text
Duplicate algorithm
Phone matching
Name matching
DOB matching
Response model
Tests
```

---

# 26. Backend Engineer Daily Workflow

For each story:

```text
Requirement
   ↓
API Contract
   ↓
Database Design
   ↓
DTO
   ↓
Repository
   ↓
Service
   ↓
Authorization
   ↓
Controller
   ↓
Tests
   ↓
Swagger
   ↓
PR
   ↓
Code Review
   ↓
Merge
```

---

# 27. Code Review Checklist

Every backend PR should verify:

### Architecture

- [ ] Correct module
- [ ] No unnecessary cross-module coupling
- [ ] Controller is thin
- [ ] Business logic in service
- [ ] Database access in repository

### Security

- [ ] Authentication
- [ ] Authorization
- [ ] Chamber isolation
- [ ] Input validation
- [ ] Sensitive data protection

### Database

- [ ] Correct indexes
- [ ] Correct constraints
- [ ] Transaction where required
- [ ] No accidental N+1 queries

### Testing

- [ ] Unit tests
- [ ] Integration tests where required
- [ ] Authorization tests
- [ ] Error scenarios

### Documentation

- [ ] Swagger
- [ ] Error codes
- [ ] API examples

---

# 28. Sprint-Level Definition of Done

A sprint is complete only when:

```text
[ ] Development complete
[ ] Database migration complete
[ ] API implementation complete
[ ] Authorization complete
[ ] Unit tests complete
[ ] Integration tests complete
[ ] Critical E2E tests complete
[ ] Swagger updated
[ ] Error codes documented
[ ] Logging implemented
[ ] Audit requirements implemented
[ ] Code reviewed
[ ] CI passing
[ ] Staging deployment successful
```

---

# 29. MVP Backend Milestones

## Milestone 1 — Platform Ready

After Sprint 2:

```text
Authentication
+
Infrastructure
```

---

## Milestone 2 — Practice Ready

After Sprint 4:

```text
Doctor
+
Chamber
+
Schedule
+
Staff
+
RBAC
```

---

## Milestone 3 — Chamber Operations Ready

After Sprint 7:

```text
Patients
+
Appointments
+
Queue
```

At this point receptionists can operate the front desk.

---

## Milestone 4 — Clinical Workflow Ready

After Sprint 10:

```text
Consultation
+
Vitals
+
Notes
+
Diagnosis
+
Investigations
+
Reports
```

---

## Milestone 5 — Prescription Ready

After Sprint 12:

```text
Clinical Workflow
+
Prescription
+
Doctor Review
+
Finalization
```

This is the first major clinical MVP milestone.

---

## Milestone 6 — Financially Ready

After Sprint 13:

```text
Prescription
+
Payment
+
Receipt
```

---

## Milestone 7 — AI Ready

After Sprint 15:

```text
Clinical Workflow
+
AI Assistant
+
AI Prescription Draft
```

---

## Milestone 8 — MVP Production Candidate

After Sprint 18:

```text
Complete Chamber Workflow
+
AI
+
Security
+
Monitoring
+
Backup
+
Production Deployment
```

---

# 30. MVP Release Gate

The backend should not be considered MVP-ready until this workflow succeeds:

```text
Doctor
 ↓
Login
 ↓
Select Chamber
 ↓
View Today's Appointments
 ↓
Receptionist Registers Patient
 ↓
Appointment Created
 ↓
Patient Checked In
 ↓
Queue Number Generated
 ↓
Doctor Calls Patient
 ↓
Consultation Started
 ↓
Vitals Recorded
 ↓
Clinical Notes Recorded
 ↓
Diagnosis Added
 ↓
Investigation Added
 ↓
AI Assistance Used
 ↓
Prescription Draft Created
 ↓
Doctor Reviews
 ↓
Doctor Finalizes
 ↓
Payment Recorded
 ↓
Receipt Generated
 ↓
Prescription Delivered
 ↓
Encounter Completed
```

---

# 31. Post-MVP Sprints

After Sprint 18, advanced capabilities can be developed.

## Phase 2

```text
Prescription Templates
Family Management
Advanced AI
Voice-to-Note
Advanced Report Analysis
Offline Support
SMS Automation
WhatsApp Integration
Advanced Analytics
```

Potential additional sprints:

```text
Sprint 19 — Prescription Templates
Sprint 20 — Family & Advanced Patient Management
Sprint 21 — AI Voice-to-Note
Sprint 22 — Advanced Report AI
Sprint 23 — Offline & Sync
Sprint 24 — Communication Automation
Sprint 25 — Advanced Analytics
```

---

# 32. Phase 3

Potential future backend modules:

```text
Patient Portal
Telemedicine
Lab Integration
Pharmacy Integration
Insurance
Referral Network
Predictive Analytics
Marketplace
External Healthcare Integrations
```

These should not delay the core MVP.

---

# 33. Recommended Team Allocation

## Backend Engineer A — Platform

Own:

```text
Foundation
Auth
Users
Doctors
Chambers
RBAC
```

## Backend Engineer B — Operations

Own:

```text
Patients
Appointments
Queue
```

## Backend Engineer C — Clinical

Own:

```text
Encounters
Vitals
Notes
Diagnosis
Investigations
Reports
Files
```

## Backend Engineer D — Prescription & Finance

Own:

```text
Medicines
Prescriptions
Payments
Receipts
```

## Backend/AI Engineer

Own:

```text
AI
AI Context
AI Safety
AI Provider
AI Clinical Features
```

## Lead/Senior Engineer

Own:

```text
Architecture
Database
Security
Code Reviews
Performance
CI/CD
Production
```

---

# 34. Backend Project Tracking Structure

Recommended hierarchy:

```text
Epic
 ↓
Feature
 ↓
Story
 ↓
Technical Task
 ↓
Sub-task
```

Example:

```text
Epic: Prescription

Feature: Prescription Finalization

Story:
Doctor finalizes prescription

Subtasks:
├── Create finalization DTO
├── Implement authorization
├── Implement validation
├── Implement transaction
├── Update prescription state
├── Create audit event
├── Emit domain event
├── Add PDF job
├── Add unit tests
├── Add integration tests
└── Add E2E test
```

---

# 35. Critical Backend Engineering Rules

The following rules should be treated as architectural constraints:

### Rule 1

```text
Frontend authorization ≠ Security
```

All authorization must be enforced by the backend.

### Rule 2

```text
chamberId from request ≠ authorization
```

The backend must verify membership.

### Rule 3

```text
AI suggestion ≠ prescription
```

AI output remains a draft until explicitly approved by a doctor.

### Rule 4

```text
Finalized prescription ≠ editable record
```

Use amendment/versioning.

### Rule 5

```text
Clinical record ≠ disposable CRUD data
```

Protect, audit and retain appropriately.

### Rule 6

```text
Redis ≠ source of truth
```

PostgreSQL remains authoritative.

### Rule 7

```text
Background job ≠ guaranteed single execution
```

Design every job to be idempotent.

### Rule 8

```text
MVP ≠ microservices
```

Use a modular monolith first.

---

# 36. Final Sprint Roadmap

```text
                    CHAMBER MANAGEMENT BACKEND
                              │
                              ▼
                     SPRINT 1 — FOUNDATION
                              │
                              ▼
                    SPRINT 2 — AUTH & USERS
                              │
                              ▼
                 SPRINT 3 — DOCTOR & CHAMBER
                              │
                              ▼
                   SPRINT 4 — STAFF & RBAC
                              │
                              ▼
                    SPRINT 5 — PATIENTS
                              │
                              ▼
                  SPRINT 6 — APPOINTMENTS
                              │
                              ▼
                     SPRINT 7 — QUEUE
                              │
                              ▼
                  SPRINT 8 — CONSULTATION
                              │
                              ▼
                SPRINT 9 — CLINICAL RECORDS
                              │
                              ▼
                  SPRINT 10 — REPORTS/FILES
                              │
                              ▼
              SPRINT 11 — MEDICINES/PRESCRIPTION
                              │
                              ▼
              SPRINT 12 — PRESCRIPTION FINALIZATION
                              │
                              ▼
                    SPRINT 13 — PAYMENTS
                              │
                              ▼
                    SPRINT 14 — AI FOUNDATION
                              │
                              ▼
                 SPRINT 15 — AI CLINICAL
                              │
                              ▼
              SPRINT 16 — NOTIFICATIONS/ANALYTICS
                              │
                              ▼
                  SPRINT 17 — FULL INTEGRATION
                              │
                              ▼
                 SPRINT 18 — PRODUCTION HARDENING
                              │
                              ▼
                         MVP RELEASE
```

---

# 37. Final Recommendation

The backend team should **not treat the sprint list as merely a module checklist**.

Each sprint should produce something demonstrably usable.

The progression should be:

```text
Sprint 2
→ User can log in

Sprint 4
→ Doctor can operate a chamber with staff

Sprint 7
→ Receptionist can run the daily queue

Sprint 10
→ Doctor can perform a complete consultation

Sprint 12
→ Doctor can safely create and finalize prescriptions

Sprint 13
→ Chamber can collect payment

Sprint 15
→ Doctor receives meaningful AI assistance

Sprint 17
→ Entire workflow works end-to-end

Sprint 18
→ System is production-ready
```

The ultimate MVP acceptance criterion is:

> **A doctor should be able to run a real chamber for an entire working day using the system, from patient registration and queue management through consultation, AI-assisted prescription, payment, and reporting, without requiring another core chamber-management system.**

---

# 38. Next Documentation Step

With the sprint plan now established, the next document should be:

## Document 10 — Complete API Contract

It should define **every API endpoint** required by the MVP, including:

```text
HTTP Method
Endpoint
Authentication
Permission
Path Parameters
Query Parameters
Request DTO
Validation Rules
Response DTO
Error Codes
Pagination
State Transitions
Database Operations
Audit Events
Example Request
Example Response
```

The API contract should then become the **single source of truth between Flutter/Web frontend, NestJS backend, QA, and AI development teams**.