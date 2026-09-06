# Document 19 — Complete Flutter UI Component & Design System Specification

**Project:** AI Chamber & Prescription Management  
**Platform:** Flutter  
**State Management:** Riverpod  
**Architecture:** Clean Architecture + Feature-First  
**Design Approach:** Mobile-first, responsive, accessible, doctor-centric  
**Languages:** Bangla + English  
**Primary Users:** Doctors, Assistant Doctors, Receptionists, Chamber Managers, Billing Staff

---

## 1. Purpose

This document defines the complete UI component library and design system for the Chamber Management Flutter application.

The objectives are to:

- create a consistent visual language;
- maximize development reuse;
- minimize duplicated UI code;
- support doctors working under time pressure;
- support staff operational workflows;
- support Bangla and English;
- provide responsive mobile/tablet/desktop layouts;
- provide accessible components;
- establish consistent loading, empty, error and offline states;
- provide a clear visual distinction between normal clinical data and AI-generated suggestions;
- provide implementation standards for Flutter developers and UI/UX designers.

The design system is a shared foundation used by every feature.

---

# 2. Design Principles

## 2.1 Doctor First

The consultation workflow is the most important experience.

The interface should minimize:

- unnecessary navigation;
- modal interruptions;
- typing;
- repeated patient lookup;
- repeated chamber selection;
- excessive scrolling.

---

## 2.2 Staff First for Operations

Receptionist and chamber staff workflows should prioritize:

- appointment registration;
- patient search;
- check-in;
- queue management;
- payment;
- patient communication.

---

## 2.3 Patient Context Everywhere

When working with a patient, the application should make the following easily available:

- patient name;
- patient ID;
- age;
- gender;
- allergies;
- important conditions;
- current visit;
- previous visits;
- prescriptions;
- investigations.

---

## 2.4 One Primary Action Per Screen

Each screen should have one obvious primary action.

Examples:

| Screen | Primary action |
|---|---|
| Patient Search | Select patient |
| Patient Registration | Save patient |
| Appointment | Book appointment |
| Queue | Call next |
| Consultation | Complete consultation |
| Prescription | Finalize prescription |
| Payment | Record payment |
| AI | Generate suggestion |

---

## 2.5 Progressive Disclosure

Do not display every possible field simultaneously.

Show:

1. essential information;
2. commonly used actions;
3. advanced information when requested.

---

## 2.6 Consistency Over Creativity

New UI patterns should not be introduced unless an existing component cannot solve the requirement.

---

# 3. Technology

Recommended packages:

```yaml
dependencies:
  flutter:
    sdk: flutter

  flutter_riverpod:
  go_router:
  freezed_annotation:
  json_annotation:
  intl:
  flutter_svg:
  cached_network_image:
  shimmer:
  connectivity_plus:
  file_picker:
  image_picker:

dev_dependencies:
  freezed:
  json_serializable:
  build_runner:
```

Additional packages may be introduced only when they solve a clear requirement.

---

# 4. Design System Architecture

```text
UI
│
├── Design Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Elevation
│   ├── Borders
│   ├── Icons
│   └── Motion
│
├── Foundations
│   ├── AppScaffold
│   ├── AppAppBar
│   ├── AppNavigation
│   └── ResponsiveLayout
│
├── Inputs
│   ├── AppTextField
│   ├── AppSearchField
│   ├── AppDropdown
│   ├── AppDatePicker
│   ├── AppTimePicker
│   ├── AppSwitch
│   ├── AppCheckbox
│   └── AppRadio
│
├── Feedback
│   ├── Loading
│   ├── Error
│   ├── Empty
│   ├── Offline
│   ├── Snackbar
│   └── Dialog
│
├── Data Display
│   ├── AppCard
│   ├── AppListTile
│   ├── AppTable
│   ├── AppChip
│   ├── StatusBadge
│   └── Timeline
│
├── Clinical
│   ├── PatientHeader
│   ├── VitalCard
│   ├── AllergyBanner
│   ├── DiagnosisChip
│   ├── InvestigationCard
│   └── PrescriptionMedicineCard
│
├── AI
│   ├── AISection
│   ├── AIResponseCard
│   ├── AIDraftCard
│   ├── AIProcessingIndicator
│   └── AIReviewBanner
│
└── Operational
    ├── QueueCard
    ├── AppointmentCard
    ├── PaymentSummary
    ├── ReceiptCard
    └── StaffPermissionCard
```

---

# 5. Flutter Directory Structure

Recommended structure:

```text
lib/
├── core/
│   ├── design_system/
│   │   ├── theme/
│   │   ├── tokens/
│   │   ├── typography/
│   │   ├── components/
│   │   ├── icons/
│   │   └── responsive/
│   │
│   ├── localization/
│   ├── routing/
│   ├── utils/
│   └── extensions/
│
├── shared/
│   ├── widgets/
│   ├── dialogs/
│   ├── sheets/
│   └── layouts/
│
└── features/
    ├── auth/
    ├── dashboard/
    ├── chambers/
    ├── patients/
    ├── appointments/
    ├── queue/
    ├── consultation/
    ├── prescriptions/
    ├── payments/
    ├── reports/
    ├── notifications/
    └── ai/
```

---

# 6. Design Tokens

All visual values should originate from centralized tokens.

Avoid:

```dart
Padding(
  padding: EdgeInsets.all(17),
)
```

Prefer:

```dart
Padding(
  padding: EdgeInsets.all(AppSpacing.md),
)
```

---

# 7. Spacing System

Use an 8-point base grid.

```text
4   xs
8   sm
12  sm+
16  md
20  md+
24  lg
32  xl
40  xxl
48  xxxl
64  section
```

Recommended constants:

```dart
class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const smMd = 12.0;
  static const md = 16.0;
  static const mdLg = 20.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 40.0;
  static const xxxl = 48.0;
  static const section = 64.0;
}
```

---

# 8. Border Radius

Recommended:

```text
Small controls       6 px
Input fields         8 px
Cards               12 px
Dialogs             16 px
Bottom sheets       20 px
Large containers     24 px
Pills                999 px
```

```dart
class AppRadius {
  static const sm = 6.0;
  static const md = 8.0;
  static const lg = 12.0;
  static const xl = 16.0;
  static const xxl = 20.0;
  static const xxxl = 24.0;
  static const pill = 999.0;
}
```

---

# 9. Color System

The exact brand palette should be finalized by the visual design phase, but the application must define semantic colors rather than feature-specific colors.

```text
Primary
PrimaryContainer
Secondary
SecondaryContainer

Surface
SurfaceVariant
Background
Border
Divider

TextPrimary
TextSecondary
TextDisabled
TextOnPrimary

Success
Warning
Error
Info

AI
AIContainer
AIText

ClinicalAlert
Critical
```

Semantic usage:

| Color | Usage |
|---|---|
| Primary | Main actions |
| Success | Completed/paid/success |
| Warning | Review/pending |
| Error | Failure/critical |
| Info | Informational |
| AI | AI-generated content |
| Critical | Allergies/high-risk warnings |

Do not use color as the only indicator of status.

---

# 10. Clinical Safety Colors

Clinical alerts require stronger visual hierarchy.

Examples:

```text
Allergy
Critical condition
Critical vital
Drug warning
AI review required
```

A clinical warning should include:

- icon;
- text;
- optional severity;
- color;
- sufficient contrast.

Example:

```text
⚠ Allergy
Penicillin
```

---

# 11. Typography

Use a typography scale rather than arbitrary font sizes.

Recommended:

```text
Display Large       32
Display Medium      28
Headline Large      24
Headline Medium     20
Headline Small      18

Title Large         18
Title Medium        16
Title Small         14

Body Large          16
Body Medium         14
Body Small          12

Label Large         14
Label Medium        12
Label Small         11
```

---

# 12. Bangla Typography

The application must support Bangla naturally.

The font strategy must support:

- Bangla Unicode;
- Latin;
- Bangla numerals where applicable;
- mixed Bangla/English content;
- prescription terminology.

Avoid manually positioning text based on assumed character widths.

---

# 13. Text Rules

Use:

- sentence case;
- short labels;
- clear action verbs;
- familiar medical terminology.

Prefer:

```text
Save Prescription
```

over:

```text
Click Here To Save Your Prescription
```

---

# 14. Icon System

Use a consistent icon library.

Icons must:

- have consistent visual weight;
- have semantic meaning;
- include tooltips on desktop where appropriate;
- have accessible labels.

Avoid using emojis as functional icons.

---

# 15. Buttons

Required button variants:

```text
Primary
Secondary
Tertiary
Outlined
Text
Destructive
Icon
Floating Action
```

Example:

```dart
AppButton.primary(
  label: 'Save Prescription',
  onPressed: savePrescription,
)
```

---

# 16. Button States

Every button must support:

```text
Enabled
Pressed
Focused
Disabled
Loading
Success
```

Loading state must prevent duplicate submissions.

---

# 17. Primary Button

Used for the most important action.

Examples:

- Book Appointment
- Check In
- Start Consultation
- Save Prescription
- Finalize Prescription
- Record Payment

---

# 18. Destructive Button

Used for:

- delete;
- remove;
- cancel;
- revoke;
- deactivate.

Destructive actions should normally require confirmation when data loss is possible.

---

# 19. Text Fields

Common variants:

```text
AppTextField
AppSearchField
AppNumberField
AppPhoneField
AppMultilineField
AppPasswordField
```

Each must support:

- label;
- hint;
- helper text;
- validation;
- error;
- prefix;
- suffix;
- enabled/disabled;
- loading where appropriate.

---

# 20. Search Field

Patient search is one of the most important inputs.

Support:

- name;
- phone;
- patient ID;
- Bangla name;
- English name.

Example:

```text
Search patient by name, phone or ID
```

---

# 21. Search UX

Search should:

- debounce;
- show recent results;
- show loading;
- show empty state;
- support clearing;
- cancel stale requests;
- preserve selected chamber context.

---

# 22. Dropdowns

Use dropdowns for:

- gender;
- appointment type;
- payment method;
- frequency;
- duration;
- status.

For long lists, use searchable selection rather than a large dropdown.

---

# 23. Date Picker

Date selection must support:

- locale;
- Bangla/English display;
- minimum/maximum dates;
- appointment availability;
- keyboard input where appropriate.

---

# 24. Time Picker

Time should be displayed according to user preference.

Support:

```text
12-hour format
24-hour format
```

Backend timestamps remain UTC.

---

# 25. Cards

Cards are used for grouped information.

Standard variants:

```text
AppCard
OutlinedCard
InteractiveCard
ClinicalCard
AI Card
SummaryCard
```

Cards should not become nested containers unnecessarily.

---

# 26. Patient Header

The patient header is a globally reusable component.

Example:

```text
┌─────────────────────────────────────┐
│ Rahim Ahmed                         │
│ PID-000123 · 42 yrs · Male          │
│ ⚠ Penicillin Allergy                │
└─────────────────────────────────────┘
```

Available actions:

- patient profile;
- timeline;
- allergies;
- previous prescriptions.

---

# 27. Patient Context Bar

During consultation:

```text
Patient
Rahim Ahmed · 42 yrs

Allergies: Penicillin
Last Visit: 12 Aug 2026
```

The context should remain visible without consuming excessive screen space.

---

# 28. Allergy Banner

Allergies must be visually prominent.

Example:

```text
⚠ IMPORTANT ALLERGY
Penicillin
```

Do not bury allergies inside a secondary tab during consultation.

---

# 29. Status Badge

Reusable statuses:

```text
Booked
Confirmed
Checked In
Waiting
Called
In Consultation
Completed
Cancelled
No Show
Pending
Paid
Refunded
Draft
Review Required
Finalized
Delivered
```

The component should map domain status → semantic visual style.

---

# 30. Chips

Use chips for:

- diagnosis;
- medicine tags;
- filters;
- patient conditions;
- appointment types.

Avoid excessive chip usage.

---

# 31. Tabs

Use tabs when content is genuinely independent.

Examples:

```text
Patient
Overview | Timeline | Prescriptions | Reports
```

Do not use tabs merely to avoid designing a proper layout.

---

# 32. Bottom Navigation

Mobile primary navigation may include:

```text
Dashboard
Appointments
Patients
Queue
More
```

The exact navigation should remain role-aware.

Doctors may prioritize:

```text
Dashboard
Queue
Patients
Reports
More
```

Receptionists may prioritize:

```text
Dashboard
Appointments
Patients
Queue
More
```

---

# 33. Desktop Navigation

Desktop should use:

```text
Sidebar
+
Top App Bar
+
Main Content
```

Example:

```text
┌────────────┬──────────────────────────────┐
│ Dashboard  │ Top Bar                      │
│ Queue      ├──────────────────────────────┤
│ Patients   │                              │
│ Appointments│        Main Content         │
│ Reports    │                              │
│ Settings   │                              │
└────────────┴──────────────────────────────┘
```

---

# 34. Responsive Breakpoints

```text
Mobile:       < 768 px
Tablet:       768–1023 px
Desktop:      >= 1024 px
Large Desktop >= 1440 px
```

Layouts must adapt rather than simply stretch.

---

# 35. Responsive Strategy

Mobile:

```text
Single column
Bottom navigation
Bottom sheets
Compact cards
Sticky primary action
```

Tablet:

```text
Two-column where appropriate
Navigation rail/sidebar
Larger content area
```

Desktop:

```text
Sidebar
Multi-column workspace
Persistent contextual panels
Keyboard shortcuts
```

---

# 36. Consultation Responsive Layout

Desktop:

```text
┌──────────────┬──────────────────────┬───────────────┐
│ Patient      │ Clinical Workspace   │ AI Assistant  │
│ Context      │                      │               │
│              │ Notes                │ Summary       │
│ Timeline     │ Diagnosis            │ Suggestions   │
│              │ Investigation        │ Chat          │
│              │ Prescription         │               │
└──────────────┴──────────────────────┴───────────────┘
```

Tablet:

```text
Patient Context
Clinical Workspace
AI as collapsible panel
```

Mobile:

```text
Patient Header
↓
Vitals
↓
Notes
↓
Diagnosis
↓
Investigation
↓
Prescription
↓
AI
↓
Complete
```

---

# 37. App Scaffold

Create:

```dart
AppScaffold
```

Responsibilities:

- safe area;
- responsive layout;
- app navigation;
- page body;
- bottom navigation;
- desktop sidebar;
- global overlays.

Feature screens should not duplicate scaffold logic.

---

# 38. App AppBar

Standard features:

- title;
- subtitle;
- back button;
- chamber selector;
- notification button;
- profile menu;
- action menu.

---

# 39. Chamber Selector

The selected chamber is critical application context.

Example:

```text
🏥 Dhanmondi Chamber
     ▼
```

Switching chambers should clearly indicate:

```text
Switching chamber...
```

Old chamber data must not remain visually active during transition.

---

# 40. Dashboard Components

Dashboard should provide:

```text
Today's appointments
Waiting patients
Current patient
Today's revenue
Completed consultations
Follow-ups
Alerts
```

Doctor dashboard should emphasize clinical operations.

Staff dashboard should emphasize operations.

---

# 41. Appointment Card

Example:

```text
09:30 AM
Rahim Ahmed
PID-000123

New Patient
Confirmed

[Check In]
```

Possible states:

```text
Upcoming
Checked In
In Queue
In Consultation
Completed
Cancelled
No Show
```

---

# 42. Queue Card

Example:

```text
#07
Rahim Ahmed
42 yrs · Male

Waiting · 12 min

[Call]
```

For current patient:

```text
#07
Rahim Ahmed

IN CONSULTATION

[Open Consultation]
```

---

# 43. Queue Screen

Required sections:

```text
Current Patient
Waiting
Called
In Consultation
Completed
```

Display summary counts:

```text
Waiting  08
Called   01
Done     14
```

---

# 44. Consultation Workspace

The consultation screen is the highest-priority screen.

Recommended structure:

```text
Patient Header

Vitals
Clinical Notes
Diagnosis
Investigations
Prescription

AI Assistant

Follow-up

Complete Consultation
```

---

# 45. Sticky Consultation Actions

On mobile, the primary action should remain accessible.

Example:

```text
┌─────────────────────────────────────┐
│       Complete Consultation         │
└─────────────────────────────────────┘
```

It must not hide important content.

---

# 46. Vitals Component

Support:

```text
Blood Pressure
Heart Rate
Temperature
Weight
Height
SpO2
BMI
```

Example:

```text
BP             120/80 mmHg
Pulse          76 bpm
Temperature    98.4 °F
Weight         68 kg
SpO₂            98%
```

---

# 47. Vital Trend Component

Display historical trends using simple charts.

Examples:

- weight;
- blood pressure;
- temperature;
- pulse;
- SpO2.

Charts must have readable labels and accessible alternatives.

---

# 48. Clinical Notes Editor

Support:

```text
Chief Complaint
History
Examination
Assessment
Plan
Additional Notes
```

The editor must support:

- autosave;
- draft state;
- saving indicator;
- offline draft where supported;
- conflict handling.

---

# 49. Diagnosis Component

Features:

- search;
- recent diagnoses;
- favorites;
- ICD information if supported;
- add/remove;
- primary diagnosis.

Example:

```text
Diagnosis

[ Search diagnosis... ]

Hypertension              Primary
Type 2 Diabetes           Secondary
```

---

# 50. Investigation Component

Support:

```text
Search investigation
Add investigation
Mark requested
Attach report later
```

Example:

```text
Investigations

CBC                         Requested
HbA1c                       Requested
Lipid Profile               Requested
```

---

# 51. Diagnostic Report Card

Example:

```text
CBC
12 Aug 2026

Status: Available

[View Report]
[Analyze with AI]
```

---

# 52. Prescription UI

Prescription should be optimized for speed.

Example:

```text
Prescription

+ Add Medicine

1. Napa 500 mg
   1 tablet · 3 times/day · 5 days

2. Omeprazole 20 mg
   1 capsule · Before breakfast · 7 days
```

---

# 53. Medicine Card

Display:

```text
Medicine Name
Strength
Form

Dose
Frequency
Duration
Instructions
```

Example:

```text
Napa
500 mg · Tablet

1 tablet
3 times daily
5 days

After meal
```

---

# 54. Add Medicine Sheet

Use a bottom sheet on mobile.

Sections:

```text
Search medicine

Medicine
Strength
Dose
Frequency
Duration
Instructions
```

Primary action:

```text
Add Medicine
```

---

# 55. Favorite Medicine

Doctors can quickly select commonly prescribed medicines.

Example:

```text
Favorites

Napa
Azithromycin
Omeprazole
Fexo
```

---

# 56. Prescription Review

Before finalization show:

```text
Patient
Diagnosis
Medicines
Instructions
Follow-up
```

Prominent warning:

```text
Review prescription carefully before finalizing.
```

---

# 57. Prescription Finalization

Finalization is a high-confidence action.

Button:

```text
Finalize Prescription
```

Confirmation:

```text
Once finalized, the prescription cannot be directly edited.

[Cancel]
[Finalize]
```

After finalization:

```text
FINALIZED
```

All fields become read-only.

---

# 58. AI Visual Language

AI components must be visually distinguishable from normal clinical content.

Use:

```text
AI icon
AI label
AI Generated badge
Review Required badge
```

Never make AI content visually indistinguishable from doctor-entered content.

---

# 59. AI Generated Label

Every AI-generated clinical suggestion should display:

```text
AI Generated
Review Required
```

---

# 60. AI Patient Summary

Example:

```text
AI Patient Summary

Patient has a history of hypertension
and diabetes. Recent BP readings show...

AI Generated
Review Required

[Use in Notes]
```

Using the suggestion must be an explicit user action.

---

# 61. AI Prescription Draft

Example:

```text
AI Prescription Suggestion

Suggested:
Napa 500 mg
1 tablet · 3 times/day

Omeprazole 20 mg
1 capsule · once daily

AI Generated
Review Required

[Review Draft]
```

AI must never display:

```text
Prescription finalized automatically
```

---

# 62. AI Chat

Chat layout:

```text
Doctor:
What are possible causes of this symptom?

AI:
Based on the provided clinical context...

AI Generated
```

Clinical AI responses should include appropriate safety messaging where required.

---

# 63. AI Processing State

Example:

```text
AI is analyzing patient information...

● ● ●
```

For longer operations:

```text
Analyzing...
This may take a few seconds.
```

---

# 64. AI Error State

Example:

```text
Unable to generate AI suggestion.

Your clinical information has not been changed.

[Try Again]
```

---

# 65. AI Apply Action

Never use ambiguous actions such as:

```text
Apply
```

Prefer:

```text
Add to Clinical Notes
Add to Prescription Draft
Use as Reference
```

---

# 66. Payment Components

Payment summary:

```text
Consultation Fee     ৳800
Discount             ৳100
-------------------------
Total                ৳700
```

Payment methods:

```text
Cash
Card
Mobile Banking
Other
```

---

# 67. Receipt Component

Receipt should contain:

```text
Chamber
Doctor
Patient
Receipt Number
Date
Service
Amount
Payment Method
```

---

# 68. Notification Components

Notification types:

```text
Appointment
Queue
Payment
Prescription
System
AI
```

Unread notifications should have a clear visual indicator.

---

# 69. Empty States

Every list screen must define an empty state.

Example:

```text
No patients found

Try searching by patient name,
phone number or patient ID.
```

Include a primary action when useful:

```text
[Register Patient]
```

---

# 70. Loading States

Use appropriate loading patterns.

Short operation:

```text
CircularProgressIndicator
```

List:

```text
Skeleton/Shimmer
```

Full page:

```text
Loading content...
```

Avoid unnecessary full-screen spinners.

---

# 71. Error States

Every network-backed screen must support:

```text
Error message
Retry
Optional diagnostic information
```

Example:

```text
Couldn't load today's queue.

[Retry]
```

---

# 72. Offline State

Use a persistent but unobtrusive indicator:

```text
Offline
```

When data is cached:

```text
Offline · Showing saved data
```

For blocked operations:

```text
This action requires an internet connection.
```

---

# 73. Snackbar

Use Snackbar for lightweight feedback.

Examples:

```text
Patient saved
Prescription draft saved
Payment recorded
```

Do not use Snackbar for critical clinical warnings.

---

# 74. Dialog

Dialogs should be used for:

- confirmation;
- destructive actions;
- critical warnings;
- short decisions.

Avoid multi-step workflows inside dialogs.

---

# 75. Bottom Sheets

Ideal for mobile:

- medicine entry;
- filters;
- appointment options;
- patient actions;
- queue actions.

Bottom sheets should not become full application screens.

---

# 76. Full-Screen Modal

Use for:

- complex forms;
- document preview;
- image/document viewing;
- prescription preview.

---

# 77. Timeline Component

Patient timeline:

```text
12 Aug 2026
Consultation
Diagnosis
Prescription
Payment

02 Jul 2026
Consultation
Investigation
```

Timeline entries should link directly to the relevant record.

---

# 78. Patient Profile Components

Patient profile should contain:

```text
Basic Information
Allergies
Conditions
Vitals
Visit History
Prescriptions
Investigations
Reports
Payments
```

---

# 79. Table Component

Desktop reports can use tables.

Example:

```text
Patient     Visit Date    Fee       Status
Rahim       12 Aug        ৳800      Paid
Karim       12 Aug        ৳800      Paid
```

Mobile should transform tables into cards or horizontal scrolling only when necessary.

---

# 80. Pagination Component

Support:

```text
Load More
Next / Previous
Cursor pagination
```

Prefer infinite/load-more patterns for mobile lists.

---

# 81. Filter Component

Reusable filters:

```text
Date
Status
Doctor
Appointment Type
Payment Method
```

Display active filters clearly.

---

# 82. Sort Component

Support:

```text
Newest
Oldest
Name
Appointment Time
Amount
```

---

# 83. Permission-Aware Components

Components may receive permissions:

```dart
AppButton.primary(
  label: 'Record Payment',
  enabled: permissions.canRecordPayment,
)
```

However:

**UI permissions are not security boundaries.**

Backend authorization remains authoritative.

---

# 84. Role-Specific UI

Doctor:

```text
Consultation
Prescription
AI
Clinical Reports
```

Receptionist:

```text
Appointments
Patients
Queue
Payments
```

Billing:

```text
Payments
Receipts
Revenue
```

Manager:

```text
Staff
Reports
Analytics
Settings
```

---

# 85. Form Design

Forms should:

- group related fields;
- show required fields;
- validate near the field;
- preserve user input after errors;
- avoid unnecessary fields;
- support keyboard navigation.

---

# 86. Form Validation

Validation should be:

```text
Immediate where helpful
On submit for required fields
Server-confirmed for business rules
```

Example:

```text
Phone number is required.
```

rather than:

```text
Invalid input.
```

---

# 87. Keyboard Handling

Mobile forms must:

- scroll focused field into view;
- use appropriate keyboard types;
- dismiss keyboard on submit;
- prevent keyboard from hiding primary actions.

---

# 88. Accessibility

Minimum requirements:

- semantic labels;
- screen-reader support;
- sufficient contrast;
- scalable text;
- minimum touch target;
- focus handling;
- keyboard navigation on desktop;
- no color-only status indication.

Recommended minimum touch target:

```text
44 × 44 px
```

---

# 89. Accessibility for Clinical Alerts

Critical alerts must communicate:

```text
Severity
Condition
Action if applicable
```

Example:

```text
Critical allergy:
Penicillin

Review before prescribing medication.
```

---

# 90. Localization

Every user-visible string must come from localization resources.

Never:

```dart
Text('Save')
```

in production feature code if localization is enabled.

Prefer:

```dart
Text(context.l10n.save)
```

---

# 91. Bangla/English Language Switching

Settings:

```text
Language

○ বাংলা
○ English
```

Changing language should update the UI without requiring a fresh login.

---

# 92. Currency

Bangladesh currency:

```text
৳800
```

The underlying API value should remain precise.

Do not use floating-point arithmetic for financial calculations.

---

# 93. Date Formatting

Backend:

```text
UTC
```

UI:

```text
Asia/Dhaka
```

Examples:

```text
12 Aug 2026
Today
Tomorrow
09:30 AM
```

---

# 94. Phone Number Formatting

Support Bangladesh phone formats while preserving normalized backend representation.

Example display:

```text
01712 345678
```

The exact normalization rules belong to the data/validation layer.

---

# 95. Patient ID Component

Patient IDs should be visually distinct:

```text
PID-000123
```

Provide copy functionality.

---

# 96. Prescription Preview

Preview must look like the actual prescription document.

Sections:

```text
Doctor
Chamber
Patient
Date

Diagnosis

Rx

Medicines

Instructions

Follow-up

Signature
```

---

# 97. PDF Viewer

Provide:

```text
Zoom
Scroll
Download/share where permitted
Print where supported
```

The viewer must respect access permissions.

---

# 98. File Upload Component

Support:

```text
Upload report
Take photo
Choose file
```

Display:

```text
Uploading 65%
```

After upload:

```text
Uploaded
```

Failure:

```text
Upload failed
[Retry]
```

---

# 99. Image/Document Preview

Provide:

- preview;
- filename;
- upload status;
- delete/remove;
- retry.

Do not expose private storage URLs unnecessarily.

---

# 100. Dashboard KPI Card

Example:

```text
Today's Patients

24

↑ 12% vs yesterday
```

KPI cards must avoid misleading comparisons.

---

# 101. Analytics Charts

Supported chart types:

```text
Line
Bar
Donut
```

Use charts only when they communicate information better than numbers.

Always provide textual values or accessible alternatives.

---

# 102. Skeleton Components

Required skeletons:

```text
PatientCardSkeleton
AppointmentCardSkeleton
QueueCardSkeleton
DashboardSkeleton
TimelineSkeleton
PrescriptionSkeleton
ReportSkeleton
```

---

# 103. Global Search

Search overlay:

```text
Search patients, appointments,
prescriptions...
```

Results should be grouped:

```text
Patients
Appointments
Prescriptions
Reports
```

---

# 104. Global Action Menu

Common actions:

```text
Register Patient
Create Appointment
Check In
Start Consultation
Record Payment
```

Only show actions allowed by role and context.

---

# 105. Toast/Snackbar Rules

Good:

```text
Patient registered successfully.
```

Bad:

```text
Operation completed successfully.
```

Messages must describe the actual result.

---

# 106. Confirmation Rules

Confirmation is required for:

- finalizing prescription;
- deleting important records;
- cancelling appointments where appropriate;
- refunding payment;
- deactivating chamber/staff;
- logging out when unsaved work exists.

---

# 107. Unsaved Changes Dialog

Example:

```text
Unsaved Changes

You have unsaved consultation changes.

[Stay]
[Discard]
```

Never silently discard clinical notes.

---

# 108. Auto-Save Indicator

Consultation:

```text
Saving...
```

Then:

```text
Saved just now
```

On failure:

```text
Couldn't save changes
[Retry]
```

---

# 109. Dirty State Indicator

If changes are pending:

```text
● Unsaved changes
```

This state should integrate with navigation guards.

---

# 110. Network State Indicator

Global indicator:

```text
Online
Offline
Connecting...
```

Do not block the entire application because connectivity is temporarily unavailable.

---

# 111. Component API Standards

Components should:

- be immutable;
- expose explicit parameters;
- avoid hidden business logic;
- avoid direct API calls;
- avoid direct Riverpod dependency unless the component is intentionally provider-aware.

Prefer:

```dart
PatientHeader(
  patient: patient,
  onTap: openPatient,
)
```

over a component internally fetching its own patient.

---

# 112. Smart vs Dumb Components

Prefer two categories.

### Dumb components

Pure UI:

```text
PatientCard
StatusBadge
VitalCard
MedicineCard
```

### Smart components

May depend on Riverpod:

```text
QueueScreen
ConsultationWorkspace
DashboardScreen
PatientDetailsScreen
```

Keep business logic out of dumb components.

---

# 113. Component Naming

Use:

```text
AppButton
AppTextField
AppCard
AppDialog
PatientCard
QueueCard
AppointmentCard
MedicineCard
PrescriptionCard
AIResponseCard
```

Avoid vague names:

```text
CommonWidget
CustomWidget
MyCard
NewWidget
```

---

# 114. Component Variants

Prefer variants over duplicate components.

Bad:

```text
DoctorButton
StaffButton
PaymentButton
```

Better:

```text
AppButton(
  variant: AppButtonVariant.primary,
)
```

---

# 115. Theme Architecture

Use Flutter `ThemeData` with centralized theme extensions.

Recommended:

```text
AppTheme
AppColors
AppTypography
AppSpacing
AppRadius
AppShadows
AppComponentThemes
```

---

# 116. Theme Extensions

Custom semantic values should use `ThemeExtension`.

Example:

```dart
class ClinicalColors extends ThemeExtension<ClinicalColors> {
  final Color allergy;
  final Color critical;
  final Color ai;
}
```

This allows consistent theme behavior.

---

# 117. Light and Dark Mode

The application should support:

```text
System
Light
Dark
```

Clinical alerts must remain distinguishable in both themes.

---

# 118. Dark Mode Rules

Avoid:

- pure black backgrounds everywhere;
- low-contrast gray text;
- saturated warning colors;
- excessive shadows.

---

# 119. Elevation

Use minimal elevation.

Suggested levels:

```text
0   Flat
1   Card
2   Elevated
4   Modal
8   Floating
```

Avoid excessive shadows.

---

# 120. Motion Design

Animations should communicate:

- state changes;
- navigation;
- loading;
- success;
- expansion.

Recommended duration:

```text
Fast      100–150 ms
Normal    200–300 ms
Slow      300–500 ms
```

Avoid decorative animations in clinical workflows.

---

# 121. Loading Motion

AI processing may use richer animation.

Normal application loading should remain subtle.

---

# 122. Success Feedback

Examples:

```text
✓ Patient saved
✓ Payment recorded
✓ Prescription finalized
```

Success should never imply completion before server confirmation.

---

# 123. Critical Mutation UX

For:

- prescription finalization;
- payment;
- queue state changes;

the UI must:

```text
Disable duplicate action
↓
Show processing
↓
Wait for server
↓
Show confirmed state
```

---

# 124. Optimistic UI Rules

Allowed for:

- simple local filters;
- tabs;
- local UI state;
- non-critical preference changes.

Avoid optimistic updates for:

- queue transitions;
- payment;
- prescription finalization;
- encounter completion;
- clinical record locking.

---

# 125. Queue UI Safety

Queue actions should always be server-confirmed.

Example:

```text
Calling patient...
```

Then:

```text
Patient #07 called
```

Never show:

```text
Called
```

before confirmation.

---

# 126. Prescription Safety UI

The UI must distinguish:

```text
Draft
AI Suggested
Review Required
Finalized
Delivered
```

Finalized prescriptions are read-only.

---

# 127. AI Safety UI

Rules:

1. AI content must be labeled.
2. AI suggestions require doctor review.
3. AI cannot directly finalize prescriptions.
4. AI content cannot silently overwrite clinical notes.
5. AI actions require explicit user intent.
6. AI errors must not modify clinical data.
7. AI-generated information must remain distinguishable from doctor-authored information.

---

# 128. Clinical Record Visual Distinction

Doctor-authored:

```text
Clinical Note
```

AI-generated:

```text
AI Generated
Review Required
```

Imported:

```text
Imported Data
```

System-generated:

```text
System Record
```

---

# 129. Audit-Friendly UI

Where appropriate, display provenance:

```text
Created by Dr. Ahmed
12 Aug 2026 · 09:42 AM
```

For amendments:

```text
Amended by Dr. Ahmed
14 Aug 2026
```

---

# 130. Role-Aware Empty States

Example doctor:

```text
No consultations today.
```

Receptionist:

```text
No appointments today.
[Create Appointment]
```

The empty state should match the user's job.

---

# 131. Responsive Dialog Rules

Desktop:

```text
Dialog
```

Mobile:

```text
Bottom Sheet
```

unless the action is destructive or requires stronger confirmation.

---

# 132. Mobile Navigation Rules

Avoid deep navigation.

Target:

```text
Dashboard
→ Queue
→ Consultation
→ Prescription
```

rather than:

```text
Dashboard
→ Queue
→ Patient
→ Patient Details
→ Visit
→ Encounter
→ Consultation
```

when the context is already known.

---

# 133. Contextual Navigation

From queue:

```text
Queue Card
→ Start Consultation
```

should open the correct encounter directly.

From patient:

```text
Patient
→ Latest Consultation
```

should open the encounter.

---

# 134. Component Composition

Example:

```text
ConsultationScreen
 ├── PatientHeader
 ├── AllergyBanner
 ├── VitalsSection
 │    └── VitalCard
 ├── NotesSection
 │    └── ClinicalNotesEditor
 ├── DiagnosisSection
 │    └── DiagnosisChip
 ├── InvestigationSection
 │    └── InvestigationCard
 ├── PrescriptionSection
 │    └── MedicineCard
 ├── AISection
 │    └── AIResponseCard
 └── ConsultationActions
```

---

# 135. Shared Patient Context

A patient context wrapper can provide:

```text
Patient
Encounter
Chamber
Permissions
```

to consultation-related components.

This reduces repeated loading and navigation.

---

# 136. Component State Rules

Components may have local UI state for:

```text
Expanded/collapsed
Selected tab
Focus
Temporary input
Animation
```

Domain state belongs in Riverpod/application state.

---

# 137. Form State Rules

Complex forms should use a dedicated controller/provider.

Example:

```text
PrescriptionEditorController
ConsultationDraftController
AppointmentFormController
PaymentFormController
```

---

# 138. No Business Logic in Widgets

Avoid:

```dart
onPressed: () async {
  final response = await dio.post(...);
}
```

Correct:

```dart
onPressed: controller.save,
```

---

# 139. Component Testing

Every reusable component should test:

- rendering;
- variants;
- disabled state;
- loading state;
- error state;
- interaction;
- accessibility semantics where relevant.

---

# 140. Golden Tests

Use golden tests for high-value shared components:

```text
AppButton
AppTextField
PatientHeader
QueueCard
AppointmentCard
MedicineCard
PrescriptionCard
AIResponseCard
StatusBadge
Dashboard KPI
```

---

# 141. Responsive Testing

Test:

```text
360 × 800
390 × 844
768 × 1024
1024 × 768
1440 × 900
```

Also test orientation where supported.

---

# 142. Localization Testing

Test:

```text
English
Bangla
Mixed Bangla + English
Long translated labels
Large text
```

Ensure text does not overflow.

---

# 143. Accessibility Testing

Verify:

- semantic labels;
- focus order;
- text scaling;
- contrast;
- touch target;
- keyboard navigation;
- screen reader interpretation.

---

# 144. Performance Rules

Avoid:

- unnecessary rebuilds;
- large widget trees;
- repeated network requests;
- excessive image decoding;
- global provider invalidation.

Use:

```dart
select()
```

where appropriate.

---

# 145. List Performance

For long lists:

- use lazy builders;
- avoid rebuilding entire lists;
- use stable keys;
- paginate;
- cache images;
- keep item widgets lightweight.

---

# 146. Image Performance

Use:

```text
CachedNetworkImage
```

where appropriate.

Images should have:

- fixed constraints;
- placeholders;
- error states;
- appropriate resolution.

---

# 147. Design System Documentation

The project should maintain a developer-facing component catalog.

Example:

```text
Design System
├── Colors
├── Typography
├── Buttons
├── Inputs
├── Cards
├── Dialogs
├── Clinical Components
├── AI Components
└── Layouts
```

If practical, implement this using a component showcase/storybook-style environment.

---

# 148. Component Inventory

## Foundation

```text
AppScaffold
AppAppBar
ResponsiveLayout
AppNavigation
AppBottomNavigation
AppSidebar
AppSection
```

## Buttons

```text
AppButton
AppIconButton
AppTextButton
AppFloatingActionButton
```

## Inputs

```text
AppTextField
AppSearchField
AppNumberField
AppPhoneField
AppDropdown
AppDateField
AppTimeField
AppSwitch
AppCheckbox
AppRadio
```

## Feedback

```text
AppLoader
AppSkeleton
AppEmptyState
AppErrorState
AppOfflineBanner
AppSnackbar
AppDialog
AppBottomSheet
```

## Data

```text
AppCard
AppListTile
AppChip
StatusBadge
AppDivider
AppAvatar
AppTable
AppPagination
AppTimeline
```

---

# 149. Clinical Component Inventory

```text
PatientHeader
PatientContextBar
AllergyBanner
ConditionBadge
VitalCard
VitalTrendChart
ClinicalNotesEditor
DiagnosisSelector
DiagnosisChip
InvestigationSelector
InvestigationCard
DiagnosticReportCard
PatientTimeline
EncounterSummary
```

---

# 150. Prescription Component Inventory

```text
PrescriptionCard
PrescriptionHeader
MedicineSearchField
MedicineCard
MedicineEditor
MedicineFrequencySelector
MedicineDurationSelector
PrescriptionReview
PrescriptionStatusBadge
PrescriptionPreview
PrescriptionFinalizationDialog
```

---

# 151. Queue Component Inventory

```text
QueueSummary
QueueCard
CurrentPatientCard
QueueStatusBadge
QueueActionBar
QueueFilters
QueueEmptyState
```

---

# 152. Appointment Component Inventory

```text
AppointmentCard
AppointmentStatusBadge
AppointmentCalendar
AppointmentList
AppointmentForm
AppointmentTypeSelector
AppointmentActionMenu
```

---

# 153. Payment Component Inventory

```text
PaymentSummary
PaymentMethodSelector
PaymentAmountField
PaymentCard
ReceiptCard
ReceiptPreview
RefundDialog
```

---

# 154. AI Component Inventory

```text
AIBadge
AISection
AIResponseCard
AIProcessingIndicator
AIErrorCard
AIReviewBanner
AIDraftCard
AIChatMessage
AIChatInput
AIApplyAction
```

---

# 155. Staff Component Inventory

```text
StaffCard
StaffRoleBadge
PermissionList
PermissionToggle
InvitationStatusBadge
StaffActionMenu
```

---

# 156. Reports Component Inventory

```text
ReportKpiCard
ReportChart
ReportFilterBar
ReportDateRange
RevenueSummary
PatientStatistics
AppointmentStatistics
```

---

# 157. Component Dependency Rule

Design-system components must not depend on feature modules.

Correct:

```text
Feature
 ↓
Design System
```

Incorrect:

```text
Design System
 ↓
Patient Feature
```

---

# 158. Feature Component Rule

Feature-specific components belong inside the feature.

Example:

```text
features/prescriptions/presentation/widgets/
    prescription_editor.dart
    medicine_card.dart
```

Generic components belong in:

```text
core/design_system/components/
```

---

# 159. Reusability Threshold

A component belongs in the global design system when:

- used by 3+ features; or
- represents a core product pattern; or
- requires strict visual consistency.

Do not prematurely generalize one-off components.

---

# 160. Design Tokens in Code

Recommended:

```dart
class AppTheme {
  static ThemeData light() {}
  static ThemeData dark() {}
}

class AppSpacing {}
class AppRadius {}
class AppTypography {}
class AppColors {}
class AppShadows {}
```

---

# 161. Theme Usage

Feature code should prefer:

```dart
Theme.of(context).colorScheme.primary
```

or application theme extensions rather than hard-coded colors.

Avoid:

```dart
Color(0xFF123456)
```

inside feature widgets.

---

# 162. State Integration

UI components should receive state from Riverpod controllers.

Example:

```text
Riverpod
   ↓
ConsultationState
   ↓
ConsultationScreen
   ↓
ClinicalNotesEditor
   ↓
User input
   ↓
Controller
```

---

# 163. Async UI Standard

Every async screen should support:

```text
Loading
Success
Empty
Error
Offline
```

For mutations:

```text
Idle
Submitting
Success
Failure
```

---

# 164. Error Message Architecture

Backend/domain errors should be mapped to user-friendly messages.

Do not expose:

```text
PrismaClientKnownRequestError
```

or raw HTTP errors.

Display:

```text
We couldn't save the prescription.
Please try again.
```

---

# 165. Critical Error Recovery

For clinical data:

```text
Save failed
↓
Keep local draft
↓
Retry
↓
Do not discard user input
```

---

# 166. Session Expiry UI

When session expires:

```text
Your session has expired.

Please sign in again.
```

Unsaved consultation data should be preserved where technically possible.

---

# 167. Logout Behavior

Before logout:

- check unsaved clinical work;
- warn user;
- clear secure session;
- clear chamber-specific sensitive cache;
- return to login.

---

# 168. Chamber Switching UI

Example:

```text
Current Chamber

Dhanmondi Chamber ✓
Uttara Chamber
Mirpur Chamber
```

During switching:

```text
Switching chamber...
```

Dashboard/queue/appointment data should refresh for the new chamber.

---

# 169. Multi-Chamber Visual Safety

Always include chamber context on important screens.

Example:

```text
Dhanmondi Chamber
Today's Queue
```

This reduces accidental cross-chamber operations.

---

# 170. Patient Data Safety

Sensitive clinical information should not be unnecessarily shown in:

- notifications;
- lock-screen previews;
- global search suggestions;
- logs;
- analytics widgets.

---

# 171. Notification Privacy

Prefer:

```text
You have a new patient update.
```

over exposing sensitive medical details in notifications.

---

# 172. Search Privacy

Global search should require appropriate permissions.

A receptionist should not automatically receive access to clinical notes merely because a patient is searchable.

---

# 173. Mobile Safe Areas

Screens must respect:

```text
Status bar
Notch
Home indicator
Keyboard
System navigation
```

---

# 174. Orientation

Primary experience:

```text
Portrait
```

Tablet/desktop:

```text
Landscape supported
```

Consultation may benefit from landscape mode on tablets.

---

# 175. Empty State Illustration

Illustrations should be:

- lightweight;
- professional;
- culturally neutral;
- optional.

Never let decorative graphics dominate clinical workflows.

---

# 176. Icon + Text Rules

For important actions:

```text
Icon + Text
```

is preferable to icon-only.

Icon-only actions should have tooltips/accessibility labels.

---

# 177. Destructive Action Placement

Do not place destructive actions beside primary actions without adequate separation.

Example:

```text
[Save]          [Delete]
```

should not look like equally safe actions.

---

# 178. Confirmation Copy

Use explicit wording.

Bad:

```text
Are you sure?
```

Better:

```text
Finalize this prescription?

After finalization, the prescription becomes read-only.
```

---

# 179. Medical Terminology

Terminology should remain consistent throughout the application.

Examples:

```text
Patient
Encounter
Consultation
Prescription
Investigation
Diagnostic Report
Follow-up
```

Do not alternate between:

```text
Visit
Appointment
Session
Consultation
```

unless they represent different concepts.

---

# 180. Component Documentation Format

Each reusable component should document:

```text
Purpose
Variants
Parameters
States
Usage
Accessibility
Responsive behavior
Example
```

---

# 181. Example Component Specification

```text
Component: PatientHeader

Purpose:
Display patient identity and critical clinical context.

Inputs:
- Patient
- Optional encounter
- Optional onTap

States:
- Normal
- Loading
- Missing patient
- Allergy warning

Responsive:
- Compact mobile
- Expanded desktop

Accessibility:
- Full patient identity read as one semantic group.
```

---

# 182. Component API Example

```dart
class PatientHeader extends StatelessWidget {
  const PatientHeader({
    super.key,
    required this.patient,
    this.onTap,
  });

  final Patient patient;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    // UI only.
  }
}
```

---

# 183. Screen Composition Standard

A screen should generally follow:

```text
Scaffold
 └── SafeArea
      └── ResponsiveLayout
           └── AppContent
                ├── Header
                ├── Content
                └── Primary Action
```

---

# 184. Feature Screen Standard

Each feature should define:

```text
Screen
Controller/Notifier
State
Widgets
Dialogs
Sheets
```

---

# 185. UI and Riverpod Boundary

Preferred:

```text
Widget
 ↓
ref.watch(...)
 ↓
State
 ↓
Controller
```

Do not allow design-system components to directly manipulate feature providers.

---

# 186. Side Effects

Use:

```dart
ref.listen(...)
```

for:

- navigation;
- Snackbar;
- dialogs;
- external actions.

Avoid triggering side effects from `build()`.

---

# 187. Form Submission

Standard sequence:

```text
User taps Save
↓
Validate local form
↓
Controller mutation
↓
Loading state
↓
Repository
↓
Server
↓
Success/Error
↓
UI feedback
```

---

# 188. Prevent Duplicate Submission

During mutation:

```dart
if (state.isSubmitting) return;
```

or disable the button.

Critical actions must never produce accidental duplicate records.

---

# 189. Scroll Behavior

Consultation should support:

- smooth vertical scrolling;
- section anchors;
- sticky patient context;
- sticky primary action.

---

# 190. Section Headers

Use concise headers:

```text
Vitals
Diagnosis
Investigations
Prescription
Follow-up
```

Avoid excessive visual decoration.

---

# 191. Dense Clinical UI

Clinical workflows may use higher information density than onboarding screens.

However:

- text remains readable;
- touch targets remain accessible;
- sections remain visually separated.

---

# 192. Reception UI

Reception workflows should optimize for speed.

Examples:

```text
Search Patient
Register Patient
Book Appointment
Check In
Call Patient
Record Payment
```

Common actions should be one or two taps away.

---

# 193. Doctor UI

Doctor workflows should optimize for:

```text
Patient context
Clinical documentation
Diagnosis
Prescription
AI assistance
Completion
```

---

# 194. Manager UI

Manager workflows should optimize for:

```text
Staff
Schedules
Revenue
Reports
Analytics
Chamber configuration
```

---

# 195. Billing UI

Billing workflow:

```text
Patient
↓
Consultation
↓
Fee
↓
Payment
↓
Receipt
```

Financial confirmation must always come from the server.

---

# 196. Tablet Optimization

Tablet consultation should support:

```text
Patient context panel
+
Clinical workspace
+
AI collapsible panel
```

This can substantially improve doctor productivity.

---

# 197. Desktop Optimization

Desktop should support:

- keyboard shortcuts;
- wider tables;
- multi-column consultation;
- persistent navigation;
- larger report views.

---

# 198. Keyboard Shortcuts

Potential shortcuts:

```text
N   New patient
A   Appointment
Q   Queue
C   Consultation
P   Prescription
S   Search
```

Shortcuts must not conflict with text input.

---

# 199. Focus Management

After actions:

```text
Add medicine → focus next medicine
Save notes → retain context
Search patient → focus result list
```

Avoid unexpected focus changes.

---

# 200. Design System Versioning

The design system should use semantic versioning:

```text
Major
Minor
Patch
```

Example:

```text
Design System 1.2.0
```

Breaking component API changes require migration notes.

---

# 201. Component Deprecation

Deprecated components should:

- remain temporarily supported;
- include migration guidance;
- have a removal target;
- not be used in new features.

---

# 202. Design Review Checklist

Before approving a screen:

```text
□ Uses design tokens
□ Uses standard typography
□ Uses standard spacing
□ Uses reusable components
□ Supports loading
□ Supports empty state
□ Supports error state
□ Supports offline state where relevant
□ Supports Bangla
□ Supports accessibility
□ Supports mobile
□ Supports tablet/desktop where relevant
□ Correct permission behavior
□ Correct clinical safety treatment
```

---

# 203. Developer Review Checklist

```text
□ No hard-coded colors
□ No hard-coded spacing
□ No direct API calls
□ No business logic in UI widgets
□ No unnecessary provider watches
□ Correct loading/error states
□ Correct localization
□ Correct responsive behavior
□ Correct semantic labels
□ Correct navigation
```

---

# 204. QA Visual Checklist

QA should verify:

```text
Typography
Spacing
Alignment
Colors
Icons
Button states
Loading
Errors
Empty states
Dark mode
Bangla
Accessibility
Responsive layouts
```

---

# 205. Golden Test Coverage

P0 golden tests:

```text
AppButton
AppTextField
PatientHeader
AllergyBanner
QueueCard
AppointmentCard
VitalCard
MedicineCard
PrescriptionReview
AIResponseCard
PaymentSummary
StatusBadge
```

---

# 206. UI Performance Targets

Target:

```text
Smooth scrolling: 60 FPS+
Fast screen transition
Minimal unnecessary rebuilds
No visible input lag
```

Large patient histories should use pagination/lazy loading.

---

# 207. Startup UI

App startup:

```text
Launch
↓
Restore session
↓
Load user
↓
Load selected chamber
↓
Open appropriate route
```

Avoid displaying the dashboard before authentication/chamber state is resolved.

---

# 208. Splash Screen

Splash should be minimal.

It should not perform unnecessary expensive API operations.

---

# 209. First-Time Onboarding

Onboarding should be:

```text
Profile
→ Professional Info
→ Verification
→ Chamber
→ Schedule
→ Staff
→ AI
→ Complete
```

Use a progress indicator.

---

# 210. Onboarding Component

Example:

```text
Step 4 of 7

Create your chamber

Chamber Name
Address
Contact Number

[Back] [Continue]
```

---

# 211. Permission Request UI

If a device permission is needed:

```text
Microphone Access

Microphone access is needed for
voice-to-note functionality.

[Allow]
```

Only request permissions when the related feature is used.

---

# 212. File Permission UI

Explain why access is needed before requesting it.

---

# 213. Voice UI

Future voice-to-note UI:

```text
🎙 Recording

01:24

[Pause] [Stop]
```

After transcription:

```text
AI Generated Transcript
Review Required

[Insert into Notes]
```

---

# 214. AI Voice Safety

Voice transcription must not automatically become a finalized clinical record.

The doctor must review and explicitly insert/save it.

---

# 215. Report Analysis UI

Example:

```text
Diagnostic Report

CBC
12 Aug 2026

[View Report]
[Analyze with AI]
```

AI result:

```text
AI Analysis
Review Required

Summary...
Potential observations...

[Add to Notes]
```

---

# 216. Patient Timeline Navigation

Timeline items should deep-link to:

```text
Encounter
Prescription
Investigation
Diagnostic Report
Payment
```

---

# 217. Deep Link Safety

Deep links must verify:

```text
Authentication
Chamber membership
Resource permission
Resource existence
```

before displaying clinical data.

---

# 218. Session-Aware UI

When authentication changes:

```text
Clear protected screens
Clear sensitive cached state
Reset navigation
```

---

# 219. Chamber-Aware UI

When chamber changes:

```text
Reset chamber-specific lists
Reset queue
Reset appointment context
Reset dashboard
Reload permissions
Reload chamber data
```

---

# 220. Patient-Aware UI

When selected patient changes:

```text
Clear old patient-specific draft context
Load new patient
Verify encounter
Update timeline
```

Never mix records between patients.

---

# 221. Encounter-Aware UI

Consultation components should all reference the same encounter ID.

```text
encounterId
 ├── notes
 ├── vitals
 ├── diagnosis
 ├── investigation
 └── prescription
```

---

# 222. Prescription-Aware UI

Prescription editor should distinguish:

```text
Local draft
Server draft
AI draft
Finalized prescription
```

---

# 223. AI Provenance

AI content should preserve:

```text
source = ai
generatedAt
requestId
reviewRequired
```

where the domain model supports it.

---

# 224. Data Provenance UI

When appropriate:

```text
Entered by Dr. Ahmed
AI Suggested
Imported from report
System Generated
```

---

# 225. No Silent Data Mutation

The UI must never silently:

- replace doctor notes;
- change diagnosis;
- add medicine;
- finalize prescription;
- record payment.

All important changes require explicit user action.

---

# 226. Security UI

Sensitive screens may support:

```text
App lock
Biometric unlock
Session timeout
```

if introduced by the security roadmap.

---

# 227. App Lock

If enabled:

```text
Unlock Chamber App
[Biometric]
[PIN]
```

Clinical data should not be displayed behind an app-lock screen.

---

# 228. Copy/Share Restrictions

Sensitive patient information should not be unnecessarily exposed through:

- system share sheets;
- clipboard;
- screenshots.

Where technically appropriate, restrict or warn for sensitive operations.

---

# 229. Print

Prescription and receipts may support printing where platform permits.

Print output must be generated from authoritative server/document data where required.

---

# 230. Design System Governance

Every new reusable component should be reviewed for:

```text
Naming
Variants
Accessibility
Responsiveness
Localization
Theming
Testing
API stability
```

---

# 231. New Component Decision Tree

Before creating a component:

```text
Can existing component solve it?
        │
       Yes
        ↓
Use existing component

       No
        ↓
Is it reusable?
        │
    ┌───┴───┐
   Yes      No
    ↓        ↓
Global      Feature
component   component
```

---

# 232. Component Quality Levels

Components may be classified:

```text
P0 — Core
P1 — Feature Critical
P2 — Advanced
P3 — Future
```

P0 components must receive the strongest test coverage.

---

# 233. P0 Component List

```text
AppScaffold
AppAppBar
AppButton
AppTextField
AppSearchField
AppCard
StatusBadge
AppDialog
AppSnackbar
AppEmptyState
AppErrorState
AppLoader

PatientHeader
AllergyBanner
QueueCard
AppointmentCard
VitalCard
MedicineCard
PrescriptionReview
AIResponseCard
PaymentSummary
```

---

# 234. P1 Components

```text
Timeline
Charts
Advanced Filters
Staff Permission UI
Report Cards
PDF Viewer
File Upload
AI Chat
Voice UI
```

---

# 235. P2 Components

```text
Advanced Analytics
Predictive UI
Telemedicine Components
Referral Components
Lab Integration Components
Pharmacy Integration Components
```

---

# 236. Design-to-Code Workflow

Recommended process:

```text
UX Flow
↓
Wireframe
↓
Visual Design
↓
Design Tokens
↓
Component Mapping
↓
Flutter Implementation
↓
Golden Tests
↓
Responsive QA
↓
Accessibility QA
↓
Feature Integration
```

---

# 237. Figma-to-Flutter Rule

Designers should use the same conceptual tokens:

```text
Spacing
Typography
Radius
Colors
Elevation
Components
```

Developers should not manually reproduce arbitrary Figma values.

---

# 238. UI Handoff

Each screen handoff should include:

```text
Screen purpose
States
Components
Responsive layouts
Interactions
Validation
Error states
Empty states
Loading states
Permissions
Localization
Accessibility
```

---

# 239. Required Screen States

Every important screen must design:

```text
Default
Loading
Empty
Error
Offline
Permission Restricted
Success
```

Forms additionally require:

```text
Validation Error
Submitting
Saved
Unsaved Changes
```

---

# 240. Consultation Screen Required States

```text
Loading Encounter
Ready
Saving
Unsaved
Save Failed
AI Processing
Prescription Draft
Prescription Review
Completed
Locked
Offline
```

---

# 241. Queue Screen Required States

```text
Loading
Empty
Waiting
Patient Called
Mutation Processing
Mutation Failed
Offline
```

---

# 242. Prescription Screen Required States

```text
Loading
Draft
Saving
AI Suggested
Review Required
Finalizing
Finalized
Delivered
Error
```

---

# 243. Payment Screen Required States

```text
Ready
Submitting
Paid
Payment Failed
Receipt Ready
Refunded
```

---

# 244. AI Screen Required States

```text
Idle
Submitting
Processing
Success
Review Required
Error
Rate Limited
Unavailable
Offline
```

---

# 245. Component Analytics

Do not instrument every UI interaction.

Track meaningful product events such as:

```text
appointment_created
patient_registered
consultation_started
prescription_finalized
payment_recorded
ai_suggestion_generated
ai_suggestion_applied
```

Never include unnecessary clinical payloads in analytics.

---

# 246. UI Logging

Never log:

```text
Access tokens
Patient clinical notes
Prescription contents
AI prompts
AI responses
Sensitive identifiers
```

Use safe identifiers/correlation IDs where required.

---

# 247. Error Observability

Production error monitoring should capture:

```text
Screen
Feature
Action
Error type
Request ID
App version
Platform
```

without sensitive patient content.

---

# 248. Version Compatibility

UI components must remain compatible with:

```text
Current supported Flutter version
Current Dart version
Current design-system version
```

Dependency upgrades require regression testing.

---

# 249. UI Technical Debt

Track:

```text
Duplicated components
Hard-coded values
Deprecated widgets
Missing states
Accessibility issues
Localization issues
Responsive issues
```

---

# 250. Component Completion Definition

A reusable component is complete when:

```text
□ API finalized
□ Variants implemented
□ Loading state implemented
□ Disabled state implemented
□ Error state where applicable
□ Responsive behavior implemented
□ Accessibility implemented
□ Localization verified
□ Theme verified
□ Unit/widget tests added
□ Golden test added where appropriate
□ Documentation added
```

---

# 251. Screen Completion Definition

A screen is complete when:

```text
□ UI implemented
□ Riverpod integration complete
□ API integration complete
□ Loading state
□ Empty state
□ Error state
□ Offline state where relevant
□ Permission handling
□ Responsive behavior
□ Bangla/English
□ Accessibility
□ Analytics where appropriate
□ Tests
□ QA approved
```

---

# 252. Sprint Mapping

## Sprint 1 — Foundation

```text
Design tokens
Theme
Typography
Spacing
Radius
Buttons
Inputs
Cards
Scaffold
Navigation
Responsive layout
Localization foundation
```

## Sprint 2 — Authentication

```text
Login
Signup
OTP
Onboarding
Session states
Auth UI
```

## Sprint 3 — Doctor/Chamber

```text
Doctor profile
Professional profile
Chamber
Schedule
Staff
Permissions
Chamber selector
```

## Sprint 4 — Patients

```text
Patient search
Patient registration
Patient profile
Patient timeline
Patient header
Allergy banner
```

## Sprint 5 — Appointment/Queue

```text
Appointment cards
Calendar
Queue cards
Queue summary
Queue actions
```

## Sprint 6 — Consultation

```text
Consultation workspace
Vitals
Notes
Diagnosis
Investigations
Patient context
Autosave indicators
```

## Sprint 7 — Prescription

```text
Medicine search
Medicine editor
Medicine cards
Prescription builder
Review
Finalization
Preview
```

## Sprint 8 — Payment

```text
Payment forms
Payment summary
Receipt
Refund
```

## Sprint 9 — AI

```text
AI badge
AI cards
AI summary
AI chat
AI prescription draft
AI processing
AI review
```

## Sprint 10 — Reports

```text
Reports
Charts
Notifications
Files
PDF viewer
Analytics
```

## Sprint 11 — Offline/Advanced UX

```text
Offline indicators
Cached data
Sync UI
Conflict UI
Advanced responsive behavior
Voice UI
```

## Sprint 12 — Hardening

```text
Accessibility
Golden tests
Responsive QA
Performance
Dark mode
Security UI
Final design-system cleanup
```

---

# 253. MVP Design System Scope

MVP must include:

```text
Theme
Typography
Spacing
Colors
Buttons
Inputs
Cards
Dialogs
Snackbar
Loading
Error
Empty
Offline
Patient Header
Allergy Banner
Appointment Card
Queue Card
Vital Card
Medicine Card
Prescription Components
Payment Components
Basic AI Components
Responsive Layout
Localization
Accessibility Foundation
```

---

# 254. Advanced Design System Scope

Phase 2:

```text
Advanced charts
AI chat
AI voice
Advanced offline
Advanced document viewer
Advanced analytics
Advanced filtering
Tablet consultation layout
```

Phase 3:

```text
Telemedicine
Lab integrations
Pharmacy integrations
Referral network
Predictive analytics
Marketplace
```

---

# 255. Final Design System Architecture

The final relationship should be:

```text
                 Design Tokens
                      │
                      ↓
              Theme / Foundations
                      │
                      ↓
              Shared Components
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
   Feature Components       Layout Components
          │                       │
          └───────────┬───────────┘
                      ↓
                 Feature Screens
                      │
                      ↓
                Riverpod State
                      │
                      ↓
                   UseCases
                      │
                      ↓
                Repositories
```

---

# 256. Final UI Rules

The following rules are mandatory:

1. **Use centralized design tokens.**
2. **Do not hard-code visual values inside feature screens.**
3. **Use reusable components whenever an established component exists.**
4. **Keep business logic out of UI widgets.**
5. **Use Riverpod for application/domain state.**
6. **Keep local UI state local.**
7. **Support Bangla and English.**
8. **Design mobile first.**
9. **Support tablet/desktop where applicable.**
10. **Every async screen must handle loading, success, empty and error states.**
11. **Important screens must handle offline state.**
12. **Clinical alerts must be visually prominent.**
13. **AI content must always be labeled.**
14. **AI suggestions require explicit review.**
15. **AI must never finalize a prescription.**
16. **Critical mutations must be server-confirmed.**
17. **Finalized prescriptions must be read-only.**
18. **Never silently discard clinical input.**
19. **Never expose sensitive clinical information unnecessarily.**
20. **Backend authorization remains the security boundary.**
21. **Use `ref.listen` for UI side effects.**
22. **Avoid unnecessary Riverpod rebuilds.**
23. **Use responsive layouts rather than fixed dimensions.**
24. **Accessibility is a first-class requirement.**
25. **Every reusable component should be tested.**

---

# 257. Overall UI Architecture

The application should ultimately feel like:

```text
                  CHAMBER APP
                       │
        ┌──────────────┴──────────────┐
        │                             │
     DOCTOR                         STAFF
        │                             │
        ↓                             ↓
 Consultation                    Operations
        │                             │
 ┌──────┼───────┐              ┌──────┼──────┐
 ↓      ↓       ↓              ↓      ↓      ↓
Vitals Diagnosis Rx         Patient Queue Payment
 │       │       │              │      │      │
 └───────┴───────┴──────────────┴──────┴──────┘
                       │
                       ↓
                  Patient Record
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
           Reports              AI
                                 │
                         Suggest / Assist
                                 │
                                 ↓
                          Doctor Review
                                 │
                                 ↓
                         Official Record
```

The design system must reinforce this workflow visually rather than compete with it.

---

# 258. Success Criteria

The UI system is successful when:

- a doctor can complete a consultation with minimal navigation;
- staff can manage a busy queue quickly;
- common actions are discoverable within seconds;
- patient context remains visible;
- AI suggestions are clearly distinguishable;
- clinical information is never confused with AI-generated content;
- the same component behaves consistently across features;
- Bangla and English work naturally;
- mobile and desktop layouts feel intentional rather than scaled;
- accessibility requirements are met;
- developers can build new screens primarily by composing existing components.

---

# 259. Next Document

The next recommended document is:

**Document 20 — Complete Flutter Screen-by-Screen Implementation Specification**

It should translate Documents 15–19 into an implementation contract for every screen, including:

- screen route;
- screen purpose;
- layout;
- widgets;
- Riverpod providers;
- API endpoints;
- request/response models;
- navigation;
- permissions;
- loading/error/empty states;
- responsive behavior;
- localization;
- accessibility;
- acceptance criteria;
- test cases;
- sprint mapping.

That document will effectively become the **screen-level implementation blueprint for the Flutter team**.