# Chamber Management
## Document 16 — Complete Flutter Feature-by-Feature Implementation Specification

**Version:** 1.0  
**Platform:** Flutter  
**Language:** Dart  
**Architecture:** Clean Architecture  
**State Management:** Riverpod  
**Routing:** GoRouter  
**Networking:** Dio  
**Serialization:** Freezed + json_serializable  
**Local Cache:** Hive  
**Secure Storage:** flutter_secure_storage  
**Backend:** NestJS + Fastify  
**API:** REST `/api/v1`  
**Database:** PostgreSQL + Prisma  
**Primary Locale:** Bangla + English  
**Timezone:** Asia/Dhaka  
**Currency:** BDT

---

# 1. Purpose

This document converts the Flutter frontend architecture defined in Document 15 into an implementation-level specification.

It defines what developers should actually build for every major frontend feature.

For each feature, this document specifies:

- Screens
- Navigation
- Files
- Domain entities
- DTOs
- Repository contracts
- API endpoints
- Use cases
- Riverpod providers
- Controllers
- UI components
- Validation
- Permissions
- Loading/error/empty states
- Local persistence
- Testing
- Acceptance criteria
- Backend dependencies

---

# 2. Frontend Implementation Strategy

Development follows this sequence:

```text
UX/UI
  ↓
API Contract
  ↓
Domain Entity
  ↓
DTO
  ↓
Repository Interface
  ↓
Remote Data Source
  ↓
Repository Implementation
  ↓
Use Cases
  ↓
Riverpod Providers
  ↓
Controller
  ↓
UI
  ↓
Validation
  ↓
Tests
```

---

# 3. Global Feature Development Rules

Every feature must:

- Follow Clean Architecture.
- Use Riverpod.
- Avoid API calls directly from widgets.
- Use repository interfaces.
- Use immutable state.
- Handle loading/error/empty states.
- Support localization.
- Respect permissions.
- Support appropriate caching.
- Include unit tests.
- Include widget tests.
- Include integration tests for critical workflows.

---

# 4. Feature Inventory

The frontend consists of:

```text
01 Authentication
02 Onboarding
03 Doctor Profile
04 Chamber
05 Schedule
06 Staff & RBAC
07 Patient
08 Appointment
09 Queue
10 Consultation
11 Vitals
12 Diagnosis
13 Investigation
14 Diagnostic Reports
15 Medicines
16 Prescription
17 Payment
18 Notifications
19 AI Assistant
20 Analytics
21 Settings
22 Files
23 Connectivity & Offline
24 Sync
25 Application Shell
```

---

# 5. Feature 01 — Authentication

## 5.1 Objective

Allow doctors and staff members to:

- Register
- Verify OTP
- Login
- Refresh session
- Logout
- Restore session

---

## 5.2 Screens

```text
SplashScreen
LoginPage
RegisterPage
OtpVerificationPage
Forgot/Recovery state
```

---

## 5.3 Files

```text
features/auth/
├── data/
│   ├── datasources/
│   │   ├── auth_remote_datasource.dart
│   │   └── auth_local_datasource.dart
│   ├── models/
│   │   ├── auth_tokens_model.dart
│   │   ├── login_response_model.dart
│   │   └── user_model.dart
│   └── repositories/
│       └── auth_repository_impl.dart
│
├── domain/
│   ├── entities/
│   │   ├── user.dart
│   │   └── session.dart
│   ├── repositories/
│   │   └── auth_repository.dart
│   └── usecases/
│       ├── login.dart
│       ├── register.dart
│       ├── verify_otp.dart
│       ├── resend_otp.dart
│       ├── refresh_session.dart
│       └── logout.dart
│
└── presentation/
    ├── pages/
    │   ├── login_page.dart
    │   ├── register_page.dart
    │   └── otp_verification_page.dart
    ├── widgets/
    │   ├── login_form.dart
    │   ├── register_form.dart
    │   └── otp_input.dart
    └── providers/
        ├── auth_provider.dart
        ├── auth_state.dart
        └── auth_controller.dart
```

---

## 5.4 APIs

```text
POST /auth/register
POST /auth/verify-otp
POST /auth/resend-otp
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /users/me
```

---

## 5.5 Tasks

### AUTH-001 — Authentication models

Create:

- UserModel
- AuthTokensModel
- LoginResponseModel
- Session

### AUTH-002 — Remote data source

Implement all authentication API calls.

### AUTH-003 — Secure token storage

Implement:

- Save access token
- Save refresh token
- Read tokens
- Clear tokens

### AUTH-004 — Repository

Implement authentication repository.

### AUTH-005 — Use cases

Implement six authentication use cases.

### AUTH-006 — Auth state

States:

```text
initial
checking
authenticated
unauthenticated
error
```

### AUTH-007 — Login

Implement:

- Phone/email input
- Password
- Validation
- API call
- Error handling

### AUTH-008 — Registration

Implement:

- Name
- Phone
- Email if applicable
- Password
- Role/account type

### AUTH-009 — OTP

Implement:

- OTP input
- Countdown
- Resend
- Invalid OTP
- Expired OTP

### AUTH-010 — Session restoration

Restore session during application startup.

### AUTH-011 — Logout

Clear:

- Session
- Secure credentials
- User cache
- Chamber selection

### AUTH-012 — Route guards

Redirect based on authentication state.

---

## 5.6 Validation

Phone:

- Bangladesh phone format
- Required

Password:

- Required
- Minimum length
- Backend constraints

OTP:

- Required
- Numeric
- Exact configured length

---

## 5.7 Acceptance Criteria

- User can register.
- User receives OTP.
- User can verify OTP.
- User can login.
- Session survives application restart.
- Expired access token can refresh.
- Logout clears session.
- Protected routes cannot be accessed without authentication.

---

# 6. Feature 02 — Onboarding

## 6.1 Objective

Guide newly registered users through setup.

---

## 6.2 Screens

```text
OnboardingWelcome
DoctorProfileSetup
ProfessionalInformation
Verification
CreateChamber
ScheduleSetup
StaffInvitation
AISetup
OnboardingComplete
```

---

## 6.3 Tasks

```text
ONB-001 Create onboarding state
ONB-002 Track completion steps
ONB-003 Doctor profile form
ONB-004 Professional information form
ONB-005 Verification submission
ONB-006 Chamber creation
ONB-007 Schedule creation
ONB-008 Staff invitation
ONB-009 AI preference setup
ONB-010 Completion screen
ONB-011 Resume incomplete onboarding
```

---

## 6.4 Acceptance Criteria

User can leave onboarding and resume later.

Completed steps must not be unnecessarily repeated.

---

# 7. Feature 03 — Doctor Profile

## APIs

```text
GET   /doctors/me
PATCH /doctors/me
GET   /doctors/me/professional-profile
PATCH /doctors/me/professional-profile
POST  /verification/submit
GET   /verification/status
```

---

## Files

```text
features/doctor/
├── data/
├── domain/
└── presentation/
```

---

## Tasks

```text
DOC-001 Doctor entity
DOC-002 Doctor model
DOC-003 Profile repository
DOC-004 Profile use cases
DOC-005 Profile provider
DOC-006 Profile page
DOC-007 Edit profile
DOC-008 Professional profile
DOC-009 Verification status
DOC-010 Verification submission
```

---

## Acceptance Criteria

Doctor can:

- View profile
- Edit profile
- View professional details
- Submit verification
- See verification status

---

# 8. Feature 04 — Chamber Management

## APIs

```text
POST   /chambers
GET    /chambers
GET    /chambers/:chamberId
PATCH  /chambers/:chamberId
POST   /chambers/:chamberId/activate
POST   /chambers/:chamberId/deactivate
```

---

## Screens

```text
ChamberList
CreateChamber
ChamberDetails
EditChamber
ChamberSwitcher
```

---

## Providers

```text
chambersProvider
selectedChamberProvider
chamberDetailsProvider
chamberControllerProvider
```

---

## Tasks

```text
CHM-001 Chamber entity
CHM-002 Chamber model
CHM-003 Chamber repository
CHM-004 Chamber use cases
CHM-005 Chamber providers
CHM-006 Chamber list
CHM-007 Create chamber
CHM-008 Edit chamber
CHM-009 Activate/deactivate
CHM-010 Chamber switcher
CHM-011 Persist selected chamber
```

---

## Business Rules

- User may have multiple chambers.
- Only authorized chamber members can access chamber data.
- Selected chamber must be included in relevant API context.
- Switching chambers must refresh chamber-scoped data.

---

# 9. Feature 05 — Schedule

## APIs

```text
GET    /chambers/:chamberId/schedules
POST   /chambers/:chamberId/schedules
PATCH  /schedules/:scheduleId
DELETE /schedules/:scheduleId
```

---

## Tasks

```text
SCH-001 Schedule entity
SCH-002 Schedule model
SCH-003 Schedule repository
SCH-004 Schedule provider
SCH-005 Weekly schedule UI
SCH-006 Add schedule
SCH-007 Edit schedule
SCH-008 Delete schedule
SCH-009 Break configuration
SCH-010 Validation
```

---

## Validation

Prevent:

- Invalid time ranges
- Overlapping schedules
- Invalid break ranges

Backend remains authoritative for conflicts.

---

# 10. Feature 06 — Staff & RBAC

## APIs

```text
GET    /chambers/:chamberId/staff
POST   /chambers/:chamberId/staff/invite
PATCH  /staff/:membershipId
DELETE /staff/:membershipId
POST   /staff/:membershipId/resend-invitation

GET /chambers/:chamberId/permissions
GET /chambers/:chamberId/my-permissions
```

---

## Screens

```text
StaffList
InviteStaff
StaffDetails
EditStaffRole
PermissionView
```

---

## Tasks

```text
STA-001 Staff entity
STA-002 Staff model
STA-003 Staff repository
STA-004 Staff providers
STA-005 Staff list
STA-006 Invite staff
STA-007 Edit role
STA-008 Remove staff
STA-009 Resend invitation
STA-010 Permission provider
STA-011 Permission-based UI
```

---

## Permission Example

```text
patient.read
patient.create
patient.update

appointment.read
appointment.create

queue.manage

payment.read
payment.create
payment.refund

staff.read
staff.manage
```

---

# 11. Feature 07 — Patient Management

## APIs

```text
POST /patients
GET  /patients
GET  /patients/search
GET  /patients/:patientId
PATCH /patients/:patientId

POST /patients/:patientId/chambers
GET  /patients/:patientId/timeline

GET    /patients/:patientId/allergies
POST   /patients/:patientId/allergies
DELETE /patients/:patientId/allergies/:allergyId

GET  /patients/:patientId/conditions
POST /patients/:patientId/conditions
```

---

## Screens

```text
PatientList
PatientSearch
PatientRegistration
PatientDetails
PatientTimeline
PatientEdit
Allergies
Conditions
```

---

## Providers

```text
patientsProvider
patientSearchProvider
patientDetailsProvider
patientTimelineProvider
patientControllerProvider
```

---

## Tasks

```text
PAT-001 Patient entity
PAT-002 Patient model
PAT-003 Patient repository
PAT-004 Patient use cases
PAT-005 Patient providers
PAT-006 Patient list
PAT-007 Search
PAT-008 Registration form
PAT-009 Duplicate detection UI
PAT-010 Patient details
PAT-011 Timeline
PAT-012 Edit patient
PAT-013 Allergies
PAT-014 Conditions
PAT-015 Add to chamber
```

---

## Patient Registration Fields

Minimum:

```text
Name
Phone
Gender
Date of Birth/Age
Address
Emergency Contact
```

Optional:

```text
Blood Group
National ID reference where appropriate
Notes
```

Avoid collecting unnecessary personal data.

---

## Search

Support:

- Bangla name
- English name
- Phone
- Patient ID

Use debounced search.

---

## Acceptance Criteria

Receptionist can register a patient in under a few minutes.

Existing patients can be found quickly.

Duplicate warnings appear before creating a potentially duplicate patient.

---

# 12. Feature 08 — Appointment

## APIs

```text
POST /appointments
GET /appointments
GET /appointments/:appointmentId
PATCH /appointments/:appointmentId

POST /appointments/:appointmentId/reschedule
POST /appointments/:appointmentId/cancel
POST /appointments/:appointmentId/confirm
```

---

## Screens

```text
AppointmentCalendar
AppointmentList
AppointmentDetails
CreateAppointment
EditAppointment
RescheduleAppointment
```

---

## Providers

```text
appointmentsProvider
appointmentCalendarProvider
appointmentDetailsProvider
appointmentControllerProvider
```

---

## Tasks

```text
APT-001 Appointment entity
APT-002 Appointment model
APT-003 Repository
APT-004 Use cases
APT-005 Calendar provider
APT-006 Appointment list
APT-007 Create appointment
APT-008 Edit appointment
APT-009 Reschedule
APT-010 Cancel
APT-011 Confirm
APT-012 Conflict handling
```

---

## Acceptance Criteria

Appointment conflicts returned by backend are clearly shown.

Appointment status is always synchronized with server state.

---

# 13. Feature 09 — Queue

## APIs

```text
GET  /queue/today
POST /queue/check-in

POST /queue/:queueEntryId/call
POST /queue/:queueEntryId/recall
POST /queue/:queueEntryId/skip
POST /queue/:queueEntryId/start
POST /queue/:queueEntryId/complete
```

---

## Screens

```text
DailyQueue
QueueCard
QueueDetails
```

---

## Providers

```text
todayQueueProvider
queueControllerProvider
queuePollingProvider
```

---

## Tasks

```text
QUE-001 Queue entity
QUE-002 Queue model
QUE-003 Repository
QUE-004 Today's queue
QUE-005 Check-in
QUE-006 Call patient
QUE-007 Recall
QUE-008 Skip
QUE-009 Start consultation
QUE-010 Complete
QUE-011 Queue polling
QUE-012 Queue refresh
QUE-013 Optimistic UI only where safe
```

---

## Queue State

```text
WAITING
CALLED
IN_CONSULTATION
COMPLETED
SKIPPED
```

---

## Critical Rule

Queue actions must never be assumed successful.

For critical transitions:

```text
User Action
 ↓
API
 ↓
Server Confirmation
 ↓
Update UI
```

---

# 14. Feature 10 — Consultation Workspace

This is the highest-priority frontend feature.

---

## Screens

```text
ConsultationWorkspace
PatientContext
VitalsSection
ClinicalNotes
Diagnosis
Investigation
Prescription
AI Assistant
Completion
```

---

## APIs

```text
POST  /encounters
GET   /encounters/:encounterId
PATCH /encounters/:encounterId

POST /encounters/:encounterId/start
POST /encounters/:encounterId/ready-for-review
POST /encounters/:encounterId/complete
POST /encounters/:encounterId/lock
```

---

## Providers

```text
consultationProvider
consultationControllerProvider
patientContextProvider
encounterProvider
consultationAutoSaveProvider
consultationStatusProvider
```

---

## Tasks

```text
CON-001 Encounter entity
CON-002 Encounter model
CON-003 Encounter repository
CON-004 Encounter use cases
CON-005 Consultation state
CON-006 Consultation controller
CON-007 Patient header
CON-008 Patient summary
CON-009 Start encounter
CON-010 Save draft
CON-011 Ready for review
CON-012 Complete encounter
CON-013 Lock encounter
CON-014 Dirty state tracking
CON-015 Auto-save
CON-016 Unsaved changes protection
```

---

## Consultation State

```text
Idle
Loading
InProgress
Saving
ReadyForReview
Completed
Locked
Error
```

---

## Auto-Save

```text
Input
 ↓
Dirty
 ↓
Debounce
 ↓
Save
 ↓
Saved
```

Recommended debounce:

```text
500ms–2s
```

depending on operation.

---

# 15. Feature 11 — Vitals

## APIs

```text
POST /encounters/:encounterId/vitals
GET  /encounters/:encounterId/vitals
PATCH /vitals/:vitalId
GET  /patients/:patientId/vitals
```

---

## Tasks

```text
VIT-001 Vital entity
VIT-002 Vital model
VIT-003 Repository
VIT-004 Vitals provider
VIT-005 Vitals form
VIT-006 Blood pressure input
VIT-007 Weight
VIT-008 Height
VIT-009 Temperature
VIT-010 Pulse
VIT-011 SpO2
VIT-012 BMI calculation
VIT-013 Historical trends
```

---

# 16. Feature 12 — Diagnosis

## APIs

```text
GET    /diagnoses/search
POST   /encounters/:encounterId/diagnoses
DELETE /encounters/:encounterId/diagnoses/:diagnosisId
```

---

## Tasks

```text
DIA-001 Diagnosis model
DIA-002 Search repository
DIA-003 Search provider
DIA-004 Diagnosis selector
DIA-005 Primary diagnosis
DIA-006 Secondary diagnosis
DIA-007 Remove diagnosis
DIA-008 Recent diagnoses
```

---

# 17. Feature 13 — Investigation

## APIs

```text
GET   /investigations/catalog
POST  /encounters/:encounterId/investigations
GET   /encounters/:encounterId/investigations
PATCH /investigations/:investigationId
```

---

## Tasks

```text
INV-001 Investigation entity
INV-002 Catalog model
INV-003 Repository
INV-004 Search
INV-005 Selector
INV-006 Selected investigation list
INV-007 Instructions
INV-008 Status
```

---

# 18. Feature 14 — Diagnostic Reports

## APIs

```text
POST /encounters/:encounterId/reports
GET  /encounters/:encounterId/reports
GET  /reports/:reportId
POST /reports/:reportId/analyze
```

---

## Tasks

```text
REP-001 Report entity
REP-002 Report model
REP-003 Repository
REP-004 Upload workflow
REP-005 Report list
REP-006 Report details
REP-007 Report preview
REP-008 AI analysis trigger
REP-009 Analysis result
REP-010 Error/retry
```

---

# 19. Feature 15 — Medicines

## APIs

```text
GET    /medicines/search
GET    /medicines/:medicineId

GET    /doctors/me/medicine-favorites
POST   /doctors/me/medicine-favorites
DELETE /doctors/me/medicine-favorites/:medicineId
```

---

## Tasks

```text
MED-001 Medicine entity
MED-002 Medicine model
MED-003 Repository
MED-004 Search provider
MED-005 Search UI
MED-006 Favorite list
MED-007 Add favorite
MED-008 Remove favorite
MED-009 Recent medicine list
```

---

# 20. Feature 16 — Prescription

Prescription is a clinical-critical module.

---

## APIs

```text
POST /encounters/:encounterId/prescriptions
GET  /prescriptions/:prescriptionId
PATCH /prescriptions/:prescriptionId

POST   /prescriptions/:prescriptionId/items
PATCH  /prescriptions/:prescriptionId/items/:itemId
DELETE /prescriptions/:prescriptionId/items/:itemId

POST /prescriptions/:prescriptionId/review
POST /prescriptions/:prescriptionId/finalize

POST /prescriptions/:prescriptionId/amend
GET  /prescriptions/:prescriptionId/history

GET  /prescriptions/:prescriptionId/preview
GET  /prescriptions/:prescriptionId/pdf
POST /prescriptions/:prescriptionId/deliver
```

---

## Providers

```text
prescriptionProvider
prescriptionControllerProvider
prescriptionItemsProvider
prescriptionReviewProvider
```

---

## Tasks

```text
RX-001 Prescription entity
RX-002 Prescription model
RX-003 Prescription item model
RX-004 Repository
RX-005 Create prescription
RX-006 Medicine selector
RX-007 Add medicine
RX-008 Edit medicine
RX-009 Remove medicine
RX-010 Dose selector
RX-011 Frequency selector
RX-012 Duration selector
RX-013 Instructions
RX-014 Review screen
RX-015 Finalization confirmation
RX-016 Finalize
RX-017 Read-only finalized state
RX-018 Amend
RX-019 History
RX-020 Preview
RX-021 PDF
RX-022 Delivery
```

---

## Prescription State

```text
DRAFT
AI_ASSISTED
REVIEW_REQUIRED
FINALIZED
DELIVERED
```

---

## Finalization Rule

The frontend must:

1. Display complete prescription.
2. Require explicit review.
3. Show confirmation.
4. Call backend.
5. Wait for server confirmation.
6. Change UI to read-only.

Never optimistically finalize.

---

# 21. Feature 17 — Payment

## APIs

```text
POST /payments
GET  /payments
GET  /payments/:paymentId
GET  /payments/:paymentId/receipt
POST /payments/:paymentId/refund
```

---

## Screens

```text
PaymentScreen
PaymentHistory
ReceiptScreen
RefundScreen
```

---

## Tasks

```text
PAY-001 Payment entity
PAY-002 Payment model
PAY-003 Repository
PAY-004 Create payment
PAY-005 Payment method selector
PAY-006 Amount validation
PAY-007 Payment history
PAY-008 Receipt
PAY-009 Refund
PAY-010 Idempotency
```

---

## Payment Methods

Support configurable methods such as:

```text
Cash
Card
Mobile Financial Service
Bank Transfer
Other
```

Actual available methods should come from backend configuration where appropriate.

---

# 22. Feature 18 — Notifications

## APIs

```text
GET /notifications
GET /notifications/unread-count
POST /notifications/:notificationId/read
POST /notifications/read-all
```

---

## Tasks

```text
NOT-001 Notification entity
NOT-002 Model
NOT-003 Repository
NOT-004 Notification provider
NOT-005 Notification list
NOT-006 Unread count
NOT-007 Mark read
NOT-008 Mark all read
NOT-009 Deep linking
```

---

# 23. Feature 19 — AI Assistant

AI must remain an assistant, never the final decision maker.

---

## APIs

```text
POST /ai/patient-summary
POST /ai/clinical-chat
POST /ai/prescription-draft
POST /ai/report-analysis
GET  /ai/requests/:requestId
```

Future:

```text
POST /ai/voice-note
```

---

## Screens

```text
AIAssistant
AIClinicalChat
AIPatientSummary
AIPrescriptionDraft
AIReportAnalysis
```

---

## Providers

```text
aiPatientSummaryProvider
aiClinicalChatProvider
aiPrescriptionDraftProvider
aiReportAnalysisProvider
aiRequestProvider
```

---

## Tasks

```text
AI-001 AI entity
AI-002 AI request model
AI-003 Repository
AI-004 Patient summary
AI-005 Clinical chat
AI-006 Prescription draft
AI-007 Report analysis
AI-008 Processing state
AI-009 Retry
AI-010 Error handling
AI-011 AI badges
AI-012 Review-required banner
AI-013 Copy/apply suggestion actions
```

---

## AI UI Rule

Every AI clinical response should clearly display:

```text
AI Generated
Review Required
```

---

## Prescription AI Flow

```text
Consultation Context
       ↓
AI Request
       ↓
AI Draft
       ↓
Doctor Review
       ↓
Doctor Edit
       ↓
Doctor Finalization
```

AI cannot call the finalization endpoint.

---

# 24. Feature 20 — Analytics

## APIs

```text
GET /analytics/dashboard
GET /analytics/revenue
GET /analytics/patients
GET /analytics/appointments
```

---

## Screens

```text
AnalyticsDashboard
RevenueAnalytics
PatientAnalytics
AppointmentAnalytics
```

---

## Tasks

```text
ANA-001 Analytics models
ANA-002 Repository
ANA-003 Dashboard provider
ANA-004 Revenue chart
ANA-005 Patient metrics
ANA-006 Appointment metrics
ANA-007 Date filtering
ANA-008 Chamber filtering
ANA-009 Empty states
```

---

# 25. Feature 21 — Settings

## Areas

```text
Profile
Language
Theme
Notifications
AI preferences
Security
Chamber
Staff
Subscription
About
Logout
```

---

## Tasks

```text
SET-001 Settings model
SET-002 Settings provider
SET-003 Language
SET-004 Theme
SET-005 Notification preferences
SET-006 AI preferences
SET-007 Security settings
SET-008 Logout
```

---

# 26. Feature 22 — Files

File operations are used by:

- Diagnostic reports
- Doctor profile
- Prescription documents
- Other attachments

---

## APIs

```text
POST   /files/upload-url
POST   /files/complete
GET    /files/:fileId
DELETE /files/:fileId
```

---

## Tasks

```text
FILE-001 File entity
FILE-002 Upload service
FILE-003 File validation
FILE-004 Upload progress
FILE-005 Retry
FILE-006 Cancellation
FILE-007 Preview
FILE-008 Download
FILE-009 Delete
```

---

# 27. Feature 23 — Connectivity & Offline

## Providers

```text
connectivityProvider
networkStatusProvider
```

---

## States

```text
ONLINE
OFFLINE
POOR_CONNECTION
RECONNECTING
```

---

## Tasks

```text
OFF-001 Connectivity service
OFF-002 Connectivity provider
OFF-003 Global offline banner
OFF-004 Request retry
OFF-005 Cache read
OFF-006 Offline error handling
OFF-007 Draft protection
```

---

# 28. Feature 24 — Sync

Full offline synchronization is an advanced feature.

---

## Architecture

```text
UI
 ↓
Repository
 ├── Remote
 └── Local
       ↓
Sync Queue
       ↓
Conflict Resolver
       ↓
Remote
```

---

## Tasks

```text
SYNC-001 Sync entity
SYNC-002 Local mutation queue
SYNC-003 Pending operation storage
SYNC-004 Retry policy
SYNC-005 Conflict detection
SYNC-006 Conflict resolution
SYNC-007 Sync status
SYNC-008 Background synchronization
SYNC-009 Sync failure UI
```

---

## Clinical Sync Rule

Do not silently overwrite clinical records.

Conflict resolution must preserve:

- Previous version
- New version
- Timestamp
- Author
- Source

---

# 29. Feature 25 — Application Shell

The application shell contains:

```text
AppScaffold
Navigation
TopBar
ChamberSwitcher
GlobalSearch
NotificationButton
UserMenu
```

---

# 30. Dashboard

Dashboard must be optimized around the doctor's daily workflow.

Primary information:

```text
Today's Patients
Current Queue
Next Patient
Today's Appointments
Today's Revenue
Pending Tasks
```

---

# 31. Dashboard Quick Actions

Recommended:

```text
Add Patient
New Appointment
Check-in Patient
Open Queue
Start Consultation
Search Patient
```

The most frequently used actions should require minimal navigation.

---

# 32. Global Search

Search should eventually support:

```text
Patients
Appointments
Prescriptions
Medicines
Diagnoses
Investigations
```

Initial MVP:

```text
Patients
```

---

# 33. Cross-Feature Navigation

Example:

```text
Patient
 ↓
Appointment
 ↓
Queue
 ↓
Consultation
 ↓
Prescription
 ↓
Payment
 ↓
Receipt
```

Each transition should preserve relevant context.

---

# 34. Shared Patient Context

Patient context should be consistently available during clinical workflows.

Example:

```text
┌───────────────────────────────┐
│ Rahim Ahmed                   │
│ 42 yrs • Male • P-000123      │
│ Allergies: Penicillin         │
└───────────────────────────────┘
```

---

# 35. Shared Loading Strategy

Use:

```text
Initial Loading
Refresh Loading
Mutation Loading
Inline Loading
Skeleton Loading
```

Avoid replacing an entire screen with a spinner for small mutations.

---

# 36. Error Handling

Errors should be contextual.

Bad:

```text
Something went wrong.
```

Better:

```text
Unable to save the patient.
Please check your connection and try again.
```

For server validation:

Display field-level errors wherever possible.

---

# 37. Retry Strategy

Retry automatically only for safe operations.

Potentially retry:

```text
GET
safe file upload retry
read operations
```

Do not blindly retry:

```text
POST payment
POST finalize prescription
POST refund
```

unless idempotency is guaranteed.

---

# 38. Cache Strategy

### Cache aggressively

```text
Medicine catalog
Diagnosis catalog
Investigation catalog
User preferences
Recent patients
```

### Cache selectively

```text
Appointments
Queue
Patient details
```

### Cache carefully

```text
Clinical notes
Prescriptions
Diagnostic reports
```

---

# 39. API Mapping Summary

| Feature | Primary API Module |
|---|---|
| Auth | `/auth` |
| Doctor | `/doctors` |
| Verification | `/verification` |
| Chamber | `/chambers` |
| Schedule | `/schedules` |
| Staff | `/staff` |
| Patient | `/patients` |
| Appointment | `/appointments` |
| Queue | `/queue` |
| Consultation | `/encounters` |
| Vitals | `/vitals` |
| Diagnosis | `/diagnoses` |
| Investigation | `/investigations` |
| Reports | `/reports` |
| Files | `/files` |
| Medicines | `/medicines` |
| Prescription | `/prescriptions` |
| Payment | `/payments` |
| Notification | `/notifications` |
| AI | `/ai` |
| Analytics | `/analytics` |
| Export | `/exports` |

---

# 40. Provider Dependency Example

Patient:

```text
patientRepositoryProvider
        ↓
patientUseCasesProvider
        ↓
patientSearchProvider
        ↓
PatientSearchPage
```

Prescription:

```text
prescriptionRepositoryProvider
        ↓
prescriptionUseCasesProvider
        ↓
prescriptionControllerProvider
        ↓
PrescriptionPage
```

---

# 41. Cross-Feature Provider Composition

Consultation may compose:

```text
selectedPatientProvider
encounterProvider
vitalsProvider
diagnosisProvider
investigationProvider
prescriptionProvider
aiProvider
```

But each provider retains ownership of its own state.

---

# 42. Permission Enforcement

Example:

```text
Doctor
    patient.create = true

Receptionist
    patient.create = true

Billing Staff
    patient.create = false
```

UI:

```text
permissionChecker.can('patient.create')
```

Backend remains authoritative.

---

# 43. Feature Testing Matrix

| Feature | Unit | Widget | Integration |
|---|---:|---:|---:|
| Auth | ✓ | ✓ | ✓ |
| Onboarding | ✓ | ✓ | ✓ |
| Doctor | ✓ | ✓ | |
| Chamber | ✓ | ✓ | ✓ |
| Staff | ✓ | ✓ | |
| Patient | ✓ | ✓ | ✓ |
| Appointment | ✓ | ✓ | ✓ |
| Queue | ✓ | ✓ | ✓ |
| Consultation | ✓ | ✓ | ✓ |
| Vitals | ✓ | ✓ | |
| Diagnosis | ✓ | ✓ | |
| Investigation | ✓ | ✓ | |
| Reports | ✓ | ✓ | ✓ |
| Medicines | ✓ | ✓ | |
| Prescription | ✓ | ✓ | ✓ |
| Payment | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | |
| AI | ✓ | ✓ | ✓ |
| Analytics | ✓ | ✓ | |
| Offline | ✓ | ✓ | ✓ |
| Sync | ✓ | ✓ | ✓ |

---

# 44. Critical End-to-End Test

The most important integration test is:

```text
Login
 ↓
Select Chamber
 ↓
Register Patient
 ↓
Create Appointment
 ↓
Check-in
 ↓
Queue
 ↓
Call Patient
 ↓
Start Consultation
 ↓
Record Vitals
 ↓
Add Diagnosis
 ↓
Add Investigation
 ↓
Create Prescription
 ↓
Review
 ↓
Finalize
 ↓
Payment
 ↓
Receipt
 ↓
Complete Consultation
```

---

# 45. AI End-to-End Test

```text
Open Patient
 ↓
Start Consultation
 ↓
Request Patient Summary
 ↓
AI Response
 ↓
Generate Prescription Draft
 ↓
Review AI Draft
 ↓
Modify
 ↓
Finalize Manually
```

Test must verify that AI cannot finalize the prescription.

---

# 46. Multi-Chamber Test

```text
Doctor
 ├── Chamber A
 └── Chamber B
```

Verify:

- Patient lists are correct.
- Appointments are isolated.
- Queue is isolated.
- Staff access is chamber-specific.
- Analytics respect selected chamber.
- Switching chamber refreshes relevant data.

---

# 47. Staff Permission Test

Example:

```text
Receptionist
```

Should be able to:

```text
Patient
Appointment
Queue
```

But should not be able to:

```text
Finalize prescription
Refund payment
Manage staff
```

depending on configured permissions.

---

# 48. Clinical Data Protection Tests

Verify:

- Finalized prescriptions are read-only.
- Locked encounters cannot be edited.
- AI output is marked as AI-generated.
- Unauthorized users cannot access clinical records.
- Sensitive information is not logged.
- Logout clears protected local data.

---

# 49. Sprint Implementation Mapping

## Sprint 1

```text
Application Shell
Core
Network
Storage
Theme
Localization
Routing
```

## Sprint 2

```text
Authentication
Onboarding
```

## Sprint 3

```text
Doctor
Chamber
Schedule
Staff
RBAC
```

## Sprint 4

```text
Patient
Search
Timeline
```

## Sprint 5

```text
Appointment
Queue
```

## Sprint 6

```text
Consultation
Vitals
Diagnosis
Investigation
```

## Sprint 7

```text
Medicines
Prescription
```

## Sprint 8

```text
Payment
Receipt
```

## Sprint 9

```text
AI
Patient Summary
Clinical Chat
Prescription Draft
```

## Sprint 10

```text
Reports
Notifications
Analytics
Files
```

## Sprint 11

```text
Offline
Caching
Sync foundation
Advanced UX
```

## Sprint 12

```text
Security
Performance
Testing
Production hardening
Release
```

---

# 50. Definition of Ready

A frontend ticket is Ready when:

```text
[ ] UX requirement exists
[ ] API endpoint identified
[ ] Request schema known
[ ] Response schema known
[ ] Permission identified
[ ] Navigation identified
[ ] Acceptance criteria defined
```

---

# 51. Definition of Done

A frontend ticket is Done when:

```text
[ ] Code implemented
[ ] Architecture followed
[ ] API integrated
[ ] Validation implemented
[ ] Loading state implemented
[ ] Error state implemented
[ ] Empty state implemented
[ ] Localization implemented
[ ] Permission behavior implemented
[ ] Tests written
[ ] Code reviewed
[ ] flutter analyze passes
[ ] Formatting passes
```

---

# 52. Frontend Jira Task Hierarchy

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
EPIC: Patient Management

Story:
Implement patient registration

Tasks:
PAT-001 Create Patient Entity
PAT-002 Create Patient DTO
PAT-003 Implement Repository
PAT-004 Implement API
PAT-005 Implement Provider
PAT-006 Implement Controller
PAT-007 Implement Registration UI
PAT-008 Implement Validation
PAT-009 Add Tests
```

---

# 53. Recommended Ticket Naming

Use:

```text
[FE-AUTH] Implement login repository
[FE-PATIENT] Implement patient search
[FE-QUEUE] Implement queue check-in
[FE-CONSULT] Implement encounter workspace
[FE-RX] Implement prescription finalization
[FE-AI] Implement AI prescription draft
```

---

# 54. Development Priority

## P0

```text
Auth
Chamber
Staff
Patient
Appointment
Queue
Consultation
Prescription
Payment
```

## P1

```text
Reports
Notifications
AI
Analytics
Favorites
Timeline
```

## P2

```text
Offline
Sync
Voice
Advanced analytics
Patient portal
Telemedicine
```

---

# 55. MVP Frontend Release Criteria

The MVP is ready when a doctor can complete:

```text
Login
 ↓
Chamber
 ↓
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
Prescription
 ↓
Payment
 ↓
Receipt
```

without requiring another application.

---

# 56. Frontend Architecture Completion Criteria

Before implementation begins, the following must exist:

```text
✓ Product Requirements
✓ Functional Specification
✓ MVP/Advanced Matrix
✓ UX/UI Specification
✓ Backend Architecture
✓ Database Architecture
✓ Migration/Seed Strategy
✓ Backend Project Structure
✓ Backend Sprint Plan
✓ API Contract
✓ Frontend Sprint Plan
✓ Frontend Architecture
✓ Frontend Feature Specification
```

---

# 57. Remaining Engineering Documents

The next documents should focus on implementation execution rather than further product design.

Recommended sequence:

### Document 17
**Complete Flutter API Integration Layer Specification**

Including:

- Dio configuration
- Interceptors
- DTO conventions
- Serialization
- Error mapping
- Token refresh
- Retry
- Idempotency
- Request IDs
- File upload
- API mocking
- API contract testing

### Document 18
**Complete Flutter Riverpod State Management Specification**

Including:

- Provider hierarchy
- AsyncNotifier patterns
- Controller patterns
- Form state
- Cache state
- Mutation state
- Cross-feature state
- Consultation state
- Error handling

### Document 19
**Complete Flutter UI Component & Design System Specification**

Including:

- Buttons
- Inputs
- Cards
- Dialogs
- Bottom sheets
- Clinical components
- Queue components
- Prescription components
- AI components
- Responsive layouts
- Accessibility

### Document 20
**Complete Flutter Testing Strategy & Test Case Specification**

Including:

- Unit tests
- Widget tests
- Integration tests
- E2E scenarios
- Mock APIs
- Test fixtures
- Clinical safety tests
- Permission tests
- Offline tests

---

# 58. Final Frontend Implementation Flow

```text
                 Product
                    │
                    ↓
                  UX/UI
                    │
                    ↓
              API Contract
                    │
                    ↓
          Frontend Architecture
                    │
                    ↓
        Feature Implementation
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      Domain      Data      Presentation
        │           │           │
        └───────────┼───────────┘
                    ↓
                 Riverpod
                    ↓
                   API
                    ↓
                 Testing
                    ↓
                 Staging
                    ↓
               Production
```

---

# 59. Final Engineering Principles

The Chamber Management frontend must be built around the following principles:

1. **Consultation is the center of the doctor experience.**
2. **Receptionist workflows must be extremely fast.**
3. **Chamber context must always be explicit.**
4. **Patient context must remain visible during clinical workflows.**
5. **Riverpod owns application state.**
6. **Repositories own data access.**
7. **Widgets do not contain business logic.**
8. **Backend authorization is authoritative.**
9. **Clinical records are treated as high-integrity data.**
10. **Finalized prescriptions are immutable from the frontend.**
11. **AI suggestions are always reviewable and clearly labeled.**
12. **AI never finalizes clinical decisions.**
13. **Critical mutations require server confirmation.**
14. **Idempotency must be used for retry-sensitive operations.**
15. **Bangla and English must be first-class languages.**
16. **Bangladesh-specific formatting must be centralized.**
17. **Offline capability must be designed into repository boundaries.**
18. **Sensitive clinical information must not appear in logs or analytics.**
19. **Critical clinical workflows require integration tests.**
20. **Frontend implementation should remain aligned with backend API contracts.**

---

# 60. Document Completion

Document 16 provides the implementation specification for the complete Flutter feature set.

At this point the project has a clear chain:

```text
PRD
 ↓
Functional Specification
 ↓
MVP / Advanced Matrix
 ↓
UX/UI Specification
 ↓
Backend Architecture
 ↓
Database Architecture
 ↓
Migration Strategy
 ↓
Backend Project Structure
 ↓
Backend Sprint Plan
 ↓
API Contract
 ↓
Frontend Sprint Plan
 ↓
Frontend Architecture
 ↓
Frontend Feature Specification
```

The project is now ready to move into the **engineering infrastructure and implementation-support documents**.

The next logical document is:

**Document 17 — Complete Flutter API Integration Layer Specification**, which will define exactly how the Flutter application communicates with the NestJS backend, including Dio, interceptors, token refresh, error mapping, DTO serialization, retries, idempotency, file uploads, API mocking, and contract testing.