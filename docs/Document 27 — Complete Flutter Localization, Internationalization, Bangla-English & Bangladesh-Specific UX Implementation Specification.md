# Document 27 — Complete Flutter Localization, Internationalization, Bangla/English & Bangladesh-Specific UX Implementation Specification

**Project:** Chamber Management  
**Platform:** Flutter  
**Architecture:** Clean Architecture + Feature-First  
**State Management:** Riverpod  
**Routing:** GoRouter  
**Networking:** Dio  
**Serialization:** Freezed + json_serializable  
**Local Storage:** Hive  
**Secure Storage:** flutter_secure_storage  
**Primary Locales:** English (`en`), Bangla (`bn`)  
**Primary Market:** Bangladesh  
**Currency:** Bangladeshi Taka (BDT / ৳)  
**Primary Time Zone:** Asia/Dhaka  
**Document Type:** Implementation Specification  
**Status:** Implementation Ready

---

# 1. Purpose

This document defines the complete localization and internationalization architecture for Chamber Management.

The system must provide a natural experience for Bangladeshi doctors and chamber staff while maintaining English as a fully supported language.

Localization covers:

- Application UI
- Validation
- Dates
- Times
- Numbers
- Currency
- Phone numbers
- Addresses
- Names
- Medical terminology
- Prescriptions
- Reports
- Notifications
- AI responses
- Voice interactions
- Empty/error/loading states
- Accessibility
- PDF generation
- Offline UI
- Search
- User preferences

The architecture must also allow additional languages to be added later without redesigning the application.

---

# 2. Localization Goals

The localization system must achieve:

1. Complete Bangla UI.
2. Complete English UI.
3. Easy runtime language switching.
4. Persistent language preference.
5. Correct Bangladesh-specific formatting.
6. Consistent medical terminology.
7. Localized validation errors.
8. Localized notifications.
9. Localized prescription output.
10. Localized PDF/report output.
11. Bangla-friendly text input.
12. Mixed Bangla-English support.
13. Accessibility for Bangla users.
14. No hardcoded user-facing strings.
15. Future support for additional locales.

---

# 3. Core Principles

## Principle 1 — No Hardcoded UI Strings

Bad:

```dart
Text('Save')
```

Preferred:

```dart
Text(context.l10n.save)
```

---

## Principle 2 — Localization Is Not Translation Only

Localization includes:

```text
Language
+
Date
+
Time
+
Number
+
Currency
+
Phone
+
Address
+
Medical terminology
+
UX conventions
```

---

## Principle 3 — Store Canonical Data

Store:

```text
UTC timestamps
Canonical phone numbers
Canonical currency values
Structured dates
Structured clinical values
```

Display localized representations.

---

## Principle 4 — Backend Remains Language-Neutral

Backend should generally store:

```text
codes
structured values
canonical names
```

rather than storing translated UI strings.

---

# 4. Supported Locales

MVP:

```text
en
bn
```

Recommended locale configuration:

```dart
const supportedLocales = [
  Locale('en'),
  Locale('bn'),
];
```

Future:

```text
hi
ar
ur
```

can be added without changing feature architecture.

---

# 5. Default Locale

Recommended behavior:

```text
First installation
      ↓
Detect device locale
      ↓
If bn → Bangla
If en → English
Otherwise → English
```

However, the product may choose English as the default if device-language detection is not desirable.

---

# 6. User Locale Preference

Persist:

```text
locale = en
```

or:

```text
locale = bn
```

Use the existing application preferences storage.

Recommended architecture:

```text
LocalePreference
      ↓
Riverpod
      ↓
MaterialApp.locale
      ↓
Localized UI
```

---

# 7. Locale Provider

Recommended:

```dart
final localeProvider =
    NotifierProvider<LocaleController, Locale>(
  LocaleController.new,
);
```

Controller responsibilities:

```text
load()
setLocale()
persist()
reset()
```

---

# 8. Locale Initialization

Application startup:

```text
Splash
 ↓
Load Preferences
 ↓
Load Locale
 ↓
Initialize Localization
 ↓
Initialize Authentication
 ↓
Initialize Router
 ↓
Application Shell
```

Locale loading must happen before displaying the main application where practical.

---

# 9. Runtime Language Switching

User should be able to switch:

```text
English
বাংলা
```

without restarting the application.

Flow:

```text
Settings
 ↓
Language
 ↓
বাংলা
 ↓
Update Locale
 ↓
Persist
 ↓
Rebuild Localized UI
```

---

# 10. Language Switch UX

Example:

```text
Language

○ English
● বাংলা
```

The selected language should be immediately obvious.

---

# 11. Language Persistence

After switching to Bangla:

```text
App closed
 ↓
App reopened
 ↓
Bangla restored
```

The preference must be associated with the authenticated user's preferences where appropriate.

---

# 12. Locale and Account Switching

When switching accounts, define whether locale is:

### Device-level

Same language for all accounts.

or:

### Account-level

Each user retains their own language.

Recommended:

**Account preference with device fallback.**

---

# 13. Flutter Localization Technology

Recommended Flutter stack:

```text
flutter_localizations
intl
ARB localization files
gen_l10n
```

Prefer Flutter's generated localization system over a custom translation framework for the core application.

---

# 14. ARB Structure

Recommended:

```text
lib/
└── l10n/
    ├── app_en.arb
    └── app_bn.arb
```

Generated classes:

```text
AppLocalizations
```

---

# 15. ARB Example

English:

```json
{
  "save": "Save",
  "cancel": "Cancel",
  "patient": "Patient",
  "patients": "Patients"
}
```

Bangla:

```json
{
  "save": "সংরক্ষণ করুন",
  "cancel": "বাতিল করুন",
  "patient": "রোগী",
  "patients": "রোগীসমূহ"
}
```

The actual project should use generated metadata and descriptions where appropriate.

---

# 16. Translation Naming Convention

Use semantic names.

Good:

```text
save
cancel
patientDetails
createAppointment
finalizePrescription
```

Avoid:

```text
button1
text23
labelPatient
```

---

# 17. Feature-Based Localization Keys

Large applications should group keys conceptually.

Examples:

```text
authLogin
authLogout
patientCreate
patientDuplicateWarning
appointmentCreate
queueCallPatient
prescriptionFinalize
paymentReceived
```

---

# 18. Avoid Duplicate Translation Keys

If the same concept appears throughout the app:

```text
Save
Cancel
Search
Delete
```

reuse a common key.

Do not create:

```text
patientSave
appointmentSave
prescriptionSave
```

unless the wording genuinely differs.

---

# 19. Translation Context

Some English words have multiple Bangla translations depending on context.

For example:

```text
History
```

could mean:

```text
ইতিহাস
```

or clinical:

```text
রোগের ইতিহাস
```

Translation keys should include context.

Example:

```text
patientClinicalHistory
```

rather than relying only on:

```text
history
```

---

# 20. Medical Terminology

Medical terminology should have a controlled terminology dictionary.

Example:

```text
Blood Pressure
রক্তচাপ

Temperature
তাপমাত্রা

Pulse
নাড়ির গতি

Diagnosis
রোগ নির্ণয়

Prescription
প্রেসক্রিপশন
```

Final terminology should be reviewed by qualified medical/domain stakeholders.

---

# 21. Medical Terminology Strategy

Use three layers:

```text
Clinical Code
      ↓
Canonical English Term
      ↓
Localized Display Term
```

Example:

```text
ICD/clinical code
 ↓
Hypertension
 ↓
উচ্চ রক্তচাপ
```

---

# 22. Diagnosis Localization

Diagnosis records should not depend on UI translations.

Store:

```text
diagnosisCode
canonicalName
```

Display:

```text
English → Hypertension
Bangla → উচ্চ রক্তচাপ
```

---

# 23. Investigation Localization

Investigation catalog entries should support:

```text
code
nameEn
nameBn
```

Example:

```text
CBC
Complete Blood Count
সম্পূর্ণ রক্ত গণনা
```

---

# 24. Medicine Names

Medicine brand/generic names should generally remain in their canonical medical form.

Example:

```text
Paracetamol
Amoxicillin
Omeprazole
```

Do not automatically translate medicine names.

---

# 25. Medicine Instructions

Instruction templates can be localized.

Example:

```text
After food
খাবারের পরে
```

```text
Before food
খাবারের আগে
```

---

# 26. Prescription Language

Doctor should be able to choose:

```text
Prescription Language:
English
Bangla
```

This may differ from application UI language.

Example:

```text
UI:
বাংলা

Prescription:
English
```

This separation is important.

---

# 27. Prescription Localization Model

```text
Application Locale
        │
        ├── UI
        │
        └── Prescription Language
```

Do not force them to be identical.

---

# 28. Prescription Output

Bangla example:

```text
রোগীর নাম: মোঃ আব্দুল করিম

ওষুধ:

Paracetamol 500 mg
১টি ট্যাবলেট
দিনে ৩ বার
৫ দিন
খাবারের পরে
```

English example:

```text
Patient Name: Md. Abdul Karim

Medicine:

Paracetamol 500 mg
1 tablet
3 times daily
5 days
After food
```

---

# 29. Doctor-Entered Prescription Text

Doctor-entered free text should not be automatically translated.

If translation is offered:

```text
Original
 ↓
AI/Translation suggestion
 ↓
Doctor review
 ↓
Explicit insertion
```

---

# 30. AI Localization

AI responses should respect the selected language.

Example:

```text
AI Language = Bangla
```

should produce Bangla responses where appropriate.

---

# 31. AI Language Preference

Possible settings:

```text
AI Response Language
○ Same as app
○ English
○ বাংলা
```

Recommended MVP:

```text
Same as app
```

with explicit override as an advanced feature.

---

# 32. AI Medical Terminology

AI should preserve medically important terms where translation could create ambiguity.

Example:

```text
Blood Pressure (রক্তচাপ)
```

may be preferable in some contexts.

The final AI prompt/output strategy should be controlled by the backend AI service.

---

# 33. AI Safety and Localization

Localization must never change clinical meaning.

Do not allow translation to alter:

```text
Dosage
Frequency
Duration
Units
Diagnosis
Warnings
```

AI-generated translated clinical content remains:

```text
AI Generated
Review Required
```

---

# 34. Bangla Voice

Future voice features should support:

```text
Bangla speech
English speech
Mixed Bangla-English speech
```

Voice transcript:

```text
রোগীর তিন দিন ধরে জ্বর
```

should remain editable before insertion into clinical notes.

---

# 35. Voice-to-Note Localization

Flow:

```text
Voice
 ↓
Speech-to-text
 ↓
Bangla/English detection
 ↓
Transcript
 ↓
Doctor review
 ↓
Insert into note
```

No automatic clinical finalization.

---

# 36. Bangla Typography

Bangla text requires proper Unicode-compatible fonts.

The application should choose a font family that:

- Supports Bangla glyphs
- Supports Latin characters
- Has good readability
- Works consistently on Android/iOS/Web where supported

A fallback font stack should be defined.

---

# 37. Font Strategy

Recommended conceptual stack:

```text
Primary:
Approved Bangla-capable UI font

Fallback:
System font
```

The exact font should be selected during visual design validation based on:

- readability
- rendering
- licensing
- performance
- platform consistency

---

# 38. Mixed Language Typography

The application frequently contains:

```text
বাংলা + English + Numbers
```

Example:

```text
BP 120/80 mmHg
```

Typography must handle mixed scripts without unexpected baseline or spacing issues.

---

# 39. Text Overflow

Bangla strings may be longer or shorter than English equivalents.

Never design buttons based on English text width alone.

Use:

```text
Flexible
Expanded
Wrap
Intrinsic sizing
```

where appropriate.

---

# 40. Button Localization

Bad:

```text
SizedBox(
  width: 100,
  child: Text(...),
)
```

if the width was chosen only for English.

Better:

```text
minimum constraints
+
padding
+
flexible text
```

---

# 41. Text Scaling

Support system text scaling.

Do not assume:

```text
fontSize = fixed
```

will always be sufficient.

Test at larger accessibility text sizes.

---

# 42. Accessibility and Bangla

Screen readers should receive meaningful Bangla labels.

Example:

```text
রোগীর নাম
```

rather than:

```text
TextField
```

---

# 43. Accessibility Semantics

Interactive elements should expose:

```text
Label
Role
State
Hint
Error
```

in the active language.

---

# 44. Localized Validation

Example English:

```text
Phone number is required.
```

Bangla:

```text
ফোন নম্বর আবশ্যক।
```

Validation codes remain language-independent.

---

# 45. Localized Error Architecture

```text
Validation Code
      ↓
Localization
      ↓
User Message
```

Example:

```text
required
 ↓
appLocalizations.fieldRequired
```

---

# 46. Server Error Localization

Backend may return:

```text
error.code = DUPLICATE_PATIENT
```

Flutter maps:

```text
DUPLICATE_PATIENT
 ↓
Localized message
```

If backend provides a safe localized message, it may be used according to API policy.

---

# 47. Unknown Error

If an unknown error code arrives:

English:

```text
Something went wrong. Please try again.
```

Bangla:

```text
কিছু সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
```

Never display raw server internals.

---

# 48. Date Formatting

Use `intl`.

Example English:

```text
5 September 2026
```

Bangla:

```text
৫ সেপ্টেম্বর ২০২৬
```

The exact formatting should follow the approved UX conventions.

---

# 49. Date Storage

Never store:

```text
05/09/2026
```

as the canonical date value.

Use:

```text
DateTime
```

or a canonical API date representation.

---

# 50. Time Formatting

Support:

```text
10:30 AM
```

or:

```text
১০:৩০ পূর্বাহ্ণ
```

depending on the localization design.

The exact Bangla period markers should be standardized across the app.

---

# 51. Timezone

All timestamps:

```text
Backend:
UTC

Flutter:
Asia/Dhaka display
```

Centralize conversion.

---

# 52. Current Date and Time

When showing:

```text
Today
Tomorrow
Yesterday
```

comparison should be performed using the chamber/user's applicable local timezone.

Do not compare raw UTC dates for local-day UX.

---

# 53. Queue Date

Queue business date must use chamber-local date.

Example:

```text
UTC date
       ↓
Asia/Dhaka
       ↓
Queue business date
```

This aligns with the backend architecture.

---

# 54. Number Formatting

Use locale-aware formatting where appropriate.

English:

```text
1,250
```

Bangla:

```text
১,২৫০
```

The product should define whether Bangla numerals are used globally or selectively.

---

# 55. Recommended Number Strategy

For clinical values:

```text
Use Arabic digits by default
```

because they are widely understood in medical contexts.

For ordinary UI text:

```text
Locale-aware formatting may be used.
```

This should be validated with Bangladeshi users.

---

# 56. Currency

Default:

```text
BDT
```

Display:

```text
৳ 500
```

or the approved localized representation.

Never store:

```text
৳500
```

as the financial value.

---

# 57. Currency Formatting

Use a centralized currency formatter.

Conceptually:

```dart
String formatCurrency(Decimal amount, Locale locale)
```

All financial screens must use the same formatter.

---

# 58. Payment Localization

English:

```text
Payment Received
৳ 500
```

Bangla:

```text
পেমেন্ট গ্রহণ করা হয়েছে
৳ ৫০০
```

Terminology should be consistent across:

- Payment
- Receipt
- Revenue
- Reports

---

# 59. Payment Methods

Payment method labels can be localized:

```text
Cash
নগদ

Card
কার্ড

Mobile Banking
মোবাইল ব্যাংকিং
```

Backend stores a stable enum/code.

---

# 60. Bangladesh Phone Formatting

User-facing display may use:

```text
01712-345678
```

or:

```text
01712345678
```

Choose one standard.

Canonical storage remains:

```text
+8801712345678
```

where supported by backend contract.

---

# 61. Phone Input

Support:

```text
01712345678
+8801712345678
8801712345678
```

Normalize before API submission.

---

# 62. Emergency Contact

Emergency contact fields should support:

```text
Name
Relationship
Phone
```

Relationship options should be localized.

Examples:

```text
Father
বাবা

Mother
মা

Spouse
স্বামী/স্ত্রী
```

---

# 63. Gender Labels

Gender values should be represented internally as stable codes.

Example:

```text
MALE
FEMALE
OTHER
PREFER_NOT_TO_SAY
```

Display localized labels.

Product requirements and local clinical/legal conventions should determine the final available values.

---

# 64. Address Localization

Bangladesh addresses are not always hierarchical enough for rigid global address forms.

Recommended:

```text
Address
Area
Thana/Upazila
District
Division
```

Optional structured fields plus free-text address.

---

# 65. Division List

If structured division selection is provided:

```text
Dhaka
Chattogram
Rajshahi
Khulna
Barishal
Sylhet
Rangpur
Mymensingh
```

Each should have localized display names.

Store stable codes.

---

# 66. District/Upazila Data

If supported, use a centrally maintained catalog.

Do not hardcode large geographic datasets inside individual widgets.

Architecture:

```text
LocationRepository
 ↓
LocationProvider
 ↓
Division
 ↓
District
 ↓
Upazila
```

---

# 67. Bangla Names

Names may contain:

```text
Bangla
English
Mixed script
Periods
Hyphens
Spaces
```

Do not impose western naming assumptions.

---

# 68. Name Ordering

Do not automatically convert:

```text
Md. Abdul Karim
```

into:

```text
Karim, Abdul Md.
```

unless explicitly required.

Display user-entered names naturally.

---

# 69. Honorifics

Doctors may use:

```text
Dr.
ডা.
```

but honorifics should be separate from the person's name where possible.

Example:

```text
title = Dr.
name = Abdul Karim
```

---

# 70. Doctor Profile

Fields:

```text
Name
Professional title
Specialty
Degree
Registration number
Chamber
```

Display according to selected locale.

Professional credentials should generally remain canonical.

---

# 71. Professional Credentials

Do not translate official credentials incorrectly.

Example:

```text
MBBS
FCPS
MD
MRCP
```

should generally remain unchanged.

---

# 72. Doctor Prescription Header

Example:

```text
Dr. Abdul Karim
MBBS, FCPS
Medicine Specialist
```

Bangla UI does not necessarily require translating credentials.

---

# 73. Bangladesh Medical Context

The UX should account for:

- Private chambers
- Multiple chambers
- Receptionist workflows
- Assistant doctors
- Walk-in patients
- Appointment patients
- Cash payments
- Local phone numbers
- Bangla communication
- Variable connectivity

---

# 74. Walk-In Terminology

Use clear localized terminology.

English:

```text
Walk-in Patient
```

Bangla:

```text
সরাসরি আগত রোগী
```

Final wording should be user-tested.

---

# 75. Appointment Terminology

English:

```text
Appointment
```

Bangla:

```text
অ্যাপয়েন্টমেন্ট
```

or another medically natural local term.

Maintain consistency.

---

# 76. Queue Terminology

English:

```text
Queue
Token
Call Patient
Next Patient
```

Bangla equivalents should be natural for chamber staff.

Potential:

```text
সিরিয়াল
টোকেন
রোগী ডাকুন
পরবর্তী রোগী
```

The final vocabulary should be validated with actual chamber staff.

---

# 77. Token Number

Token numbers should remain numeric:

```text
A-012
012
```

Do not unnecessarily localize token identifiers.

---

# 78. Patient ID

Patient IDs should remain machine-friendly.

Example:

```text
PAT-000123
```

Do not translate prefixes based on locale.

---

# 79. Search

Search must support:

```text
Bangla name
English name
Phone
Patient ID
```

The backend search implementation must handle Bangla appropriately.

---

# 80. Search Placeholder

English:

```text
Search patient by name, phone or ID
```

Bangla:

```text
নাম, ফোন বা আইডি দিয়ে রোগী খুঁজুন
```

---

# 81. Search Normalization

Search normalization may include:

```text
Whitespace normalization
Phone normalization
Case normalization
```

Do not aggressively alter Bangla Unicode text.

---

# 82. Bangla Unicode

The application must use Unicode consistently.

Avoid:

- Legacy Bangla encodings
- Non-Unicode database assumptions
- Manual glyph manipulation

---

# 83. Bangla Keyboard

Do not ship a custom Bangla keyboard in MVP.

Use the device's native keyboard.

The app must simply support Bangla Unicode input correctly.

---

# 84. Clipboard and Bangla

Copy/paste must preserve Unicode correctly.

Test:

```text
বাংলা
বাংলা + English
বাংলা + numbers
```

---

# 85. Bangla Text Rendering Tests

Test:

```text
রোগীর নাম
মোঃ আব্দুল করিম
রক্তচাপ
দিনে ৩ বার
```

on:

- Android
- iOS
- Web if supported

---

# 86. Localization of Notifications

Notification titles and bodies should be localized.

Example:

English:

```text
Appointment Confirmed
Your appointment has been confirmed.
```

Bangla:

```text
অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে
আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করা হয়েছে।
```

---

# 87. Notification Privacy

Do not put sensitive clinical details in notifications.

Bad:

```text
Diagnosis: Hypertension
Prescription: ...
```

Better:

```text
Your consultation has been updated.
```

---

# 88. Localized Empty States

Example:

English:

```text
No appointments today.
```

Bangla:

```text
আজ কোনো অ্যাপয়েন্টমেন্ট নেই।
```

---

# 89. Localized Loading States

Prefer simple:

```text
Loading...
```

or:

```text
লোড হচ্ছে...
```

Do not create dozens of unnecessary loading translations.

---

# 90. Localized Offline States

English:

```text
You're offline.
Changes will be saved locally where supported.
```

Bangla:

```text
আপনি অফলাইনে আছেন।
যেসব কাজ সমর্থিত, সেগুলোর পরিবর্তন স্থানীয়ভাবে সংরক্ষণ করা হবে।
```

---

# 91. Localized Conflict States

English:

```text
This information was changed elsewhere.
Please review the latest version.
```

Bangla:

```text
এই তথ্যটি অন্য কোথাও পরিবর্তন করা হয়েছে।
সর্বশেষ সংস্করণটি পর্যালোচনা করুন।
```

---

# 92. Localized Permission Errors

English:

```text
You don't have permission to perform this action.
```

Bangla:

```text
এই কাজটি করার অনুমতি আপনার নেই।
```

---

# 93. Localized Session Expiration

English:

```text
Your session has expired.
Please sign in again.
```

Bangla:

```text
আপনার সেশন শেষ হয়ে গেছে।
অনুগ্রহ করে আবার লগইন করুন।
```

---

# 94. Pluralization

Do not concatenate numbers manually.

Bad:

```dart
Text('$count patients')
```

Use localized plural rules.

Example:

```text
1 patient
5 patients
```

Bangla may use a different grammatical structure.

---

# 95. ICU Message Format

Use ICU messages through Flutter localization where appropriate.

Conceptually:

```text
{count, plural,
  =0 {No patients}
  =1 {1 patient}
  other {{count} patients}
}
```

Equivalent Bangla translation should be linguistically natural.

---

# 96. Gender/Grammatical Variation

Avoid unnecessarily gendered UI messages.

Prefer neutral messages wherever possible.

---

# 97. Relative Dates

Examples:

```text
Today
Yesterday
Tomorrow
2 days ago
```

These should be localized.

---

# 98. Calendar

Calendar UX should support:

- Gregorian calendar
- Localized month/day names
- Bangladesh timezone
- Appropriate first day of week
- Accessibility

MVP should remain Gregorian unless there is a strong product requirement for another calendar.

---

# 99. Weekday Names

English:

```text
Saturday
Sunday
Monday
...
```

Bangla:

```text
শনিবার
রবিবার
সোমবার
...
```

Use locale-aware formatting.

---

# 100. Month Names

English:

```text
January
February
...
```

Bangla:

```text
জানুয়ারি
ফেব্রুয়ারি
...
```

Use `intl` rather than manual lists where possible.

---

# 101. Time Period Labels

The application must define a consistent representation for:

```text
AM
PM
```

and Bangla equivalents.

Do not mix English and Bangla period markers inconsistently.

---

# 102. Reports Localization

Reports should support:

```text
UI language
Report language
```

where applicable.

Examples:

- Revenue report
- Appointment report
- Patient report
- Chamber report

---

# 103. PDF Localization

Prescription PDFs and receipts should support Bangla fonts.

Critical requirement:

```text
Bangla text must render correctly in PDF.
```

Do not assume the Flutter UI font automatically works in generated PDFs.

---

# 104. PDF Font Embedding

Backend PDF generation should embed an appropriate Unicode Bangla-capable font.

The font must be licensed appropriately for production use.

---

# 105. Prescription PDF Language

Prescription PDF generation should receive an explicit language parameter:

```text
language = bn
```

or:

```text
language = en
```

Backend generates the appropriate localized output.

---

# 106. Receipt Localization

Receipt should include:

```text
Chamber
Doctor
Patient
Date
Payment method
Amount
Receipt number
```

with localized labels.

---

# 107. Printed Output

Printed prescriptions should be:

- Readable
- High contrast
- Printer-friendly
- Bangla-compatible
- English-compatible
- Compact
- Clinically clear

Avoid decorative UI styling in medical documents.

---

# 108. RTL Readiness

Bangla is LTR.

However, architecture should not assume only LTR forever.

Future RTL languages may require:

```text
Directionality
Text alignment
Icons
Navigation
```

Use Flutter's localization/directionality system rather than manually forcing LTR everywhere.

---

# 109. Icon Directionality

Directional icons such as:

```text
Back
Forward
Arrow
Chevron
```

should respect `Directionality`.

Do not hardcode left/right assumptions unnecessarily.

---

# 110. Text Alignment

For normal text:

```text
TextAlign.start
```

is preferred over:

```text
TextAlign.left
```

where appropriate.

---

# 111. Layout Direction

Use:

```text
EdgeInsetsDirectional
AlignmentDirectional
```

when layout semantics depend on reading direction.

---

# 112. Localization and Navigation

Route names should remain stable:

```text
/app/patients
/app/appointments
```

Do not translate route identifiers.

Only visible route titles are localized.

---

# 113. Deep Links

Deep-link paths should remain language-independent.

Example:

```text
/app/patients/:patientId
```

works regardless of locale.

---

# 114. Localization and Analytics

Analytics event names remain stable.

Example:

```text
patient_created
appointment_created
prescription_finalized
```

Do not send:

```text
রোগী_তৈরি
```

as event names.

---

# 115. Analytics Screen Names

Use stable identifiers:

```text
patient_details
consultation_workspace
prescription_review
```

Localized display names are unnecessary for analytics.

---

# 116. Localization and Logging

Logs should use stable technical codes.

Example:

```text
VALIDATION_ERROR
DUPLICATE_PATIENT
```

Do not rely on translated user-facing strings for debugging.

---

# 117. Localization and API

API request payloads should generally use:

```text
codes
IDs
canonical values
```

Example:

```json
{
  "gender": "MALE"
}
```

not:

```json
{
  "gender": "পুরুষ"
}
```

---

# 118. Localization and Enums

Backend enum:

```text
PAID
PENDING
REFUNDED
```

Flutter display:

```text
Paid
পরিশোধিত
```

This separation must be maintained.

---

# 119. Localization and Cache

Cached entities should store canonical values.

Changing language should not require refetching all backend data.

Example:

```text
Patient entity
 ↓
same entity
 ↓
Bangla display
```

---

# 120. Localization and Offline Mode

Offline UI must still work in the selected language.

Translation resources should be bundled with the application.

Do not require network access to translate basic UI strings.

---

# 121. Localization and Sync

Sync payloads should remain language-neutral.

Example:

```text
prescription.status = FINALIZED
```

not:

```text
prescription.status = চূড়ান্ত
```

---

# 122. Localization and AI Cache

AI response cache must account for language.

Conceptually:

```text
AI request context
+
language
```

If the same request can produce different language responses, language must be part of the cache identity.

---

# 123. Localization and Patient Data

Patient names should not be translated.

If the patient provides:

```text
মোঃ আব্দুল করিম
```

store and display that exact name.

---

# 124. Localization and Clinical Notes

Clinical notes are user-authored content.

Never automatically translate them because the app locale changed.

---

# 125. Localization and Drafts

Changing locale while editing a form should:

```text
Change labels
Preserve user-entered values
Preserve draft
Preserve clinical text
```

---

# 126. Localization and Validation State

When switching language:

```text
Existing validation code
 ↓
Re-render localized message
```

Do not permanently store translated validation text inside form state.

---

# 127. Localization and Accessibility Text

Accessibility labels must also be localized.

Example:

English:

```text
Call next patient
```

Bangla:

```text
পরবর্তী রোগীকে ডাকুন
```

---

# 128. Localization and Tooltips

Tooltips should be localized.

However, avoid relying on tooltips for critical instructions because mobile users may not see them.

---

# 129. Localization and Confirmation Dialogs

All destructive/critical confirmations must be localized.

Example:

```text
Delete this patient?
```

Bangla:

```text
এই রোগীকে মুছে ফেলবেন?
```

Final wording should follow product/legal requirements.

---

# 130. Localization and Form Labels

Forms must use localized labels.

Example:

```text
Patient Name
রোগীর নাম
```

Required markers remain visually consistent.

---

# 131. Localization and Error Summary

Example:

English:

```text
Please fix 3 fields before continuing.
```

Bangla:

```text
চালিয়ে যাওয়ার আগে ৩টি ক্ষেত্র ঠিক করুন।
```

Use plural-aware localization.

---

# 132. Localization and Search Results

Search result content should use the patient's actual stored name.

UI labels are localized.

---

# 133. Localization and Queue

Queue statuses should map:

```text
WAITING
CALLED
IN_CONSULTATION
COMPLETED
SKIPPED
```

to localized labels.

---

# 134. Queue Example

English:

```text
Waiting
Called
In Consultation
Completed
```

Bangla:

```text
অপেক্ষমাণ
ডাকা হয়েছে
পরামর্শ চলছে
সম্পন্ন
```

Final terminology should be user-tested.

---

# 135. Appointment Status Localization

Backend:

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

Frontend translates these codes.

---

# 136. Prescription Status Localization

Backend:

```text
DRAFT
AI_ASSISTED
REVIEW_REQUIRED
FINALIZED
DELIVERED
```

Display localized status labels.

---

# 137. Payment Status Localization

Backend:

```text
PENDING
PAID
PARTIALLY_REFUNDED
REFUNDED
```

Display localized text.

---

# 138. Form Localization

All forms from Document 26 must use this localization layer:

```text
Patient
Appointment
Chamber
Staff
Schedule
Consultation
Vitals
Diagnosis
Investigation
Prescription
Payment
Refund
```

---

# 139. Global Search Localization

Search UI must support:

```text
Bangla
English
Phone
Patient ID
```

Search errors and empty states must be localized.

---

# 140. Dashboard Localization

Dashboard widgets should localize:

```text
Today's Patients
Appointments
Queue
Revenue
Pending Payments
Follow-ups
```

---

# 141. Reports Localization

Reports must use consistent localized terminology.

Example:

```text
Revenue
Patient Visits
Appointments
Cancellation Rate
Average Consultation Time
```

---

# 142. Staff UX Localization

Receptionist workflows should be particularly concise.

Examples:

```text
Register Patient
Check In
Call Patient
Take Payment
Complete Visit
```

Bangla versions should use natural operational language rather than literal translations.

---

# 143. Doctor UX Localization

Doctor-facing clinical terminology should prioritize:

```text
Accuracy
Familiar medical terminology
Short labels
Low cognitive load
```

---

# 144. Localization Review Process

Every translation should pass:

```text
Developer review
 ↓
Language review
 ↓
Medical terminology review
 ↓
UX review
 ↓
Native-user validation
```

---

# 145. Translation Ownership

Recommended ownership:

### Developers

Localization infrastructure.

### Product

Meaning/context.

### Bangla language reviewer

Natural Bangla.

### Medical reviewer

Clinical terminology.

---

# 146. Translation Source of Truth

ARB files should be the source of truth for UI translations.

Avoid maintaining separate unofficial spreadsheets as runtime truth.

A translation management platform may be introduced later.

---

# 147. Translation Quality Rules

Translations must be:

- Natural
- Concise
- Consistent
- Context-aware
- Clinically appropriate
- Accessible

Avoid literal word-for-word translation when it produces unnatural Bangla.

---

# 148. Translation Glossary

Maintain a glossary:

```text
English | Bangla | Context
```

Example:

```text
Patient | রোগী | Clinical
Appointment | অ্যাপয়েন্টমেন্ট | Scheduling
Prescription | প্রেসক্রিপশন | Clinical
Queue | সিরিয়াল | Chamber
```

---

# 149. Glossary Enforcement

The same concept must not randomly alternate between:

```text
রোগী
```

and:

```text
পেশেন্ট
```

unless context intentionally requires it.

---

# 150. Bangla UX Language Style

Recommended:

- Simple
- Familiar
- Professional
- Concise
- Avoid unnecessarily formal literary Bangla

The application targets busy doctors and chamber staff.

---

# 151. Example: Receptionist UX

Prefer:

```text
রোগী যোগ করুন
```

over overly formal alternatives.

---

# 152. Example: Doctor UX

Prefer concise labels:

```text
রোগ নির্ণয়
রোগীর ইতিহাস
রক্তচাপ
প্রেসক্রিপশন
```

rather than long explanatory phrases.

---

# 153. Localization and Performance

Localization resources should be loaded efficiently.

Basic translations should be bundled.

Do not perform network requests for every string.

---

# 154. Localization and App Startup

Startup should not wait for remote translation downloads.

Required language resources are packaged with the application.

---

# 155. Localization and App Size

Monitor translation resource size.

For two languages this should remain small.

Additional large locale-specific assets should be loaded only when necessary.

---

# 156. Localization Testing

Every release must test both:

```text
English
Bangla
```

at minimum.

---

# 157. Localization Unit Tests

Test:

```text
Translation key exists
Plural rules
Date formatting
Currency formatting
Phone formatting
Status mapping
Error mapping
```

---

# 158. Localization Widget Tests

Test:

```text
Button width
Text wrapping
Overflow
Validation messages
Dialogs
Navigation titles
Forms
```

in both languages.

---

# 159. Golden Tests

Golden tests should include:

```text
Dashboard EN
Dashboard BN
Queue EN
Queue BN
Consultation EN
Consultation BN
Prescription EN
Prescription BN
Payment EN
Payment BN
```

---

# 160. Accessibility Tests

Test both locales with:

```text
Large text
Screen reader
High contrast
Keyboard navigation
```

where supported.

---

# 161. Bangla Rendering Test Matrix

Test:

| Content | Android | iOS | Web |
|---|---:|---:|---:|
| Bangla UI | ✓ | ✓ | ✓ |
| Bangla names | ✓ | ✓ | ✓ |
| Bangla notes | ✓ | ✓ | ✓ |
| Mixed text | ✓ | ✓ | ✓ |
| Bangla numerals | ✓ | ✓ | ✓ |
| Prescription | ✓ | ✓ | ✓ |

---

# 162. PDF Localization Tests

Test:

```text
Bangla prescription PDF
Bangla receipt
English prescription PDF
English receipt
Mixed medical terminology
```

Verify:

- Glyph rendering
- Font embedding
- Alignment
- Line wrapping
- Printing

---

# 163. Localization Regression Test

Every new feature must verify:

```text
No hardcoded strings
English complete
Bangla complete
No overflow
No incorrect terminology
No untranslated enum
```

---

# 164. Static Analysis

CI should detect hardcoded user-facing strings where practical.

Potential approaches:

- Custom lint rules
- Code review
- Static analysis
- Localization key checks

---

# 165. Missing Translation Detection

CI should fail if:

```text
app_en.arb
```

contains a key absent from:

```text
app_bn.arb
```

for required MVP translations.

---

# 166. Unused Translation Detection

Periodically detect unused keys to prevent localization bloat.

---

# 167. Translation Key Naming Test

Ensure keys follow conventions:

```text
camelCase
semantic
feature-aware
```

---

# 168. Localization Release Checklist

Before release:

```text
□ English complete
□ Bangla complete
□ Missing keys checked
□ Medical terms reviewed
□ Validation reviewed
□ Status labels reviewed
□ Date/time tested
□ Currency tested
□ Phone tested
□ PDF tested
□ Accessibility tested
□ Large text tested
□ Bangla overflow tested
```

---

# 169. Bangladesh-Specific UX Checklist

```text
□ Bangladesh phone numbers
□ +880 normalization
□ BDT currency
□ Asia/Dhaka timezone
□ Bangla input
□ English input
□ Mixed input
□ Bangla names
□ Bangladesh address
□ Local chamber terminology
□ Local queue terminology
□ Local payment terminology
□ Bangla prescription
□ Bangla PDF
□ Variable connectivity
□ Offline localized states
```

---

# 170. Recommended Localization Architecture

```text
                 ┌─────────────────────┐
                 │   User Preference   │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │ Locale Controller   │
                 │     Riverpod        │
                 └──────────┬──────────┘
                            │
              ┌─────────────▼─────────────┐
              │   Flutter Localization    │
              │      AppLocalizations     │
              └─────────────┬─────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
     UI Text           Validation           Formatting
                            │                    │
                            │          ┌─────────┼─────────┐
                            │          │         │         │
                            │         Date     Number   Currency
                            │
                            ▼
                      Localized UX
```

---

# 171. Formatting Architecture

Create centralized services:

```text
DateFormatter
TimeFormatter
NumberFormatter
CurrencyFormatter
PhoneFormatter
FileSizeFormatter
RelativeTimeFormatter
```

---

# 172. Formatting Provider

These can be exposed through dependency injection/providers.

Example:

```text
formattingServiceProvider
```

Avoid calling `DateFormat` with arbitrary formats throughout the application.

---

# 173. Date Formatting Example

Bad:

```dart
DateFormat('dd/MM/yyyy')
```

everywhere.

Preferred:

```dart
ref.read(dateFormatterProvider).formatShort(date);
```

This allows locale-aware behavior.

---

# 174. Currency Formatting Example

Bad:

```dart
Text('৳ ${amount.toString()}')
```

Preferred:

```dart
Text(currencyFormatter.format(amount))
```

---

# 175. Phone Formatting Example

Bad:

```dart
Text(patient.phone)
```

if the product requires display formatting.

Preferred:

```dart
Text(phoneFormatter.format(patient.phone))
```

---

# 176. Canonical vs Display Values

Every formatter follows:

```text
Canonical Value
      ↓
Formatter
      ↓
Localized Display Value
```

Never reverse this relationship.

---

# 177. Localization and Domain Layer

Domain entities must not depend directly on Flutter localization.

Bad:

```dart
class Patient {
  String get displayGender => 'পুরুষ';
}
```

Preferred:

```text
Patient.gender = Gender.male
```

UI maps the value using localization.

---

# 178. Localization and Repository Layer

Repositories should not return translated UI strings.

Bad:

```text
PatientRepository
→ "রোগী পাওয়া যায়নি"
```

Preferred:

```text
PatientRepository
→ NotFoundFailure
```

UI translates the failure.

---

# 179. Localization and Use Cases

Use cases should operate on:

```text
entities
codes
values
failures
```

not localized UI text.

---

# 180. Localization and Riverpod

Riverpod controllers should generally expose:

```text
errorCode
failure
validationCode
status
```

rather than permanently storing translated strings.

This allows language switching without rebuilding business state.

---

# 181. Localization and Widgets

Widgets consume:

```text
AppLocalizations
```

and render localized content.

---

# 182. Locale Change During Active Consultation

If doctor changes language while consultation is open:

```text
UI labels change
Clinical data remains unchanged
Draft remains unchanged
AI context remains unchanged
```

Prescription language remains independent if explicitly configured.

---

# 183. Locale Change During Prescription Editing

Changing UI locale must not:

- Translate medicine names
- Change dosage
- Change frequency
- Change duration
- Modify doctor notes

Only UI presentation changes.

---

# 184. Locale Change During AI Chat

Existing messages should retain their generated content.

Changing locale affects:

```text
New request language
UI labels
```

unless the user explicitly requests translation.

---

# 185. Locale Change During Report Analysis

AI analysis result should not automatically change language merely because the UI locale changed.

Provide explicit translation/regeneration where required.

---

# 186. Localization and Notifications

If server sends push notifications, preferred language should be available to backend notification generation.

Example:

```text
user.locale = bn
```

Backend notification template:

```text
bn
```

---

# 187. Backend Notification Templates

Recommended:

```text
notificationType
locale
template
variables
```

Example:

```text
APPOINTMENT_CONFIRMED
bn
```

---

# 188. Localization and Email/SMS

Future communication channels should support:

```text
English
Bangla
```

Templates should use stable variable names.

---

# 189. Localization and WhatsApp

If later integrated:

```text
Template language
```

must be managed independently from application UI language.

---

# 190. Localization and Subscription

Subscription plans may require:

```text
Plan name
Description
Feature labels
Price
Billing period
```

localized in UI.

Financial/legal terms must be accurately translated.

---

# 191. Localization and Platform Admin

Platform Admin UI may initially be English-first.

However, architecture should not prevent Bangla support later.

---

# 192. Localization and Audit Logs

Audit events remain machine-readable:

```text
PRESCRIPTION_FINALIZED
PAYMENT_CREATED
PATIENT_UPDATED
```

The UI may display localized human-readable descriptions.

---

# 193. Localization and Export

CSV/Excel/PDF exports should define:

```text
Export language
```

where appropriate.

Raw IDs/codes remain unchanged.

---

# 194. Localization and Backup

Backups contain canonical data.

They should not depend on the current locale.

---

# 195. Localization and Search Index

Search index should support:

```text
Unicode
Bangla
English
```

but should not store translated UI labels unnecessarily.

---

# 196. Localization and Database

Database should use:

```text
UTF-8
```

and PostgreSQL Unicode support.

Bangla text must round-trip correctly.

---

# 197. Database Unicode Testing

Test:

```text
Flutter
 ↓
API
 ↓
PostgreSQL
 ↓
API
 ↓
Flutter
```

with Bangla patient names and clinical notes.

The original string must remain unchanged.

---

# 198. API Unicode Testing

Test:

```json
{
  "name": "মোঃ আব্দুল করিম"
}
```

and verify:

```text
POST
→ database
→ GET
→ Flutter
```

returns the same content correctly.

---

# 199. Localization and Offline Database

Offline storage must preserve Unicode.

Test Bangla content through:

```text
Save
Close app
Restart
Read
Sync
```

---

# 200. Localization and Sync Conflicts

Conflict comparison should use canonical values.

Do not compare localized display strings.

---

# 201. Localization and Sorting

Sorting Bangla names requires deliberate behavior.

Do not assume default Unicode ordering provides ideal Bangla alphabetical ordering.

If alphabetical Bangla sorting is required, define and test a proper collation/ordering strategy.

---

# 202. Localization and Patient Search Ranking

Search relevance should be language-aware.

Example:

```text
রহিম
```

should find:

```text
রহিম
```

without requiring English transliteration.

---

# 203. Transliteration

Do not automatically transliterate names.

For example:

```text
রহিম
```

should not automatically become:

```text
Rahim
```

unless the user explicitly requests it.

---

# 204. Optional Transliteration

Future feature:

```text
Bangla name
 ↓
Suggested English transliteration
 ↓
User review
 ↓
Save
```

This must never silently replace the original name.

---

# 205. Bangladesh Number Input

Support standard local formats while maintaining canonical storage.

Example:

```text
Input:
01712345678

Canonical:
+8801712345678
```

---

# 206. Bangladesh Time

Primary display timezone:

```text
Asia/Dhaka
```

Use IANA timezone identifiers.

Do not hardcode:

```text
UTC+6
```

throughout the application.

---

# 207. Daylight Saving Consideration

Bangladesh does not currently use seasonal DST rules in normal operation, but the application should still use the named timezone:

```text
Asia/Dhaka
```

rather than assuming a permanent numeric offset.

---

# 208. Bangladesh Currency

Canonical currency:

```text
BDT
```

Display symbol:

```text
৳
```

Use a centralized formatter.

---

# 209. Localization and Clinical Units

Units should generally remain internationally recognizable:

```text
kg
cm
°C
mmHg
bpm
%
```

Labels around them can be localized.

---

# 210. Localization and Decimal Separators

Clinical and financial numeric input must follow a consistent parsing policy.

Do not allow locale formatting to make numeric API values ambiguous.

Example:

```text
1,000
```

must have clearly defined interpretation.

---

# 211. Recommended Numeric Input Rule

For data entry:

```text
Accept:
0-9
.
```

where decimal input is required.

Convert to canonical numeric values before API submission.

Localized display can differ.

---

# 212. Localization and Forms

Document 26 remains authoritative for:

- Form validation
- Input handling
- Focus
- Keyboard
- Autosave

Document 27 adds:

- Localized labels
- Localized errors
- Localized formatting
- Bangla input support

---

# 213. Localization and Navigation

Document 25 remains authoritative for routing.

Document 27 adds:

- Localized route titles
- Localized navigation labels
- Directionality readiness
- Localized deep-link destination UI

---

# 214. Localization and Networking

Document 24 remains authoritative for resilience.

API requests may include:

```text
Accept-Language
```

where supported.

Example:

```text
Accept-Language: bn
```

However, critical API contracts should remain language-neutral.

---

# 215. Accept-Language

Use it for:

- Server-generated messages
- Notifications
- AI response preferences where appropriate

Do not use it to change:

- IDs
- Enum codes
- API field names
- Data contracts

---

# 216. Localization Headers

Conceptual:

```text
Accept-Language: bn
X-App-Locale: bn
```

Only send headers that are part of the agreed backend API contract.

---

# 217. Locale Metadata

The app may send:

```text
locale
timezone
appVersion
platform
```

as metadata where required.

Never include unnecessary patient information.

---

# 218. Localization and Security

Localization must not bypass:

- Authorization
- Validation
- Audit
- Data isolation

A translated label does not change the underlying permission.

---

# 219. Localization and AI Security

Patient-provided text in Bangla is still untrusted content.

AI systems must treat:

```text
Bangla clinical note
```

as patient data, not system instructions.

---

# 220. Localization and Prompt Injection

Prompt injection may occur in any language.

Security controls must be language-independent.

---

# 221. Localization and Auditability

When an AI action is performed:

```text
AI request
language = bn
```

may be recorded as metadata where appropriate.

Do not store unnecessary clinical content in logs.

---

# 222. Localization and Error Reporting

Crash reports should contain stable technical information, not translated user messages as the primary diagnostic signal.

---

# 223. Localization and Testing Fixtures

Create fixtures:

```text
banglaPatient
banglaDoctor
mixedLanguagePatient
banglaClinicalNote
banglaPrescription
```

---

# 224. Sample Bangla Patient Fixture

```text
Name:
মোঃ আব্দুল করিম

Phone:
01712345678

Address:
মিরপুর, ঢাকা
```

Use synthetic test data only.

---

# 225. Sample Bangla Clinical Fixture

```text
রোগীর ৩ দিন ধরে জ্বর এবং কাশি রয়েছে।
```

No real patient data should be committed to source control.

---

# 226. Sample Mixed Fixture

```text
Patient reports ৩ days of fever.
```

This is important because mixed-script content is common.

---

# 227. Localization Test Dataset

Maintain test strings containing:

```text
Short Bangla
Long Bangla
Mixed Bangla-English
Numbers
Medical terms
Special characters
Unicode punctuation
```

---

# 228. Long Translation Test

Every major screen should be tested with unusually long localized strings to detect:

```text
Overflow
Clipping
Layout collapse
Button wrapping
Dialog overflow
```

---

# 229. Small Screen Testing

Minimum practical test:

```text
320px-class width
```

for critical mobile screens.

Verify Bangla text remains usable.

---

# 230. Tablet Testing

Test:

```text
768–1023px
```

with both locales.

---

# 231. Desktop Testing

For supported desktop/web layouts:

```text
>=1024px
```

Test Bangla navigation and table layouts.

---

# 232. Localization and Tables

Tables may become wider in Bangla.

Use:

```text
horizontal scrolling
responsive columns
priority columns
```

rather than clipping text.

---

# 233. Localization and Dashboard Cards

Dashboard cards should adapt to translated labels.

Avoid fixed widths based solely on English labels.

---

# 234. Localization and Bottom Navigation

Keep labels concise.

Example:

```text
Dashboard
Patients
Queue
Appointments
More
```

Bangla equivalents should remain short enough for mobile.

---

# 235. Localization and App Shell

Application shell includes:

```text
Navigation
App bar
Chamber selector
Notifications
Profile
Global search
```

All must support runtime locale changes.

---

# 236. Localization and Chamber Selector

Chamber names remain user-entered values.

The selector label itself is localized.

Example:

```text
Select Chamber
চেম্বার নির্বাচন করুন
```

---

# 237. Localization and Patient Timeline

Timeline event types should use stable codes:

```text
ENCOUNTER_CREATED
PRESCRIPTION_FINALIZED
PAYMENT_RECEIVED
```

and localized display labels.

---

# 238. Localization and Reports

Charts may use localized axis labels and legends.

Numerical values should remain accurate and unambiguous.

---

# 239. Localization and CSV

CSV exports require special attention to:

- UTF-8
- Bangla characters
- Excel compatibility
- Column names
- Encoding markers where appropriate

---

# 240. Localization and Excel

Bangla text should render correctly when exported to Excel-compatible formats.

Use the backend/export implementation defined by the project.

---

# 241. Localization and Printing

Printer output should be tested with:

```text
Bangla
English
Mixed text
```

Some printers may have font limitations, so PDF rendering should be preferred where appropriate.

---

# 242. Localization and App Store Metadata

Future release assets may need:

```text
English metadata
Bangla metadata
```

This is outside runtime localization but should be tracked separately.

---

# 243. Localization Configuration

Recommended configuration:

```text
supportedLocales
defaultLocale
fallbackLocale
fallbackLanguage
prescriptionLanguage
aiLanguage
```

---

# 244. Fallback Strategy

If Bangla translation is missing:

```text
Bangla key
 ↓
English fallback
```

However, missing Bangla translations should be treated as release defects for required production screens.

---

# 245. Fallback Safety

Never show:

```text
patientCreateTitle
```

to the user.

Missing translation should fall back gracefully.

---

# 246. Translation Build Validation

CI should:

```text
Generate localization
 ↓
Compile Flutter
 ↓
Verify all required keys
 ↓
Run localization tests
```

---

# 247. Localization CI Pipeline

```text
Code
 ↓
Analyze
 ↓
Generate l10n
 ↓
Check missing keys
 ↓
Unit Tests
 ↓
Widget Tests
 ↓
Golden Tests
 ↓
Integration Tests
```

---

# 248. Localization Code Review Checklist

Reviewer checks:

```text
□ No hardcoded strings
□ Correct translation key
□ Context documented
□ Bangla translation natural
□ Medical term reviewed
□ Pluralization handled
□ Overflow considered
□ Accessibility label localized
```

---

# 249. Localization Definition of Ready

A feature is ready for implementation when:

```text
□ English copy approved
□ Bangla copy available
□ Medical terminology reviewed
□ Formatting requirements defined
□ Locale behavior defined
□ Accessibility labels defined
```

---

# 250. Localization Definition of Done

A feature is done when:

```text
□ English implemented
□ Bangla implemented
□ No missing translations
□ No hardcoded UI strings
□ Formatting localized
□ Validation localized
□ Accessibility localized
□ Responsive layouts verified
□ Golden tests updated
□ Bangla rendering tested
□ CI localization checks pass
```

---

# 251. Sprint Mapping

## Sprint 1 — Foundation

Implement:

- Flutter localization
- ARB
- `AppLocalizations`
- Locale provider
- Locale persistence
- Formatting services
- Bangla font strategy

---

## Sprint 2 — Authentication

Localize:

- Login
- Registration
- OTP
- Password reset
- Validation
- Session errors

---

## Sprint 3 — Doctor/Chamber

Localize:

- Doctor profile
- Professional profile
- Chamber
- Schedule
- Staff

---

## Sprint 4 — Patients

Localize:

- Patient registration
- Search
- Details
- Timeline
- Allergy
- Conditions
- Address

---

## Sprint 5 — Appointment/Queue

Localize:

- Calendar
- Appointment
- Queue
- Token
- Status
- Check-in

---

## Sprint 6 — Consultation

Localize:

- Vitals
- Clinical notes
- Diagnosis
- Investigation
- Follow-up

---

## Sprint 7 — Prescription

Localize:

- Prescription builder
- Medicine instructions
- Review
- Finalization
- Prescription preview
- Prescription language

---

## Sprint 8 — Payments

Localize:

- Payment
- Receipt
- Refund
- Currency
- Payment statuses

---

## Sprint 9 — AI

Localize:

- Patient summary
- Clinical chat
- AI prescription draft
- AI report analysis
- AI status
- AI language preference

---

## Sprint 10 — Reports/Notifications

Localize:

- Reports
- Charts
- Notifications
- Dashboard analytics

---

## Sprint 11 — Offline/Advanced UX

Localize:

- Offline states
- Sync states
- Conflict states
- Draft recovery
- Connectivity messages

---

## Sprint 12 — Production Hardening

Complete:

- Translation audit
- Accessibility
- Golden tests
- PDF tests
- Bangla device testing
- Performance testing
- Final language review

---

# 252. MVP Localization Scope

MVP must include:

```text
✓ English
✓ Bangla
✓ Runtime switching
✓ Persistent preference
✓ Localized validation
✓ Bangladesh phone formatting
✓ BDT
✓ Asia/Dhaka
✓ Bangla input
✓ Localized appointment/queue
✓ Localized consultation
✓ Localized prescription
✓ Localized payment
✓ Localized errors
✓ Basic Bangla PDF
```

---

# 253. Phase 2 Localization

Add:

```text
✓ Advanced Bangla terminology
✓ Bangla AI responses
✓ Bangla voice
✓ Advanced report localization
✓ SMS templates
✓ Notification templates
✓ Bangla analytics
✓ Transliteration assistance
```

---

# 254. Phase 3 Localization

Potential:

```text
✓ Additional South Asian languages
✓ Advanced multilingual AI
✓ Patient portal localization
✓ Telemedicine localization
✓ Pharmacy/lab localization
✓ Multilingual communication templates
```

---

# 255. Localization Anti-Patterns

Avoid:

```text
❌ Hardcoded strings
❌ Translating domain enums
❌ Translating patient names
❌ Automatic clinical-note translation
❌ Fixed-width English-only buttons
❌ Hardcoded UTC+6
❌ Hardcoded currency strings
❌ Manual date formatting everywhere
❌ Raw server errors
❌ Language-specific business logic
❌ Locale-dependent API contracts
❌ Silent transliteration
```

---

# 256. Final Localization Architecture

```text
                         User
                           │
                           ▼
                    ┌──────────────┐
                    │ Locale UI    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Riverpod     │
                    │ Locale State │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │ Flutter Localization    │
              │ AppLocalizations        │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
     UI Text          Validation          Formatting
        │                  │                  │
        │                  │        ┌─────────┼─────────┐
        │                  │        │         │         │
        ▼                  ▼        ▼         ▼         ▼
      Bangla            Errors    Date      Number   Currency
      English
        │
        ▼
 ┌─────────────────────────────────────┐
 │ Bangladesh-Specific UX              │
 │                                     │
 │ Phone • BDT • Asia/Dhaka            │
 │ Names • Address • Medical Terms     │
 │ Queue • Prescription • AI           │
 └─────────────────────────────────────┘
```

---

# 257. Complete Localization Data Flow

```text
Canonical Backend Data
        ↓
Domain Entity
        ↓
Riverpod State
        ↓
Localized Presentation
        ↓
Formatter / Translator
        ↓
Flutter UI
```

For example:

```text
gender = MALE
        ↓
Locale = bn
        ↓
পুরুষ
```

but:

```text
gender = MALE
```

remains the canonical application value.

---

# 258. Complete Bangladesh UX Data Flow

```text
User Input
    ↓
Bangla / English / Mixed
    ↓
Normalization
    ↓
Canonical Domain Value
    ↓
API
    ↓
Database
    ↓
Canonical Value
    ↓
Localized Display
```

This guarantees that language presentation does not corrupt the underlying data.

---

# 259. Final Architectural Rules

The following rules are mandatory:

1. **Never hardcode user-facing strings.**
2. **English and Bangla are first-class locales.**
3. **Use Flutter's generated localization architecture.**
4. **Keep domain data language-neutral.**
5. **Keep API contracts language-neutral.**
6. **Store canonical dates and timestamps.**
7. **Use Asia/Dhaka for Bangladesh-local display.**
8. **Use BDT for Bangladesh financial display.**
9. **Normalize Bangladesh phone numbers centrally.**
10. **Preserve Bangla Unicode exactly.**
11. **Do not automatically translate patient names.**
12. **Do not automatically translate clinical notes.**
13. **Do not automatically modify prescriptions during localization.**
14. **Prescription language must be independently configurable.**
15. **AI language must not compromise clinical meaning.**
16. **Localization must not bypass security or authorization.**
17. **Localized status labels must map from stable backend enums.**
18. **Validation codes must remain language-independent.**
19. **PDFs must explicitly support Bangla fonts.**
20. **All production screens must pass Bangla overflow and accessibility testing.**

---

# 260. Final Product Principle

Chamber Management should not feel like an English application that has been translated into Bangla.

It should feel like a **Bangladesh-first medical chamber application that naturally supports both Bangla and English**.

The architecture therefore separates:

```text
Language
from
Data

Presentation
from
Business Logic

Localization
from
Domain Rules

Display Formatting
from
Canonical Storage
```

The final model is:

```text
                 CHAMBER MANAGEMENT
                         │
             ┌───────────┴───────────┐
             │                       │
          English                  Bangla
             │                       │
             └───────────┬───────────┘
                         │
                Same Domain Model
                         │
                Same API Contract
                         │
                Same Security Model
                         │
                Same Clinical Data
                         │
                Bangladesh UX Layer
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
     Phone              BDT            Asia/Dhaka
       │                 │                 │
       ├─────────────────┼─────────────────┤
       │                 │                 │
     Bangla          Medical          Local Chamber
     Input          Terminology           Workflow
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                   Doctor / Staff
```

This architecture provides a stable foundation for multilingual clinical workflows while preserving **clinical data integrity, security, accessibility, performance, and future extensibility**.

---

# 261. Relationship With Complete Document Set

Document 27 completes the presentation/localization layer and integrates with:

```text
Document 17
Flutter API Integration

Document 18
Riverpod State Management

Document 20
Screen-by-Screen Implementation

Document 22
Security, Privacy & Data Protection

Document 23
Offline-First, Local Storage & Synchronization

Document 24
Networking, API Error Handling & Resilience

Document 25
Navigation, Routing, Deep Linking & Application Shell

Document 26
Forms, Validation, Input Handling & User Interaction
```

Together these establish the complete Flutter foundation:

```text
Application Shell
       ↓
Navigation
       ↓
Localization
       ↓
Forms / Input
       ↓
Riverpod State
       ↓
Clean Architecture
       ↓
Networking
       ↓
Offline / Sync
       ↓
Security
       ↓
Backend API
```

# End of Document 27