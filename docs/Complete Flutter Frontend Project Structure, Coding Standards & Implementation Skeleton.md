# Chamber Management
## Document 15 — Complete Flutter Frontend Project Structure, Coding Standards & Implementation Skeleton

**Version:** 1.0  
**Platform:** Flutter  
**Language:** Dart  
**Architecture:** Clean Architecture  
**State Management:** Riverpod  
**Routing:** GoRouter  
**Networking:** Dio  
**Serialization:** Freezed + json_serializable  
**Local Storage:** Hive  
**Secure Storage:** flutter_secure_storage  
**Backend:** NestJS + Fastify  
**API:** REST `/api/v1`  
**Database:** PostgreSQL  
**Primary Locale:** Bangla + English  
**Timezone:** Asia/Dhaka  
**Currency:** BDT

---

# 1. Purpose

This document defines the implementation-level architecture for the Chamber Management Flutter application.

Document 14 defined **what should be implemented sprint by sprint**.

Document 15 defines **how the Flutter codebase should be structured and implemented**.

The objective is to ensure that all frontend developers follow the same architecture and coding conventions.

---

# 2. Architectural Goals

The frontend architecture must provide:

- Clear separation of concerns
- Testable business logic
- Reusable UI components
- Predictable state management
- Strong API boundaries
- Easy backend integration
- Local caching
- Future offline synchronization
- Bangla/English localization
- Secure authentication
- Clinical-data safety
- Maintainability
- Scalability

---

# 3. High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                  Flutter App                 │
├──────────────────────────────────────────────┤
│ Presentation                                 │
│  Pages / Widgets / Providers                 │
├──────────────────────────────────────────────┤
│ Application                                  │
│  Controllers / Use-case orchestration        │
├──────────────────────────────────────────────┤
│ Domain                                       │
│  Entities / Repository Contracts / UseCases  │
├──────────────────────────────────────────────┤
│ Data                                         │
│  DTOs / Repository Implementations            │
├──────────────────────────────────────────────┤
│ Infrastructure                               │
│  Dio / Hive / Secure Storage / File System   │
└──────────────────────────────────────────────┘
```

Dependency direction:

```text
Presentation
     ↓
Application
     ↓
Domain
     ↑
Data
     ↓
Infrastructure
```

The domain layer must not depend on Flutter UI or Dio.

---

# 4. Complete Project Structure

Recommended project structure:

```text
chamber_management/
│
├── android/
├── ios/
├── assets/
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   └── animations/
│
├── test/
│   ├── core/
│   ├── features/
│   └── fixtures/
│
├── integration_test/
│   ├── auth/
│   ├── patient/
│   ├── appointment/
│   ├── consultation/
│   ├── prescription/
│   └── payment/
│
├── lib/
│   │
│   ├── main.dart
│   │
│   ├── app/
│   │   ├── app.dart
│   │   ├── router/
│   │   │   ├── app_router.dart
│   │   │   ├── route_names.dart
│   │   │   ├── route_paths.dart
│   │   │   └── route_guards.dart
│   │   │
│   │   ├── theme/
│   │   │   ├── app_theme.dart
│   │   │   ├── app_colors.dart
│   │   │   ├── app_text_styles.dart
│   │   │   ├── app_spacing.dart
│   │   │   └── app_dimensions.dart
│   │   │
│   │   ├── localization/
│   │   │   ├── app_en.arb
│   │   │   └── app_bn.arb
│   │   │
│   │   └── config/
│   │       ├── app_config.dart
│   │       ├── environment.dart
│   │       └── build_config.dart
│   │
│   ├── core/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── network/
│   │   ├── storage/
│   │   ├── security/
│   │   ├── permissions/
│   │   ├── validators/
│   │   ├── formatters/
│   │   ├── extensions/
│   │   ├── utils/
│   │   ├── logging/
│   │   ├── connectivity/
│   │   └── widgets/
│   │
│   └── features/
│       │
│       ├── auth/
│       ├── onboarding/
│       ├── doctor/
│       ├── chamber/
│       ├── staff/
│       ├── patient/
│       ├── appointment/
│       ├── queue/
│       ├── consultation/
│       ├── vitals/
│       ├── diagnosis/
│       ├── investigation/
│       ├── reports/
│       ├── medicines/
│       ├── prescription/
│       ├── payment/
│       ├── notifications/
│       ├── ai/
│       ├── analytics/
│       ├── settings/
│       └── profile/
│
├── .env.development
├── .env.staging
├── .env.production
├── analysis_options.yaml
├── pubspec.yaml
└── README.md
```

---

# 5. Feature Architecture

Every major feature follows the same structure.

Example:

```text
features/patient/
│
├── data/
│   ├── datasources/
│   │   ├── patient_remote_datasource.dart
│   │   └── patient_local_datasource.dart
│   │
│   ├── models/
│   │   ├── patient_model.dart
│   │   ├── patient_model.freezed.dart
│   │   └── patient_model.g.dart
│   │
│   └── repositories/
│       └── patient_repository_impl.dart
│
├── domain/
│   ├── entities/
│   │   └── patient.dart
│   │
│   ├── repositories/
│   │   └── patient_repository.dart
│   │
│   └── usecases/
│       ├── create_patient.dart
│       ├── search_patients.dart
│       ├── get_patient.dart
│       └── get_patient_timeline.dart
│
└── presentation/
    ├── pages/
    │   ├── patient_list_page.dart
    │   ├── patient_details_page.dart
    │   └── patient_form_page.dart
    │
    ├── widgets/
    │   ├── patient_card.dart
    │   ├── patient_search.dart
    │   └── patient_header.dart
    │
    └── providers/
        ├── patient_providers.dart
        ├── patient_controller.dart
        └── patient_state.dart
```

---

# 6. Core Layer

The `core` directory contains functionality shared by multiple features.

It must not contain feature-specific business logic.

---

# 7. Core Errors

Structure:

```text
core/errors/
├── app_exception.dart
├── failure.dart
├── network_failure.dart
├── validation_failure.dart
├── auth_failure.dart
└── failure_mapper.dart
```

Recommended domain failure hierarchy:

```text
Failure
├── NetworkFailure
├── UnauthorizedFailure
├── ForbiddenFailure
├── ValidationFailure
├── NotFoundFailure
├── ConflictFailure
├── RateLimitFailure
├── ServerFailure
└── UnknownFailure
```

---

# 8. API Error Handling

Backend errors should be converted into application failures.

Example:

```text
HTTP 401
    ↓
UnauthorizedFailure

HTTP 403
    ↓
ForbiddenFailure

HTTP 404
    ↓
NotFoundFailure

HTTP 409
    ↓
ConflictFailure

HTTP 422
    ↓
ValidationFailure

HTTP 429
    ↓
RateLimitFailure

HTTP 500
    ↓
ServerFailure
```

Widgets should never directly interpret raw HTTP status codes.

---

# 9. Network Layer

Structure:

```text
core/network/
├── api_client.dart
├── dio_provider.dart
├── auth_interceptor.dart
├── refresh_token_interceptor.dart
├── request_id_interceptor.dart
├── error_interceptor.dart
├── network_info.dart
└── api_endpoints.dart
```

---

# 10. API Client

Responsibilities:

- GET
- POST
- PATCH
- PUT
- DELETE
- File upload
- Download
- Headers
- Authentication
- Error normalization

Example conceptual interface:

```dart
abstract interface class ApiClient {
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  });

  Future<T> post<T>(
    String path, {
    Object? data,
  });

  Future<T> patch<T>(
    String path, {
    Object? data,
  });

  Future<T> delete<T>(
    String path, {
    Object? data,
  });
}
```

---

# 11. Dio Interceptor Order

Recommended:

```text
Request
 ↓
Request ID
 ↓
Authentication
 ↓
Logging
 ↓
Dio
 ↓
Response
 ↓
Error Mapping
```

Production logging must redact:

- Access tokens
- Refresh tokens
- Patient information
- Clinical notes
- Prescription data
- Diagnostic reports

---

# 12. Token Management

Structure:

```text
core/security/
├── token_storage.dart
├── session_manager.dart
└── auth_state.dart
```

Use secure storage.

Access token:

```text
flutter_secure_storage
```

Refresh token:

```text
flutter_secure_storage
```

Never use Hive for authentication secrets.

---

# 13. Session Lifecycle

```text
App Start
    ↓
Read Refresh Token
    ↓
Valid?
 ├── Yes → Refresh/Restore Session
 └── No → Login
```

On logout:

```text
API Logout
 ↓
Clear Secure Storage
 ↓
Clear Session Cache
 ↓
Clear User-Specific Local Cache
 ↓
Navigate to Login
```

---

# 14. Serialization

Use:

- Freezed
- json_serializable

Example:

```dart
@freezed
class PatientModel with _$PatientModel {
  const factory PatientModel({
    required String id,
    required String name,
    String? phone,
    String? gender,
    DateTime? dateOfBirth,
  }) = _PatientModel;

  factory PatientModel.fromJson(Map<String, dynamic> json) =>
      _$PatientModelFromJson(json);
}
```

---

# 15. Domain Entity

Domain entities should not depend on JSON.

Example:

```dart
class Patient {
  final String id;
  final String name;
  final String? phone;

  const Patient({
    required this.id,
    required this.name,
    this.phone,
  });
}
```

---

# 16. Model-to-Entity Mapping

Keep API models separate from domain entities.

```text
JSON
 ↓
PatientModel
 ↓
Patient
 ↓
UI
```

Never expose raw JSON maps to widgets.

---

# 17. Repository Pattern

Domain:

```dart
abstract interface class PatientRepository {
  Future<Result<Patient>> createPatient(
    CreatePatientParams params,
  );

  Future<Result<List<Patient>>> searchPatients(
    String query,
  );

  Future<Result<Patient>> getPatient(
    String patientId,
  );
}
```

Implementation:

```text
PatientRepository
       ↑
PatientRepositoryImpl
       ↓
RemoteDataSource
       ↓
ApiClient
```

---

# 18. Use Case Pattern

Each important business operation gets a use case.

Example:

```text
CreatePatient
SearchPatients
GetPatient
UpdatePatient
GetPatientTimeline
AddPatientAllergy
AddPatientCondition
```

Avoid putting complex business logic directly into widgets.

---

# 19. Riverpod Architecture

Recommended dependency chain:

```text
UI
 ↓
Controller / Notifier
 ↓
Use Case
 ↓
Repository
 ↓
Data Source
 ↓
API
```

---

# 20. Riverpod Provider Types

Use:

### Provider

For:

- Repository
- Data source
- Service
- Configuration

### FutureProvider

For:

- Read-only asynchronous data

### StreamProvider

For:

- Streams
- Connectivity
- Future real-time events

### Notifier / AsyncNotifier

For:

- Stateful workflows
- CRUD
- Forms
- Mutations
- Complex UI state

---

# 21. Example Riverpod Structure

```text
patientRepositoryProvider
        ↓
patientUseCasesProvider
        ↓
patientControllerProvider
        ↓
patientListPage
```

---

# 22. Controller Responsibility

A controller should:

- Receive user actions
- Call use cases
- Manage UI state
- Expose success/error
- Trigger refresh

A controller should not:

- Build widgets
- Contain raw Dio calls
- Parse JSON
- Contain presentation-specific formatting

---

# 23. Feature Provider Naming

Use consistent naming:

```text
patientsProvider
patientDetailsProvider
patientTimelineProvider
patientControllerProvider
patientSearchProvider
```

Avoid:

```text
provider1
dataProvider
controller
manager
```

---

# 24. Authentication Feature

Structure:

```text
features/auth/
├── data/
│   ├── datasources/
│   │   ├── auth_remote_datasource.dart
│   │   └── auth_local_datasource.dart
│   ├── models/
│   │   ├── login_response_model.dart
│   │   ├── user_model.dart
│   │   └── auth_tokens_model.dart
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
    │   └── otp_page.dart
    ├── widgets/
    │   ├── login_form.dart
    │   └── otp_input.dart
    └── providers/
        ├── auth_provider.dart
        └── auth_controller.dart
```

---

# 25. Doctor Feature

```text
features/doctor/
├── data/
├── domain/
└── presentation/
```

Use cases:

```text
GetDoctorProfile
UpdateDoctorProfile
GetProfessionalProfile
UpdateProfessionalProfile
SubmitVerification
GetVerificationStatus
```

---

# 26. Chamber Feature

Use cases:

```text
CreateChamber
GetChambers
GetChamber
UpdateChamber
ActivateChamber
DeactivateChamber
GetSchedules
CreateSchedule
UpdateSchedule
DeleteSchedule
```

Providers:

```text
chambersProvider
selectedChamberProvider
chamberDetailsProvider
scheduleProvider
chamberControllerProvider
```

---

# 27. Staff Feature

Use cases:

```text
GetStaff
InviteStaff
UpdateStaff
RemoveStaff
ResendInvitation
GetPermissions
GetMyPermissions
```

---

# 28. Patient Feature

Use cases:

```text
CreatePatient
SearchPatients
GetPatients
GetPatient
UpdatePatient
GetPatientTimeline
AddPatientToChamber
GetAllergies
AddAllergy
RemoveAllergy
GetConditions
AddCondition
```

---

# 29. Appointment Feature

Structure:

```text
features/appointment/
├── data/
├── domain/
└── presentation/
```

Providers:

```text
appointmentsProvider
appointmentCalendarProvider
appointmentDetailsProvider
appointmentControllerProvider
```

---

# 30. Queue Feature

The queue is operationally sensitive.

Providers:

```text
todayQueueProvider
queueControllerProvider
queuePollingProvider
queueFiltersProvider
```

Actions:

```text
checkIn
call
recall
skip
start
complete
```

---

# 31. Consultation Feature

This is the most important frontend feature.

Structure:

```text
features/consultation/
├── data/
├── domain/
└── presentation/
```

Primary provider:

```text
consultationControllerProvider
```

Supporting providers:

```text
encounterProvider
patientContextProvider
consultationStatusProvider
consultationAutoSaveProvider
```

---

# 32. Consultation Workspace State

Conceptually:

```text
ConsultationState
├── encounter
├── patient
├── vitals
├── notes
├── diagnoses
├── investigations
├── prescription
├── AI suggestions
├── saving
├── error
└── dirty state
```

---

# 33. Consultation Screen Architecture

```text
ConsultationPage
│
├── PatientHeader
├── PatientSummary
├── VitalsSection
├── ClinicalNotesSection
├── DiagnosisSection
├── InvestigationSection
├── PrescriptionSection
├── AIAssistantSection
└── CompleteConsultationButton
```

Use slivers or other appropriate techniques if the screen becomes long.

---

# 34. Auto-Save Architecture

Auto-save must be controlled.

```text
User Input
 ↓
Mark Dirty
 ↓
Debounce
 ↓
Save Draft
 ↓
Update Last Saved
```

Example UI:

```text
Saving...
Saved just now
Offline — will sync
```

---

# 35. Vitals Feature

Fields:

```text
Weight
Height
Temperature
Pulse
Respiratory Rate
Blood Pressure
SpO2
BMI
```

Create reusable clinical input widgets.

---

# 36. Diagnosis Feature

Support:

```text
Search
Recent
Favorites
Primary Diagnosis
Secondary Diagnosis
Remove
```

Search must be debounced.

---

# 37. Investigation Feature

Support:

- Catalog search
- Selected investigations
- Instructions
- Status
- Report association

---

# 38. Prescription Feature

Structure:

```text
features/prescription/
├── data/
├── domain/
└── presentation/
```

Use cases:

```text
CreatePrescription
GetPrescription
UpdatePrescription
AddPrescriptionItem
UpdatePrescriptionItem
RemovePrescriptionItem
ReviewPrescription
FinalizePrescription
AmendPrescription
GetPrescriptionHistory
GetPrescriptionPreview
GetPrescriptionPdf
DeliverPrescription
```

---

# 39. Prescription State

```text
Draft
 ↓
AI Assisted
 ↓
Review Required
 ↓
Finalized
 ↓
Delivered
```

Finalized state must be treated as read-only.

---

# 40. Prescription Builder

Recommended components:

```text
PrescriptionHeader
MedicineSearch
MedicineFavoriteList
MedicineSelector
PrescriptionItemCard
DoseSelector
FrequencySelector
DurationSelector
InstructionSelector
PrescriptionSummary
PrescriptionReview
```

---

# 41. Prescription Safety UI

Before finalization:

```text
Review Prescription

Patient:
Rahim Ahmed

Medicines:
1. Medicine A
2. Medicine B

Diagnosis:
...

[ ] I confirm that I have reviewed this prescription.

[Finalize Prescription]
```

The checkbox should not replace backend authorization.

---

# 42. Medicine Feature

Use cases:

```text
SearchMedicines
GetMedicine
GetFavoriteMedicines
AddFavoriteMedicine
RemoveFavoriteMedicine
```

Medicine catalog should support Bangla/English where data is available.

---

# 43. Payment Feature

Structure:

```text
features/payment/
├── data/
├── domain/
└── presentation/
```

Use cases:

```text
CreatePayment
GetPayments
GetPayment
GetReceipt
RefundPayment
```

Money must be represented safely.

Do not use floating-point arithmetic for financial values.

---

# 44. Reports Feature

Support:

```text
UploadReport
GetReports
GetReport
AnalyzeReport
DownloadReport
```

File workflow:

```text
File Picker
 ↓
Upload URL
 ↓
Object Storage
 ↓
Complete Upload
 ↓
Create/Update Report
```

---

# 45. AI Feature

Structure:

```text
features/ai/
├── data/
│   ├── datasources/
│   ├── models/
│   └── repositories/
│
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
│       ├── generate_patient_summary.dart
│       ├── clinical_chat.dart
│       └── generate_prescription_draft.dart
│
└── presentation/
    ├── pages/
    ├── widgets/
    └── providers/
```

---

# 46. AI State

```text
Idle
 ↓
Submitting
 ↓
Processing
 ↓
Completed
```

Failure:

```text
Failed
```

Never block the consultation if AI fails.

---

# 47. AI UI Components

Create:

```text
AIInsightCard
AIResponseCard
AIGeneratedBadge
AIReviewBanner
AIProcessingIndicator
AIErrorState
```

---

# 48. AI Safety UI

Every AI-generated clinical output should have clear visual indication.

Example:

```text
AI Generated
Review Required

Clinical Summary
...
```

For prescription drafts:

```text
AI Suggested Draft

This is not a finalized prescription.
Review and modify before finalization.
```

---

# 49. Analytics Feature

Providers:

```text
dashboardAnalyticsProvider
revenueAnalyticsProvider
patientAnalyticsProvider
appointmentAnalyticsProvider
```

Charts should remain readable on small screens.

---

# 50. Notifications Feature

Structure:

```text
features/notifications/
├── data/
├── domain/
└── presentation/
```

Providers:

```text
notificationsProvider
unreadNotificationCountProvider
notificationControllerProvider
```

---

# 51. Local Storage Architecture

Use Hive for MVP caching.

Structure:

```text
core/storage/
├── hive_service.dart
├── storage_keys.dart
├── cache_manager.dart
└── boxes/
    ├── auth_box.dart
    ├── chamber_box.dart
    ├── patient_box.dart
    ├── appointment_box.dart
    └── consultation_box.dart
```

---

# 52. Hive Storage Policy

Safe to cache:

- User preferences
- Selected chamber
- Recent patients
- Recent appointments
- Queue snapshot
- Medicine favorites
- Draft consultation data

Be cautious with:

- Clinical notes
- Prescription content
- Diagnostic reports

Sensitive clinical data should have an explicit retention and encryption strategy.

---

# 53. Offline Architecture Preparation

Even before full offline support, design repositories so local caching can be introduced later.

```text
Repository
 ├── RemoteDataSource
 └── LocalDataSource
```

Do not directly access Hive from widgets.

---

# 54. Connectivity

Create:

```text
connectivityProvider
networkStatusProvider
```

States:

```text
Online
Offline
Poor
Reconnecting
```

---

# 55. Offline Banner

Global component:

```text
AppOfflineBanner
```

Display only when necessary.

Do not permanently occupy significant screen space.

---

# 56. Routing

Route definitions:

```text
app/router/
├── app_router.dart
├── route_names.dart
├── route_paths.dart
└── route_guards.dart
```

Example route constants:

```text
login
register
otp
dashboard
patients
patientDetails
appointments
queue
consultation
prescription
payment
settings
```

---

# 57. Route Guard Logic

Conceptually:

```text
Splash
 ↓
Session Check
 ├── Authenticated
 │       ↓
 │   Onboarding Complete?
 │       ├── Yes → Dashboard
 │       └── No  → Onboarding
 │
 └── Unauthenticated
         ↓
       Login
```

---

# 58. Deep Linking

Prepare routes for:

```text
Patient
Appointment
Prescription
Notification
```

Example:

```text
/app/patients/:patientId
```

---

# 59. Theme Architecture

```text
app/theme/
├── app_theme.dart
├── app_colors.dart
├── app_text_styles.dart
├── app_spacing.dart
├── app_dimensions.dart
└── app_component_theme.dart
```

Do not use arbitrary styling repeatedly inside widgets.

---

# 60. Design Tokens

Centralize:

```text
Spacing
Radius
Typography
Button height
Input height
Icon sizes
Elevation
```

This allows global UI changes without modifying every screen.

---

# 61. Localization

Use ARB files:

```text
app_en.arb
app_bn.arb
```

Example:

```text
"login": "Login"
```

Bangla:

```text
"login": "লগইন"
```

No hard-coded user-facing strings.

---

# 62. Date & Time

Backend:

```text
UTC
```

Frontend:

```text
Asia/Dhaka
```

All date/time formatting must pass through centralized formatters.

---

# 63. Bangladesh Phone Formatter

Create:

```text
BangladeshPhoneFormatter
BangladeshPhoneValidator
```

Normalize input before API submission.

---

# 64. Currency Formatter

Create:

```text
BdtCurrencyFormatter
```

Example:

```text
৳800
৳1,500
৳10,000
```

Do not manually concatenate currency strings throughout the UI.

---

# 65. Shared Widgets

Structure:

```text
core/widgets/
├── buttons/
├── inputs/
├── dialogs/
├── cards/
├── states/
├── loading/
├── navigation/
└── clinical/
```

---

# 66. Common State Widgets

Every major screen should support:

```text
LoadingState
EmptyState
ErrorState
SuccessState
OfflineState
```

---

# 67. Form Architecture

For complex forms:

```text
Page
 ↓
Form Widget
 ↓
Controller
 ↓
Validation
 ↓
Use Case
```

Validation should be reusable.

---

# 68. Validation

Create:

```text
core/validators/
├── required_validator.dart
├── phone_validator.dart
├── email_validator.dart
├── date_validator.dart
├── number_validator.dart
└── password_validator.dart
```

Clinical-specific validation belongs in the relevant feature.

---

# 69. Permission Architecture

Create:

```text
core/permissions/
├── permission.dart
├── permission_checker.dart
└── permission_provider.dart
```

Example:

```text
patient.read
patient.create
patient.update

appointment.read
appointment.create

payment.create
payment.refund

staff.read
staff.manage
```

Frontend permissions control UI visibility.

Backend remains authoritative.

---

# 70. Audit Awareness

Frontend should provide metadata where required:

```text
requestId
deviceId
appVersion
```

Backend is responsible for authoritative audit logging.

---

# 71. Request ID

Every API request should have a unique request ID.

Useful for:

- Debugging
- Support
- Observability
- Incident investigation

Example:

```text
X-Request-ID
```

---

# 72. Logging

Logging levels:

```text
debug
info
warning
error
```

Development can log request metadata.

Production must redact sensitive data.

---

# 73. Environment Configuration

Example:

```text
development:
API_BASE_URL=https://dev-api.example.com

staging:
API_BASE_URL=https://staging-api.example.com

production:
API_BASE_URL=https://api.example.com
```

Actual production secrets must come from secure CI/CD configuration.

---

# 74. Application Configuration

Create:

```dart
class AppConfig {
  final String apiBaseUrl;
  final String environment;
  final bool enableLogging;
  final bool enableMockApi;
}
```

---

# 75. Mock API Architecture

Development should support:

```text
RealRepository
MockRepository
```

Provider override:

```text
ProviderScope(
  overrides: [
    patientRepositoryProvider
        .overrideWithValue(mockRepository),
  ],
)
```

This enables frontend development before backend endpoints are complete.

---

# 76. Testing Architecture

Test directory mirrors application architecture:

```text
test/
├── core/
│   ├── validators/
│   ├── formatters/
│   ├── network/
│   └── storage/
│
└── features/
    ├── auth/
    ├── patient/
    ├── appointment/
    ├── queue/
    ├── consultation/
    ├── prescription/
    └── payment/
```

---

# 77. Unit Test Requirements

Unit test:

- Use cases
- Repository implementations
- Mappers
- Validators
- Formatters
- Controllers
- Sync logic
- Permission helpers

---

# 78. Widget Test Requirements

At minimum:

```text
LoginForm
OTPInput
PatientForm
PatientCard
AppointmentForm
QueueCard
VitalsForm
DiagnosisSelector
PrescriptionItem
PaymentForm
AIResponseCard
```

---

# 79. Integration Test Requirements

Critical flows:

```text
Authentication
Patient registration
Appointment creation
Queue check-in
Consultation
Prescription finalization
Payment
```

---

# 80. Test Fixtures

Create:

```text
test/fixtures/
├── user_fixture.dart
├── doctor_fixture.dart
├── chamber_fixture.dart
├── patient_fixture.dart
├── appointment_fixture.dart
├── encounter_fixture.dart
├── prescription_fixture.dart
└── payment_fixture.dart
```

Never use real patient information in tests.

---

# 81. Static Analysis

Configure:

```text
analysis_options.yaml
```

Enforce:

- Strong typing
- Avoid dynamic where possible
- Unused code detection
- Consistent imports
- Async safety
- Formatting

Run:

```text
flutter analyze
dart format .
```

before pull requests.

---

# 82. Code Style Rules

## Classes

PascalCase:

```text
PatientRepository
AppointmentController
PrescriptionPage
```

## Variables

camelCase:

```text
patientId
selectedChamber
appointmentDate
```

## Files

snake_case:

```text
patient_repository.dart
appointment_controller.dart
prescription_page.dart
```

---

# 83. Widget Rules

Widgets should remain small.

Avoid:

```text
1000+ line screen
```

Prefer:

```text
Page
 ├── Header
 ├── Content
 │   ├── Section
 │   └── Section
 └── Actions
```

---

# 84. Business Logic Rules

Never put:

```text
API calls
database operations
complex business rules
```

inside widget `build()` methods.

---

# 85. Async Rules

Avoid unhandled async operations.

Use:

```text
AsyncValue
Future
Stream
```

with proper loading/error handling.

---

# 86. State Mutation Rules

Do not mutate state objects directly.

Prefer immutable state:

```text
Freezed
```

or Riverpod immutable state patterns.

---

# 87. Clinical Data Rules

Frontend must never:

- Delete finalized prescriptions locally
- Modify finalized prescription UI state as if editable
- Silently overwrite clinical records
- Hide audit-relevant state transitions
- Treat AI suggestions as approved clinical data

---

# 88. Prescription Finalization Rule

Frontend:

```text
Review
 ↓
Confirmation
 ↓
API finalize
 ↓
Success
 ↓
Read-only state
```

Do not optimistically mark prescription as finalized before backend confirmation.

---

# 89. Payment Rules

Payment creation should use idempotency keys.

Frontend generates:

```text
Idempotency-Key
```

for retry-safe operations.

Applicable to:

- Payment
- Prescription finalization
- Appointment creation
- Queue check-in

---

# 90. Navigation After Mutations

Use predictable navigation.

Example:

```text
Create Patient
 ↓
Success
 ↓
Patient Details
```

Prescription:

```text
Finalize
 ↓
Prescription Preview
```

Payment:

```text
Payment Success
 ↓
Receipt
```

---

# 91. Global Application State

Only global state belongs at application level.

Examples:

```text
Auth
Selected Chamber
User Preferences
Connectivity
Localization
Theme
```

Do not make every feature global.

---

# 92. Feature State Isolation

Patient state should remain inside:

```text
features/patient
```

Prescription state:

```text
features/prescription
```

Consultation can compose these features.

---

# 93. Consultation as Composition Root

The consultation workspace may consume:

```text
Patient
Vitals
Diagnosis
Investigation
Prescription
AI
```

But each feature should retain ownership of its own business logic.

---

# 94. Dependency Rule

Avoid:

```text
Patient → Prescription
```

unless there is a genuine domain dependency.

Prefer:

```text
Consultation
 ├── Patient
 ├── Prescription
 ├── Diagnosis
 └── AI
```

---

# 95. Reusable Clinical Components

Create:

```text
PatientHeader
ClinicalSection
VitalInput
DiagnosisChip
InvestigationChip
MedicineCard
AIInsightCard
```

These components should be usable across multiple screens.

---

# 96. API Endpoint Organization

Create:

```text
core/network/api_endpoints.dart
```

Example:

```text
auth.register
auth.login
auth.refresh

patients.list
patients.create
patients.details

appointments.list
appointments.create

queue.today

encounters.create

prescriptions.finalize
```

Avoid scattering endpoint strings throughout repositories.

---

# 97. API Contract Versioning

All requests use:

```text
/api/v1
```

Future versions:

```text
/api/v2
```

The frontend should centralize API version configuration.

---

# 98. File Upload Architecture

Use a dedicated service:

```text
FileUploadService
```

Responsibilities:

- Select file
- Validate file
- Request upload URL
- Upload
- Track progress
- Complete upload
- Handle cancellation
- Retry where appropriate

---

# 99. PDF Architecture

Create:

```text
core/utils/pdf/
```

Responsibilities:

- Preview
- Generate
- Print
- Share
- Download

Prescription PDF generation should preferably use backend-generated canonical documents where legal/clinical consistency matters.

---

# 100. Notifications Architecture

Push notification flow:

```text
Firebase
 ↓
Notification Service
 ↓
Local Notification
 ↓
Deep Link
 ↓
Relevant Screen
```

Notification payload should contain identifiers, not unnecessary clinical content.

---

# 101. Analytics Architecture

Create an abstraction:

```text
AnalyticsService
```

Example:

```text
trackEvent(
  EventName.patientCreated,
);
```

Do not send sensitive clinical payloads to general analytics providers.

---

# 102. Crash Reporting

Create:

```text
CrashReportingService
```

Record:

- Exception
- Stack trace
- App version
- OS version
- Device information
- Request ID where relevant

Do not attach clinical content.

---

# 103. App Lifecycle

Handle:

```text
resumed
inactive
paused
detached
```

Important scenarios:

- Consultation in progress
- Prescription editing
- App backgrounding
- Token expiration
- Network loss
- Device rotation where supported

---

# 104. Unsaved Changes

If a clinical form is dirty:

```text
Leave Screen?
Your changes have not been saved.
```

Options:

```text
Stay
Save
Discard
```

For clinical records, default toward preserving data.

---

# 105. Tablet/Desktop Readiness

Although mobile-first, layouts should support larger screens.

Breakpoints:

```text
< 768px
Mobile

768–1023px
Tablet

>= 1024px
Desktop
```

On tablet/desktop:

```text
Navigation Rail
+
Master/Detail layouts
```

may be used.

---

# 106. Accessibility

Every interactive element should have:

- Semantic label
- Meaningful tooltip where appropriate
- Sufficient touch target
- Keyboard support where applicable

Avoid communicating status only through color.

---

# 107. App Startup Flow

```text
main()
 ↓
Initialize Flutter
 ↓
Load Environment
 ↓
Initialize Storage
 ↓
Initialize Secure Storage
 ↓
Initialize Firebase
 ↓
Initialize Dependency Providers
 ↓
Run App
```

---

# 108. `main.dart` Responsibility

`main.dart` should remain minimal.

Conceptually:

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await AppBootstrap.initialize();

  runApp(
    const ProviderScope(
      child: ChamberManagementApp(),
    ),
  );
}
```

---

# 109. App Bootstrap

Create:

```text
app/config/app_bootstrap.dart
```

Responsibilities:

- Environment
- Hive
- Firebase
- Logging
- Crash reporting
- Notification initialization
- Other infrastructure

---

# 110. Application Root

```text
ChamberManagementApp
 ├── Theme
 ├── Localization
 ├── Router
 └── ProviderScope
```

---

# 111. Git Branching

Recommended:

```text
main
develop
feature/*
bugfix/*
hotfix/*
release/*
```

Feature example:

```text
feature/patient-management
feature/consultation-workspace
feature/ai-prescription
```

---

# 112. Commit Convention

Recommended:

```text
feat:
fix:
refactor:
test:
docs:
chore:
perf:
build:
```

Example:

```text
feat: add patient registration workflow
fix: handle expired auth token
test: add prescription finalization tests
```

---

# 113. Pull Request Rules

Every PR should contain:

```text
Summary
Changes
Screenshots/video where applicable
API dependency
Testing performed
Known limitations
```

PR checklist:

```text
[ ] flutter analyze
[ ] dart format
[ ] unit tests
[ ] widget tests
[ ] integration tests if applicable
[ ] localization
[ ] accessibility
[ ] no sensitive logs
```

---

# 114. CI Pipeline

Recommended:

```text
Pull Request
     ↓
Install Flutter
     ↓
Pub Get
     ↓
Format Check
     ↓
Analyze
     ↓
Unit Tests
     ↓
Widget Tests
     ↓
Build
```

Staging:

```text
develop
 ↓
Tests
 ↓
Build APK/IPA
 ↓
Deploy Staging
```

Production:

```text
release
 ↓
Regression
 ↓
Approval
 ↓
Production Build
 ↓
Store/Internal Distribution
```

---

# 115. Sprint-to-Code Mapping

| Sprint | Primary Code Areas |
|---|---|
| 1 | `app`, `core`, bootstrap, networking |
| 2 | `auth`, `onboarding` |
| 3 | `doctor`, `chamber`, `staff` |
| 4 | `patient` |
| 5 | `appointment`, `queue` |
| 6 | `consultation`, `vitals`, `diagnosis`, `investigation` |
| 7 | `prescription`, `medicines` |
| 8 | `payment` |
| 9 | `ai` |
| 10 | `reports`, `notifications`, `analytics` |
| 11 | `storage`, `connectivity`, `sync` |
| 12 | `security`, `testing`, `performance`, release |

---

# 116. Sprint 1 Implementation File Set

The first sprint should create approximately:

```text
lib/
├── main.dart
├── app/
│   ├── app.dart
│   ├── router/
│   ├── theme/
│   └── config/
│
└── core/
    ├── network/
    ├── storage/
    ├── security/
    ├── errors/
    ├── logging/
    ├── validators/
    ├── formatters/
    └── widgets/
```

No feature should bypass these foundations.

---

# 117. Sprint 2 Implementation File Set

Add:

```text
features/
├── auth/
└── onboarding/
```

Minimum working flow:

```text
Splash
 ↓
Login
 ↓
Register
 ↓
OTP
 ↓
Authenticated
```

---

# 118. Sprint 3 Implementation File Set

Add:

```text
doctor/
chamber/
staff/
```

Working flow:

```text
Doctor
 ↓
Create Chamber
 ↓
Schedule
 ↓
Invite Staff
 ↓
Dashboard
```

---

# 119. Sprint 4 Implementation File Set

Add:

```text
patient/
```

Working flow:

```text
Patient List
 ↓
Search
 ↓
Create
 ↓
Details
 ↓
Timeline
```

---

# 120. Sprint 5 Implementation File Set

Add:

```text
appointment/
queue/
```

Working flow:

```text
Appointment
 ↓
Check-in
 ↓
Queue
 ↓
Call
```

---

# 121. Sprint 6 Implementation File Set

Add:

```text
consultation/
vitals/
diagnosis/
investigation/
```

Working flow:

```text
Queue
 ↓
Consultation
 ↓
Clinical Data
```

---

# 122. Sprint 7 Implementation File Set

Add:

```text
prescription/
medicines/
```

Working flow:

```text
Consultation
 ↓
Prescription
 ↓
Review
 ↓
Finalize
```

---

# 123. Sprint 8 Implementation File Set

Add:

```text
payment/
```

Working flow:

```text
Consultation
 ↓
Payment
 ↓
Receipt
```

---

# 124. Sprint 9 Implementation File Set

Add:

```text
ai/
```

Working flow:

```text
Patient Context
 ↓
AI
 ↓
Suggestion
 ↓
Doctor Review
```

---

# 125. Sprint 10 Implementation File Set

Add:

```text
reports/
notifications/
analytics/
```

---

# 126. Sprint 11 Implementation File Set

Expand:

```text
core/storage/
core/connectivity/
sync/
```

If sync becomes sufficiently complex, it may later become:

```text
features/sync/
```

---

# 127. Sprint 12 Implementation File Set

Focus on:

```text
test/
integration_test/
CI/CD
performance
security
release configuration
```

---

# 128. Frontend Dependency Rules

Recommended dependency direction:

```text
app
 ↓
features
 ↓
core
```

Features may depend on:

```text
core
```

One feature should not directly depend on another feature's internal implementation.

Use shared domain abstractions where cross-feature interaction is required.

---

# 129. Avoid Circular Dependencies

Bad:

```text
Patient → Consultation
Consultation → Patient
```

Better:

```text
Consultation
    ↓
PatientRepository
```

or composition at presentation/application level.

---

# 130. API Contract First Development

Before implementing a backend-connected feature:

1. Review API contract.
2. Create DTO.
3. Create domain entity.
4. Create repository contract.
5. Create mock repository.
6. Build UI.
7. Implement real repository.
8. Integrate API.
9. Add integration tests.

---

# 131. Feature Completion Checklist

Every feature must satisfy:

```text
[ ] Domain entity
[ ] DTO/model
[ ] Repository interface
[ ] Repository implementation
[ ] Remote datasource
[ ] Use cases
[ ] Riverpod provider
[ ] Controller/notifier
[ ] Page
[ ] Reusable widgets
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Validation
[ ] Localization
[ ] Unit tests
[ ] Widget tests
[ ] Integration test if critical
```

---

# 132. Critical Feature Completion Checklist

For:

- Consultation
- Prescription
- Payment
- Queue

also require:

```text
[ ] Idempotency
[ ] Concurrency handling
[ ] Retry handling
[ ] Audit awareness
[ ] Offline behavior
[ ] E2E test
```

---

# 133. Frontend Definition of Done

A feature is Done when:

### Architecture

- Correct layer separation
- No business logic in widgets
- Repository abstraction implemented

### UI

- Matches approved UX
- Responsive
- Accessible
- Bangla/English

### API

- Correct endpoint
- Correct DTO
- Correct error handling
- Correct authorization behavior

### State

- Riverpod implemented
- Loading/error/empty states handled

### Testing

- Unit tests
- Widget tests
- Integration tests where required

### Security

- Sensitive data protected
- No secret leakage
- No sensitive logs

### Documentation

- API mapping documented
- Known limitations documented

---

# 134. Complete Frontend Development Flow

```text
Product Requirement
        ↓
UX/UI Specification
        ↓
API Contract
        ↓
Domain Entity
        ↓
Repository Contract
        ↓
Mock Repository
        ↓
Riverpod State
        ↓
UI Implementation
        ↓
Real API Repository
        ↓
Integration
        ↓
Unit Tests
        ↓
Widget Tests
        ↓
E2E Tests
        ↓
Code Review
        ↓
Staging
        ↓
Production
```

---

# 135. Final Architecture

```text
                         Flutter Application
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
             App Layer                         Core Layer
                │                                   │
        ┌───────┴────────┐             ┌────────────┴───────────┐
        │                │             │                        │
     Router            Theme       Network                  Storage
        │                              │                        │
        └──────────────┬───────────────┴────────────┬───────────┘
                       │                            │
                  Feature Modules              Infrastructure
                       │
        ┌──────────────┼──────────────────────────────┐
        │              │                              │
   Operations       Clinical                       AI
        │              │                              │
 Chamber             Patient                    AI Assistant
 Staff               Consultation               AI Summary
 Appointment         Prescription               AI Draft
 Queue               Payment                     AI Chat
                     Reports
                       │
                       ↓
                 Domain Layer
                       │
                 Repository Layer
                       │
              ┌────────┴─────────┐
              │                  │
          Remote API          Local Cache
              │                  │
             Dio                Hive
              │
              ↓
        NestJS REST API
              │
         PostgreSQL
```

---

# 136. Final Coding Principles

The Flutter implementation must follow these principles:

1. **Use Clean Architecture consistently.**
2. **Use Riverpod for application state.**
3. **Keep widgets focused on presentation.**
4. **Keep business logic outside widgets.**
5. **Use repositories as data boundaries.**
6. **Keep domain entities independent of API models.**
7. **Use Freezed for immutable models/state where appropriate.**
8. **Use Dio only inside the data/network layer.**
9. **Never access Hive directly from widgets.**
10. **Use secure storage for authentication secrets.**
11. **Centralize API endpoints.**
12. **Centralize validation and formatting.**
13. **Centralize Bangla/English localization.**
14. **Centralize Bangladesh-specific phone/currency/date formatting.**
15. **Treat backend authorization as authoritative.**
16. **Never treat AI output as final clinical data.**
17. **Never silently overwrite clinical information.**
18. **Never make finalized prescriptions editable.**
19. **Use idempotency for critical mutations.**
20. **Build loading, empty, error and offline states into every major feature.**
21. **Use mock repositories to allow frontend/backend parallel development.**
22. **Keep feature boundaries clean.**
23. **Test critical clinical workflows end-to-end.**
24. **Never expose sensitive clinical data through logs or analytics.**
25. **Optimize the application around the doctor's consultation workflow.**

---

# 137. Recommended Next Document

The next document should now move from architecture into **actual development task specifications**.

## Document 16 — Complete Flutter Feature-by-Feature Implementation Specification

It should define, for every feature:

- Exact screens
- Exact files to create
- Domain entities
- DTOs
- API endpoints
- Repository methods
- Use cases
- Riverpod providers
- Controller methods
- UI components
- Validation rules
- Loading/error/empty states
- Local cache behavior
- Navigation
- Permission requirements
- Unit tests
- Widget tests
- Integration tests
- Acceptance criteria
- Backend dependencies
- Example request/response mapping

The first feature specification should be **Authentication**, followed by **Onboarding → Doctor → Chamber → Staff → Patient → Appointment → Queue → Consultation → Prescription → Payment → AI**.

This will give the frontend team an implementation-level specification that can be converted directly into Jira/Linear tickets.