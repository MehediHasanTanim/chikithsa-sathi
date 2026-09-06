# Document 20 — Complete Flutter Screen-by-Screen Implementation Specification

**Project:** AI Chamber & Prescription Management  
**Platform:** Flutter  
**Architecture:** Clean Architecture + Feature-First  
**State Management:** Riverpod  
**Routing:** GoRouter  
**Networking:** Dio  
**Persistence:** Hive + flutter_secure_storage  
**Serialization:** Freezed + json_serializable  
**Backend:** NestJS + PostgreSQL + Prisma  
**API:** REST `/api/v1`  
**Languages:** Bangla + English  
**Primary Market:** Bangladesh

---

# 1. Purpose

This document defines the implementation specification for every major Flutter screen in the Chamber Management application.

It connects:

```text
UX/UI Design
      ↓
Flutter Screen
      ↓
Riverpod Provider
      ↓
Controller / Notifier
      ↓
Use Case
      ↓
Repository
      ↓
API / Local Storage
```

For every screen, this document defines:

- route;
- purpose;
- user role;
- entry points;
- layout;
- components;
- Riverpod providers;
- API endpoints;
- user actions;
- navigation;
- validation;
- loading state;
- empty state;
- error state;
- offline state;
- permission behavior;
- responsive behavior;
- localization;
- acceptance criteria;
- testing requirements.

---

# 2. Product Navigation Architecture

## 2.1 Primary Routes

```text
/auth
/auth/login
/auth/register
/auth/verify-otp
/auth/forgot-password

/onboarding
/onboarding/profile
/onboarding/professional
/onboarding/verification
/onboarding/chamber
/onboarding/schedule
/onboarding/staff
/onboarding/ai
/onboarding/complete

/app
/app/dashboard
/app/appointments
/app/appointments/:id
/app/patients
/app/patients/:id
/app/patients/:id/timeline
/app/queue
/app/consultations/:encounterId
/app/prescriptions/:id
/app/reports
/app/payments
/app/notifications
/app/settings

/app/chambers
/app/chambers/:id
/app/chambers/:id/schedule
/app/chambers/:id/staff
```

---

# 3. Route Architecture

Recommended GoRouter structure:

```text
GoRouter
│
├── Auth Routes
│
├── Onboarding Routes
│
└── Protected App Shell
    │
    ├── Dashboard
    ├── Appointments
    ├── Patients
    ├── Queue
    ├── Reports
    ├── Notifications
    └── Settings
```

The application shell should be displayed only after:

```text
Authentication
+
User Profile
+
Selected Chamber
```

are resolved where required.

---

# 4. Global Screen Rules

Every screen must support, where applicable:

```text
Loading
Success
Empty
Error
Offline
Permission Restricted
```

Forms additionally support:

```text
Validation Error
Submitting
Saved
Unsaved Changes
```

---

# 5. Global Screen Structure

Recommended:

```text
AppScaffold
 └── ResponsiveLayout
      ├── AppAppBar
      ├── PageHeader
      ├── Content
      └── PrimaryAction
```

---

# 6. Global Provider Dependencies

Common providers:

```text
authSessionProvider
currentUserProvider
selectedChamberIdProvider
selectedChamberProvider
myPermissionsProvider
connectivityProvider
notificationsProvider
unreadNotificationCountProvider
appSettingsProvider
localeProvider
themeProvider
```

---

# 7. Screen Inventory

## Authentication

1. Splash
2. Login
3. Registration
4. OTP Verification
5. Forgot Password
6. Password Reset

## Onboarding

7. Profile
8. Professional Information
9. Verification
10. Chamber Creation
11. Schedule
12. Staff
13. AI Setup
14. Completion

## Main Application

15. Dashboard
16. Chamber Switcher
17. Global Search
18. Notifications

## Patients

19. Patient List
20. Patient Search
21. Patient Registration
22. Patient Details
23. Patient Timeline
24. Allergy Management
25. Condition Management

## Appointments

26. Appointment Calendar
27. Appointment List
28. Create Appointment
29. Appointment Details
30. Reschedule
31. Cancel Appointment

## Queue

32. Daily Queue
33. Queue Entry Details

## Consultation

34. Consultation Workspace
35. Vitals
36. Clinical Notes
37. Diagnosis
38. Investigation
39. Diagnostic Reports
40. Follow-up

## Prescription

41. Prescription Builder
42. Medicine Search
43. Medicine Editor
44. Prescription Review
45. Prescription Finalization
46. Prescription Preview
47. Prescription History

## Payments

48. Payment
49. Receipt
50. Refund

## AI

51. AI Patient Summary
52. AI Clinical Chat
53. AI Prescription Draft
54. AI Report Analysis
55. AI Request Status
56. AI Voice Note

## Reports

57. Reports Dashboard
58. Revenue Report
59. Patient Report
60. Appointment Report

## Administration

61. Doctor Profile
62. Professional Profile
63. Chamber Management
64. Schedule Management
65. Staff Management
66. Permission Management
67. Settings

---

# 8. Screen 1 — Splash Screen

## Route

```text
/
```

## Purpose

Initialize application state.

## Responsibilities

- restore authentication;
- initialize secure storage;
- load preferences;
- determine onboarding state;
- restore selected chamber;
- route to correct destination.

## Providers

```text
appBootstrapProvider
authSessionProvider
currentUserProvider
selectedChamberIdProvider
```

## Flow

```text
Launch
 ↓
Bootstrap
 ↓
Authentication?
 ├── No → Login
 └── Yes
      ↓
Onboarding complete?
 ├── No → Onboarding
 └── Yes → Dashboard
```

## Acceptance Criteria

- No authenticated user reaches protected screens without valid session.
- Existing session restores correctly.
- Expired session routes to login.
- Selected chamber is restored when valid.

---

# 9. Screen 2 — Login

## Route

```text
/auth/login
```

## Components

```text
AppTextField
PasswordField
AppButton
ForgotPasswordButton
```

## Provider

```text
authControllerProvider
authSessionProvider
```

## API

```text
POST /auth/login
GET /users/me
```

## Actions

```text
Login
Forgot Password
Create Account
```

## States

```text
Idle
Submitting
Success
Invalid Credentials
Network Error
Account Locked
```

## Acceptance Criteria

- Invalid credentials show useful error.
- Successful login stores credentials securely.
- User is routed according to onboarding state.
- Duplicate login taps are prevented.

---

# 10. Screen 3 — Registration

## Route

```text
/auth/register
```

## Fields

```text
Name
Phone
Email optional
Password
Confirm Password
```

## API

```text
POST /auth/register
```

## Provider

```text
registrationControllerProvider
```

## Validation

- valid phone;
- password requirements;
- matching passwords;
- required name.

---

# 11. Screen 4 — OTP Verification

## Route

```text
/auth/verify-otp
```

## Components

```text
OTPInput
ResendTimer
VerifyButton
```

## API

```text
POST /auth/verify-otp
POST /auth/resend-otp
```

## State

```text
Verifying
Verified
Invalid OTP
Expired OTP
Resending
```

---

# 12. Screen 5 — Forgot Password

## Route

```text
/auth/forgot-password
```

## API

```text
POST /auth/forgot-password
```

If this endpoint is introduced into the backend contract.

---

# 13. Screen 6 — Password Reset

## Route

```text
/auth/reset-password
```

Support:

```text
New Password
Confirm Password
```

---

# 14. Screen 7 — Doctor Profile Onboarding

## Route

```text
/onboarding/profile
```

## Fields

```text
Full Name
Profile Photo
Gender
Date of Birth
Phone
Email
Address
```

## Provider

```text
doctorProfileControllerProvider
doctorProfileProvider
```

## API

```text
PATCH /doctors/me
```

---

# 15. Screen 8 — Professional Information

## Route

```text
/onboarding/professional
```

## Fields

```text
Medical Degree
Specialization
BMDC Registration Number
Years of Experience
Professional Bio
```

## API

```text
PATCH /doctors/me/professional-profile
```

---

# 16. Screen 9 — Professional Verification

## Route

```text
/onboarding/verification
```

## Components

```text
VerificationStatusCard
DocumentUpload
SubmitButton
```

## API

```text
POST /verification/submit
GET /verification/status
```

## States

```text
Not Submitted
Submitted
Under Review
Approved
Rejected
Resubmission Required
```

---

# 17. Screen 10 — Chamber Creation

## Route

```text
/onboarding/chamber
```

## Fields

```text
Chamber Name
Address
Phone
Description
```

## API

```text
POST /chambers
```

## Provider

```text
chamberControllerProvider
```

---

# 18. Screen 11 — Schedule Setup

## Route

```text
/onboarding/schedule
```

## Features

- select weekdays;
- opening time;
- closing time;
- consultation duration;
- break;
- appointment capacity.

## API

```text
POST /chambers/:chamberId/schedules
```

---

# 19. Screen 12 — Staff Setup

## Route

```text
/onboarding/staff
```

## Features

```text
Invite Receptionist
Invite Assistant Doctor
Invite Billing Staff
```

## API

```text
POST /chambers/:chamberId/staff/invite
```

---

# 20. Screen 13 — AI Setup

## Route

```text
/onboarding/ai
```

Explain:

- AI patient summaries;
- clinical assistant;
- prescription drafting;
- report analysis;
- voice notes.

Important:

```text
AI assists doctors.
AI does not replace doctor judgment.
```

---

# 21. Screen 14 — Onboarding Complete

## Route

```text
/onboarding/complete
```

Show:

```text
Profile ✓
Verification ✓
Chamber ✓
Schedule ✓
Staff ✓
AI ✓
```

Primary action:

```text
Go to Dashboard
```

---

# 22. Screen 15 — Doctor Dashboard

## Route

```text
/app/dashboard
```

## Layout

```text
Header
Chamber Selector

Today's Summary
├── Patients
├── Appointments
├── Waiting
└── Revenue

Current Patient

Today's Queue

Upcoming Appointments

Alerts
```

## Providers

```text
dashboardProvider
todayQueueProvider
todayAppointmentsProvider
dashboardRevenueProvider
selectedChamberProvider
```

## APIs

```text
GET /analytics/dashboard
GET /queue/today
GET /appointments
```

---

# 23. Dashboard Role Variants

Doctor:

```text
Patients
Queue
Consultations
Revenue
AI
```

Receptionist:

```text
Appointments
Check-ins
Queue
Payments
```

Manager:

```text
Staff
Revenue
Reports
Analytics
```

---

# 24. Screen 16 — Chamber Switcher

## Trigger

Tap current chamber in AppBar.

## Provider

```text
chambersProvider
selectedChamberIdProvider
chamberSwitchControllerProvider
```

## API

```text
GET /chambers
```

## Switching Flow

```text
Select Chamber
↓
Persist ID
↓
Clear chamber-scoped UI state
↓
Invalidate chamber providers
↓
Load new chamber
↓
Refresh dashboard
```

---

# 25. Screen 17 — Global Search

## Route

```text
/app/search
```

## Search Categories

```text
Patients
Appointments
Prescriptions
Reports
```

## Provider

```text
globalSearchProvider
```

## Rules

- debounce 250–350 ms;
- cancel stale request;
- enforce permissions;
- preserve chamber context.

---

# 26. Screen 18 — Notifications

## Route

```text
/app/notifications
```

## Providers

```text
notificationsProvider
unreadNotificationCountProvider
notificationControllerProvider
```

## APIs

```text
GET /notifications
GET /notifications/unread-count
POST /notifications/:notificationId/read
POST /notifications/read-all
```

---

# 27. Screen 19 — Patient List

## Route

```text
/app/patients
```

## Layout

```text
Search

Filters

Patient List

Floating Action:
Register Patient
```

## Provider

```text
patientsProvider
```

## API

```text
GET /patients
```

## Features

- pagination;
- search;
- filtering;
- sorting;
- pull-to-refresh.

---

# 28. Screen 20 — Patient Search

## Component

```text
AppSearchField
PatientSearchResult
```

## Search Inputs

```text
Name
Bangla Name
Phone
Patient ID
```

## API

```text
GET /patients/search
```

## Acceptance Criteria

- stale search responses cannot overwrite current results;
- minimum query length respected;
- loading indicator shown;
- no-result state shown.

---

# 29. Screen 21 — Patient Registration

## Route

```text
/app/patients/new
```

## Fields

```text
Name
Bangla Name
Phone
Date of Birth/Age
Gender
Address
Emergency Contact
```

## API

```text
POST /patients
```

## Duplicate Detection

If potential duplicate:

```text
Possible Existing Patient

Rahim Ahmed
01712...
PID-000123

[Open Existing]
[Create Anyway]
```

---

# 30. Screen 22 — Patient Details

## Route

```text
/app/patients/:id
```

## Provider

```text
patientDetailsProvider(patientId)
```

## API

```text
GET /patients/:patientId
GET /patients/:patientId/allergies
GET /patients/:patientId/conditions
```

## Layout

```text
Patient Header
Allergies
Conditions
Latest Visit
Vitals
Timeline
Prescriptions
Reports
```

---

# 31. Screen 23 — Patient Timeline

## Route

```text
/app/patients/:id/timeline
```

## Provider

```text
patientTimelineProvider(patientId)
```

## API

```text
GET /patients/:patientId/timeline
```

Timeline items:

```text
Consultation
Prescription
Investigation
Report
Payment
Follow-up
```

---

# 32. Screen 24 — Allergy Management

## API

```text
GET /patients/:patientId/allergies
POST /patients/:patientId/allergies
DELETE /patients/:patientId/allergies/:allergyId
```

## UX

Critical allergies should be visible immediately.

---

# 33. Screen 25 — Condition Management

## API

```text
GET /patients/:patientId/conditions
POST /patients/:patientId/conditions
```

---

# 34. Screen 26 — Appointment Calendar

## Route

```text
/app/appointments
```

## Providers

```text
appointmentCalendarProvider
appointmentsProvider
```

## API

```text
GET /appointments
```

## Views

```text
Day
Week
Month
```

Mobile defaults to Day.

---

# 35. Screen 27 — Appointment List

Display:

```text
Time
Patient
Type
Status
Actions
```

Filters:

```text
Today
Upcoming
Completed
Cancelled
No Show
```

---

# 36. Screen 28 — Create Appointment

## Route

```text
/app/appointments/new
```

## Fields

```text
Patient
Date
Time
Appointment Type
Notes
```

## API

```text
POST /appointments
```

## Validation

- valid patient;
- valid chamber;
- available slot;
- required date/time.

---

# 37. Screen 29 — Appointment Details

## Route

```text
/app/appointments/:id
```

## Provider

```text
appointmentDetailsProvider(appointmentId)
```

## Actions

```text
Confirm
Reschedule
Cancel
Check In
```

---

# 38. Screen 30 — Reschedule Appointment

## API

```text
POST /appointments/:appointmentId/reschedule
```

Must display available schedule.

---

# 39. Screen 31 — Cancel Appointment

## API

```text
POST /appointments/:appointmentId/cancel
```

Confirmation should explain consequences.

---

# 40. Screen 32 — Daily Queue

## Route

```text
/app/queue
```

## Provider

```text
todayQueueProvider
queueControllerProvider
```

## API

```text
GET /queue/today
POST /queue/check-in
POST /queue/:id/call
POST /queue/:id/recall
POST /queue/:id/skip
POST /queue/:id/start
POST /queue/:id/complete
```

## Layout

```text
Current Patient

Queue Summary

Waiting
Called
In Consultation
Completed
```

---

# 41. Queue Mutation Rule

All queue actions are server-confirmed.

```text
Tap Call
↓
Submitting
↓
Server Response
↓
Update Queue
```

Never optimistically mark a patient as called.

---

# 42. Screen 33 — Queue Entry Details

Display:

```text
Queue Number
Patient
Appointment
Wait Time
Status
```

Actions depend on state and permission.

---

# 43. Screen 34 — Consultation Workspace

## Route

```text
/app/consultations/:encounterId
```

## Most Important Screen

## Layout

```text
Patient Header
Allergy Banner

Vitals

Clinical Notes

Diagnosis

Investigations

Prescription

AI Assistant

Follow-up

Complete Consultation
```

## Providers

```text
consultationWorkspaceProvider(encounterId)
consultationDraftControllerProvider(encounterId)
vitalsProvider(encounterId)
diagnosesProvider(encounterId)
investigationsProvider(encounterId)
prescriptionProvider(encounterId)
```

---

# 44. Consultation APIs

```text
GET /encounters/:id
PATCH /encounters/:id
POST /encounters/:id/start
POST /encounters/:id/ready-for-review
POST /encounters/:id/complete
POST /encounters/:id/lock
```

---

# 45. Consultation State

```text
Loading
Ready
Saving
Save Failed
Ready For Review
Completing
Completed
Locked
Offline
```

---

# 46. Consultation Autosave

Changes should:

```text
Update Local State
↓
Mark Dirty
↓
Debounce
↓
Save Draft
↓
Show Saved
```

Recommended debounce:

```text
500–1500 ms
```

---

# 47. Screen 35 — Vitals

## Component

```text
VitalsSection
VitalInput
VitalCard
```

Fields:

```text
Blood Pressure
Pulse
Temperature
Weight
Height
SpO2
BMI
```

## API

```text
POST /encounters/:id/vitals
GET /encounters/:id/vitals
PATCH /vitals/:id
GET /patients/:patientId/vitals
```

---

# 48. Screen 36 — Clinical Notes

## Sections

```text
Chief Complaint
History
Examination
Assessment
Plan
Additional Notes
```

## API

```text
POST /encounters/:id/notes
GET /encounters/:id/notes
PATCH /notes/:id
```

---

# 49. Screen 37 — Diagnosis

## Provider

```text
diagnosisSearchProvider(query)
encounterDiagnosesProvider(encounterId)
diagnosisControllerProvider(encounterId)
```

## API

```text
GET /diagnoses/search
POST /encounters/:id/diagnoses
DELETE /encounters/:id/diagnoses/:diagnosisId
```

---

# 50. Screen 38 — Investigation

## Provider

```text
investigationCatalogProvider
encounterInvestigationsProvider(encounterId)
```

## API

```text
GET /investigations/catalog
POST /encounters/:id/investigations
GET /encounters/:id/investigations
PATCH /investigations/:id
```

---

# 51. Screen 39 — Diagnostic Reports

## API

```text
POST /encounters/:id/reports
GET /encounters/:id/reports
GET /reports/:id
```

## Components

```text
DiagnosticReportCard
FileUpload
ReportPreview
```

---

# 52. Screen 40 — Follow-Up

Follow-up options:

```text
No Follow-up
Follow-up Date
Follow-up Instructions
```

This may be part of the consultation screen rather than a separate route.

---

# 53. Screen 41 — Prescription Builder

## Route

```text
/app/consultations/:encounterId/prescription
```

## Providers

```text
prescriptionProvider(prescriptionId)
prescriptionDraftControllerProvider(encounterId)
prescriptionItemsProvider(prescriptionId)
```

## Layout

```text
Prescription Header

Diagnosis

Medicines

+ Add Medicine

Instructions

Follow-up

Review Prescription
```

---

# 54. Prescription API

```text
POST /encounters/:id/prescriptions
GET /prescriptions/:id
PATCH /prescriptions/:id
POST /prescriptions/:id/items
PATCH /prescriptions/:id/items/:itemId
DELETE /prescriptions/:id/items/:itemId
POST /prescriptions/:id/review
POST /prescriptions/:id/finalize
```

---

# 55. Screen 42 — Medicine Search

## Provider

```text
medicineSearchProvider(query)
medicineFavoritesProvider
```

## API

```text
GET /medicines/search
GET /medicines/:id
GET /doctors/me/medicine-favorites
```

## Search

- debounce;
- cancel previous request;
- recent medicines;
- favorites.

---

# 56. Screen 43 — Medicine Editor

Fields:

```text
Medicine
Strength
Dose
Frequency
Duration
Instructions
```

Example:

```text
Napa
500 mg

1 tablet
3 times daily
5 days
After meal
```

---

# 57. Screen 44 — Prescription Review

Show complete prescription.

Required warning:

```text
Review all medicines, dosage and instructions
before finalizing.
```

AI-generated items must remain clearly labeled.

---

# 58. Screen 45 — Prescription Finalization

## State

```text
Ready
Finalizing
Success
Failure
```

## Rules

- no optimistic finalization;
- server confirmation required;
- prevent duplicate requests;
- finalized prescription becomes read-only.

---

# 59. Finalization Flow

```text
Review
↓
Validate
↓
Confirm
↓
POST /prescriptions/:id/finalize
↓
Server confirms
↓
FINALIZED
↓
Read-only UI
```

---

# 60. Screen 46 — Prescription Preview

Display final document.

Actions:

```text
View
Download
Share where permitted
Print where supported
```

API:

```text
GET /prescriptions/:id/preview
GET /prescriptions/:id/pdf
```

---

# 61. Screen 47 — Prescription History

Display:

```text
Prescription Version
Created Date
Status
Amendment History
```

API:

```text
GET /prescriptions/:id/history
```

Finalized records remain immutable.

---

# 62. Screen 48 — Payment

## Route

```text
/app/payments/new
```

## Provider

```text
paymentControllerProvider
paymentFormProvider
```

## API

```text
POST /payments
```

## Fields

```text
Amount
Discount
Payment Method
Notes
```

---

# 63. Payment Safety

Payment success must never be optimistic.

```text
Submitting
↓
Server
↓
Confirmed
```

Use precise decimal/string representation for money.

---

# 64. Screen 49 — Receipt

## Provider

```text
receiptProvider(paymentId)
```

## API

```text
GET /payments/:paymentId/receipt
```

Display:

```text
Receipt Number
Patient
Doctor
Chamber
Service
Amount
Payment Method
Date
```

---

# 65. Screen 50 — Refund

## API

```text
POST /payments/:paymentId/refund
```

Requires:

- permission;
- amount;
- reason;
- confirmation.

---

# 66. Screen 51 — AI Patient Summary

## Route

```text
/app/ai/patient-summary/:encounterId
```

## Provider

```text
aiPatientSummaryProvider(encounterId)
```

## API

```text
POST /ai/patient-summary
```

## States

```text
Idle
Generating
Success
Review Required
Error
```

---

# 67. AI Summary UI

Example:

```text
AI Patient Summary

Patient has a history of...

AI Generated
Review Required

[Add to Notes]
```

The AI result is not automatically inserted.

---

# 68. Screen 52 — AI Clinical Chat

## Provider

```text
aiClinicalChatControllerProvider(conversationId)
```

## API

```text
POST /ai/clinical-chat
```

## Features

- conversation;
- context-aware questions;
- clear conversation;
- retry;
- loading.

---

# 69. AI Chat Safety

AI responses must remain clearly separate from official clinical records.

No automatic persistence into:

```text
Diagnosis
Clinical Notes
Prescription
```

---

# 70. Screen 53 — AI Prescription Draft

## API

```text
POST /ai/prescription-draft
```

## Provider

```text
aiPrescriptionDraftControllerProvider(encounterId)
```

## UI

```text
AI Prescription Suggestion

Medicine
Dose
Frequency
Duration

AI Generated
Review Required

[Review Draft]
```

---

# 71. AI Prescription Flow

```text
Doctor requests AI draft
↓
AI generates suggestion
↓
Doctor reviews
↓
Doctor edits
↓
Doctor explicitly adds to prescription draft
↓
Doctor reviews final prescription
↓
Doctor finalizes
```

AI cannot call:

```text
finalizePrescription()
```

---

# 72. Screen 54 — AI Report Analysis

## Route

```text
/app/ai/report-analysis/:reportId
```

## API

```text
POST /ai/report-analysis
```

## Provider

```text
aiReportAnalysisProvider(reportId)
```

---

# 73. Screen 55 — AI Request Status

## API

```text
GET /ai/requests/:requestId
```

Used for asynchronous AI processing.

## State

```text
Submitting
Processing
Completed
Failed
Cancelled
```

Polling must stop on terminal state.

---

# 74. Screen 56 — AI Voice Note

Future feature.

## Flow

```text
Start Recording
↓
Stop
↓
Upload Audio
↓
Transcription
↓
AI Generated Transcript
↓
Doctor Review
↓
Insert into Notes
```

API:

```text
POST /ai/voice-note
```

when available.

---

# 75. Screen 57 — Reports Dashboard

## Route

```text
/app/reports
```

## Providers

```text
analyticsDashboardProvider
```

## API

```text
GET /analytics/dashboard
```

Display:

```text
Patients
Appointments
Consultations
Revenue
Follow-ups
```

---

# 76. Screen 58 — Revenue Report

## API

```text
GET /analytics/revenue
```

Filters:

```text
Today
This Week
This Month
Custom Range
```

Display:

```text
Total Revenue
Paid
Refunded
Average Consultation Fee
```

---

# 77. Screen 59 — Patient Report

## API

```text
GET /analytics/patients
```

Display:

```text
New Patients
Returning Patients
Total Visits
Patient Growth
```

---

# 78. Screen 60 — Appointment Report

## API

```text
GET /analytics/appointments
```

Display:

```text
Booked
Completed
Cancelled
No Show
Utilization
```

---

# 79. Screen 61 — Doctor Profile

## Route

```text
/app/settings/profile
```

## API

```text
GET /doctors/me
PATCH /doctors/me
```

---

# 80. Screen 62 — Professional Profile

## API

```text
GET /doctors/me/professional-profile
PATCH /doctors/me/professional-profile
```

---

# 81. Screen 63 — Chamber Management

## Route

```text
/app/chambers
```

## Provider

```text
chambersProvider
chamberControllerProvider
```

## API

```text
GET /chambers
POST /chambers
GET /chambers/:id
PATCH /chambers/:id
POST /chambers/:id/activate
POST /chambers/:id/deactivate
```

---

# 82. Screen 64 — Schedule Management

## Route

```text
/app/chambers/:id/schedule
```

## API

```text
GET /chambers/:id/schedules
POST /chambers/:id/schedules
PATCH /schedules/:id
DELETE /schedules/:id
```

---

# 83. Screen 65 — Staff Management

## Route

```text
/app/chambers/:id/staff
```

## Provider

```text
staffProvider(chamberId)
staffControllerProvider
```

## API

```text
GET /chambers/:id/staff
POST /chambers/:id/staff/invite
PATCH /staff/:membershipId
DELETE /staff/:membershipId
POST /staff/:membershipId/resend-invitation
```

---

# 84. Screen 66 — Permission Management

## API

```text
GET /chambers/:id/permissions
GET /chambers/:id/my-permissions
```

Display permission groups:

```text
Patients
Appointments
Queue
Clinical
Prescription
Payments
Reports
Staff
Settings
```

---

# 85. Screen 67 — Settings

## Sections

```text
Profile
Chamber
Schedule
Staff
Permissions
Notifications
Language
Theme
Security
About
Logout
```

---

# 86. Shared Screen: Appointment → Queue

When staff checks in:

```text
Appointment
↓
Check In
↓
POST /queue/check-in
↓
Queue Entry
↓
Queue Screen
```

Invalidate:

```text
appointmentProvider
queueProvider
```

---

# 87. Shared Screen: Queue → Consultation

```text
Queue
↓
Start
↓
POST /queue/:id/start
↓
Encounter
↓
Consultation
```

Invalidate:

```text
queueProvider
encounterProvider
```

---

# 88. Shared Screen: Consultation → Prescription

```text
Consultation
↓
Prescription
↓
Draft
↓
Review
↓
Finalize
```

---

# 89. Shared Screen: Consultation → Payment

```text
Complete Consultation
↓
Payment
↓
Record Payment
↓
Receipt
```

---

# 90. Shared Screen: Patient → Consultation

Patient profile should provide:

```text
Start Consultation
Book Appointment
View Timeline
View Prescriptions
View Reports
```

---

# 91. Shared Patient Context

Patient-related screens should reuse:

```text
PatientHeader
PatientContextBar
AllergyBanner
```

---

# 92. Global Loading Standard

Use:

```text
Skeleton
```

for initial list/content loading.

Use:

```text
ProgressIndicator
```

for short mutations.

Avoid full-screen loaders after data is already visible.

---

# 93. Global Error Standard

Every API error should map to:

```text
Human-readable message
Retry
Optional action
```

Never expose raw backend exceptions.

---

# 94. Global Empty State Standard

Every list must define:

```text
Icon/illustration
Message
Optional explanation
Primary action
```

---

# 95. Global Offline Standard

If offline:

```text
Cached data → display
Critical server mutation → block
Draft editing → allow only where explicitly supported
```

---

# 96. Navigation Guards

Navigation guards are required for:

- unsaved consultation;
- prescription editing;
- important forms.

Example:

```text
Unsaved Changes

Your consultation contains unsaved changes.

[Stay]
[Discard]
```

---

# 97. Permission Matrix

| Feature | Doctor | Assistant | Receptionist | Billing | Manager |
|---|---:|---:|---:|---:|---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Patient | ✓ | ✓ | ✓ | Limited | ✓ |
| Appointment | ✓ | ✓ | ✓ | Limited | ✓ |
| Queue | ✓ | ✓ | ✓ | Limited | ✓ |
| Clinical Notes | ✓ | ✓ | Configurable | ✗ | Configurable |
| Diagnosis | ✓ | ✓ | ✗ | ✗ | Configurable |
| Prescription | ✓ | ✓ | ✗ | ✗ | Configurable |
| Payment | ✓ | Configurable | ✓ | ✓ | ✓ |
| Reports | ✓ | Configurable | Limited | ✓ | ✓ |
| Staff | ✓ | ✗ | ✗ | ✗ | ✓ |
| Settings | ✓ | ✗ | ✗ | ✗ | ✓ |

Backend remains authoritative.

---

# 98. Provider-to-Screen Mapping

| Screen | Primary Providers |
|---|---|
| Splash | appBootstrap, authSession |
| Login | authController |
| Dashboard | dashboard, queue, appointments |
| Patients | patients |
| Patient Details | patientDetails, timeline |
| Appointments | appointments, calendar |
| Queue | todayQueue, queueController |
| Consultation | consultationWorkspace, draft |
| Vitals | vitals |
| Diagnosis | diagnoses |
| Investigation | investigations |
| Prescription | prescription, medicineSearch |
| Payment | paymentController |
| Reports | analytics |
| AI Summary | aiPatientSummary |
| AI Chat | aiClinicalChat |
| Notifications | notifications |
| Chamber | chambers |
| Staff | staff |

---

# 99. Provider Family Rules

Use families for resource IDs:

```text
patientDetailsProvider(patientId)
patientTimelineProvider(patientId)
appointmentDetailsProvider(appointmentId)
encounterProvider(encounterId)
prescriptionProvider(prescriptionId)
receiptProvider(paymentId)
reportProvider(reportId)
```

This prevents unrelated resources from sharing state.

---

# 100. Chamber Isolation

Every chamber-scoped provider must depend on:

```text
chamberId
```

or selected chamber context.

Bad:

```text
appointmentsProvider
```

if it can accidentally aggregate multiple chambers.

Better:

```text
appointmentsProvider(chamberId)
```

or derive the chamber from an explicitly controlled selected-chamber provider.

---

# 101. Cache Rules

Recommended:

```text
Session                 Keep Alive
Selected Chamber        Keep Alive
Patient List             Auto Dispose
Patient Details          Auto Dispose
Search                   Auto Dispose
Queue                    Auto Dispose
Appointments             Auto Dispose
Analytics                Auto Dispose
Consultation Draft       Keep Alive while active
Prescription Draft       Keep Alive while editing
AI Chat                  Scoped
```

---

# 102. Invalidation Rules

## Check-in

Invalidate:

```text
queue
appointment
dashboard
```

## Queue Start

Invalidate:

```text
queue
encounter
```

## Consultation Complete

Invalidate:

```text
encounter
queue
dashboard
patientTimeline
```

## Prescription Finalize

Invalidate:

```text
prescription
encounter
patientTimeline
```

## Payment

Invalidate:

```text
payment
receipt
dashboard
revenue
```

---

# 103. Avoid Global Invalidation

Do not use:

```dart
ref.invalidateAll();
```

or equivalent broad refresh strategies after normal mutations.

Use targeted invalidation.

---

# 104. Search Architecture

Search screens should follow:

```text
Input
↓
Debounce
↓
Cancel previous request
↓
Request
↓
Generation/latest-query validation
↓
Display
```

---

# 105. Pagination

All large lists should support cursor pagination where backend supports it.

Examples:

```text
Patients
Appointments
Notifications
Timeline
Reports
Audit Logs
```

---

# 106. Pull-to-Refresh

Supported on:

```text
Dashboard
Patients
Appointments
Queue
Notifications
Reports
```

Refresh must not discard unsaved form state.

---

# 107. Background Refresh

Appropriate for:

```text
Dashboard
Queue
Appointments
Notifications
```

Do not refresh aggressively while the user is actively editing clinical records.

---

# 108. App Lifecycle

On app resume:

```text
Check session
Check connectivity
Refresh selected chamber data where appropriate
Refresh queue/dashboard if stale
```

Do not automatically reload an active consultation and overwrite local draft state.

---

# 109. Deep Linking

Supported examples:

```text
/app/patients/:patientId
/app/appointments/:appointmentId
/app/consultations/:encounterId
/app/prescriptions/:prescriptionId
```

Before displaying data:

```text
Authenticate
↓
Verify chamber membership
↓
Verify permission
↓
Load resource
```

---

# 110. Screen-Level Analytics

Track meaningful events:

```text
patient_registered
appointment_created
patient_checked_in
consultation_started
prescription_finalized
payment_recorded
ai_summary_generated
ai_draft_applied
```

Never include clinical payloads.

---

# 111. Security Requirements

Screens must never expose:

```text
Access tokens
Refresh tokens
Sensitive API credentials
Internal error details
```

Sensitive clinical data must not be written to ordinary logs.

---

# 112. Screen Performance

Target:

```text
Smooth scrolling
Fast navigation
No unnecessary rebuilds
No repeated network requests
```

Use:

```text
const widgets
select()
family providers
pagination
lazy lists
cached images
```

where appropriate.

---

# 113. Responsive Screen Rules

## Mobile

```text
Single column
Bottom navigation
Bottom sheets
Sticky actions
```

## Tablet

```text
Two-column layouts
Navigation rail
Expanded consultation
```

## Desktop

```text
Sidebar
Multi-column
Persistent contextual panels
Keyboard shortcuts
```

---

# 114. Consultation Desktop

```text
┌────────────┬─────────────────────────┬──────────────┐
│ Patient    │ Clinical Workspace      │ AI Assistant │
│ Context    │                         │              │
│            │ Vitals                  │ Summary      │
│ Timeline   │ Notes                   │ Chat         │
│            │ Diagnosis               │ Suggestions  │
│            │ Prescription            │              │
└────────────┴─────────────────────────┴──────────────┘
```

---

# 115. Consultation Mobile

```text
Patient Header
↓
Allergies
↓
Vitals
↓
Notes
↓
Diagnosis
↓
Investigations
↓
Prescription
↓
AI
↓
Follow-up
↓
Complete
```

---

# 116. Accessibility

Every screen must support:

```text
Screen readers
Large text
Keyboard navigation
Focus management
Semantic labels
Minimum touch targets
Contrast
```

---

# 117. Localization

All user-visible text must be localized.

Support:

```text
English
বাংলা
```

Test mixed-language content.

---

# 118. Clinical Alert Accessibility

Do not communicate:

```text
Allergy = red
```

only through color.

Use:

```text
Icon
Text
Severity
```

---

# 119. Prescription Accessibility

Medicine information should be read logically:

```text
Medicine
Strength
Dose
Frequency
Duration
Instructions
```

---

# 120. Error Recovery

For clinical drafts:

```text
Save Failed
↓
Keep local state
↓
Retry
```

Never:

```text
Save Failed
↓
Clear form
```

---

# 121. AI Error Recovery

AI failures must leave clinical data unchanged.

Example:

```text
AI unavailable.

Your consultation data is safe.

[Try Again]
```

---

# 122. Permission Error

Example:

```text
You don't have permission to perform this action.
```

Offer an appropriate alternative where possible.

---

# 123. Session Expiry During Consultation

If session expires:

```text
Preserve local draft
↓
Authenticate again
↓
Restore consultation
↓
Retry save
```

where technically supported.

---

# 124. Offline Consultation

If explicitly enabled:

```text
Offline
↓
Continue editing local draft
↓
Display "Not synced"
↓
Sync when connection returns
```

Critical finalization actions still require server confirmation.

---

# 125. Prescription Offline

Draft editing may be allowed.

Finalization requires:

```text
Online
+
Server confirmation
```

---

# 126. Payment Offline

Payment recording should require server connectivity unless a future offline financial architecture explicitly supports safe reconciliation.

---

# 127. Queue Offline

Queue state transitions require server connectivity.

---

# 128. Testing Strategy

Testing layers:

```text
Unit
↓
Provider
↓
Widget
↓
Integration
↓
E2E
```

---

# 129. Unit Tests

Test:

- validators;
- mappers;
- use cases;
- state transitions;
- formatters;
- permission helpers.

---

# 130. Provider Tests

Test:

```text
Loading
Success
Error
Retry
Invalidation
Mutation
Disposal
Family parameters
```

---

# 131. Authentication Tests

Test:

```text
Login success
Login failure
OTP success
OTP failure
Session restore
Session expiry
Logout
Refresh token
```

---

# 132. Chamber Tests

Test:

```text
Load chambers
Select chamber
Persist chamber
Switch chamber
Clear old state
Reload new chamber
```

Critical test:

```text
Chamber A data must never appear
after switching to Chamber B.
```

---

# 133. Patient Tests

Test:

```text
Search
Pagination
Duplicate detection
Create
Update
Timeline
Allergies
Conditions
```

---

# 134. Appointment Tests

Test:

```text
Create
Confirm
Reschedule
Cancel
Check-in
```

---

# 135. Queue Tests

Test:

```text
Check-in
Call
Recall
Skip
Start
Complete
Failure
Concurrent mutation
```

---

# 136. Consultation Tests

Test:

```text
Load
Start
Edit notes
Autosave
Save failure
Retry
Diagnosis
Vitals
Investigation
Complete
Lock
```

---

# 137. Prescription Tests

Test:

```text
Create draft
Add medicine
Edit medicine
Delete medicine
AI suggestion
Review
Finalize
Finalized read-only
Amendment
```

---

# 138. Payment Tests

Test:

```text
Create payment
Duplicate prevention
Failure
Receipt
Refund
```

---

# 139. AI Tests

Test:

```text
Request
Processing
Polling
Success
Error
Retry
AI labeling
Review required
Explicit apply
```

Critical:

```text
AI must never finalize a prescription.
```

---

# 140. Widget Tests

High-priority widgets:

```text
PatientHeader
AllergyBanner
QueueCard
AppointmentCard
MedicineCard
PrescriptionReview
AIResponseCard
PaymentSummary
StatusBadge
```

---

# 141. Golden Tests

Required for major reusable components and important screen states.

---

# 142. Integration Tests

Examples:

```text
Login → Dashboard
Register Patient → Patient Profile
Appointment → Check-in → Queue
Queue → Consultation
Consultation → Prescription
Prescription → Payment
```

---

# 143. Critical E2E Flow

The highest-priority E2E scenario:

```text
Login
 ↓
Select Chamber
 ↓
Create/Select Patient
 ↓
Create Appointment
 ↓
Check In
 ↓
Queue
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
Complete Consultation
 ↓
Record Payment
 ↓
Generate Receipt
```

---

# 144. Critical E2E AI Flow

```text
Open Consultation
↓
Request AI Summary
↓
AI Generates
↓
Review
↓
Explicitly Apply
↓
Verify Clinical Record
```

AI output must not appear as doctor-authored without explicit action.

---

# 145. Critical Multi-Chamber E2E

```text
Login
↓
Chamber A
↓
View Queue
↓
Switch Chamber B
↓
Verify Queue B
↓
Verify Appointments B
↓
Verify Patients B
↓
Verify Dashboard B
```

---

# 146. Definition of Ready

A screen is Ready for Development when:

```text
□ UX flow approved
□ UI design approved
□ Components identified
□ Route defined
□ API defined
□ Provider defined
□ Permissions defined
□ Loading state defined
□ Empty state defined
□ Error state defined
□ Offline behavior defined
□ Localization defined
□ Acceptance criteria defined
```

---

# 147. Definition of Done

A screen is Done when:

```text
□ Flutter implementation complete
□ Riverpod integration complete
□ API integration complete
□ Navigation complete
□ Validation complete
□ Loading state complete
□ Empty state complete
□ Error state complete
□ Offline state complete where relevant
□ Permission handling complete
□ Bangla verified
□ English verified
□ Responsive verified
□ Accessibility verified
□ Tests complete
□ QA approved
```

---

# 148. MVP Screen Scope

MVP must include:

```text
Splash
Login
Registration
OTP
Onboarding
Dashboard
Chamber
Staff
Patient List
Patient Registration
Patient Details
Appointments
Queue
Consultation
Vitals
Diagnosis
Investigation
Prescription
Prescription Review
Prescription Finalization
Payment
Receipt
Basic Reports
Basic AI
Settings
```

---

# 149. Phase 2 Screens

```text
Advanced Patient Timeline
Advanced Reports
AI Clinical Chat
AI Report Analysis
AI Voice Notes
Advanced Notifications
Offline UI
Sync UI
Advanced Analytics
Advanced Staff Management
```

---

# 150. Phase 3 Screens

```text
Patient Portal
Telemedicine
Lab Integration
Pharmacy Integration
Referral Network
Insurance
Marketplace
Advanced Predictive Analytics
```

---

# 151. Sprint 1 — Foundation

Screens/components:

```text
Splash
AppScaffold
AppAppBar
Navigation
Theme
Localization
Responsive Layout
Global Error
Global Loading
```

---

# 152. Sprint 2 — Authentication & Onboarding

```text
Login
Registration
OTP
Password Recovery
Profile
Professional Info
Verification
Chamber Setup
Schedule
Staff
AI Setup
Completion
```

---

# 153. Sprint 3 — Doctor, Chamber & Staff

```text
Dashboard
Chamber Switcher
Doctor Profile
Professional Profile
Chamber Management
Schedule
Staff
Permissions
```

---

# 154. Sprint 4 — Patient Management

```text
Patient List
Patient Search
Patient Registration
Patient Details
Timeline
Allergies
Conditions
```

---

# 155. Sprint 5 — Appointment & Queue

```text
Calendar
Appointment List
Appointment Details
Create Appointment
Reschedule
Cancel
Queue
Queue Entry
```

---

# 156. Sprint 6 — Consultation

```text
Consultation Workspace
Vitals
Notes
Diagnosis
Investigation
Reports
Follow-up
```

---

# 157. Sprint 7 — Prescription

```text
Prescription Builder
Medicine Search
Medicine Editor
Favorites
Review
Finalization
Preview
History
```

---

# 158. Sprint 8 — Payment

```text
Payment
Receipt
Refund
Revenue Summary
```

---

# 159. Sprint 9 — AI

```text
AI Summary
AI Clinical Chat
AI Prescription Draft
AI Processing
AI Review
```

---

# 160. Sprint 10 — Reports & Notifications

```text
Reports Dashboard
Revenue Report
Patient Report
Appointment Report
Notifications
File Upload
PDF Viewer
```

---

# 161. Sprint 11 — Offline & Advanced UX

```text
Offline State
Sync
Conflict Handling
Advanced Responsive Layout
Voice Note
Advanced Search
```

---

# 162. Sprint 12 — Production Hardening

```text
Accessibility
Golden Tests
E2E
Performance
Security
Dark Mode
Responsive QA
Localization QA
```

---

# 163. Jira Story Structure

Recommended hierarchy:

```text
EPIC: Flutter UI & Application

  STORY: Patient Management

    TASK: Patient List Screen
    TASK: Patient Search
    TASK: Patient Registration
    TASK: Patient Details

  STORY: Consultation

    TASK: Consultation Workspace
    TASK: Vitals
    TASK: Diagnosis
    TASK: Investigation
    TASK: Notes
```

---

# 164. Screen Naming Convention

Use:

```text
PatientListScreen
PatientDetailsScreen
PatientRegistrationScreen

AppointmentListScreen
AppointmentDetailsScreen

ConsultationWorkspaceScreen

PrescriptionBuilderScreen
PrescriptionReviewScreen
```

Avoid:

```text
PatientPage2
NewPatientPage
PatientNewScreen2
```

---

# 165. Widget Naming Convention

```text
PatientHeader
PatientCard
PatientTimeline
QueueCard
MedicineCard
PrescriptionReview
AIResponseCard
```

---

# 166. Controller Naming Convention

```text
PatientController
AppointmentController
QueueController
ConsultationDraftController
PrescriptionController
PaymentController
AIClinicalChatController
```

---

# 167. Provider Naming Convention

```text
patientDetailsProvider
patientTimelineProvider
appointmentDetailsProvider
todayQueueProvider
consultationWorkspaceProvider
prescriptionProvider
aiPatientSummaryProvider
```

---

# 168. Route Naming Convention

Use predictable resource-oriented routes:

```text
/patients
/patients/:id
/appointments
/appointments/:id
/consultations/:id
/prescriptions/:id
```

---

# 169. UI-to-API Mapping Example

For Patient Details:

```text
PatientDetailsScreen
        ↓
patientDetailsProvider(patientId)
        ↓
GetPatientDetailsUseCase
        ↓
PatientRepository
        ↓
GET /patients/:patientId
```

---

# 170. Mutation Mapping Example

Queue Call:

```text
QueueCard
 ↓
QueueController.call(entryId)
 ↓
CallQueueEntryUseCase
 ↓
QueueRepository
 ↓
POST /queue/:queueEntryId/call
 ↓
Response
 ↓
Invalidate Queue
```

---

# 171. Prescription Mapping Example

```text
PrescriptionReviewScreen
 ↓
PrescriptionController.finalize()
 ↓
FinalizePrescriptionUseCase
 ↓
PrescriptionRepository
 ↓
POST /prescriptions/:id/finalize
 ↓
Server Confirmation
 ↓
Read-only Finalized State
```

---

# 172. AI Mapping Example

```text
AI Summary Screen
 ↓
AIController.generate()
 ↓
GeneratePatientSummaryUseCase
 ↓
AIRepository
 ↓
POST /ai/patient-summary
 ↓
AI Result
 ↓
AI Generated / Review Required
 ↓
Explicit Apply
```

---

# 173. File Upload Mapping

```text
FileUploadWidget
 ↓
Request Upload URL
 ↓
POST /files/upload-url
 ↓
Upload directly to object storage
 ↓
POST /files/complete
 ↓
Display uploaded file
```

---

# 174. PDF Mapping

```text
PrescriptionPreviewScreen
 ↓
GET /prescriptions/:id/pdf
 ↓
Download bytes/file
 ↓
PDF Viewer
```

---

# 175. UI State Architecture

Recommended:

```text
Screen
 ↓
Riverpod
 ↓
AsyncValue / Freezed State
 ↓
Controller
 ↓
UseCase
 ↓
Repository
```

---

# 176. Async UI Pattern

```dart id="p6l7jy"
ref.watch(provider).when(
  loading: () => const AppSkeleton(),
  error: (error, stack) => AppErrorState(
    onRetry: () => ref.invalidate(provider),
  ),
  data: (data) => ScreenContent(data),
);
```

---

# 177. Mutation UI Pattern

```text
Idle
 ↓
Submitting
 ↓
Success / Failure
```

Primary button:

```text
Idle → enabled
Submitting → loading + disabled
Success → close/update
Failure → enabled + error
```

---

# 178. Screen-Level Provider Rule

A screen should not own unrelated global state.

For example:

```text
PatientDetailsScreen
```

should not directly manage:

```text
Payment
Queue
Global Notifications
```

unless those are explicitly part of its workflow.

---

# 179. Screen Composition Rule

Prefer composition:

```text
PatientDetailsScreen
 ├── PatientHeader
 ├── AllergySection
 ├── ConditionSection
 ├── LatestVisit
 ├── TimelinePreview
 └── PatientActions
```

rather than a single massive widget.

---

# 180. Maximum Screen Complexity

If a screen becomes excessively large:

```text
Split into sections
+
Extract widgets
+
Extract state controllers
```

The consultation screen is allowed to be complex but must remain modular.

---

# 181. Consultation Component Boundaries

```text
ConsultationWorkspace
├── PatientContext
├── VitalsSection
├── NotesSection
├── DiagnosisSection
├── InvestigationSection
├── PrescriptionSection
├── AISection
├── FollowUpSection
└── ConsultationActionBar
```

---

# 182. Prescription Component Boundaries

```text
PrescriptionBuilder
├── PrescriptionHeader
├── DiagnosisSummary
├── MedicineList
├── MedicineSearch
├── MedicineEditor
├── InstructionSection
├── FollowUpSection
└── PrescriptionActions
```

---

# 183. Queue Component Boundaries

```text
QueueScreen
├── QueueSummary
├── CurrentPatientCard
├── WaitingList
├── CalledList
├── ConsultationList
└── QueueActionBar
```

---

# 184. Patient Component Boundaries

```text
PatientDetails
├── PatientHeader
├── AllergyBanner
├── ConditionList
├── VitalSummary
├── TimelinePreview
├── PrescriptionPreview
└── PatientActions
```

---

# 185. Screen Security Principle

Every screen containing protected information must assume:

```text
Authentication
+
Chamber Access
+
Permission
+
Resource Access
```

The backend remains the final security authority.

---

# 186. Screen Data Freshness

Recommended:

```text
Queue        Very Short
Appointments Short
Patient      Moderate
Reports      Longer
Settings     Long
```

Clinical records should be refreshed carefully to avoid disrupting active editing.

---

# 187. Active Consultation Protection

While consultation is active:

```text
Do not automatically replace draft state
Do not aggressively refresh
Do not discard local edits
Do not navigate without confirmation
```

---

# 188. Finalized Prescription Protection

After finalization:

```text
No edit controls
No delete controls
Read-only state
Amendment workflow only
```

---

# 189. Financial Record Protection

After payment confirmation:

```text
Payment = immutable financial event
```

Corrections should use refund/amendment workflows rather than silently editing the original transaction.

---

# 190. AI Content Protection

AI content should always have:

```text
source = AI
reviewRequired = true
```

until explicitly reviewed/applied.

---

# 191. Doctor Authored Content

Doctor-authored clinical content should remain distinguishable from AI-generated suggestions.

---

# 192. Audit Visibility

Where useful:

```text
Created by
Updated by
Created at
Updated at
```

should be displayed.

---

# 193. Offline Data Security

On logout:

```text
Clear sensitive chamber-scoped cached data
Clear temporary patient data
Clear active consultation state unless securely persisted for recovery
```

Do not retain sensitive data indefinitely.

---

# 194. Error Boundary

Unexpected widget-level errors should be caught at an application boundary.

Provide:

```text
Something went wrong.

[Try Again]
```

without exposing stack traces.

---

# 195. Crash Recovery

After application crash during consultation:

```text
Reopen App
↓
Detect recoverable draft
↓
Show:
"Recover unsaved consultation?"
↓
Doctor chooses
```

if local draft recovery is implemented.

---

# 196. QA Matrix

Every P0 screen should be tested against:

```text
Android phone
iPhone
Tablet
Desktop
Light mode
Dark mode
English
Bangla
Online
Offline
Small text
Large text
Different roles
Different permissions
```

---

# 197. P0 Screen List

```text
Login
Dashboard
Patient List
Patient Details
Appointment
Queue
Consultation
Prescription
Payment
Receipt
AI Summary
Reports
Settings
```

---

# 198. P1 Screen List

```text
Timeline
Diagnostic Reports
AI Chat
AI Prescription Draft
Notifications
Staff
Permissions
Advanced Reports
```

---

# 199. P2 Screen List

```text
Voice Note
Offline Sync
Advanced Analytics
Patient Portal
Telemedicine
Lab
Pharmacy
```

---

# 200. Final Screen Architecture

The completed application should follow:

```text
                    Flutter App
                        │
                  App Bootstrap
                        │
                Authentication
                        │
                   App Shell
                        │
       ┌────────────────┼────────────────┐
       ↓                ↓                ↓
    Dashboard        Operations       Clinical
       │                │                │
       ↓                ↓                ↓
   Analytics       Appointment        Patient
                    Queue               │
                    Payment             ↓
                                      Encounter
                                         │
                         ┌───────────────┼───────────────┐
                         ↓               ↓               ↓
                       Vitals         Diagnosis      Investigation
                         │               │               │
                         └───────────────┼───────────────┘
                                         ↓
                                   Prescription
                                         │
                              ┌──────────┴──────────┐
                              ↓                     ↓
                           Doctor                 AI
                          Review              Suggestion
                              │                     │
                              └──────────┬──────────┘
                                         ↓
                                  Final Prescription
                                         │
                                         ↓
                                      Payment
                                         │
                                         ↓
                                      Receipt
                                         │
                                         ↓
                                      Reports
```

---

# 201. Final Architecture Rules

1. Every screen must have a defined route.
2. Every screen must have defined providers.
3. Every server operation must go through the repository layer.
4. Widgets must never call Dio directly.
5. Business logic must not live in widgets.
6. Use provider families for resource-specific state.
7. Chamber context must be explicit.
8. Patient context must be preserved across clinical workflows.
9. Critical mutations must be server-confirmed.
10. Prescription finalization must never be optimistic.
11. Payment success must never be optimistic.
12. Queue transitions must never be optimistic.
13. Finalized prescriptions must be read-only.
14. AI output must always be clearly labeled.
15. AI suggestions require explicit doctor review.
16. AI must never finalize prescriptions.
17. Unsaved clinical data must never be silently discarded.
18. Offline behavior must be explicit.
19. Localization must cover all user-facing text.
20. Accessibility must be implemented from the beginning.
21. Responsive behavior must be designed, not merely scaled.
22. Permission checks must exist in both UI and backend.
23. Sensitive patient information must not be logged.
24. Provider invalidation must be targeted.
25. Search must debounce and cancel stale requests.
26. Async operations must expose loading/error states.
27. Screens must remain modular through component composition.
28. Design-system components must remain feature-independent.
29. Clinical records must maintain provenance.
30. Every P0 workflow must have automated coverage.

---

# 202. Complete Product Flow

The final Flutter implementation should allow the following uninterrupted workflow:

```text
Doctor Login
    ↓
Select Chamber
    ↓
Dashboard
    ↓
Today's Appointments
    ↓
Patient Check-in
    ↓
Queue
    ↓
Call Patient
    ↓
Start Consultation
    ↓
Patient Context
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
Prescription Draft
    ↓
Doctor Review
    ↓
Prescription Finalization
    ↓
Consultation Completion
    ↓
Payment
    ↓
Receipt
    ↓
Prescription Delivery
    ↓
Patient Timeline
    ↓
Reports
```

This workflow represents the primary **MVP acceptance journey**.

---

# 203. Final MVP Acceptance Criteria

The MVP is considered functionally complete when a doctor and chamber staff can:

### Doctor

```text
✓ Register
✓ Login
✓ Complete onboarding
✓ Create chamber
✓ Configure schedule
✓ Manage staff
✓ View dashboard
✓ View patient
✓ Review patient history
✓ Start consultation
✓ Record vitals
✓ Record notes
✓ Add diagnosis
✓ Add investigation
✓ Create prescription
✓ Review prescription
✓ Finalize prescription
✓ Use AI assistance
✓ Complete consultation
✓ View reports
```

### Staff

```text
✓ Login
✓ Select chamber
✓ Register patient
✓ Search patient
✓ Create appointment
✓ Check in patient
✓ Manage queue
✓ Record payment
✓ Generate receipt
```

---

# 204. Final UX Quality Gate

Before MVP release:

```text
□ No broken navigation
□ No dead-end screens
□ No missing loading states
□ No missing error states
□ No missing empty states
□ No uncontrolled duplicate submissions
□ No cross-chamber data leakage
□ No cross-patient data leakage
□ No accidental prescription finalization
□ No accidental payment confirmation
□ No AI content presented as final medical decision
□ No lost consultation drafts
□ No untranslated user-facing strings
□ No major accessibility violations
□ No critical responsive layout issues
□ Critical E2E flow passes
```

---

# 205. Final Deliverable

At the end of Document 20, the Flutter team should have enough information to implement:

```text
Routes
+
Screens
+
Widgets
+
Providers
+
Controllers
+
API Integration
+
Permissions
+
States
+
Validation
+
Navigation
+
Responsive Layouts
+
Localization
+
Accessibility
+
Testing
```

without requiring another high-level architectural decision for the core MVP workflows.

---

# 206. Relationship to Previous Documents

The complete Flutter documentation chain is now:

```text
Document 14
Flutter Sprint-by-Sprint Implementation Plan
            ↓
Document 15
Flutter Frontend Architecture
            ↓
Document 16
Flutter Feature-by-Feature Specification
            ↓
Document 17
Flutter API Integration Layer
            ↓
Document 18
Flutter Riverpod State Management
            ↓
Document 19
Flutter UI Component & Design System
            ↓
Document 20
Flutter Screen-by-Screen Implementation
```

Together these documents form the complete Flutter implementation blueprint.

---

# 207. Next Recommended Document

The next document should be:

**Document 21 — Complete Flutter Testing Strategy & Test Case Specification**

It should define:

- unit-test architecture;
- Riverpod provider tests;
- repository tests;
- widget tests;
- golden tests;
- integration tests;
- E2E tests;
- API mocking;
- test fixtures;
- test data;
- authentication tests;
- multi-chamber isolation tests;
- clinical data protection tests;
- prescription safety tests;
- AI safety tests;
- offline/sync tests;
- performance tests;
- accessibility tests;
- CI test pipeline;
- release gates;
- complete test-case matrix.