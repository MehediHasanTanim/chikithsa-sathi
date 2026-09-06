# AI-Powered Doctor Chamber & Prescription Management
## Product Requirements Document (PRD)

**Product Type:** AI-powered Doctor Chamber Management & Clinical Assistant  
**Target Market:** Bangladesh  
**Primary Users:** Doctors, Assistant Doctors, Chamber Staff  
**Platforms:** Mobile + Web  
**Languages:** Bangla + English  
**Document Version:** 1.0  
**Status:** Product Definition

---

# 1. Executive Summary

The application is a Bangladesh-focused digital platform designed to help doctors manage their complete chamber workflow from a single application.

The system combines:

- Doctor and chamber management
- Appointment scheduling
- Daily patient queue management
- Patient clinical records
- Visit history
- Prescription management
- Diagnostic/lab report management
- Payment collection
- Staff and assistant-doctor management
- Clinical documentation
- AI-powered clinical assistance
- AI prescription drafting
- AI report analysis
- Practice analytics
- Patient communication

The platform is intended to replace fragmented workflows involving paper prescriptions, notebooks, spreadsheets, messaging applications and separate appointment/payment systems.

The product should behave as a **digital chamber operating system for doctors**.

---

# 2. Product Vision

> **Build the most practical AI-powered digital chamber assistant for doctors in Bangladesh.**

The platform should enable a doctor to manage multiple chambers, patients, staff, consultations and prescriptions while reducing administrative work and consultation documentation effort.

The core principle is:

**Staff manages operations → Assistant Doctor supports clinical work → Doctor makes clinical decisions → AI assists the doctor.**

---

# 3. Product Goals

## 3.1 Primary Goals

1. Digitize chamber operations.
2. Reduce administrative workload for doctors.
3. Make patient information immediately accessible during consultation.
4. Reduce prescription/documentation time.
5. Provide longitudinal patient history.
6. Allow staff to manage appointments and payments.
7. Allow assistant doctors to participate with controlled permissions.
8. Provide AI-powered clinical assistance.
9. Support Bangla and English workflows.
10. Work reliably in Bangladesh's variable connectivity environment.

## 3.2 Secondary Goals

1. Improve patient experience.
2. Reduce waiting time.
3. Improve follow-up management.
4. Improve practice visibility through analytics.
5. Create a foundation for future telemedicine/lab/pharmacy integrations.

---

# 4. Non-Goals for MVP

The following should NOT be part of the initial MVP:

- Full hospital management system
- Pharmacy inventory management
- Laboratory management system
- Hospital billing
- Insurance management
- Autonomous diagnosis
- Autonomous prescription generation
- Autonomous treatment decisions
- Full telemedicine platform
- Public doctor marketplace
- Large-scale patient social network

These can be considered for future phases.

---

# 5. Target Users

## 5.1 Doctor

The primary product user.

Responsibilities:

- Manage chambers
- Manage staff
- Manage assistant doctors
- Manage patients
- Conduct consultations
- Review clinical history
- Create prescriptions
- Use AI assistance
- Review AI-generated suggestions
- View reports and analytics

---

## 5.2 Assistant Doctor

Supports the primary doctor.

Responsibilities may include:

- Patient history
- Vital signs
- Clinical notes
- Examination
- Diagnosis
- Draft prescription
- AI assistance

Permissions must be configurable by the primary doctor.

---

## 5.3 Chamber Staff

Responsible primarily for administrative operations.

Responsibilities:

- Patient registration
- Appointment management
- Check-in
- Queue management
- Token management
- Payment collection
- Receipt generation
- Patient communication

Staff should not have access to restricted clinical information unless explicitly permitted.

---

## 5.4 Platform Administrator

Responsible for platform-level operations.

Responsibilities:

- Doctor management
- Verification
- Subscription management
- Platform configuration
- Support
- Security monitoring
- AI usage monitoring
- System health

---

# 6. Core Product Workflow

```text
Doctor Signup
      ↓
Mobile Verification
      ↓
Doctor Onboarding
      ↓
Professional Profile
      ↓
Professional Verification
      ↓
Create Chamber
      ↓
Configure Schedule
      ↓
Add Staff
      ↓
Add Assistant Doctor
      ↓
Register Patient
      ↓
Create Appointment
      ↓
Patient Check-in
      ↓
Daily Queue
      ↓
Vitals / History
      ↓
Consultation
      ↓
AI Assistance
      ↓
Diagnosis
      ↓
Prescription Draft
      ↓
Doctor Review
      ↓
Final Prescription
      ↓
Payment
      ↓
Prescription Delivery
      ↓
Follow-up
      ↓
Patient History
      ↓
Reports & Analytics
```

---

# 7. Doctor Signup Requirements

## 7.1 Account Creation

The doctor should be able to create an account using:

- Mobile number
- OTP
- Optional email
- Password or passwordless authentication
- Preferred language
- Terms and privacy consent

### Required

- Mobile number
- OTP verification
- Name
- Acceptance of terms

---

# 8. Doctor Onboarding

The onboarding process should be guided and progressive.

## Step 1 — Account

- Mobile number
- OTP
- Password/security setup

## Step 2 — Doctor Profile

- Name
- Profile photo
- Professional title
- Gender
- Contact information

## Step 3 — Professional Information

- Specialty
- Sub-specialty
- Qualifications
- Degrees
- Certifications
- Years of experience
- BMDC number
- Hospital affiliations

## Step 4 — Professional Verification

Verification states:

```text
Not Submitted
     ↓
Pending
     ↓
Under Review
     ↓
Verified
```

Alternative states:

```text
Verification Failed
Requires Manual Review
Suspended
```

## Step 5 — First Chamber

Doctor enters:

- Chamber name
- Address
- Area
- City
- Contact number
- Consultation fee
- Follow-up fee

## Step 6 — Chamber Schedule

Doctor configures:

- Working days
- Start time
- End time
- Breaks
- Appointment duration
- Maximum patients
- Walk-in capacity

## Step 7 — Staff

Doctor can invite chamber staff.

## Step 8 — Assistant Doctor

Optional.

## Step 9 — AI Setup

Doctor configures:

- AI language
- Voice settings
- AI assistance preferences
- Consent/privacy settings

## Step 10 — Completion

The doctor reaches the main dashboard.

Onboarding should remain editable later.

---

# 9. Authentication Requirements

The platform must support:

- Mobile + OTP login
- Password login
- Password reset
- OTP resend
- OTP expiration
- Login throttling
- Session management
- Device management
- Logout from individual device
- Logout from all devices

Future:

- Biometric authentication
- Trusted devices
- Passkeys

---

# 10. Multi-Chamber Management

A doctor may operate multiple chambers.

Each chamber should have independent:

- Address
- Schedule
- Consultation fee
- Staff
- Assistant doctors
- Appointments
- Queue
- Payment records
- Operational configuration

The doctor should be able to switch between chambers easily.

Example:

```text
Dr. Rahman

Chambers
├── Dhanmondi Chamber
├── Uttara Chamber
└── Mirpur Chamber
```

---

# 11. Chamber Schedule

The system should support:

- Weekly schedule
- Multiple sessions per day
- Break periods
- Appointment intervals
- Maximum patients
- Walk-in patients
- Emergency slots
- Holidays
- Temporary closure
- Vacation schedules
- Special schedules

Example:

```text
Saturday

4:00 PM ───────── 7:00 PM
          Consultation

7:00 PM ───────── 7:30 PM
          Break

7:30 PM ───────── 10:00 PM
          Consultation
```

---

# 12. Staff Management

Doctor can:

- Invite staff
- Assign staff to chambers
- Change permissions
- Deactivate staff
- Remove staff
- View activity

Default roles:

- Receptionist
- Chamber Staff
- Billing Staff
- Chamber Manager

Custom roles may be introduced later.

---

# 13. Assistant Doctor

Assistant doctors can be assigned to specific chambers.

Doctor controls whether an assistant can:

- View patient
- Create patient
- View clinical history
- Add vitals
- Add notes
- Add diagnosis
- Draft prescription
- Finalize prescription
- Use AI
- View reports

---

# 14. Role-Based Access Control

Permissions must be granular.

Example:

| Capability | Doctor | Assistant | Staff |
|---|---:|---:|---:|
| Patient Registration | ✓ | ✓ | ✓ |
| Patient Demographics | ✓ | ✓ | ✓ |
| Clinical History | ✓ | Configurable | Restricted |
| Vitals | ✓ | ✓ | Configurable |
| Diagnosis | ✓ | Configurable | ✗ |
| Prescription Draft | ✓ | Configurable | ✗ |
| Final Prescription | ✓ | Configurable | ✗ |
| Payment | ✓ | Configurable | ✓ |
| Financial Reports | ✓ | ✗ | Configurable |
| AI Clinical Assistant | ✓ | Configurable | ✗ |
| AI Prescription | ✓ | Configurable | ✗ |
| Export Data | ✓ | Configurable | Configurable |

---

# 15. Patient Management

Each patient receives a unique patient identifier.

Example:

```text
PAT-00012345
```

Patient profile should contain:

- Name
- Mobile
- Gender
- Date of birth
- Age
- Address
- Guardian
- Emergency contact
- Blood group
- Occupation
- Notes

---

# 16. Patient Search

Search by:

- Patient ID
- Name
- Mobile number
- Partial mobile number
- Date of birth

Search should be extremely fast because it will be used during live consultations.

---

# 17. Duplicate Patient Detection

The system should detect possible duplicate patients using:

- Mobile number
- Name
- Date of birth
- Other identifying information

The system should suggest:

> Possible duplicate patient found.

Doctor/admin can merge records according to permissions.

---

# 18. Patient Clinical Record

Patient record should provide a unified timeline:

```text
Patient
│
├── Demographics
├── Allergies
├── Medical History
├── Medication History
├── Visit History
├── Prescription History
├── Diagnostic Reports
├── Vital Trends
├── Payments
└── Follow-ups
```

---

# 19. Appointment Management

Appointment creation should support:

- Existing patient
- New patient
- Chamber
- Date
- Time
- Token
- Appointment type
- Notes

Statuses:

```text
Scheduled
Confirmed
Arrived
Checked-in
Waiting
In Consultation
Completed
Cancelled
No Show
```

---

# 20. Daily Queue

The daily queue is a core chamber feature.

The system should support:

- Token number
- Patient name
- Appointment time
- Check-in
- Queue position
- Skip
- Recall
- Move
- No-show
- Emergency priority
- Walk-in

Example:

```text
CURRENT TOKEN: 18

17  Completed
18  In Consultation
19  Waiting
20  Waiting
21  Waiting
```

---

# 21. Smart Queue

Future advanced functionality:

- Estimated waiting time
- Current token
- Queue position
- Doctor delay
- Patient notification
- Dynamic ETA

---

# 22. Patient Encounter

Each consultation creates an encounter.

Core structure:

```text
Chief Complaint
      ↓
History
      ↓
Vitals
      ↓
Examination
      ↓
Diagnosis
      ↓
Investigation
      ↓
Prescription
      ↓
Advice
      ↓
Follow-up
```

---

# 23. Clinical History

The system should support:

### Present History

- Chief complaint
- Duration
- History of present illness
- Associated symptoms

### Past History

- Chronic diseases
- Previous illnesses
- Surgery
- Hospitalization
- Family history
- Social history

### Allergy

- Drug allergy
- Food allergy
- Other allergy
- Reaction

### Medication

- Current medication
- Previous medication
- Long-term medication
- Adherence notes

---

# 24. Vitals

Supported vitals:

- Weight
- Height
- BMI
- Blood pressure
- Pulse
- Temperature
- SpO2
- Respiratory rate
- Blood glucose

Historical values should be retained.

---

# 25. Vital Trends

Doctors should be able to see trends such as:

```text
Blood Pressure
Visit 1 → Visit 2 → Visit 3 → Visit 4

Weight
Visit 1 → Visit 2 → Visit 3 → Visit 4
```

Charts should support configurable date ranges.

---

# 26. Diagnosis

Support:

- Primary diagnosis
- Secondary diagnosis
- Differential diagnosis
- Clinical notes
- Diagnosis history
- Search

Future versions may support standardized diagnostic coding.

---

# 27. Investigation

Investigation categories:

- Blood
- Urine
- Imaging
- X-Ray
- CT
- MRI
- Ultrasound
- ECG
- Other

---

# 28. Diagnostic Report Management

Doctors/staff can upload:

- PDF
- Image
- Scanned document
- Lab report
- Imaging report
- ECG report

Metadata:

- Report type
- Date
- Diagnostic center
- Result
- Notes
- Related encounter

---

# 29. Prescription

Prescription must support:

- Medicine
- Generic
- Brand
- Strength
- Dosage
- Route
- Frequency
- Duration
- Quantity
- Before/after food
- PRN
- Special instructions

---

# 30. Medicine Management

Doctors can maintain:

- Favorite medicines
- Frequently prescribed medicines
- Preferred dosage
- Preferred duration
- Preferred instructions

Search:

```text
Generic
Brand
Strength
Dosage form
```

---

# 31. Prescription Templates

Doctors can:

- Create template
- Edit template
- Duplicate template
- Delete template
- Apply template
- Modify template before finalization

---

# 32. Prescription History

Doctor can:

- View previous prescriptions
- Compare prescriptions
- Copy previous prescription
- See changes
- View prescription versions

Every finalized prescription must be auditable.

---

# 33. Prescription PDF

Prescription should include:

- Doctor information
- Qualifications
- BMDC information
- Chamber
- Patient
- Date
- Diagnosis
- Medicines
- Advice
- Follow-up
- Prescription ID
- Doctor signature
- QR verification

---

# 34. Prescription Verification

Each prescription may contain a QR code.

Scanning the QR should open a secure verification page.

Only minimum required information should be exposed.

---

# 35. Payment Management

Staff can record:

- Consultation fee
- Follow-up fee
- Discount
- Additional charges
- Paid amount
- Due amount
- Payment method

Payment methods:

- Cash
- Card
- Mobile financial services
- Bank transfer

---

# 36. Receipt

Receipt contains:

- Receipt number
- Patient
- Doctor
- Chamber
- Visit
- Amount
- Discount
- Paid
- Due
- Payment method
- Date/time

---

# 37. Follow-up

Doctor can specify:

- Follow-up date
- Follow-up period
- Reason
- Instructions

The system can generate reminders.

---

# 38. Doctor Dashboard

The dashboard should provide:

```text
Today's Chambers
Today's Appointments
Current Queue
Patients Seen
Pending Patients
Today's Revenue
Follow-ups
```

Quick actions:

- Add patient
- Search patient
- Open queue
- Start consultation
- Create prescription
- AI assistant

---

# 39. Consultation Workspace

The consultation screen is one of the most important screens in the application.

The doctor should be able to see:

```text
Patient Header
────────────────────────
Name | Age | Gender | ID
Allergy | Important Alerts

Vitals
────────────────────────

Clinical History
────────────────────────

Previous Visits
────────────────────────

Reports
────────────────────────

Diagnosis
────────────────────────

Prescription
────────────────────────

AI Assistant
────────────────────────

Follow-up
────────────────────────
```

The objective is:

> **Minimum clicks during consultation.**

---

# 40. AI Clinical Assistant

The doctor can communicate with an AI assistant.

Possible requests:

- Summarize patient history
- Explain clinical concepts
- Compare previous visits
- Analyze medication changes
- Explain laboratory values
- Generate patient-friendly explanations
- Suggest questions to consider
- Draft clinical notes

The AI must clearly distinguish:

- Patient facts
- AI-generated interpretation
- Suggestions

---

# 41. Patient-Specific AI

When authorized, AI may access relevant patient information.

Example:

> "Summarize this patient's last six visits."

AI returns:

```text
Patient Summary

History:
...

Recent diagnoses:
...

Medication changes:
...

Important investigations:
...

Recent trends:
...

Items requiring physician review:
...
```

---

# 42. AI Patient Timeline

AI can convert fragmented records into a timeline.

Example:

```text
Jan 2026
Hypertension diagnosed

Mar 2026
BP elevated
Medication adjusted

Jun 2026
BP improved

Aug 2026
Follow-up
```

---

# 43. AI Prescription Assistant

Input:

```text
Symptoms
+
History
+
Vitals
+
Diagnosis
+
Investigations
+
Existing Medication
```

AI generates a **draft**.

Workflow:

```text
Patient Data
     ↓
AI
     ↓
Suggested Prescription
     ↓
Doctor Review
     ↓
Doctor Edit
     ↓
Doctor Approval
     ↓
Final Prescription
```

### Critical Requirement

AI must **never automatically finalize or issue a prescription**.

The doctor must explicitly approve the final prescription.

---

# 44. AI Prescription Safety

Potential warnings:

- Drug interaction
- Duplicate medication
- Allergy conflict
- Existing medication conflict
- Possible contraindication
- Dose concern

Warnings are advisory and must be reviewed by the doctor.

---

# 45. AI Diagnostic Report Analyzer

The AI may:

- Extract report values
- Identify abnormal values
- Summarize report
- Compare previous reports
- Highlight significant changes
- Generate questions for physician review

Example:

```text
Report Summary

Hb: ...
WBC: ...
Platelet: ...

Potentially abnormal:
...

Compared with previous:
...

AI interpretation:
...
```

AI output must always be clearly labeled.

---

# 46. AI Voice Clinical Notes

The system should support:

- Bangla
- English
- Bangla-English mixed speech

Example:

Doctor speaks:

> "Patient-er dui din dhore fever, temperature 102, BP 130/85..."

AI converts this into structured clinical information.

The doctor must review the generated notes before saving them as official clinical records.

---

# 47. AI Clinical Documentation

AI may draft:

- History
- Examination notes
- Clinical summary
- Patient instructions
- Follow-up instructions
- Referral notes

Official records require doctor review.

---

# 48. Bangla & English

The application should support:

### UI

- Bangla
- English

### Clinical Documentation

- Bangla
- English
- Mixed

### AI

- Bangla responses
- English responses
- Mixed responses

### Voice

- Bangla speech
- English speech
- Mixed speech

---

# 49. Patient Communication

Supported communication:

- SMS
- WhatsApp
- Push notification
- Email

Use cases:

- Appointment confirmation
- Appointment reminder
- Queue update
- Prescription notification
- Follow-up reminder
- Payment receipt

---

# 50. Patient Portal

Patients may eventually access:

- Profile
- Appointments
- Prescriptions
- Reports
- Visit history
- Payments
- Follow-ups

Doctors control what information becomes visible.

---

# 51. Offline-First

The chamber application should continue functioning during temporary internet outages.

Potential offline functionality:

- Today's appointments
- Patient search
- Queue
- Vitals
- Clinical notes
- Prescription drafting

Architecture:

```text
Local Database
      ↓
Offline Operations
      ↓
Sync Queue
      ↓
Internet Available
      ↓
Backend Synchronization
```

Conflict resolution must be explicitly designed.

---

# 52. Backup & Export

Doctors should be able to export:

- Patients
- Visits
- Prescriptions
- Reports
- Appointments
- Financial data

Formats:

- PDF
- CSV
- JSON

Future:

- Google Drive
- OneDrive
- Dropbox

---

# 53. Audit Logging

The system must record important actions.

Example:

```text
User: Assistant Doctor
Action: Updated Patient Vitals
Patient: PAT-00012345
Time: 2026-09-03 16:20
```

Prescription audit example:

```text
Draft Created
      ↓
Modified
      ↓
Reviewed
      ↓
Approved
      ↓
Finalized
```

---

# 54. Security

Requirements:

- TLS
- Encryption at rest
- Secure authentication
- OTP protection
- RBAC
- Fine-grained authorization
- Secure document storage
- Session management
- Audit logs
- Backup/recovery
- Data access controls
- AI data minimization

---

# 55. AI Data Privacy

Only the minimum necessary patient information should be sent to AI services.

The system should maintain:

```text
AI Request
   ↓
Permission Check
   ↓
Data Filtering
   ↓
Context Construction
   ↓
AI Service
   ↓
Response
```

The application should not expose unrelated patient information to an AI request.

---

# 56. Reports & Analytics

## Patient Analytics

- New patients
- Returning patients
- Unique patients
- Patient growth
- Age distribution
- Gender distribution

## Chamber Analytics

- Daily patient volume
- Average patients/day
- Peak hours
- Appointment utilization
- No-show rate

## Financial Analytics

- Daily revenue
- Weekly revenue
- Monthly revenue
- Chamber revenue
- Payment-method breakdown
- Discounts
- Outstanding amounts

---

# 57. Clinical Analytics

Potential analytics:

- Common diagnoses
- Diagnosis trends
- Frequently prescribed medicines
- Investigation frequency
- Follow-up rate
- Follow-up compliance
- Vital trends

Clinical analytics should be presented as practice-level information and should not replace clinical judgment.

---

# 58. AI Practice Intelligence

Future AI capabilities:

- Predict patient volume
- Identify peak hours
- Recommend schedule changes
- Analyze no-show patterns
- Generate monthly practice summaries
- Explain revenue trends
- Identify follow-up patterns

Example:

> "Tuesday between 6 PM and 8 PM has the highest patient demand over the last three months."

---

# 59. Notification Center

Notifications include:

- Appointment
- Cancellation
- Queue
- Payment
- Follow-up
- Staff invitation
- Verification
- AI processing
- Security alerts

---

# 60. Global Search

Global search should cover:

- Patients
- Visits
- Prescriptions
- Reports
- Appointments
- Staff
- Chambers

---

# 61. Chamber Queue Display

Optional TV/monitor mode:

```text
NOW CONSULTING

TOKEN 18

NEXT
19
20
21
```

Doctor status:

```text
Doctor is currently consulting
Estimated wait: 25 minutes
```

---

# 62. Staff Dashboard

Staff dashboard should focus on operational tasks:

```text
Today's Appointments
Current Queue
New Patients
Check-ins
Payments
Pending Follow-ups
Doctor Status
```

---

# 63. Subscription

Possible plans:

### Free / Trial

Limited:

- 1 chamber
- Limited patients
- Basic prescription
- Basic reports

### Basic

- Multiple patients
- Staff
- Appointment management
- Prescription management

### Professional

- Multiple chambers
- Assistant doctors
- Advanced reports
- AI features
- Patient communication

### Premium

- Advanced AI
- Voice
- Advanced analytics
- Offline sync
- Larger storage

### Enterprise

For:

- Clinics
- Medical centers
- Multi-doctor organizations

Actual pricing should be determined separately through market validation.

---

# 64. Platform Administration

Admin portal should provide:

### Doctor Management

- Search doctors
- View profile
- Verification
- Activate/deactivate
- Support

### Platform Metrics

- Registered doctors
- Active doctors
- Chambers
- Patients
- Consultations
- AI requests
- Storage usage

### Subscription

- Plans
- Subscriptions
- Usage
- Revenue

### System

- AI health
- Notification health
- Storage health
- API health
- Audit/security monitoring

---

# 65. MVP Scope

The MVP should focus on the **core chamber workflow**.

## Authentication

- Doctor signup
- Mobile OTP
- Login
- Profile
- Professional information
- Basic verification

## Chamber

- Create chamber
- Multiple chambers
- Schedule
- Chamber settings

## Users

- Staff invitation
- Assistant doctor
- Basic RBAC

## Patient

- Registration
- Search
- Patient ID
- Patient profile
- Basic clinical history

## Appointment

- Create appointment
- Reschedule
- Cancel
- Check-in
- Queue
- Token

## Clinical

- Encounter
- Complaint
- History
- Vitals
- Diagnosis
- Clinical notes

## Prescription

- Medicine search
- Prescription
- Favorites
- Templates
- History
- PDF

## Reports

- Diagnostic report upload
- Report history

## Payment

- Fee
- Discount
- Payment
- Receipt

## AI

- Clinical AI chat
- Patient history summary
- AI prescription draft
- AI clinical note draft
- Basic report summary

## Security

- RBAC
- Authentication
- Audit logging
- Secure document storage

---

# 66. Phase 2

Phase 2 should add:

- Bangla voice
- English voice
- Mixed Bangla-English voice
- Advanced report analysis
- AI safety checks
- Drug interaction support
- Advanced prescription templates
- Automated follow-up
- SMS
- WhatsApp
- Patient portal
- Offline-first synchronization
- Cloud backup
- Advanced analytics
- Smart queue
- Queue display
- Practice intelligence

---

# 67. Phase 3

Future ecosystem:

- Public doctor profile
- Doctor discovery
- Online appointment booking
- Telemedicine
- Lab integration
- Pharmacy integration
- Hospital integration
- Digital prescription ecosystem
- Patient health records
- Family health management
- Insurance integrations
- Advanced clinical AI

---

# 68. Critical AI Safety Principle

The following architecture is mandatory:

```text
Patient Data
     ↓
AI Processing
     ↓
AI Suggestion
     ↓
Doctor Review
     ↓
Doctor Modification
     ↓
Doctor Approval
     ↓
Final Clinical Record
```

Never:

```text
Patient Data
     ↓
AI
     ↓
Automatic Prescription
```

The AI is a **clinical assistant**, not an autonomous doctor.

---

# 69. Core Product Metrics

## Doctor Metrics

- Monthly active doctors
- Daily active doctors
- Retention
- Average consultations/day
- Chambers per doctor

## Patient Metrics

- Patients registered
- Returning patients
- Follow-up rate

## Operational Metrics

- Average waiting time
- Average consultation time
- No-show rate
- Queue completion rate

## AI Metrics

- AI requests
- AI prescription drafts
- AI suggestions accepted
- AI suggestions edited
- AI-generated notes accepted
- AI report analyses

## Business Metrics

- Free → paid conversion
- Monthly recurring revenue
- Churn
- Average revenue per doctor

---

# 70. MVP Success Criteria

The MVP should be considered successful if a doctor can complete the entire chamber workflow without external tools:

```text
Login
 ↓
Open Chamber
 ↓
View Appointments
 ↓
Manage Queue
 ↓
Open Patient
 ↓
Review History
 ↓
Record Vitals
 ↓
Consult
 ↓
Use AI
 ↓
Create/Review Prescription
 ↓
Finalize
 ↓
Collect Payment
 ↓
Send Prescription
```

The doctor should not need paper, spreadsheet or a separate prescription application for the normal chamber workflow.

---

# 71. Recommended Product Priorities

## P0 — Critical

- Doctor signup
- Onboarding
- Chamber
- Staff
- RBAC
- Patient
- Appointment
- Queue
- Consultation
- Prescription
- Payment
- Security

## P1 — High

- AI clinical assistant
- AI prescription draft
- AI patient summary
- Diagnostic reports
- Prescription templates
- Follow-up
- Basic analytics

## P2 — Important

- Voice
- Smart queue
- Patient portal
- SMS
- WhatsApp
- Offline mode
- Advanced AI

## P3 — Future

- Telemedicine
- Lab integration
- Pharmacy integration
- Doctor marketplace
- Hospital integration
- Healthcare ecosystem

---

# 72. Key Product Differentiators

The product should differentiate itself through:

### 1. Multi-Chamber

Designed specifically for doctors who practice at multiple locations.

### 2. Staff-First Operations

Reception staff can manage the operational workflow while the doctor focuses on patients.

### 3. Fast Consultation

The consultation workspace should be optimized for speed.

### 4. AI Prescription Assistant

AI reduces prescription/documentation workload while keeping the doctor in control.

### 5. Patient Intelligence

AI can understand the patient's longitudinal history rather than only the current visit.

### 6. Bangla Voice

Doctors can document naturally using Bangla, English or mixed speech.

### 7. Offline-First

The system remains usable when chamber internet connectivity is unreliable.

### 8. Bangladesh-Focused

The product should understand local workflows, terminology, payment methods and communication patterns.

---

# 73. Product Architecture Direction

The product should eventually be organized around these major domains:

```text
Identity & Access
       │
       ├── Doctor
       ├── Staff
       └── Assistant
       
Practice Management
       │
       ├── Chamber
       ├── Schedule
       └── Staff
       
Patient Management
       │
       ├── Patient
       ├── History
       ├── Encounter
       └── Reports
       
Appointment
       │
       ├── Booking
       ├── Check-in
       └── Queue
       
Clinical
       │
       ├── Vitals
       ├── Diagnosis
       ├── Investigation
       └── Prescription
       
Billing
       │
       ├── Payment
       └── Receipt
       
AI
       │
       ├── Clinical Assistant
       ├── Prescription Assistant
       ├── Patient Summary
       ├── Report Analyzer
       └── Voice Documentation
       
Analytics
       │
       ├── Clinical
       ├── Operational
       └── Financial
       
Platform
       │
       ├── Subscription
       ├── Notification
       ├── Audit
       └── Administration
```

---

# 74. Recommended Next Product-Design Step

After this PRD, the next document should be the:

## Detailed Functional Specification

It should break every module into:

```text
Feature
  ↓
User Story
  ↓
Preconditions
  ↓
Main Flow
  ↓
Alternative Flow
  ↓
Validation Rules
  ↓
Business Rules
  ↓
Permissions
  ↓
Error Handling
  ↓
Acceptance Criteria
```

For example:

### Feature: Create Appointment

**Actor:** Doctor / Staff

**Preconditions:**
- User is authenticated.
- User has appointment permission.
- Chamber is active.
- Schedule exists.

**Main Flow:**

1. User selects chamber.
2. User selects date.
3. User searches existing patient.
4. User selects appointment time.
5. System validates slot.
6. User confirms appointment.
7. System generates appointment.
8. System assigns token if applicable.
9. System sends confirmation.

**Acceptance Criteria:**

- Appointment cannot be created outside configured schedule.
- Appointment cannot conflict with an occupied slot unless overbooking is enabled.
- Appointment must belong to a chamber.
- Appointment must belong to a patient.
- Authorized staff can create appointments.
- Unauthorized staff cannot create appointments.

---

# 75. Recommended Documentation Roadmap

The complete product documentation should now be developed in this order:

### Document 1 — PRD
**Completed in this document**

↓

### Document 2 — Detailed Functional Specification
Every feature → user stories → business rules → acceptance criteria.

↓

### Document 3 — MVP vs Advanced Feature Matrix
Clearly identify:
- MVP
- Phase 2
- Phase 3
- Future

↓

### Document 4 — UX/UI Specification
Screen-by-screen:
- Signup
- Onboarding
- Dashboard
- Chamber
- Patient
- Appointment
- Queue
- Consultation
- Prescription
- AI
- Reports
- Settings

↓

### Document 5 — Role & Permission Matrix
Detailed Doctor / Assistant / Staff / Admin permissions.

↓

### Document 6 — Domain Model & Database Design
Entities, relationships, indexes, audit model and multi-chamber data isolation.

↓

### Document 7 — API Specification
REST API modules, endpoints, request/response structures, authentication and authorization.

↓

### Document 8 — Technical Architecture
Flutter/Web + Backend + PostgreSQL + Redis + AI services + object storage + notifications.

↓

### Document 9 — AI Technical Design
RAG, patient context, prompt architecture, safety guardrails, model routing, voice pipeline, AI auditability.

↓

### Document 10 — Phase-wise Implementation Plan
Engineering phases, sprints, dependencies, team structure and milestones.

---

## Recommended immediate next step

**I recommend we proceed with Document 2: the Detailed Functional Specification.**

That will turn the current high-level PRD into something the engineering team can actually implement, starting with **Doctor Signup & Onboarding → Chamber Management → Staff/Assistant → Patient → Appointment → Queue → Consultation → Prescription → AI → Payment → Reports**.