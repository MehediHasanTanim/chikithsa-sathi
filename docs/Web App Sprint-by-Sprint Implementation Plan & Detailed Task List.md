# Web App Sprint-by-Sprint Implementation Plan & Detailed Task List

**Project:** Chamber Management  
**Platform:** Web Application  
**Target Users:** Doctors, Assistant Doctors, Receptionists, Chamber Managers, Billing Staff, Platform Administrators  
**Architecture:** Feature-First + Clean Architecture principles  
**Frontend:** React + Next.js + TypeScript  
**State Management:** TanStack Query + Zustand/Context where appropriate  
**UI:** Responsive desktop-first with tablet support  
**API:** REST `/api/v1`  
**Backend:** NestJS + PostgreSQL + Prisma  
**Authentication:** JWT Access Token + Refresh Token  
**Localization:** English + Bangla  
**Primary Market:** Bangladesh  
**Currency:** BDT  
**Timezone:** Asia/Dhaka  
**Development Model:** Agile / Scrum  
**Sprint Duration:** 2 weeks  
**Total Planned Duration:** 24 weeks / 12 sprints

---

# 1. Purpose

This document defines the complete sprint-by-sprint implementation plan for the Chamber Management Web Application.

The objective is to provide an implementation-ready roadmap for the web development team.

The plan covers:

- Web application foundation
- Authentication
- Doctor onboarding
- Chamber management
- Staff/RBAC
- Patient management
- Appointment management
- Queue management
- Consultation workspace
- Prescription
- Payments
- AI features
- Reports
- Notifications
- Offline/resilience capabilities
- Localization
- Security
- Testing
- Production deployment

---

# 2. Web Application Goals

The web application should provide:

1. Fast chamber operations.
2. Excellent desktop experience.
3. Efficient receptionist workflow.
4. Efficient doctor consultation workflow.
5. Multi-chamber support.
6. Role-based access.
7. Bangla/English support.
8. Real-time or near-real-time queue visibility.
9. Rich patient history.
10. Fast prescription creation.
11. AI-assisted clinical workflow.
12. Detailed reporting.
13. Strong security and privacy.
14. Reliable performance on common Bangladesh internet connections.

---

# 3. Primary Web Users

## 3.1 Doctor / Practice Owner

Primary activities:

- Dashboard
- Queue
- Consultation
- Patient history
- Prescription
- AI assistant
- Reports
- Chamber management

---

## 3.2 Assistant Doctor

Activities:

- Queue
- Patient history
- Vitals
- Clinical notes
- Diagnosis
- Investigation
- Prescription draft

Permissions depend on chamber configuration.

---

## 3.3 Receptionist / Chamber Staff

Activities:

- Patient registration
- Appointment management
- Check-in
- Queue
- Payment
- Patient search

---

## 3.4 Chamber Manager

Activities:

- Staff
- Schedule
- Appointments
- Reports
- Chamber configuration

---

## 3.5 Billing Staff

Activities:

- Payments
- Receipts
- Refunds
- Revenue reports

---

## 3.6 Platform Admin

Activities:

- Doctor verification
- User management
- Subscription
- Platform reports
- Audit
- System configuration

---

# 4. Recommended Web Technology Stack

## Frontend

```text
Next.js
React
TypeScript
TanStack Query
Zustand
React Hook Form
Zod
Axios or Fetch
Tailwind CSS
Component Library
date-fns / Intl
```

Recommended supporting libraries:

```text
TanStack Table
Recharts
Lucide
React PDF viewer where required
Playwright
Vitest
Testing Library
MSW
```

---

# 5. Architecture

Recommended:

```text
Browser
   ↓
Next.js Application
   ↓
Presentation Layer
   ↓
Feature Controllers / Hooks
   ↓
Use Cases
   ↓
Repository Interfaces
   ↓
API Repository
   ↓
API Client
   ↓
NestJS Backend
```

---

# 6. Frontend Project Structure

Recommended:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (onboarding)/
│   ├── (dashboard)/
│   ├── admin/
│   └── api/
│
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── doctors/
│   ├── chambers/
│   ├── schedules/
│   ├── staff/
│   ├── patients/
│   ├── appointments/
│   ├── queue/
│   ├── consultations/
│   ├── vitals/
│   ├── diagnoses/
│   ├── investigations/
│   ├── reports/
│   ├── prescriptions/
│   ├── medicines/
│   ├── payments/
│   ├── notifications/
│   ├── ai/
│   ├── analytics/
│   └── settings/
│
├── components/
├── hooks/
├── lib/
├── services/
├── repositories/
├── types/
├── schemas/
├── i18n/
├── stores/
└── styles/
```

---

# 7. Development Strategy

Development should proceed in this order:

```text
Foundation
   ↓
Authentication
   ↓
Doctor/Chamber
   ↓
Staff/RBAC
   ↓
Patients
   ↓
Appointments
   ↓
Queue
   ↓
Consultation
   ↓
Prescription
   ↓
Payments
   ↓
AI
   ↓
Reports
   ↓
Production Hardening
```

---

# 8. Sprint Overview

| Sprint | Focus | Primary Outcome |
|---|---|---|
| 1 | Foundation | Working web shell |
| 2 | Authentication | Secure login/session |
| 3 | Doctor + Chamber | Chamber setup |
| 4 | Staff + RBAC | Role-based operations |
| 5 | Patient Management | Complete patient workflow |
| 6 | Appointment + Queue | Chamber operations |
| 7 | Consultation | Clinical workspace |
| 8 | Prescription + Medicines | Digital prescription |
| 9 | Payments + Receipts | Billing workflow |
| 10 | AI Assistant | AI-assisted consultation |
| 11 | Reports + Notifications | Analytics and communication |
| 12 | Hardening + Release | Production-ready web app |

---

# Sprint 1 — Web Foundation & Application Shell

## Sprint Goal

Establish the complete technical foundation of the web application.

---

## 1. Project Initialization

Tasks:

- Create Next.js project.
- Configure TypeScript.
- Configure ESLint.
- Configure Prettier.
- Configure Git hooks.
- Configure environment management.
- Configure path aliases.
- Configure production build.
- Configure development scripts.

---

## 2. Folder Architecture

Tasks:

- Create feature directories.
- Create shared component structure.
- Create API service layer.
- Create repository layer.
- Create validation layer.
- Create localization structure.
- Create shared types.
- Create common utilities.

---

## 3. UI Foundation

Implement:

- Application shell.
- Header.
- Sidebar.
- Main content area.
- Breadcrumb.
- Page header.
- Modal.
- Drawer.
- Toast.
- Confirmation dialog.
- Loading state.
- Error state.
- Empty state.
- Skeleton components.

---

## 4. Design System

Implement:

- Typography.
- Colors.
- Spacing.
- Radius.
- Shadows.
- Buttons.
- Inputs.
- Selects.
- Date picker.
- Time picker.
- Checkbox.
- Radio.
- Switch.
- Tabs.
- Badge.
- Tooltip.
- Dropdown.
- Table.
- Pagination.

---

## 5. Responsive Layout

Support:

```text
Desktop: >=1024px
Tablet: 768–1023px
Mobile: <768px
```

Primary optimization:

```text
Desktop
```

because chamber management is expected to use larger screens extensively.

---

## 6. API Client

Implement:

- API base URL.
- Request wrapper.
- Response parsing.
- Error parsing.
- Request ID.
- Authorization.
- Timeout.
- Retry policy.
- API versioning.

---

## 7. TanStack Query

Configure:

- Query client.
- Default stale time.
- Retry behavior.
- Cache policy.
- Query keys.
- Mutation handling.
- Invalidation strategy.

---

## 8. Global State

Implement global state only for:

- Auth/session.
- Selected chamber.
- Locale.
- Theme.
- Global UI state.

Avoid putting server state into global Zustand state.

---

## 9. Theme

Implement:

- Light mode.
- Dark mode architecture.
- System preference.
- Persistent theme.

---

## 10. Localization Foundation

Implement:

- English.
- Bangla.
- Locale provider.
- Language switcher.
- Translation loading.
- Formatting helpers.

---

## Sprint 1 Deliverables

```text
✓ Next.js project
✓ Application shell
✓ Design system
✓ API client
✓ Query client
✓ Global state
✓ Localization
✓ Theme
✓ Responsive layout
✓ CI foundation
```

---

# Sprint 2 — Authentication & Onboarding

## Sprint Goal

Implement secure authentication and initial doctor onboarding.

---

## 1. Login

Implement:

- Email/phone login.
- Password.
- Remember session.
- Login loading.
- Validation.
- API integration.
- Error handling.

---

## 2. Registration

Implement:

- Doctor registration.
- Name.
- Phone.
- Email.
- Password.
- Terms acceptance.
- Validation.

---

## 3. OTP

Implement:

- OTP screen.
- OTP input.
- Resend.
- Countdown.
- Invalid OTP.
- Expired OTP.
- Success flow.

---

## 4. Password Recovery

Implement:

- Forgot password.
- OTP.
- New password.
- Confirmation.
- Success.

---

## 5. Session Management

Implement:

- Access token.
- Refresh token.
- Automatic refresh.
- Concurrent refresh protection.
- Logout.
- Session expiration.
- Redirect to login.

---

## 6. Route Guards

Implement:

```text
Unauthenticated
    ↓
Auth routes

Authenticated
    ↓
Onboarding check
    ↓
Dashboard
```

---

## 7. Doctor Onboarding

Implement:

- Profile.
- Professional information.
- Verification.
- Chamber creation.
- Schedule.
- Staff invitation.
- AI setup.
- Completion.

---

## 8. Form Validation

Use:

```text
React Hook Form
+
Zod
```

Tasks:

- Shared schemas.
- Error messages.
- Bangla validation.
- Server validation mapping.

---

## Sprint 2 Deliverables

```text
✓ Registration
✓ Login
✓ OTP
✓ Password reset
✓ Session handling
✓ Route guards
✓ Doctor onboarding
```

---

# Sprint 3 — Doctor, Chamber & Schedule Management

## Sprint Goal

Allow doctors to create and manage their chamber environment.

---

## 1. Doctor Profile

Implement:

- Profile page.
- Personal information.
- Profile photo.
- Professional information.
- Degrees.
- Specialization.
- Registration number.

---

## 2. Verification

Implement:

- Verification status.
- Document upload.
- Submission.
- Pending state.
- Approved state.
- Rejected state.
- Resubmission.

---

## 3. Chamber Management

Implement:

- Chamber list.
- Create chamber.
- Edit chamber.
- Activate/deactivate.
- Chamber details.
- Address.
- Contact.
- Consultation fee.

---

## 4. Chamber Switcher

Implement:

- Header chamber selector.
- Active chamber.
- Persistent selection.
- Permission validation.
- Query cache invalidation.

---

## 5. Schedule

Implement:

- Weekly schedule.
- Working days.
- Start/end time.
- Breaks.
- Appointment capacity.
- Consultation duration.

---

## 6. Chamber Settings

Implement:

- General settings.
- Queue settings.
- Payment settings.
- Prescription settings.
- Notification settings.

---

## Sprint 3 Deliverables

```text
✓ Doctor profile
✓ Verification
✓ Chamber CRUD
✓ Chamber switcher
✓ Schedule
✓ Chamber settings
```

---

# Sprint 4 — Staff, Roles & Permissions

## Sprint Goal

Enable multiple users to operate a chamber safely.

---

## 1. Staff List

Implement:

- Staff table.
- Search.
- Filter.
- Status.
- Role.
- Last activity.

---

## 2. Staff Invitation

Implement:

- Invite.
- Email/phone.
- Role selection.
- Invitation status.
- Resend invitation.
- Cancel invitation.

---

## 3. Role Management

Support:

```text
Doctor
Assistant Doctor
Receptionist
Chamber Manager
Billing Staff
```

---

## 4. Permission System

Implement permission codes such as:

```text
PATIENT_VIEW
PATIENT_CREATE
PATIENT_UPDATE

APPOINTMENT_VIEW
APPOINTMENT_CREATE
APPOINTMENT_UPDATE

QUEUE_VIEW
QUEUE_MANAGE

CONSULTATION_VIEW
CONSULTATION_EDIT

PRESCRIPTION_CREATE
PRESCRIPTION_FINALIZE

PAYMENT_VIEW
PAYMENT_CREATE
PAYMENT_REFUND

REPORT_VIEW
CHAMBER_MANAGE
STAFF_MANAGE
```

---

## 5. Permission-Aware UI

Implement:

- Hide unauthorized actions.
- Disable unauthorized actions.
- Permission-based menus.
- Permission-based buttons.

Important:

> Frontend permission checks never replace backend authorization.

---

## 6. Staff Activity

Display:

- User.
- Role.
- Status.
- Last activity.
- Chamber.

---

## Sprint 4 Deliverables

```text
✓ Staff management
✓ Invitations
✓ Roles
✓ Permissions
✓ Permission-aware navigation
✓ Staff administration
```

---

# Sprint 5 — Patient Management

## Sprint Goal

Implement complete patient registration and clinical history access.

---

## 1. Patient List

Implement:

- Search.
- Pagination.
- Filters.
- Sorting.
- Patient ID.
- Name.
- Phone.
- Last visit.

---

## 2. Patient Search

Support:

```text
Bangla name
English name
Phone
Patient ID
```

Implement:

- Debouncing.
- Search cancellation.
- Latest-result-wins.
- Empty state.

---

## 3. Patient Registration

Fields:

- Name.
- Phone.
- Date of birth/age.
- Gender.
- Address.
- Emergency contact.
- Notes.

---

## 4. Duplicate Detection

Display:

```text
Possible duplicate patient
```

with:

- Matching name.
- Phone.
- Existing patient ID.

Allow authorized user to continue or select existing patient.

---

## 5. Patient Details

Implement tabs:

```text
Overview
Timeline
Visits
Prescriptions
Investigations
Reports
Vitals
Allergies
Conditions
```

---

## 6. Patient Timeline

Show:

- Visits.
- Diagnoses.
- Prescriptions.
- Reports.
- Payments where permitted.
- Follow-ups.

---

## 7. Clinical History

Implement:

- Allergies.
- Conditions.
- Previous diagnoses.
- Vital history.

---

## 8. Patient Chamber Association

Support:

```text
Patient
   ↓
PatientChamber
```

so patients can be associated with multiple chambers safely.

---

## Sprint 5 Deliverables

```text
✓ Patient list
✓ Search
✓ Registration
✓ Duplicate detection
✓ Patient profile
✓ Timeline
✓ Clinical history
```

---

# Sprint 6 — Appointments & Queue Management

## Sprint Goal

Build the operational core of the chamber.

---

# Part A — Appointments

## 1. Appointment Calendar

Views:

```text
Day
Week
Month
```

---

## 2. Appointment List

Display:

- Patient.
- Time.
- Doctor.
- Status.
- Appointment type.
- Notes.

---

## 3. Create Appointment

Implement:

- Existing patient selection.
- New patient.
- Date.
- Time.
- Doctor.
- Reason.
- Notes.

---

## 4. Appointment Actions

Implement:

```text
Confirm
Reschedule
Cancel
Check-in
Mark no-show
```

---

# Part B — Queue

## 5. Daily Queue

Display:

```text
Token
Patient
Appointment
Status
Wait Time
Actions
```

---

## 6. Queue Actions

Implement:

```text
Call
Recall
Skip
Start Consultation
Complete
```

---

## 7. Queue Board

Desktop layout:

```text
Current Patient
      │
      ▼
Next Patients
      │
      ▼
Waiting Queue
```

---

## 8. Real-Time Updates

Implement using:

- Polling initially, or
- WebSocket/SSE if backend supports it.

Queue updates should appear without full page refresh.

---

## 9. Queue Timer

Display:

```text
Waiting time
Consultation duration
```

---

## 10. Walk-In Patient

Implement:

```text
Register
 ↓
Check-in
 ↓
Queue
```

without requiring an appointment.

---

## Sprint 6 Deliverables

```text
✓ Appointment calendar
✓ Appointment CRUD
✓ Check-in
✓ Daily queue
✓ Queue actions
✓ Queue board
✓ Walk-in workflow
✓ Real-time/polling updates
```

---

# Sprint 7 — Consultation Workspace

## Sprint Goal

Build the primary doctor workspace.

This is the most important web screen.

---

# 1. Consultation Layout

Recommended desktop layout:

```text
┌─────────────────────────────────────────────────────┐
│ Patient Header                                      │
├───────────────┬─────────────────────┬───────────────┤
│ Patient       │ Clinical Workspace  │ AI Assistant  │
│ Context       │                     │               │
│               │ Vitals              │ Summary       │
│ History       │ Notes               │ Chat          │
│ Allergies     │ Diagnosis           │ Suggestions   │
│ Conditions    │ Investigation       │               │
│ Timeline      │ Prescription        │               │
└───────────────┴─────────────────────┴───────────────┘
```

---

# 2. Patient Context

Display:

- Name.
- Age.
- Gender.
- Patient ID.
- Allergies.
- Important conditions.
- Previous visit.
- Current visit.

---

# 3. Vitals

Implement:

- Blood pressure.
- Pulse.
- Temperature.
- Weight.
- Height.
- SpO2.
- BMI.

---

# 4. Clinical Notes

Implement:

- Chief complaint.
- History.
- Examination.
- Assessment.
- Plan.
- Free-form notes.

---

# 5. Diagnosis

Implement:

- Search.
- Add.
- Remove.
- Primary diagnosis.
- Secondary diagnosis.

---

# 6. Investigation

Implement:

- Investigation search.
- Add investigation.
- Result status.
- Notes.
- Previous investigation history.

---

# 7. Diagnostic Reports

Implement:

- Report list.
- Upload.
- Preview.
- Download.
- Analysis action.

---

# 8. Autosave

Implement:

```text
Editing
 ↓
Dirty
 ↓
Autosave
 ↓
Saved
```

Display:

```text
Saving...
Saved
Save failed
```

---

# 9. Consultation Lifecycle

Support:

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

---

# 10. Consultation Completion

Before completion:

- Validate required information.
- Save notes.
- Save vitals.
- Save diagnoses.
- Save investigation data.
- Verify prescription state.

---

# Sprint 7 Deliverables

```text
✓ Consultation workspace
✓ Patient context
✓ Vitals
✓ Clinical notes
✓ Diagnosis
✓ Investigation
✓ Reports
✓ Autosave
✓ Encounter lifecycle
```

---

# Sprint 8 — Medicines & Prescription

## Sprint Goal

Implement complete digital prescription workflow.

---

# 1. Medicine Search

Search by:

- Generic name.
- Brand name.
- Strength.
- Dosage form.

---

# 2. Medicine Selection

Display:

```text
Medicine
Strength
Form
Generic
```

---

# 3. Prescription Item

Fields:

```text
Medicine
Dose
Frequency
Duration
Route
Timing
Instructions
Quantity
```

---

# 4. Prescription Builder

Support:

- Add medicine.
- Edit.
- Remove.
- Reorder.
- Duplicate.
- Favorites.

---

# 5. Favorite Medicines

Doctor can save frequently used medicines.

---

# 6. Prescription Templates

Future/Phase 2:

```text
Common cold
Diabetes follow-up
Hypertension
Gastritis
```

---

# 7. Prescription Review

Display:

```text
Patient
Diagnosis
Medicines
Instructions
Follow-up
Doctor information
```

---

# 8. Prescription Finalization

Flow:

```text
Draft
 ↓
Review
 ↓
Validate
 ↓
Finalize
 ↓
Server confirmation
 ↓
Read-only
```

Never perform optimistic finalization.

---

# 9. Prescription Amendment

Finalized prescriptions cannot be directly edited.

Use:

```text
Amend
 ↓
Create replacement/amendment
 ↓
Preserve history
```

---

# 10. Prescription Preview

Implement:

- Printable layout.
- PDF preview.
- English.
- Bangla.

---

# 11. Prescription Delivery

Future support:

- Print.
- Download PDF.
- SMS.
- WhatsApp.

---

# Sprint 8 Deliverables

```text
✓ Medicine search
✓ Prescription builder
✓ Favorites
✓ Review
✓ Finalization
✓ Amendment
✓ Preview
✓ PDF
✓ Bangla/English prescription
```

---

# Sprint 9 — Payments, Receipts & Billing

## Sprint Goal

Implement financial operations.

---

# 1. Payment Screen

Display:

```text
Patient
Consultation
Fee
Discount
Amount
Payment Method
Status
```

---

# 2. Payment Methods

MVP:

```text
Cash
Card
Mobile Banking
```

---

# 3. Payment Creation

Implement:

- Amount validation.
- Payment method.
- Notes.
- Idempotency.
- Server confirmation.

---

# 4. Receipt

Display:

- Receipt number.
- Patient.
- Doctor.
- Chamber.
- Amount.
- Method.
- Date/time.

---

# 5. Receipt PDF

Support:

```text
English
Bangla
```

---

# 6. Refund

Authorized users can:

- Request refund.
- View refund.
- Process refund.

Permission required.

---

# 7. Revenue Dashboard

Display:

```text
Today
This Week
This Month
Custom Range
```

Metrics:

- Revenue.
- Visits.
- Average fee.
- Outstanding amount.
- Refunds.

---

# 8. Financial Safety

Payment mutations must:

- Be server-authoritative.
- Use idempotency.
- Never rely on optimistic UI.
- Prevent duplicate payment submission.

---

# Sprint 9 Deliverables

```text
✓ Payment
✓ Receipt
✓ Refund
✓ Revenue summary
✓ Financial validation
✓ Idempotent payment flow
```

---

# Sprint 10 — AI Assistant

## Sprint Goal

Integrate AI into the clinical workflow without compromising safety.

---

# 1. AI Patient Summary

Display:

```text
Medical history
Previous diagnoses
Previous prescriptions
Relevant reports
Recent vitals
```

Clearly label:

```text
AI Generated
```

---

# 2. AI Clinical Chat

Doctor can ask:

```text
What are possible differential diagnoses?
Summarize previous visits.
Explain this report.
What should I consider?
```

---

# 3. AI Prescription Draft

Flow:

```text
Clinical Context
      ↓
AI
      ↓
Suggested Prescription
      ↓
Doctor Review
      ↓
Doctor Edit
      ↓
Doctor Finalization
```

AI cannot call the finalization endpoint.

---

# 4. AI Report Analysis

Implement:

- Report selection.
- Analyze.
- Processing state.
- Result.
- Warning.
- Doctor review.

---

# 5. AI Request Status

Support:

```text
SUBMITTED
PROCESSING
COMPLETED
FAILED
```

Use polling or real-time updates.

---

# 6. AI Chat UI

Desktop:

```text
┌──────────────────────────────┐
│ AI Assistant                 │
├──────────────────────────────┤
│ Conversation                 │
│                              │
│ Doctor question              │
│                              │
│ AI response                  │
│                              │
├──────────────────────────────┤
│ Ask AI...              Send  │
└──────────────────────────────┘
```

---

# 7. AI Safety UX

Every AI-generated clinical output should show:

```text
AI Generated
Review Required
```

---

# 8. AI Data Scope

AI requests must be scoped to:

```text
User
Chamber
Patient
Encounter
```

---

# 9. AI Error Handling

Handle:

- Timeout.
- Rate limit.
- Processing failure.
- Provider failure.
- Invalid output.
- Safety rejection.

---

# 10. AI Chat Privacy

Do not expose:

- Other patient information.
- Other chamber information.
- Unauthorized records.

---

# Sprint 10 Deliverables

```text
✓ AI summary
✓ AI clinical chat
✓ AI prescription draft
✓ AI report analysis
✓ Async AI requests
✓ AI safety UI
✓ AI error handling
```

---

# Sprint 11 — Reports, Notifications & Advanced Dashboard

## Sprint Goal

Provide management visibility and operational analytics.

---

# 1. Doctor Dashboard

Widgets:

```text
Today's Patients
Appointments
Current Queue
Completed Consultations
Revenue
Pending Payments
Follow-ups
```

---

# 2. Patient Reports

Metrics:

- New patients.
- Returning patients.
- Patient growth.
- Visits.

---

# 3. Appointment Reports

Metrics:

- Total appointments.
- Completed.
- Cancelled.
- No-show.
- Completion rate.

---

# 4. Revenue Reports

Metrics:

- Daily revenue.
- Monthly revenue.
- Revenue by chamber.
- Payment method.
- Refunds.

---

# 5. Charts

Use:

- Line charts.
- Bar charts.
- Donut charts.
- KPI cards.

---

# 6. Date Range

Support:

```text
Today
Yesterday
This Week
This Month
Last Month
Custom
```

---

# 7. Notifications

Implement:

- Notification center.
- Unread count.
- Mark read.
- Mark all read.

---

# 8. Notification Categories

Examples:

```text
Appointment
Queue
Payment
Verification
System
AI
```

---

# 9. Dashboard Customization

Future:

- Reorder widgets.
- Hide widgets.
- Save dashboard layout.

---

# 10. Export

Support:

- CSV.
- Excel-compatible export.
- PDF where required.

---

# Sprint 11 Deliverables

```text
✓ Dashboard
✓ Analytics
✓ Patient reports
✓ Appointment reports
✓ Revenue reports
✓ Notifications
✓ Export
```

---

# Sprint 12 — Production Hardening, Security & Release

## Sprint Goal

Convert the application into a production-ready system.

---

# 1. Security Review

Verify:

- Authentication.
- Authorization.
- RBAC.
- Chamber isolation.
- Session security.
- XSS protection.
- CSRF strategy where applicable.
- Secure cookies/token handling.
- Content Security Policy.
- File upload security.
- Deep-link authorization.

---

# 2. Clinical Data Security

Verify:

- No sensitive data in logs.
- No patient information in analytics.
- No unauthorized patient access.
- No cross-chamber data.
- No cross-account cached data.

---

# 3. Prescription Security

Test:

```text
Unauthorized finalize
Unauthorized edit
Duplicate finalize
Concurrent finalize
Amendment
```

---

# 4. Payment Security

Test:

```text
Duplicate payment
Unauthorized refund
Amount manipulation
Concurrent payment
Retry after timeout
```

---

# 5. Performance

Measure:

```text
Initial load
Dashboard load
Patient search
Patient profile
Consultation load
Prescription load
Reports
```

Targets should be finalized during performance testing.

---

# 6. Frontend Bundle Optimization

Implement:

- Route-based code splitting.
- Lazy loading.
- Image optimization.
- Dependency audit.
- Bundle analysis.
- Remove unused dependencies.

---

# 7. API Optimization

Verify:

- Query caching.
- Pagination.
- Request cancellation.
- Duplicate request prevention.
- Efficient query keys.
- Prefetching.

---

# 8. Accessibility

Test:

- Keyboard navigation.
- Screen reader.
- Focus management.
- Color contrast.
- Form labels.
- Error announcements.
- Large text.

---

# 9. Localization

Complete:

```text
English
Bangla
```

Verify:

- Translation completeness.
- Bangla overflow.
- Dates.
- Currency.
- Phone.
- Prescription.
- Reports.
- Notifications.

---

# 10. Browser Testing

Minimum:

```text
Chrome
Edge
Safari
Firefox
```

---

# 11. Responsive Testing

Test:

```text
Desktop
Laptop
Tablet
Mobile
```

---

# 12. E2E Testing

Critical flow:

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
Start Consultation
 ↓
Vitals
 ↓
Diagnosis
 ↓
Investigation
 ↓
Prescription
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

---

# 13. Multi-Chamber Testing

Test:

```text
Chamber A
 ↓
Patient A
 ↓
Switch Chamber
 ↓
Chamber B
```

Verify Chamber A data is not visible in Chamber B.

---

# 14. Production Monitoring

Implement:

- Error monitoring.
- Performance monitoring.
- API error monitoring.
- Frontend crash monitoring.
- Availability monitoring.

Never log sensitive clinical payloads.

---

# 15. Deployment

Prepare:

```text
Development
Staging
Production
```

---

# 16. Release Checklist

```text
✓ Build passes
✓ Type checking passes
✓ Lint passes
✓ Unit tests pass
✓ Widget/component tests pass
✓ Integration tests pass
✓ E2E passes
✓ Security checks pass
✓ Localization checks pass
✓ Accessibility checks pass
✓ Performance checks pass
✓ Production environment verified
```

---

# 17. Web Application Core Routes

Recommended route structure:

```text
/
├── auth/
│   ├── login
│   ├── register
│   ├── verify-otp
│   ├── forgot-password
│   └── reset-password
│
├── onboarding/
│   ├── profile
│   ├── professional
│   ├── verification
│   ├── chamber
│   ├── schedule
│   ├── staff
│   ├── ai
│   └── complete
│
└── app/
    ├── dashboard
    ├── patients
    ├── appointments
    ├── queue
    ├── consultations
    ├── prescriptions
    ├── payments
    ├── reports
    ├── notifications
    ├── settings
    └── chamber
```

---

# 18. Main Application Shell

Desktop:

```text
┌───────────────────────────────────────────────────────┐
│ Logo | Chamber | Search | Notifications | Profile   │
├───────────────┬───────────────────────────────────────┤
│ Dashboard     │                                       │
│ Patients      │                                       │
│ Appointments  │             Main Content              │
│ Queue         │                                       │
│ Consultation  │                                       │
│ Prescriptions │                                       │
│ Payments      │                                       │
│ Reports       │                                       │
│               │                                       │
│ Settings      │                                       │
└───────────────┴───────────────────────────────────────┘
```

---

# 19. Responsive Navigation

Desktop:

```text
Persistent sidebar
```

Tablet:

```text
Collapsible sidebar
```

Mobile:

```text
Drawer / bottom navigation where appropriate
```

---

# 20. Web-Specific UX Advantages

The web application should exploit larger screens.

Important capabilities:

### Multi-column consultation

Patient context + clinical workspace + AI.

### Rich tables

Patients, appointments, payments, reports.

### Keyboard shortcuts

Examples:

```text
Ctrl/Cmd + K
Global search

N
New patient

A
New appointment

Q
Queue

Esc
Close modal
```

Exact shortcuts should be configurable and documented.

---

# 21. Global Search

Implement:

```text
Ctrl/Cmd + K
```

Search:

```text
Patients
Appointments
Prescriptions
Reports
```

Results should be permission-aware.

---

# 22. Patient Quick Actions

From patient search:

```text
View
Book Appointment
Check-in
Start Consultation
View Prescription
Take Payment
```

Available actions depend on permissions and patient state.

---

# 23. Queue Quick Actions

Queue operators should perform common actions without opening multiple screens.

Example:

```text
Call
Recall
Skip
Start
Complete
```

---

# 24. Consultation Quick Actions

Doctor should have immediate access to:

```text
Vitals
History
Diagnosis
Investigation
Prescription
AI
Complete
```

---

# 25. Prescription Quick Actions

Support:

```text
Add Medicine
Favorite Medicine
AI Draft
Review
Finalize
Print
Download
```

---

# 26. Keyboard Accessibility

Forms should support:

```text
Tab
Shift + Tab
Enter
Escape
Arrow navigation
```

Avoid keyboard traps.

---

# 27. Browser Refresh Handling

Refresh should preserve:

- Auth session.
- Selected chamber.
- Current route.

Active unsaved clinical drafts must be recoverable according to the offline/draft strategy.

---

# 28. Unsaved Changes

For:

- Consultation notes
- Prescription drafts
- Patient forms
- Chamber configuration

warn before navigation when unsaved changes exist.

---

# 29. Browser Tab Handling

Multiple browser tabs must not cause:

- Cross-chamber data leakage.
- Stale auth state.
- Silent overwrite.
- Duplicate payment.
- Duplicate prescription finalization.

---

# 30. Cross-Tab Synchronization

Where appropriate use:

```text
BroadcastChannel
```

or another browser-safe mechanism for:

- Logout.
- Session expiration.
- Locale changes.
- Selected chamber changes.

---

# 31. Server State Strategy

Use TanStack Query for:

```text
Patients
Appointments
Queue
Encounters
Prescriptions
Payments
Reports
Notifications
AI requests
```

---

# 32. Client State Strategy

Use Zustand/Context only for:

```text
Auth UI
Selected chamber
Locale
Theme
Sidebar
Modal
Temporary UI state
```

---

# 33. Query Key Strategy

Examples:

```text
patients
patients.search
patient.detail
patient.timeline

appointments
appointments.calendar

queue.today

encounter.detail

prescription.detail

payments
reports.dashboard
```

All chamber-scoped queries must include:

```text
chamberId
```

where relevant.

---

# 34. Cache Isolation

Cache keys must prevent:

```text
Chamber A
```

data from being displayed for:

```text
Chamber B
```

Example:

```text
[
  "patients",
  chamberId,
  filters
]
```

---

# 35. Mutation Strategy

Critical mutations:

```text
Queue
Payment
Prescription Finalization
Encounter Completion
```

must await server confirmation.

---

# 36. Optimistic Updates

Allowed selectively for low-risk UI operations.

Do not use optimistic updates for:

- Prescription finalization.
- Payment.
- Refund.
- Encounter locking.
- Clinical record locking.

---

# 37. Error Handling

Every feature should support:

```text
Loading
Success
Empty
Validation Error
Unauthorized
Forbidden
Not Found
Conflict
Network Error
Server Error
```

---

# 38. Conflict Handling

For clinical records:

```text
Version mismatch
 ↓
Show conflict
 ↓
Load latest
 ↓
Compare
 ↓
Doctor decides
```

Never silently overwrite clinical data.

---

# 39. Offline Web Strategy

MVP:

```text
Online-first
```

with:

- Cached reads.
- Draft persistence.
- Connectivity detection.

Advanced:

- Service worker.
- IndexedDB.
- Offline mutation queue.
- Sync engine.

Critical clinical mutations remain server-authoritative.

---

# 40. Web Notifications

Support:

- In-app notification center.
- Browser notification permission as optional advanced feature.
- Appointment reminders.
- Queue events.
- System events.

Avoid sensitive patient information in browser notifications.

---

# 41. File Upload

Use backend presigned URLs.

Flow:

```text
Select File
 ↓
Request Upload URL
 ↓
Upload
 ↓
Complete Upload
 ↓
Store File Reference
```

Validate:

- Type.
- Size.
- Extension.
- MIME type.

---

# 42. PDF Handling

Support:

- Prescription preview.
- Prescription download.
- Receipt download.
- Diagnostic report preview.

---

# 43. Security Headers

Production should configure appropriate:

- Content-Security-Policy.
- X-Content-Type-Options.
- Referrer-Policy.
- Permissions-Policy.
- Frame protections.

Exact policy should be finalized during security testing.

---

# 44. XSS Protection

Never render untrusted HTML directly.

Clinical notes and AI responses should be treated as untrusted content.

---

# 45. AI Output Rendering

AI-generated Markdown/HTML must be sanitized before rendering.

Do not allow arbitrary scripts or unsafe HTML.

---

# 46. Role-Based Navigation

Example:

### Doctor

```text
Dashboard
Patients
Appointments
Queue
Consultations
Prescriptions
Reports
AI
Settings
```

### Receptionist

```text
Dashboard
Patients
Appointments
Queue
Payments
```

### Billing

```text
Dashboard
Payments
Revenue
Reports
```

---

# 47. Web MVP Scope

MVP includes:

```text
Authentication
Doctor Profile
Chamber
Schedule
Staff
RBAC
Patients
Appointments
Queue
Consultation
Vitals
Diagnosis
Investigation
Prescription
Payments
Reports
Basic AI
Notifications
Bangla/English
Security
Audit
```

---

# 48. Advanced Web Scope

Phase 2:

```text
Advanced AI
Voice-to-note
Offline web
Advanced analytics
Automated communication
Patient portal
Prescription templates
Advanced reporting
Browser notifications
```

Phase 3:

```text
Telemedicine
Lab integration
Pharmacy integration
Insurance
Referral network
Marketplace
Predictive analytics
```

---

# 49. Team Structure

Recommended web team:

```text
1 Tech Lead / Senior Frontend Engineer
2 Frontend Engineers
1 UI/UX Engineer
1 QA Engineer
Shared Backend Engineers
Shared DevOps Engineer
```

---

# 50. Suggested Sprint Ownership

| Sprint | Frontend | UI/UX | QA |
|---|---:|---:|---:|
| 1 | High | High | Medium |
| 2 | High | Medium | High |
| 3 | High | Medium | High |
| 4 | High | Medium | High |
| 5 | High | High | High |
| 6 | High | High | High |
| 7 | Very High | Very High | Very High |
| 8 | Very High | High | Very High |
| 9 | High | Medium | Very High |
| 10 | Very High | High | Very High |
| 11 | High | Medium | High |
| 12 | High | Medium | Very High |

---

# 51. Sprint Dependencies

```text
Sprint 1
   ↓
Sprint 2
   ↓
Sprint 3
   ↓
Sprint 4
   ↓
Sprint 5
   ↓
Sprint 6
   ↓
Sprint 7
   ↓
Sprint 8
   ↓
Sprint 9
   ↓
Sprint 10
   ↓
Sprint 11
   ↓
Sprint 12
```

However, parallel development should be used where possible.

---

# 52. Parallel Development Strategy

After Sprint 1:

```text
Team A
Authentication / Doctor / Chamber

Team B
Patients / Appointments

Team C
Design System / Components / QA
```

Later:

```text
Team A
Consultation / Prescription

Team B
Payments / Reports

Team C
AI / Notifications / Testing
```

---

# 53. Jira Epic Structure

Recommended:

```text
WEB-EPIC-AUTH
WEB-EPIC-ONBOARDING
WEB-EPIC-CHAMBER
WEB-EPIC-STAFF
WEB-EPIC-PATIENT
WEB-EPIC-APPOINTMENT
WEB-EPIC-QUEUE
WEB-EPIC-CONSULTATION
WEB-EPIC-PRESCRIPTION
WEB-EPIC-PAYMENT
WEB-EPIC-AI
WEB-EPIC-REPORTING
WEB-EPIC-LOCALIZATION
WEB-EPIC-SECURITY
WEB-EPIC-TESTING
```

---

# 54. Jira Story Format

Example:

```text
WEB-PATIENT-001
Create patient registration form
```

Subtasks:

```text
Create UI
Create validation schema
Create API repository
Create query/mutation
Implement error handling
Add localization
Add tests
```

---

# 55. Definition of Ready

A story is ready when:

```text
✓ UX approved
✓ API contract available
✓ Permission defined
✓ Validation defined
✓ Localization copy available
✓ Acceptance criteria available
✓ Dependencies identified
```

---

# 56. Definition of Done

A story is done when:

```text
✓ UI implemented
✓ API integrated
✓ Loading handled
✓ Empty handled
✓ Error handled
✓ Validation implemented
✓ Permissions implemented
✓ English implemented
✓ Bangla implemented
✓ Responsive behavior verified
✓ Accessibility verified
✓ Unit/component tests added
✓ Code reviewed
✓ QA passed
```

---

# 57. MVP End-to-End Acceptance Criteria

A doctor must be able to:

```text
Register
 ↓
Verify account
 ↓
Complete profile
 ↓
Create chamber
 ↓
Configure schedule
 ↓
Invite staff
 ↓
Register patient
 ↓
Create appointment
 ↓
Check patient in
 ↓
Manage queue
 ↓
Open consultation
 ↓
Record vitals
 ↓
Record diagnosis
 ↓
Add investigation
 ↓
Create prescription
 ↓
Review prescription
 ↓
Finalize prescription
 ↓
Complete consultation
 ↓
Receive payment
 ↓
Generate receipt
 ↓
View reports
```

---

# 58. Staff End-to-End Acceptance Criteria

Receptionist:

```text
Login
 ↓
Select chamber
 ↓
Search patient
 ↓
Register patient
 ↓
Create appointment
 ↓
Check-in
 ↓
Manage queue
 ↓
Take payment
 ↓
Print/download receipt
```

---

# 59. AI End-to-End Acceptance Criteria

Doctor:

```text
Open consultation
 ↓
Request patient summary
 ↓
Review AI summary
 ↓
Ask clinical question
 ↓
Request prescription draft
 ↓
Review AI output
 ↓
Edit
 ↓
Finalize manually
```

The AI must never finalize the prescription.

---

# 60. Critical Security Acceptance Criteria

The web application must fail release if:

```text
❌ User can access another user's data
❌ User can access another chamber's data
❌ Unauthorized staff can finalize prescription
❌ Unauthorized user can refund payment
❌ AI exposes another patient's data
❌ Tokens are exposed in logs
❌ Clinical data is exposed through browser cache
❌ Finalized prescription can be silently edited
```

---

# 61. Performance Acceptance Criteria

Critical screens:

```text
Login
Dashboard
Patient Search
Patient Details
Queue
Consultation
Prescription
Payment
Reports
```

must be measured under realistic network conditions.

---

# 62. Bangladesh Network Testing

Test under:

```text
Fast connection
Average mobile broadband
Slow connection
High latency
Intermittent connection
Temporary disconnection
```

The UI should provide clear feedback rather than appearing frozen.

---

# 63. Localization Acceptance Criteria

Both:

```text
English
বাংলা
```

must be usable throughout MVP.

Verify:

```text
No missing strings
No overflow
No broken Bangla rendering
No untranslated status
No incorrect medical terminology
```

---

# 64. Browser Support Matrix

| Browser | Priority |
|---|---|
| Chrome | P0 |
| Edge | P0 |
| Safari | P1 |
| Firefox | P1 |
| Mobile Chrome | P1 |
| Mobile Safari | P1 |

---

# 65. Testing Strategy

Testing should include:

```text
Unit
Component
Integration
API integration
E2E
Accessibility
Responsive
Security
Performance
Localization
```

---

# 66. Critical E2E Scenarios

## Scenario 1

Doctor registration → onboarding → chamber.

## Scenario 2

Receptionist → patient → appointment → check-in.

## Scenario 3

Queue → consultation → prescription.

## Scenario 4

Prescription → finalization → PDF.

## Scenario 5

Consultation → payment → receipt.

## Scenario 6

AI summary → AI prescription draft → doctor review.

## Scenario 7

Chamber A → Chamber B isolation.

## Scenario 8

Logout → account switch → cache isolation.

---

# 67. Release Milestones

## Milestone 1 — Technical Foundation

After Sprint 1.

---

## Milestone 2 — Operational Foundation

After Sprint 6.

At this point:

```text
Patient
+
Appointment
+
Queue
```

should work.

---

## Milestone 3 — Clinical MVP

After Sprint 8.

```text
Consultation
+
Prescription
```

complete.

---

## Milestone 4 — Financial MVP

After Sprint 9.

```text
Payment
+
Receipt
```

complete.

---

## Milestone 5 — AI MVP

After Sprint 10.

---

## Milestone 6 — Production Candidate

After Sprint 12.

---

# 68. Recommended Development Priority

If schedule becomes constrained, prioritize:

```text
P0
Authentication
Chamber
RBAC
Patient
Appointment
Queue
Consultation
Prescription
Payment
```

Then:

```text
P1
AI
Reports
Notifications
Localization
Advanced UX
```

Then:

```text
P2
Offline
Advanced analytics
Voice
Patient portal
Telemedicine
```

---

# 69. Features That Should Not Block MVP

Do not delay MVP for:

```text
Full offline web
Telemedicine
WhatsApp automation
Advanced voice
Marketplace
Lab integration
Pharmacy integration
Insurance
Predictive AI
Advanced dashboard customization
Complex patient portal
```

---

# 70. Web + Flutter Architecture Alignment

Both clients should share:

```text
Backend API
Domain concepts
RBAC
Status enums
Validation rules
Localization terminology
Security rules
AI safety rules
Clinical lifecycle
Payment lifecycle
Prescription lifecycle
```

---

# 71. Platform-Specific Responsibilities

## Web

Optimize for:

```text
Large screens
Tables
Keyboard
Multi-column workflows
High information density
Staff operations
Reports
Administration
```

## Flutter

Optimize for:

```text
Mobility
Touch
Camera/files
Voice
Offline
Quick doctor workflows
```

---

# 72. Shared Backend Contract

The web application should consume the same API defined in:

**Document 10 — Complete Endpoint-by-Endpoint API Contract**

No web-specific business logic should bypass the backend domain rules.

---

# 73. Shared Security Model

Web implementation must follow:

**Document 22 — Flutter Security, Privacy & Data Protection**

adapted for browser security.

Key principles:

```text
Backend authorization
Chamber isolation
Secure session
Minimal data exposure
Safe AI
Clinical integrity
Auditability
```

---

# 74. Shared Localization Model

Web implementation must follow:

**Document 27 — Flutter Localization, Internationalization, Bangla/English & Bangladesh-Specific UX**

with the same terminology glossary.

---

# 75. Shared Forms Architecture

Web forms should align with:

**Document 26 — Forms, Validation, Input Handling & User Interaction**

using web equivalents of:

```text
Validation
Dirty state
Autosave
Server errors
Conflict handling
Draft recovery
```

---

# 76. Shared Networking Architecture

Web API implementation should follow:

**Document 24 — Flutter Networking, API Error Handling & Resilience**

adapted for:

```text
Browser
Cookies/token storage strategy
HTTP cache
AbortController
Browser connectivity
```

---

# 77. Shared Navigation Architecture

Web routing should follow the principles of:

**Document 25 — Navigation, Routing, Deep Linking & Application Shell**

with Next.js routing conventions.

---

# 78. Final Web Architecture

```text
                     WEB APPLICATION
                            │
                    ┌───────▼───────┐
                    │   Next.js     │
                    └───────┬───────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
   Presentation          State              Localization
       │                    │                    │
       ▼                    ▼                    ▼
   Components        TanStack Query       English / Bangla
       │                    │
       └──────────────┬─────┘
                      ▼
                Feature Layer
                      │
                      ▼
                 Repository
                      │
                      ▼
                  API Client
                      │
                      ▼
               NestJS Backend
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    PostgreSQL      Redis       Object Storage
```

---

# 79. Final Sprint Plan

```text
SPRINT 1
Foundation & Application Shell

SPRINT 2
Authentication & Onboarding

SPRINT 3
Doctor, Chamber & Schedule

SPRINT 4
Staff, Roles & Permissions

SPRINT 5
Patient Management

SPRINT 6
Appointments & Queue

SPRINT 7
Consultation Workspace

SPRINT 8
Medicines & Prescription

SPRINT 9
Payments & Billing

SPRINT 10
AI Assistant

SPRINT 11
Reports & Notifications

SPRINT 12
Security, Testing & Production
```

---

# 80. Final Product Flow

The completed web application should support:

```text
                    LOGIN
                      │
                      ▼
                 DASHBOARD
                      │
              ┌───────┴────────┐
              │                │
          PATIENTS         APPOINTMENTS
              │                │
              └───────┬────────┘
                      ▼
                   CHECK-IN
                      │
                      ▼
                    QUEUE
                      │
                      ▼
                CONSULTATION
                      │
       ┌──────────────┼──────────────┐
       │              │              │
     VITALS       DIAGNOSIS      INVESTIGATION
       │              │              │
       └──────────────┼──────────────┘
                      ▼
                 AI ASSISTANT
                      │
                      ▼
                 PRESCRIPTION
                      │
                      ▼
                    REVIEW
                      │
                      ▼
                  FINALIZE
                      │
                      ▼
               COMPLETE VISIT
                      │
                      ▼
                   PAYMENT
                      │
                      ▼
                   RECEIPT
                      │
                      ▼
                   REPORTS
```

---

# 81. Final Implementation Principle

The web application should be treated as a **professional medical practice operations platform**, not simply a web version of the mobile application.

The desktop experience should specifically optimize for:

```text
Speed
Information density
Keyboard efficiency
Multi-column workflows
Large patient datasets
Queue operations
Clinical consultation
Prescription creation
Financial reporting
Administration
```

At the same time, it must maintain the same foundational principles as the Flutter application:

```text
Backend-authoritative security
+
Chamber isolation
+
Clinical data integrity
+
Prescription immutability
+
AI safety
+
Bangla/English localization
+
Auditability
+
Reliable API integration
```

The highest-priority web screen is the **Consultation Workspace**, while the highest-priority operational workflow is:

```text
Patient
→ Appointment
→ Check-in
→ Queue
→ Consultation
→ Prescription
→ Payment
```

If these workflows are exceptionally fast, reliable, and easy to use, the web application will provide substantial value to doctors and chamber staff from the first production release.

# End of Document