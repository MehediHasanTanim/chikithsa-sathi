# Document 26 — Complete Flutter Forms, Validation, Input Handling & User Interaction Implementation Specification

**Project:** Chamber Management  
**Platform:** Flutter  
**Architecture:** Clean Architecture + Feature-First  
**State Management:** Riverpod  
**Networking:** Dio  
**Serialization:** Freezed + json_serializable  
**Local Storage:** Hive  
**Secure Storage:** flutter_secure_storage  
**Routing:** GoRouter  
**Languages:** Bangla + English  
**Target Users:** Doctor, Assistant Doctor, Receptionist, Chamber Manager, Billing Staff  
**Document Type:** Implementation Specification  
**Status:** Implementation Ready

---

# 1. Purpose

This document defines the complete implementation architecture for:

- Flutter forms
- User input
- Validation
- Form state
- Input formatting
- Keyboard handling
- Focus management
- Server validation
- Clinical data entry
- Autosave
- Draft persistence
- Error presentation
- User interaction
- Accessibility
- Localization
- Offline form behavior
- Form testing

The objective is to ensure that every form in Chamber Management behaves consistently and safely.

---

# 2. Form Architecture Principles

The implementation must follow these principles:

1. UI widgets must not contain business validation logic.
2. Form state must be immutable where practical.
3. Riverpod manages form/application state.
4. Domain validation belongs in domain/application layers.
5. UI validation provides immediate feedback.
6. Backend validation remains authoritative.
7. Server validation errors must map to individual fields where possible.
8. Clinical data must never be silently discarded.
9. Critical actions require explicit confirmation.
10. Autosave must be used for appropriate clinical drafts.
11. Finalization must never rely on client-side validation alone.
12. Input formatting must not corrupt user data.
13. Bangla and English input must be supported.
14. Forms must work on mobile, tablet, and desktop.
15. Accessibility must be considered from the beginning.
16. Offline forms must clearly distinguish saved, local, and synchronized states.

---

# 3. Form Categories

Forms are divided into four categories.

## 3.1 Simple Forms

Examples:

- Login
- OTP
- Password
- Search
- Settings

Characteristics:

- Short
- Immediate submission
- Minimal persistence

---

## 3.2 Transaction Forms

Examples:

- Appointment creation
- Payment
- Staff invitation
- Chamber setup

Characteristics:

- Multiple fields
- Server validation
- Submit/cancel flow
- Possible draft state

---

## 3.3 Clinical Forms

Examples:

- Vitals
- Clinical notes
- Diagnosis
- Investigation
- Prescription

Characteristics:

- Sensitive data
- Autosave
- Strong validation
- Conflict handling
- Auditability
- Server confirmation

---

## 3.4 Configuration Forms

Examples:

- Doctor profile
- Professional profile
- Chamber
- Schedule
- Staff permissions
- Preferences

Characteristics:

- Persistent
- Editable
- Validation required
- Usually non-clinical

---

# 4. Form Architecture

Recommended flow:

```text
Widget
  ↓
Form Controller / Riverpod Notifier
  ↓
Form State
  ↓
Validation
  ↓
Use Case
  ↓
Repository
  ↓
API / Local Storage
```

Never:

```text
Widget
  ↓
Dio
```

---

# 5. Recommended Project Structure

```text
lib/
├── core/
│   ├── validation/
│   │   ├── validators/
│   │   ├── validation_error.dart
│   │   ├── validation_result.dart
│   │   └── validation_utils.dart
│   │
│   ├── input/
│   │   ├── formatters/
│   │   ├── masks/
│   │   └── input_utils.dart
│   │
│   └── forms/
│       ├── form_state.dart
│       ├── form_status.dart
│       ├── field_error.dart
│       └── form_controller.dart
│
└── features/
    ├── auth/
    ├── patients/
    ├── appointments/
    ├── consultation/
    ├── prescription/
    ├── payments/
    ├── chambers/
    └── staff/
```

---

# 6. Form State Model

A reusable form state should represent:

```text
Initial
Editing
Valid
Invalid
Submitting
Success
Failure
Saved
Saving
SaveFailed
```

Example:

```dart
enum FormStatus {
  initial,
  editing,
  valid,
  invalid,
  submitting,
  success,
  failure,
  saving,
  saved,
  saveFailed,
}
```

---

# 7. Generic Form State

Conceptual:

```dart
@freezed
class FormState<T> with _$FormState<T> {
  const factory FormState({
    required T value,
    @Default(FormStatus.initial) FormStatus status,
    @Default({}) Map<String, String> fieldErrors,
    String? generalError,
    @Default(false) bool dirty,
  }) = _FormState<T>;
}
```

For more complex features, use feature-specific state classes rather than forcing every form into one generic model.

---

# 8. Field State

Each important field may track:

```text
Value
Dirty
Touched
Focused
Valid
Error
Server Error
```

Example:

```dart
@freezed
class FieldState<T> with _$FieldState<T> {
  const factory FieldState({
    T? value,
    @Default(false) bool touched,
    @Default(false) bool dirty,
    String? error,
  }) = _FieldState<T>;
}
```

---

# 9. Touched vs Dirty

These concepts must remain separate.

### Touched

User interacted with the field.

### Dirty

Value differs from the initial value.

Example:

```text
Initial:
Name = "Rahim"

User focuses and leaves:
Name = "Rahim"

Touched = true
Dirty = false
```

This distinction controls validation and unsaved-change warnings.

---

# 10. Validation Timing

Validation should happen at multiple levels.

### Level 1 — Input

Immediate format validation.

### Level 2 — Field blur

Validate when user leaves the field.

### Level 3 — Form submission

Validate all fields.

### Level 4 — Backend

Authoritative validation.

---

# 11. Validation UX

Avoid displaying errors immediately when the form first opens.

Bad:

```text
Name
Required ❌
Phone
Required ❌
```

Better:

```text
Name
[              ]
```

After interaction:

```text
Name
[              ]
Name is required
```

---

# 12. Validation Severity

Validation messages may be:

```text
Error
Warning
Information
```

Examples:

### Error

```text
Phone number is required.
```

### Warning

```text
This patient may already exist.
```

### Information

```text
Patient ID will be generated automatically.
```

---

# 13. Validation Architecture

Recommended:

```text
UI Validator
     ↓
Domain Validation
     ↓
Backend Validation
```

The same business rule should not be duplicated unnecessarily.

Where a rule is shared between client and server, define a clear contract.

---

# 14. Validation Result

Example:

```dart
sealed class ValidationResult {
  const ValidationResult();
}

class Valid extends ValidationResult {
  const Valid();
}

class Invalid extends ValidationResult {
  final String code;
  final String message;

  const Invalid({
    required this.code,
    required this.message,
  });
}
```

Prefer validation codes internally.

---

# 15. Validation Codes

Examples:

```text
required
invalid_email
invalid_phone
invalid_date
invalid_number
invalid_range
duplicate_patient
invalid_bp
invalid_temperature
invalid_dosage
invalid_frequency
server_validation
```

Localization should map codes to translated messages.

---

# 16. Required Field Validation

Required fields:

```text
Patient name
Phone
Doctor name
Chamber name
Appointment date
Appointment time
Medicine name
Dosage
Frequency
```

Generic validator:

```dart
String? requiredValidator(String? value) {
  if (value == null || value.trim().isEmpty) {
    return 'required';
  }

  return null;
}
```

---

# 17. String Validation

Rules:

- Trim leading/trailing whitespace.
- Preserve meaningful internal spaces.
- Do not arbitrarily remove Bangla characters.
- Avoid aggressive normalization unless explicitly required.

Example:

```text
"  Md. Rahim  "
```

becomes:

```text
"Md. Rahim"
```

---

# 18. Name Validation

Names may contain:

- Bangla
- English
- Spaces
- Periods
- Hyphens
- Apostrophes

Avoid overly restrictive regex patterns.

Valid examples:

```text
Md. Abdul Karim
মোঃ আব্দুল করিম
Rahim-Uddin
```

---

# 19. Phone Number Input

Bangladesh phone numbers should support common forms.

Examples:

```text
01712345678
+8801712345678
8801712345678
```

Internally normalize to a canonical representation.

Recommended canonical form:

```text
+8801XXXXXXXXX
```

---

# 20. Phone Input UX

Display:

```text
Phone Number
[ 017XXXXXXXX ]
```

The keyboard should be numeric where appropriate.

Do not prevent users from entering `+880` if the field explicitly supports international format.

---

# 21. Phone Normalization

Conceptual:

```text
01712345678
       ↓
+8801712345678
```

Normalization should happen before API submission.

Never modify the displayed value unexpectedly while the user is typing.

---

# 22. Email Validation

Email validation should be practical rather than excessively restrictive.

Use:

```text
RFC-compatible reasonable validation
```

Do not attempt to fully prove that an email address exists on the client.

Backend verification remains authoritative.

---

# 23. Numeric Input

Numeric fields include:

- Age
- Weight
- Height
- Temperature
- Pulse
- SpO2
- Consultation fee
- Quantity
- Dosage

Use appropriate keyboards.

---

# 24. Decimal Input

Fields such as:

```text
Weight
Height
Temperature
Fee
Dosage
```

may require decimals.

Accept:

```text
70
70.5
```

Do not accept invalid values such as:

```text
70..5
```

---

# 25. Number Parsing

Never directly trust:

```dart
double.parse(value)
```

without validation.

Use safe parsing:

```dart
final value = double.tryParse(input);
```

Then validate the result.

---

# 26. Range Validation

Examples:

```text
Weight > 0
Height > 0
Temperature > 0
Pulse > 0
SpO2 between 0 and 100
```

Range rules should be domain-specific.

---

# 27. Age Input

Prefer date of birth where possible.

If age is entered:

```text
0–150
```

may be used as a sanity range.

However, patient age should preferably be derived from:

```text
dateOfBirth
```

rather than manually maintained.

---

# 28. Date of Birth

Date picker must support:

- Past dates
- Reasonable minimum/maximum dates
- Bangla/English localization
- Clear date format

Store:

```text
YYYY-MM-DD
```

as a date concept rather than a formatted display string.

---

# 29. Date and Time

All server timestamps follow the architecture rule:

```text
Storage:
UTC

Display:
Asia/Dhaka
```

Forms should convert appropriately.

---

# 30. Appointment Date

Appointment date should validate:

- Valid date
- Chamber schedule
- Doctor availability
- Holidays where configured
- Existing appointment conflicts

Some of these require server validation.

---

# 31. Appointment Time

Time input should:

- Respect chamber schedule
- Display local Bangladesh time
- Support 12-hour/24-hour preference
- Prevent invalid intervals
- Respect appointment duration

---

# 32. Timezone Rule

Never manually add/subtract Bangladesh offset throughout UI code.

Use a centralized date/time utility.

```text
UTC
 ↓
DateTimeService
 ↓
Asia/Dhaka
```

---

# 33. Text Input Controllers

Controllers should be owned by the UI/controller lifecycle.

Avoid global controllers.

Example:

```dart
final nameController = TextEditingController();
```

Dispose appropriately.

---

# 34. Riverpod Form Controller

For complex forms:

```dart
final patientFormControllerProvider =
    NotifierProvider<PatientFormController, PatientFormState>(
  PatientFormController.new,
);
```

The controller owns:

- Field updates
- Validation
- Submission
- Server errors
- Dirty state

---

# 35. Form Controller Responsibilities

A controller may expose:

```text
setName()
setPhone()
setGender()
setDateOfBirth()
validate()
submit()
reset()
clearErrors()
```

Avoid exposing internal implementation details to widgets.

---

# 36. Form Controller Example

Conceptually:

```dart
void setName(String value) {
  state = state.copyWith(
    name: value,
    dirty: true,
    nameError: null,
  );
}
```

Then:

```dart
Future<void> submit() async {
  final validation = validate();

  if (!validation.isValid) {
    state = ...
    return;
  }

  state = state.copyWith(
    status: FormStatus.submitting,
  );

  final result = await useCase(...);

  // Map result.
}
```

---

# 37. Form Submission Flow

```text
User taps Submit
      ↓
Disable duplicate submit
      ↓
Client validation
      ↓
Build domain request
      ↓
Use case
      ↓
Repository
      ↓
API
      ↓
Server validation
      ↓
Success / Error
```

---

# 38. Double Submission Prevention

While submitting:

```text
Submit button disabled
```

State:

```text
isSubmitting = true
```

Do not allow:

```text
tap
tap
tap
```

to create duplicate appointments/payments.

---

# 39. Idempotency

Critical mutations should use the API idempotency mechanism defined in Document 17.

Examples:

```text
Appointment creation
Payment
Prescription finalization
Staff invitation
```

Use a client-generated idempotency key where supported.

---

# 40. Server Validation Errors

Backend may return:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "phone",
        "code": "DUPLICATE",
        "message": "Patient already exists"
      }
    ]
  }
}
```

Map:

```text
phone → phoneError
```

---

# 41. Field Error Mapping

Backend field names should map to frontend field identifiers.

Example:

```dart
const fieldMap = {
  'phone': 'phone',
  'dateOfBirth': 'dateOfBirth',
  'chamberId': 'chamber',
};
```

Avoid hardcoded mapping scattered across widgets.

---

# 42. General Server Errors

If no field can be associated:

```text
Something went wrong. Please try again.
```

Show a form-level error.

Example:

```text
┌──────────────────────────────┐
│ Unable to save changes.      │
│ Please try again.            │
└──────────────────────────────┘
```

---

# 43. Network Errors

Examples:

```text
No internet connection
Request timed out
Server unavailable
Rate limited
```

Messages should be user-friendly.

Do not expose:

```text
SocketException(...)
DioException(...)
HTTP 502
```

directly to users.

---

# 44. Error Message Architecture

Recommended:

```text
Exception
 ↓
Failure
 ↓
FailureMapper
 ↓
Localized User Message
```

Example:

```text
ConflictFailure
 ↓
"These details were changed by someone else."
```

---

# 45. Validation Error Localization

Use codes:

```text
invalid_phone
required
duplicate_patient
```

Then localization:

```text
English:
Phone number is invalid.

Bangla:
ফোন নম্বরটি সঠিক নয়।
```

Do not store translated strings in domain entities.

---

# 46. Input Formatting

Use formatters only where necessary.

Examples:

```text
Phone
Currency
Date
Numeric
```

Avoid formatting clinical free-text notes.

---

# 47. Clinical Notes

Clinical notes must preserve user input.

Do not automatically:

- Rewrite
- Correct
- Translate
- Capitalize
- Remove punctuation
- Modify medical terminology

AI assistance must be explicit and separate.

---

# 48. Bangla Clinical Notes

The application must support:

```text
বাংলা
English
Mixed Bangla-English
```

Example:

```text
রোগীর ৩ দিন ধরে জ্বর।
Patient reports fever for 3 days.
```

Do not block mixed-language input.

---

# 49. Multiline Input

Clinical notes should support:

- Multiline
- Long text
- Cursor movement
- Copy/paste
- Keyboard dismissal
- Accessibility

Use:

```dart
TextInputType.multiline
```

where appropriate.

---

# 50. Prescription Medicine Input

Medicine entry should support:

```text
Medicine
Strength
Dosage
Frequency
Duration
Route
Instructions
Quantity
```

Example:

```text
Paracetamol
500 mg
1 tablet
3 times daily
5 days
After food
```

---

# 51. Medicine Search Input

Medicine search should:

- Debounce
- Cancel stale requests
- Show recent/favorite medicines
- Support Bangla/English
- Handle empty results
- Avoid excessive API requests

Search architecture follows Document 18.

---

# 52. Prescription Validation

Before finalization:

```text
Medicine exists
Dosage valid
Frequency valid
Duration valid
Route valid where required
Instructions valid where required
At least one medicine if prescription requires it
```

Then:

```text
Server validation
```

must occur.

---

# 53. Prescription Draft

Prescription draft state:

```text
DRAFT
```

may be modified.

AI-generated draft:

```text
AI_ASSISTED
```

must transition into:

```text
REVIEW_REQUIRED
```

before finalization.

---

# 54. AI Prescription Input Rules

AI may provide suggestions.

Example:

```text
AI Generated
Review Required
```

The doctor must explicitly review and edit.

The AI layer must not directly submit:

```text
POST /prescriptions/:id/finalize
```

---

# 55. Vitals Form

Vitals may include:

```text
Weight
Height
Temperature
Pulse
Blood Pressure
SpO2
BMI
```

---

# 56. Blood Pressure Input

Blood pressure should use two fields:

```text
Systolic
Diastolic
```

Example:

```text
BP
[ 120 ] / [ 80 ] mmHg
```

Validate that:

- Both values exist when BP is recorded.
- Values are numeric.
- Values are within reasonable clinical input boundaries.
- Clearly implausible values trigger validation/warning rather than silent acceptance.

Clinical thresholds should be configurable and medically reviewed rather than hardcoded casually.

---

# 57. BMI

BMI may be calculated:

```text
BMI = weight / height²
```

where units are normalized correctly.

BMI is derived information.

Do not allow users to manually edit the calculated BMI unless there is an explicit clinical reason.

---

# 58. Temperature

Support:

```text
°C
°F
```

depending on application preference.

Internally use a canonical unit.

Recommended:

```text
Celsius
```

Display according to user preference.

---

# 59. SpO2

Input:

```text
0–100 %
```

Provide clear validation.

Do not automatically label a value as medically dangerous solely through generic UI validation.

Clinical alerts should follow medically reviewed rules.

---

# 60. Clinical Notes Autosave

Clinical forms should support autosave.

Example:

```text
User types
 ↓
Debounce 750 ms
 ↓
Save draft
 ↓
Saved
```

Possible state:

```text
Saving...
Saved
Save failed
```

---

# 61. Autosave Rules

Autosave should:

- Debounce changes.
- Avoid excessive API calls.
- Cancel stale save requests.
- Track versions.
- Handle conflicts.
- Persist local drafts when appropriate.
- Never silently overwrite newer server data.

---

# 62. Dirty State

Each clinical form should track:

```text
dirty = true
```

when unsaved changes exist.

After successful save:

```text
dirty = false
```

---

# 63. Draft Persistence

For supported forms:

```text
UI
 ↓
Riverpod
 ↓
Local Draft
 ↓
Remote Sync
```

Local draft may survive:

- App restart
- Temporary network loss
- Backgrounding

Sensitive data must follow Document 22 encryption/retention rules.

---

# 64. Draft Recovery

On reopening a consultation:

```text
Server Draft
+
Local Draft
```

must be reconciled.

Possible outcomes:

```text
Local newer
Server newer
Equal
Conflict
```

---

# 65. Conflict UX

Never silently overwrite.

Example:

```text
This consultation was changed elsewhere.

[Keep My Changes]
[Use Latest]
[Review Differences]
```

For clinical records, conflict handling must preserve data integrity.

---

# 66. Offline Form Behavior

When offline:

```text
Form remains usable where supported.
```

Display:

```text
Offline — changes saved locally
```

For operations requiring server confirmation:

```text
Cannot complete this action while offline.
```

---

# 67. Form Save Indicator

Recommended states:

```text
No changes
Unsaved changes
Saving...
Saved
Save failed
Offline — saved locally
Syncing...
Conflict
```

Use subtle UI indicators.

---

# 68. Keyboard Handling

Forms must handle the keyboard correctly.

Requirements:

- Avoid hidden fields.
- Scroll focused field into view.
- Maintain cursor position.
- Dismiss keyboard appropriately.
- Support hardware keyboards on desktop/tablet.

---

# 69. Focus Management

Forms should define logical focus order.

Example:

```text
Name
 ↓
Phone
 ↓
Gender
 ↓
DOB
 ↓
Address
 ↓
Save
```

Use `FocusNode` where explicit control is required.

---

# 70. Focus on Validation Error

After submission failure:

```text
First invalid field
       ↓
Focus
       ↓
Scroll into view
```

Do not focus multiple fields simultaneously.

---

# 71. Keyboard Action

Use appropriate actions:

```text
next
next
next
done
```

Example:

```dart
textInputAction: TextInputAction.next
```

For final field:

```dart
TextInputAction.done
```

---

# 72. Form Scrolling

Long forms should use:

```text
SingleChildScrollView
```

or:

```text
CustomScrollView
```

with care.

Avoid nested scrolling containers unless required.

---

# 73. Form Sections

Long forms should be divided logically.

Example Patient Registration:

```text
Personal Information
Contact Information
Medical Information
Emergency Contact
Additional Information
```

---

# 74. Progressive Disclosure

Do not display every optional field immediately.

Example:

```text
Basic Patient Information
        ↓
Additional Information
```

This improves speed for receptionists.

---

# 75. Required vs Optional

Clearly mark required fields.

Recommended:

```text
Patient Name *
Phone Number *
Date of Birth
```

Avoid marking every field as required.

---

# 76. Placeholder Rules

Use placeholders as examples, not labels.

Good:

```text
Phone Number *
[ 017XXXXXXXX ]
```

Bad:

```text
[Enter phone number]
```

without a persistent label.

---

# 77. Helper Text

Use helper text for context.

Example:

```text
Phone Number
Your patient's mobile number

[017XXXXXXXX]
```

Avoid excessive instructional text.

---

# 78. Password Forms

Password fields require:

- Secure input
- Show/hide toggle
- Strength feedback where appropriate
- Confirmation field
- No logging
- No persistence in Hive

---

# 79. OTP Input

OTP form:

```text
[ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]
```

Requirements:

- Numeric keyboard
- Auto-advance
- Paste support
- Countdown
- Resend
- Clear error state

---

# 80. Search Forms

Search fields should:

- Debounce 250–350 ms
- Cancel stale requests
- Show loading
- Show empty result
- Preserve query
- Support clear action

---

# 81. Patient Search

Search by:

```text
Name
Phone
Patient ID
```

Bangla and English search should be supported.

Do not search all chambers indiscriminately.

---

# 82. Duplicate Patient Detection

During registration:

```text
Enter phone
 ↓
Search existing patient
 ↓
Possible duplicate
```

Show:

```text
A patient with this phone number may already exist.

[Open Patient]
[Create Anyway]
```

Final duplicate policy must be enforced by backend/business rules.

---

# 83. Patient Registration Form

Recommended fields:

### Required

- Name
- Gender where applicable
- Phone or alternative contact according to product policy

### Optional

- Date of birth
- Address
- Email
- Emergency contact
- Blood group
- Notes

Avoid collecting unnecessary personal information.

---

# 84. Address Input

Bangladesh addresses may not fit rigid international structures.

Support:

```text
House/Flat
Road
Area
Thana/Upazila
District
Division
Additional Address
```

But do not require all fields.

Free-text address remains available.

---

# 85. Chamber Form

Fields:

```text
Chamber Name
Address
Phone
Consultation Fee
Currency
Timezone
Active Status
```

Currency:

```text
BDT
```

should be the default for Bangladesh deployment.

---

# 86. Schedule Form

Fields:

```text
Day
Start Time
End Time
Appointment Duration
Breaks
Maximum Patients
```

Validation:

```text
Start < End
No overlapping intervals
Valid appointment duration
```

---

# 87. Staff Invitation Form

Fields:

```text
Name
Phone / Email
Role
Permissions
```

Validation:

```text
Valid contact
Valid role
Permission compatibility
No duplicate active membership
```

---

# 88. Appointment Form

Fields:

```text
Patient
Date
Time
Visit Type
Doctor
Reason
Notes
```

Validation:

```text
Patient required
Date valid
Time valid
Doctor/chamber valid
Availability valid
```

---

# 89. Payment Form

Fields:

```text
Amount
Payment Method
Reference
Notes
```

Validation:

```text
Amount > 0
Payment method valid
Reference required where applicable
```

Payment success must always come from server confirmation.

---

# 90. Payment Amount Input

Use Decimal-safe handling.

Do not use binary floating-point arithmetic for money calculations.

The backend uses Decimal.

Flutter should use a suitable decimal representation or integer minor units where the API contract permits.

---

# 91. Currency Formatting

Display:

```text
৳ 1,000
```

or the approved product format.

Do not store formatted currency strings as financial values.

---

# 92. Refund Form

Fields:

```text
Refund Amount
Reason
Reference
```

Validation:

```text
Refund amount <= refundable amount
Reason required
```

Final validation occurs on the server.

---

# 93. Clinical Investigation Form

Fields may include:

```text
Investigation
Priority
Clinical indication
Instructions
```

Selection should use catalog data.

---

# 94. Diagnostic Report Upload Form

Flow:

```text
Select File
 ↓
Validate Type
 ↓
Validate Size
 ↓
Upload
 ↓
Complete Upload
 ↓
Attach Report
```

Never trust only client-side file validation.

---

# 95. File Input Validation

Validate:

- File extension
- MIME type
- File size
- Upload state

Backend must validate again.

---

# 96. File Upload UX

States:

```text
Selecting
Uploading
Processing
Uploaded
Failed
Retrying
```

Example:

```text
Blood_Test.pdf

Uploading... 65%
```

---

# 97. Form Error Placement

Preferred order:

1. Field-level error below field
2. Form-level error near submit area
3. Snackbar only for transient/global events

Do not rely solely on snackbars for validation errors.

---

# 98. Snackbar Usage

Good:

```text
Patient saved successfully.
```

Bad:

```text
Phone number is invalid.
```

Field errors should remain visible next to the field.

---

# 99. Error Summary

For very long forms, show:

```text
Please fix 3 fields before continuing.
```

Then allow navigation to invalid fields.

---

# 100. Accessibility

Forms must support:

- Screen readers
- Semantic labels
- Error announcements
- Focus movement
- Keyboard navigation
- High contrast
- Touch targets
- Clear validation states

---

# 101. Semantic Labels

Every input must have a meaningful semantic label.

Avoid:

```text
TextField
```

as the only accessibility description.

Use:

```text
Patient phone number
```

---

# 102. Error Accessibility

When validation fails:

```text
Phone number. Error: Invalid Bangladesh phone number.
```

The error should be available to accessibility tools.

---

# 103. Touch Targets

Interactive controls should generally meet platform accessibility guidance, with approximately:

```text
48 × 48 logical pixels
```

as a practical baseline.

---

# 104. Form Localization

All:

- Labels
- Errors
- Helper text
- Buttons
- Validation messages
- Dialogs

must be localized.

Never hardcode English strings inside form controllers.

---

# 105. Bangla Numerals

The application should decide consistently whether numeric input accepts:

```text
0-9
```

only, or also Bangla numerals:

```text
০-৯
```

Recommended MVP:

- Display localized text.
- Accept standard Arabic digits reliably.
- Consider Bangla numeral normalization as an advanced enhancement.

---

# 106. Copy and Paste

Do not disable copy/paste unnecessarily.

Exceptions should be limited to security-sensitive fields such as OTP/password where justified.

---

# 107. Clipboard Privacy

Do not automatically copy:

- Patient clinical notes
- Prescription data
- Sensitive reports

to clipboard.

If the user explicitly copies content, respect platform behavior and security guidance.

---

# 108. Input Sanitization

Client input should be normalized but not destructively sanitized.

Examples:

```text
Trim whitespace
Normalize phone
Normalize date representation
```

Do not remove arbitrary characters from clinical notes.

---

# 109. Injection Protection

Flutter should not attempt to solve SQL injection.

Backend uses:

```text
Prisma parameterized queries
```

The client should still treat server/API input as untrusted.

---

# 110. Form State and Permissions

A form must check permissions before allowing mutation.

Example:

```text
User can view prescription
but cannot finalize prescription
```

UI:

```text
Finalize button hidden/disabled
```

Backend:

```text
POST /prescriptions/:id/finalize
→ authorization check
```

---

# 111. Permission Changes While Form Is Open

If permission changes while a form is open:

```text
User loses permission
       ↓
Mutation blocked
       ↓
Show access message
       ↓
Preserve local draft where safe
```

Never assume previously loaded permissions remain valid forever.

---

# 112. Chamber Changes While Form Is Open

If active chamber changes:

```text
Form belongs to Chamber A
       ↓
Switch Chamber B
       ↓
Block/confirm navigation
       ↓
Preserve/discard draft according to policy
```

Never submit Chamber A data under Chamber B context.

---

# 113. Account Switching While Form Is Open

Account switch must:

- Stop submission.
- Clear account-specific form state.
- Clear sensitive drafts as required.
- Reset providers.
- Navigate to new account context.

---

# 114. Form Reset

Reset should restore:

```text
Initial values
Initial validation state
Dirty = false
Errors = empty
```

Do not reset unexpectedly after a failed API request.

---

# 115. Form Cancel

Cancel behavior depends on dirty state.

If clean:

```text
Cancel → Back
```

If dirty:

```text
Cancel
 ↓
Discard changes?
```

---

# 116. Form Success Navigation

After successful creation:

```text
Form
 ↓
API success
 ↓
Invalidate relevant providers
 ↓
Navigate to created resource
```

Example:

```text
Create Patient
 ↓
Patient Details
```

---

# 117. Provider Invalidation After Form Submission

Examples:

### Patient creation

```text
invalidate patientsProvider
invalidate patientSearchProvider
```

### Appointment creation

```text
invalidate appointmentsProvider
invalidate dashboardProvider
```

### Payment

```text
invalidate paymentProvider
invalidate analyticsProvider
```

### Prescription finalization

```text
invalidate prescriptionProvider
invalidate encounterProvider
invalidate patientTimelineProvider
```

---

# 118. Form Submission and Navigation

Never navigate on:

```text
button tap
```

Navigate on:

```text
server-confirmed success
```

except for carefully designed local-only forms.

---

# 119. Form Loading States

Forms should distinguish:

```text
Initial load
Editing
Submitting
Saving
Uploading
Processing
```

Do not replace the entire form with a spinner during a small field mutation.

---

# 120. Submit Button States

Recommended:

```text
Normal:
Save

Submitting:
Saving...

Disabled:
Save
```

For clinical actions:

```text
Finalize Prescription
```

→

```text
Finalizing...
```

---

# 121. Form Skeletons

Use skeleton loading when editing existing resources.

Example:

```text
Patient Details
Name: █████████
Phone: ███████
DOB: ███████
```

---

# 122. Empty Form States

Create forms generally should not use an empty-state illustration.

Focus immediately on the first useful field.

---

# 123. Edit Form Initialization

When editing:

```text
API Entity
 ↓
Mapper
 ↓
Form State
 ↓
Controllers
```

Do not directly bind API DTOs to widgets.

---

# 124. Form DTO Separation

Architecture:

```text
API DTO
 ↓
Domain Entity
 ↓
Form Model
 ↓
UI
```

The UI should never depend directly on generated API DTO classes.

---

# 125. Form Model Example

```dart
@freezed
class PatientFormModel with _$PatientFormModel {
  const factory PatientFormModel({
    @Default('') String name,
    @Default('') String phone,
    DateTime? dateOfBirth,
    Gender? gender,
    @Default('') String address,
  }) = _PatientFormModel;
}
```

---

# 126. Form-to-Request Mapping

```text
PatientFormModel
      ↓
CreatePatientInput
      ↓
Repository
      ↓
API DTO
```

This prevents UI-specific fields from leaking into backend contracts.

---

# 127. Validation Before Mapping

Order:

```text
Form state
 ↓
Validate
 ↓
Normalize
 ↓
Map to domain input
 ↓
Use case
```

---

# 128. Form Normalization

Examples:

```text
Phone:
01712345678
→ +8801712345678

Name:
"  Rahim  "
→ "Rahim"

Amount:
"1000.00"
→ Decimal-safe representation
```

---

# 129. Server vs Client Validation Matrix

| Rule | Client | Server |
|---|---:|---:|
| Required field | Yes | Yes |
| Basic format | Yes | Yes |
| Phone normalization | Yes | Yes |
| Duplicate patient | Optional pre-check | Yes |
| Appointment availability | Display/pre-check | Yes |
| Permission | UI | Yes |
| Prescription finalization | Yes | Yes |
| Payment amount | Yes | Yes |
| Chamber ownership | No trust | Yes |
| Patient authorization | No trust | Yes |

---

# 130. Form Security

Never log:

- Password
- OTP
- Access token
- Refresh token
- Patient clinical notes
- Prescription contents
- Payment credentials
- AI prompts/responses

---

# 131. Form Analytics

Safe analytics:

```text
patient_form_opened
patient_form_submitted
patient_form_validation_failed
appointment_form_opened
prescription_review_opened
```

Do not send:

```text
patient_name
phone
diagnosis
prescription
clinical_note
```

---

# 132. Form Performance

Avoid rebuilding entire forms for every keystroke.

Use:

```text
Consumer
select
small scoped widgets
```

where appropriate.

---

# 133. Riverpod Form Performance

Prefer:

```dart
ref.watch(
  patientFormProvider.select(
    (state) => state.phoneError,
  ),
);
```

for small dependent widgets.

Avoid watching the entire form state from every field.

---

# 134. Controller Lifecycle

For short-lived forms:

```text
autoDispose
```

may be appropriate.

For active consultation drafts:

```text
keepAlive
```

or a scoped lifecycle may be necessary.

Always explicitly define lifecycle behavior.

---

# 135. Form Provider Scope

Example:

```text
patientCreateFormProvider
appointmentCreateFormProvider
consultationFormProvider(encounterId)
prescriptionFormProvider(prescriptionId)
```

Use `.family` for resource-specific forms.

---

# 136. Form State During Navigation

When navigating within a form:

```text
Patient Form
 ↓
Add Allergy
 ↓
Return
```

the parent form state should remain intact.

Do not recreate the entire form unnecessarily.

---

# 137. Nested Forms

Avoid deeply nested independent forms.

Example:

```text
Prescription
 ├── Medicine 1
 ├── Medicine 2
 └── Medicine 3
```

Prefer one prescription state with medicine item sub-state.

---

# 138. Dynamic Form Fields

Prescription items are dynamic.

State:

```text
items: List<PrescriptionItemForm>
```

Operations:

```text
addItem()
updateItem()
removeItem()
reorderItem()
```

---

# 139. Dynamic Field Validation

Each medicine item must be independently validated.

Example:

```text
Medicine 1 ✓
Medicine 2 ❌ Dosage missing
Medicine 3 ✓
```

Submission should identify the invalid item.

---

# 140. Form Validation Summary

For complex forms:

```text
2 fields need attention
```

Selecting the summary item should scroll to the corresponding field.

---

# 141. Medical Data Entry Safety

Clinical forms should:

- Preserve exact user-entered values.
- Avoid automatic destructive transformations.
- Make units visible.
- Show warnings clearly.
- Require confirmation for high-impact actions.
- Never silently substitute values.

---

# 142. Units

Every measurable clinical field should display its unit.

Examples:

```text
Weight: kg
Height: cm
Temperature: °C
Pulse: bpm
SpO2: %
Blood pressure: mmHg
```

---

# 143. Unit Conversion

If supported:

```text
Input Unit
 ↓
Canonical Unit
 ↓
Display Unit
```

Conversions should be centralized and tested.

---

# 144. Clinical Threshold Warnings

Warnings may be shown for suspicious values.

Example:

```text
This value appears unusual. Please verify.
```

Warnings must not automatically prevent entry unless medically reviewed and required by product policy.

---

# 145. Clinical Form Confirmation

Confirmation is appropriate for:

```text
Complete consultation
Finalize prescription
Lock clinical record
Refund payment
Delete/remove important data
```

Not for every ordinary field change.

---

# 146. Prescription Finalization Confirmation

Example:

```text
Finalize Prescription?

Please review all medicines, dosage,
frequency, duration, and instructions.

After finalization, the prescription
will become read-only.

[Cancel]
[Finalize]
```

---

# 147. Form Interaction With AI

AI actions should be explicit.

Example:

```text
Generate Draft
```

not:

```text
AI automatically modifies prescription
```

AI-generated values should be inserted as reviewable draft content.

---

# 148. AI Form Provenance

Fields influenced by AI may be marked:

```text
AI Generated
```

or at section level:

```text
AI Suggestion — Review Required
```

The doctor must remain in control.

---

# 149. Form Draft and AI

If AI generates a prescription draft:

```text
Existing draft
      ↓
AI request
      ↓
AI result
      ↓
Doctor review
      ↓
Accept/Edit/Reject
```

AI must not overwrite existing doctor-authored data without explicit user action.

---

# 150. Voice Input

Future voice-to-note forms should follow:

```text
Record
 ↓
Transcribe
 ↓
Review transcript
 ↓
Insert into notes
```

Never:

```text
Voice
 ↓
Automatically finalize clinical record
```

---

# 151. Form Accessibility With Voice

Voice input must have:

- Recording state
- Stop button
- Error state
- Permission handling
- Transcript review
- Edit capability

---

# 152. Form Permissions

Microphone/camera permissions must be requested only when needed.

Do not request all device permissions at startup.

---

# 153. Form Interaction With Notifications

If a notification arrives while the user is editing:

```text
Do not automatically navigate away
```

unless the user explicitly chooses the notification.

---

# 154. Form Interaction With Session Expiration

If session expires while editing:

```text
Save local draft where safe
 ↓
Login
 ↓
Restore draft if authorized
```

Never expose the draft to another account.

---

# 155. Form Interaction With App Backgrounding

On background:

- Preserve safe local state.
- Protect sensitive screen.
- Cancel unnecessary transient operations.
- Resume safely.

Do not assume backgrounding means the user abandoned the form.

---

# 156. Form Recovery After Crash

For supported drafts:

```text
App restart
 ↓
Detect unfinished draft
 ↓
Show:
"Resume your unfinished consultation?"
```

Do not restore automatically into a different patient/chamber/account.

---

# 157. Form Recovery Expiration

Drafts should have a retention policy.

Example:

```text
Temporary form drafts:
7–30 days
```

Exact retention must be defined by product/privacy requirements.

---

# 158. Form Testing Architecture

Test at multiple levels:

```text
Validator Tests
 ↓
Form Controller Tests
 ↓
Repository Tests
 ↓
Widget Tests
 ↓
Integration Tests
 ↓
E2E Tests
```

---

# 159. Validator Unit Tests

Test:

```text
Required
Phone
Email
Date
Numeric
Decimal
Range
Blood pressure
SpO2
Dosage
Duration
```

Include Bangla and mixed-language input.

---

# 160. Form Controller Tests

Test:

```text
Initial state
Field update
Dirty state
Validation
Submission
Server success
Server validation error
Network failure
Reset
Retry
```

---

# 161. Widget Tests

Test:

```text
Field rendering
Validation messages
Keyboard type
Focus behavior
Button states
Loading state
Error state
Accessibility labels
```

---

# 162. Integration Tests

Test:

```text
Patient creation
Appointment creation
Staff invitation
Consultation autosave
Prescription editing
Payment
Report upload
```

---

# 163. Critical Clinical E2E

Must test:

```text
Login
 ↓
Queue
 ↓
Consultation
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
AI Draft
 ↓
Review
 ↓
Finalize
```

---

# 164. Critical Validation E2E

Test:

```text
Invalid patient form
 ↓
Field errors
 ↓
Correct values
 ↓
Submit
 ↓
Server success
```

---

# 165. Critical Offline E2E

Test:

```text
Open consultation
 ↓
Enter notes
 ↓
Network lost
 ↓
Local draft saved
 ↓
App restarted
 ↓
Draft recovered
 ↓
Network restored
 ↓
Sync
```

---

# 166. Critical Conflict E2E

Test:

```text
Device A edits consultation
Device B edits consultation
       ↓
Conflict
       ↓
Conflict UI
       ↓
User resolution
       ↓
Final state preserved
```

---

# 167. Critical Security E2E

Test:

```text
Account A
 ↓
Form
 ↓
Logout
 ↓
Account B
 ↓
Account A draft must not appear
```

Also:

```text
Chamber A
 ↓
Switch Chamber B
 ↓
Chamber A form data unavailable
```

---

# 168. Form Test Matrix

| Form | Unit | Widget | Integration | E2E |
|---|---:|---:|---:|---:|
| Login | ✓ | ✓ | ✓ | ✓ |
| Registration | ✓ | ✓ | ✓ | ✓ |
| OTP | ✓ | ✓ | ✓ | ✓ |
| Patient | ✓ | ✓ | ✓ | ✓ |
| Appointment | ✓ | ✓ | ✓ | ✓ |
| Chamber | ✓ | ✓ | ✓ | ✓ |
| Staff | ✓ | ✓ | ✓ | ✓ |
| Vitals | ✓ | ✓ | ✓ | ✓ |
| Consultation | ✓ | ✓ | ✓ | ✓ |
| Prescription | ✓ | ✓ | ✓ | ✓ |
| Payment | ✓ | ✓ | ✓ | ✓ |
| Refund | ✓ | ✓ | ✓ | ✓ |
| AI Draft | ✓ | ✓ | ✓ | ✓ |
| File Upload | ✓ | ✓ | ✓ | ✓ |

---

# 169. Reusable Form Components

Create a shared component library:

```text
AppTextField
AppPhoneField
AppPasswordField
AppSearchField
AppNumberField
AppCurrencyField
AppDateField
AppTimeField
AppDropdown
AppMultiSelect
AppTextArea
AppFormSection
AppFieldError
AppValidationSummary
AppSubmitButton
AppCancelButton
AppSaveIndicator
AppUnsavedChangesDialog
AppConfirmationDialog
```

---

# 170. Clinical Components

```text
PatientNameField
PatientPhoneField
DateOfBirthField
BloodPressureField
WeightField
HeightField
TemperatureField
PulseField
SpO2Field
MedicineSelector
DosageField
FrequencySelector
DurationField
ClinicalNotesEditor
DiagnosisSelector
InvestigationSelector
```

---

# 171. Form Component API Design

Reusable fields should support:

```dart
AppTextField(
  label: 'Patient Name',
  value: state.name,
  errorText: state.nameError,
  onChanged: controller.setName,
)
```

Components should not know business rules.

---

# 172. Validation Dependency Injection

Validators may be provided through a central provider where useful.

Example:

```text
validationConfigProvider
```

This can support configurable:

- Phone rules
- Appointment intervals
- Numeric ranges
- Localization

---

# 173. Avoid Global Mutable Validation Rules

Do not use mutable global variables such as:

```dart
GlobalValidationRules.current = ...
```

Use immutable configuration/providers.

---

# 174. Form Configuration

Some forms may be configured by backend/product settings.

Example:

```text
Consultation fee required?
Phone required?
DOB required?
```

Configuration should be loaded safely and cached.

Server remains authoritative.

---

# 175. Server-Driven Forms

Do not implement fully server-driven forms in MVP.

Prefer:

```text
Strongly typed Flutter forms
+
small configurable rules
```

This provides stronger type safety and maintainability.

---

# 176. Form Versioning

If form structure changes between app versions:

```text
App version
 ↓
Form model version
 ↓
Migration if required
```

This matters particularly for persisted drafts.

---

# 177. Draft Migration

If an old draft contains:

```text
oldField
```

and the new app uses:

```text
newField
```

provide explicit migration logic.

Never deserialize blindly into a new model.

---

# 178. Form Serialization

Use:

```text
Freezed
json_serializable
```

for structured form persistence where appropriate.

Do not manually concatenate JSON strings.

---

# 179. Local Form Storage

Sensitive drafts stored locally must follow Document 22.

Recommended:

```text
Encrypted storage where appropriate
Minimal retention
User/chamber scoped keys
Explicit cleanup
```

---

# 180. Form Storage Key Strategy

Keys should include logical scope.

Conceptually:

```text
draft:{userId}:{chamberId}:{encounterId}
```

But avoid putting raw sensitive identifiers into logs.

Storage implementation should isolate users/chambers securely.

---

# 181. Form Cache Isolation

When switching:

```text
User
Chamber
```

invalidate/remove relevant forms.

Never reuse:

```text
PatientFormController
```

from another chamber/user context.

---

# 182. Form Memory Management

Dispose:

- TextEditingController
- FocusNode
- AnimationController
- StreamSubscription
- Timers

when their owning lifecycle ends.

---

# 183. Debounced Validation

Do not debounce all validation.

Debounce when:

```text
Remote duplicate checking
Search
Expensive validation
```

Do not debounce simple:

```text
required
numeric
length
```

unless UX requires it.

---

# 184. Async Validation

Example:

```text
Phone entered
 ↓
Debounce
 ↓
Check possible duplicate
 ↓
Show result
```

Async validation must not block the entire form unnecessarily.

---

# 185. Async Validation Race Handling

If user enters:

```text
01711111111
```

then quickly:

```text
01722222222
```

the response for the first request must not overwrite the second.

Use:

```text
Cancellation
+
request generation/version
```

---

# 186. Form Submission Race Handling

Only one submit should be active.

```text
Submitting
```

blocks duplicate requests.

If the user changes a field during submission, define whether:

- Changes are blocked
- Changes remain local
- Submission uses snapshot

For critical clinical actions, use an explicit snapshot.

---

# 187. Form Snapshot

Before critical submission:

```text
Current Form
 ↓
Immutable Request Snapshot
 ↓
API
```

This prevents mutation during asynchronous processing from changing what was submitted.

---

# 188. Prescription Finalization Snapshot

At finalization:

```text
Prescription Draft
 ↓
Validation
 ↓
Immutable finalization request
 ↓
Server
```

The user cannot accidentally alter the request midway.

---

# 189. Payment Snapshot

Payment amount should be captured at submission.

```text
Current amount
 ↓
Request snapshot
 ↓
Server
```

Do not calculate financial totals after the API request starts.

---

# 190. Appointment Snapshot

At creation:

```text
Patient
Doctor
Chamber
Date
Time
Reason
```

must form one request snapshot.

---

# 191. Form UX on Slow Network

If the network is slow:

```text
Submitting...
```

with clear feedback.

Do not:

```text
freeze entire UI
```

unless necessary.

---

# 192. Form UX on Timeout

Show:

```text
We couldn't confirm the save.

Your information is still here.
Please try again.
```

For idempotent operations, retry safely.

---

# 193. Form UX on Server Conflict

Show:

```text
This information was changed elsewhere.
Please review the latest version.
```

Do not overwrite automatically.

---

# 194. Form UX on Permission Failure

Show:

```text
You no longer have permission to save these changes.
```

Then:

```text
Preserve safe draft
→ return to authorized screen
```

where appropriate.

---

# 195. Form UX on Session Expiration

Show:

```text
Your session has expired.
Please sign in again.
```

If draft recovery is supported:

```text
Your unfinished work has been saved locally.
```

Do not reveal sensitive details on the login screen.

---

# 196. Form UX on Offline

Example:

```text
Offline

Changes will be saved locally and synchronized
when the connection returns.
```

Only display this where the feature actually supports offline persistence.

---

# 197. Form UX on Recovery

After successful synchronization:

```text
Saved and synchronized
```

Use a subtle status indicator rather than a disruptive dialog.

---

# 198. Form Component Design System

Every field should support states:

```text
Default
Focused
Filled
Disabled
Read-only
Error
Warning
Success
Loading
```

---

# 199. Read-Only Clinical Forms

Finalized records:

```text
Read-only
```

Fields should visually communicate that they cannot be edited.

Do not merely disable every field without explaining why.

---

# 200. Disabled vs Read-Only

### Disabled

User cannot interact.

### Read-only

User can select/copy content where appropriate but cannot modify.

Clinical finalized records should generally use a deliberate read-only presentation.

---

# 201. Form Submission Checklist

Before submitting:

```text
✓ Required fields valid
✓ Format valid
✓ Domain rules valid
✓ Permissions valid
✓ Active chamber valid
✓ Request snapshot created
✓ Idempotency key generated where needed
✓ Sensitive logging disabled
✓ Network available where required
```

---

# 202. Form Implementation Checklist

For every form implement:

```text
□ Form model
□ Form state
□ Riverpod controller
□ Initial values
□ Field update methods
□ Validators
□ Server error mapping
□ Dirty state
□ Loading state
□ Submit state
□ Success state
□ Failure state
□ Reset
□ Cancel
□ Keyboard handling
□ Focus management
□ Accessibility
□ Localization
□ Offline behavior
□ Draft persistence where applicable
□ Tests
```

---

# 203. Critical Form Rules

### Rule 1

Never put business logic inside widgets.

### Rule 2

Never trust client validation as the security boundary.

### Rule 3

Never silently discard clinical input.

### Rule 4

Never put sensitive clinical data into logs.

### Rule 5

Never allow duplicate critical submissions.

### Rule 6

Never submit a mutation under the wrong chamber.

### Rule 7

Never allow another user's draft to appear after account switching.

### Rule 8

Never silently overwrite conflicting clinical data.

### Rule 9

Never allow AI to finalize a prescription.

### Rule 10

Never navigate away from unsaved clinical work without a safe policy.

---

# 204. Form Architecture Diagram

```text
                         ┌──────────────────┐
                         │   Flutter UI     │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │ Form Components  │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │ Riverpod Form    │
                         │ Controller       │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
               Validation     Form State    Draft State
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                         ┌────────▼─────────┐
                         │     Use Case     │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │    Repository    │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             Remote API                   Local Storage
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                         ┌────────▼─────────┐
                         │ Final Form State │
                         └──────────────────┘
```

---

# 205. Complete Patient Registration Flow

```text
Open Form
 ↓
Enter Name
 ↓
Enter Phone
 ↓
Possible Duplicate Check
 ↓
Enter DOB/Gender
 ↓
Enter Address
 ↓
Client Validation
 ↓
Submit
 ↓
Server Validation
 ↓
Patient Created
 ↓
Invalidate Patient List
 ↓
Navigate Patient Details
```

---

# 206. Complete Appointment Form Flow

```text
Select Patient
 ↓
Select Date
 ↓
Select Time
 ↓
Check Availability
 ↓
Enter Reason
 ↓
Validate
 ↓
Create Appointment
 ↓
Server Confirmation
 ↓
Appointment Details
```

---

# 207. Complete Consultation Form Flow

```text
Open Encounter
 ↓
Load Draft
 ↓
Vitals
 ↓
Clinical Notes
 ↓
Diagnosis
 ↓
Investigation
 ↓
Autosave
 ↓
Prescription
 ↓
Review
 ↓
Complete
```

---

# 208. Complete Prescription Form Flow

```text
Prescription Builder
 ↓
Add Medicine
 ↓
Configure Dosage
 ↓
Configure Frequency
 ↓
Configure Duration
 ↓
Instructions
 ↓
Optional AI Draft
 ↓
Doctor Review
 ↓
Validation
 ↓
Finalize
 ↓
Server Confirmation
 ↓
Read-only Prescription
```

---

# 209. Complete Payment Form Flow

```text
Payment Screen
 ↓
Amount
 ↓
Method
 ↓
Reference
 ↓
Validate
 ↓
Create Payment
 ↓
Server Confirmation
 ↓
Receipt
```

---

# 210. Final Form Architecture

The complete form architecture is:

```text
User Input
    ↓
Reusable Form Component
    ↓
Riverpod Controller
    ↓
Immutable Form State
    ↓
Client Validation
    ↓
Normalization
    ↓
Domain Input
    ↓
Use Case
    ↓
Repository
    ↓
Networking / Local Storage
    ↓
Server Validation
    ↓
Success / Failure
    ↓
Riverpod State Update
    ↓
Provider Invalidation
    ↓
Navigation
```

---

# 211. Relationship With Previous Documents

## Document 17 — Flutter API Integration

Forms use:

- DTO mapping
- API error handling
- Request IDs
- Idempotency
- Retry policies
- File upload
- Server validation

---

## Document 18 — Riverpod State Management

Forms use:

- Notifier/AsyncNotifier
- Immutable state
- `.family`
- `select`
- lifecycle management
- mutation handling
- provider invalidation

---

## Document 20 — Screen Implementation

Every screen's form behavior should follow this document.

---

## Document 22 — Security & Privacy

Forms follow:

- Secure storage
- Sensitive-data logging restrictions
- Chamber isolation
- Account isolation
- Clinical data protection
- AI safety

---

## Document 23 — Offline & Synchronization

Forms integrate with:

- Draft persistence
- Offline editing
- Sync
- Conflict resolution
- Recovery

---

## Document 24 — Networking & Resilience

Forms rely on:

- Request retries
- Timeout handling
- Error mapping
- Token refresh
- Connectivity
- Idempotency

---

## Document 25 — Navigation

Forms integrate with:

- Unsaved-change guards
- Deep links
- Back navigation
- Session expiration
- Chamber switching
- Post-submit navigation

---

# 212. Recommended Next Document

The next logical document is:

## Document 27 — Complete Flutter Localization, Internationalization, Bangla/English & Bangladesh-Specific UX Implementation Specification

It should cover:

- Flutter localization architecture
- Bangla/English translation structure
- ARB files
- Locale switching
- Date/time localization
- Bangla numerals
- Bengali typography
- Bangladesh phone formatting
- BDT currency
- Address formatting
- Bangla names
- Bangla/English medical terminology
- Prescription language
- Font strategy
- Text overflow
- mixed-language UI
- RTL readiness
- accessibility
- localization testing
- pluralization
- date/time/calendar
- notification localization
- AI Bangla responses
- Bangla voice interaction
- localized validation errors
- localized reports/PDFs
- future localization support.

---

# 213. Final Architecture Statement

Forms in Chamber Management are not simple UI controls.

They are the boundary where:

```text
Human Input
     ↓
Clinical/Business Data
     ↓
Validation
     ↓
Application State
     ↓
Backend
```

therefore the form architecture must prioritize:

**Correctness → Safety → Data Integrity → Usability → Performance**

For ordinary forms, validation should be fast and unobtrusive.

For clinical forms, the system must additionally guarantee:

```text
No silent data loss
No cross-chamber contamination
No cross-account contamination
No unauthorized mutation
No unsafe automatic modification
No AI-controlled finalization
No silent conflict overwrite
```

The final implementation model is:

```text
Flutter Form
   +
Riverpod State
   +
Typed Domain Model
   +
Layered Validation
   +
Resilient Networking
   +
Secure Local Draft
   +
Server Authority
   +
Safe Navigation
```

This provides the foundation for reliable, multilingual, offline-aware, clinically safe data entry throughout the Chamber Management application.