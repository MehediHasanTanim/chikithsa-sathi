# Document 18 — Complete Flutter Riverpod State Management Specification

**Project:** AI-Powered Chamber & Prescription Management  
**Platform:** Flutter  
**State Management:** Riverpod  
**Architecture:** Clean Architecture + Feature-First  
**Backend:** NestJS + Fastify + PostgreSQL  
**API:** REST `/api/v1`  
**Document:** 18  
**Status:** Implementation Ready  
**Target:** MVP + Advanced Architecture

---

# 1. Purpose

This document defines the complete Riverpod state-management architecture for the Chamber Management Flutter application.

The objective is to provide a consistent approach for managing:

- Authentication/session
- User profile
- Doctor profile
- Professional verification
- Chamber selection
- Chamber configuration
- Staff and permissions
- Patients
- Patient search
- Patient timeline
- Appointments
- Queue
- Consultation
- Vitals
- Diagnosis
- Investigation
- Diagnostic reports
- Medicines
- Prescriptions
- Payments
- Notifications
- AI
- Analytics
- Files
- Connectivity
- Offline/cache state
- Application settings

The architecture must support:

- reactive UI
- predictable state transitions
- asynchronous operations
- API integration
- local caching
- pagination
- search
- form state
- optimistic updates only where safe
- concurrency
- multi-chamber context
- clinical data integrity
- testability
- scalability

---

# 2. State Management Philosophy

Riverpod is responsible for **application state orchestration**, not business logic.

The separation is:

```text
UI
 ↓
Riverpod Controller
 ↓
Use Case
 ↓
Repository
 ↓
Remote / Local Data Source
```

Riverpod should not contain:

- SQL logic
- Dio calls
- complex business rules
- API DTO parsing
- authentication token implementation
- prescription clinical decision logic

---

# 3. Core Principle

The application should follow:

> **Providers expose state; controllers coordinate actions; use cases contain business operations; repositories provide data.**

Example:

```text
PrescriptionScreen
        ↓
PrescriptionController
        ↓
FinalizePrescriptionUseCase
        ↓
PrescriptionRepository
        ↓
API
```

---

# 4. Riverpod Version

Use a current stable Riverpod release compatible with the project's Flutter SDK.

Recommended packages:

```yaml
dependencies:
  flutter_riverpod:
  riverpod_annotation:

dev_dependencies:
  riverpod_generator:
  build_runner:
```

Prefer code generation for large feature sets.

---

# 5. Why Riverpod

Riverpod is appropriate because the application requires:

- dependency injection
- async state
- provider composition
- scoped state
- lifecycle management
- auto-dispose
- test overrides
- dependency tracking
- family providers
- refresh/invalidation
- clean separation from widgets

---

# 6. Provider Categories

Providers should be classified into:

```text
1. Infrastructure Providers
2. Dependency Providers
3. Repository Providers
4. Use Case Providers
5. Read Providers
6. Controller Providers
7. Session Providers
8. Cache Providers
9. Feature State Providers
10. Derived Providers
```

---

# 7. Infrastructure Providers

Examples:

```text
appConfigProvider
dioProvider
apiClientProvider
secureStorageProvider
tokenStorageProvider
connectivityProvider
localDatabaseProvider
loggerProvider
```

These generally live under:

```text
lib/core/
```

---

# 8. Repository Providers

Example:

```dart
final patientRepositoryProvider =
    Provider<PatientRepository>((ref) {
  return PatientRepositoryImpl(
    remoteDataSource:
        ref.watch(patientRemoteDataSourceProvider),
    localDataSource:
        ref.watch(patientLocalDataSourceProvider),
  );
});
```

Repositories should normally be stateless services.

---

# 9. Use Case Providers

Example:

```dart
final getPatientUseCaseProvider =
    Provider<GetPatientUseCase>((ref) {
  return GetPatientUseCase(
    ref.watch(patientRepositoryProvider),
  );
});
```

Use cases should contain domain/application operations.

---

# 10. Controller Providers

Controllers coordinate:

- UI actions
- use cases
- state changes
- refresh/invalidation
- mutation lifecycle

Example:

```dart
@riverpod
class PatientController extends _$PatientController {
  @override
  FutureOr<void> build() {}

  Future<void> updatePatient(
    UpdatePatientRequest request,
  ) async {
    ...
  }
}
```

---

# 11. State Types

Use explicit state models.

Recommended categories:

```text
AsyncValue<T>
FormState
MutationState
PaginationState<T>
SearchState<T>
SessionState
QueueState
ConsultationState
PrescriptionState
AiRequestState
```

Do not create unnecessarily complex state objects for simple read operations.

---

# 12. AsyncValue

For simple asynchronous reads:

```dart
final patientProvider =
    FutureProvider.family<Patient, String>((ref, patientId) async {
  return ref
      .watch(getPatientUseCaseProvider)
      .execute(patientId);
});
```

UI:

```dart
ref.watch(patientProvider(patientId)).when(
  data: (patient) => PatientView(patient),
  loading: () => const PatientLoading(),
  error: (error, stack) => PatientError(error),
);
```

---

# 13. AsyncNotifier

Use `AsyncNotifier`/generated equivalent for stateful asynchronous features.

Recommended for:

- authentication
- dashboard
- patient lists
- appointments
- queue
- consultation
- prescription
- payments
- AI

---

# 14. Notifier

Use a regular `Notifier` for synchronous state.

Examples:

```text
selectedChamber
selectedLanguage
selectedAppointmentFilter
selectedPatient
theme preference
```

---

# 15. State Ownership Rule

Every piece of state must have one clear owner.

Example:

```text
selectedChamber
        ↓
selectedChamberProvider
```

Do not duplicate selected chamber state in:

- dashboard
- patient screen
- appointment screen
- queue screen

They should all consume the central provider.

---

# 16. Global State vs Feature State

Global state:

```text
session
currentUser
selectedChamber
permissions
connectivity
app settings
```

Feature state:

```text
patient search
appointment calendar
queue
consultation
prescription builder
AI chat
```

Feature state should not unnecessarily become global state.

---

# 17. Global Provider Architecture

Recommended:

```text
appConfigProvider
sessionProvider
currentUserProvider
selectedChamberProvider
permissionsProvider
connectivityProvider
appSettingsProvider
```

Dependency:

```text
Session
   ↓
Current User
   ↓
Chambers
   ↓
Selected Chamber
   ↓
Permissions
```

---

# 18. Session Provider

The session provider is responsible for:

- restoring session
- login
- logout
- refresh
- session expiration

Example:

```dart
@riverpod
class Session extends _$Session {
  @override
  Future<SessionState> build() async {
    return _restoreSession();
  }

  Future<void> logout() async {
    ...
  }
}
```

---

# 19. Session State

Recommended:

```dart
sealed class SessionState {
  const SessionState();
}

class SessionInitializing extends SessionState {}

class Authenticated extends SessionState {
  final User user;

  const Authenticated(this.user);
}

class Unauthenticated extends SessionState {}

class SessionExpired extends SessionState {}
```

---

# 20. Authentication State Flow

```text
App Launch
    ↓
Session Initializing
    ↓
Read Secure Storage
    ↓
Validate/Restore Session
    │
    ├── Valid → Authenticated
    │
    └── Invalid → Unauthenticated
```

---

# 21. Login State

Login is a mutation state:

```text
idle
 ↓
submitting
 ↓
success
```

or:

```text
idle
 ↓
submitting
 ↓
failure
```

Use a dedicated controller rather than embedding login form state inside session state if the UI is complex.

---

# 22. OTP State

OTP controller manages:

```text
phone
OTP input
verification
resend
cooldown
error
```

State:

```text
initial
waiting
verifying
verified
failure
```

Resend cooldown should be local UI state.

---

# 23. Current User Provider

```dart
@riverpod
Future<User> currentUser(Ref ref) async {
  return ref.watch(getCurrentUserUseCaseProvider).execute();
}
```

When profile changes:

```text
update profile
 ↓
invalidate currentUserProvider
```

---

# 24. Selected Chamber Provider

This is one of the most important global providers.

```dart
@riverpod
class SelectedChamber extends _$SelectedChamber {
  @override
  String? build() {
    return _loadPersistedChamber();
  }

  Future<void> select(String chamberId) async {
    state = chamberId;
    await _persist(chamberId);
  }
}
```

---

# 25. Selected Chamber Rules

Selected chamber must:

- belong to authenticated doctor/user
- be active
- be accessible to the user
- persist across sessions
- reset if membership is revoked

The backend remains authoritative.

---

# 26. Chamber Context

Chamber-scoped providers should depend on:

```dart
ref.watch(selectedChamberProvider)
```

Example:

```dart
@riverpod
Future<List<Appointment>> appointments(
  Ref ref,
) async {
  final chamberId =
      ref.watch(selectedChamberProvider);

  if (chamberId == null) {
    return [];
  }

  return ref
      .watch(appointmentRepositoryProvider)
      .getAppointments(chamberId);
}
```

---

# 27. Chamber Change Handling

When the user switches chambers:

```text
Selected Chamber changes
        ↓
Invalidate chamber-scoped providers
        ↓
Reload:
  appointments
  queue
  patients
  dashboard
  staff
  schedules
  permissions
        ↓
UI updates
```

---

# 28. Chamber Isolation

A provider must never display Chamber A data after switching to Chamber B.

Therefore:

```text
Chamber ID
   ↓
Provider family/context
```

must be considered part of the state identity.

---

# 29. Permission Provider

Permissions are chamber-specific.

```dart
@riverpod
Future<Set<String>> permissions(
  Ref ref,
) async {
  final chamberId =
      ref.watch(selectedChamberProvider);

  if (chamberId == null) {
    return {};
  }

  return ref
      .watch(permissionRepositoryProvider)
      .getMyPermissions(chamberId);
}
```

---

# 30. Permission Helper

```dart
bool hasPermission(
  Set<String> permissions,
  String permission,
) {
  return permissions.contains(permission);
}
```

Usage:

```dart
final canFinalize = hasPermission(
  permissions,
  'prescription.finalize',
);
```

This is a UI convenience only.

---

# 31. Provider Lifecycle

Use:

```text
autoDispose
```

for temporary feature state.

Use:

```text
keepAlive
```

for state that should survive navigation.

Examples:

### Auto dispose

```text
patient search
appointment filter
AI temporary request
```

### Keep alive

```text
session
selected chamber
current user
app settings
```

---

# 32. Family Providers

Use family providers when state depends on an identifier.

Example:

```dart
@riverpod
Future<Patient> patient(
  Ref ref,
  String patientId,
) async {
  return ref
      .watch(patientRepositoryProvider)
      .getPatient(patientId);
}
```

Usage:

```dart
ref.watch(patientProvider(patientId));
```

---

# 33. Family Provider Rules

Family arguments must be stable.

Good:

```text
patientId
appointmentId
encounterId
prescriptionId
```

Avoid passing large mutable objects as family arguments.

---

# 34. Patient State Architecture

Providers:

```text
patientsProvider
patientSearchProvider
patientProvider(patientId)
patientTimelineProvider(patientId)
patientVitalsProvider(patientId)
patientControllerProvider
```

---

# 35. Patient List State

Patient list needs:

```text
items
loading
refreshing
loadingMore
page
hasNext
error
search
```

Recommended:

```dart
class PatientListState {
  final List<Patient> items;
  final bool isLoading;
  final bool isRefreshing;
  final bool isLoadingMore;
  final bool hasNext;
  final Failure? failure;
}
```

---

# 36. Patient Search State

```text
idle
 ↓
typing
 ↓
debouncing
 ↓
searching
 ↓
results
```

or:

```text
searching
 ↓
failure
```

Search provider should be `autoDispose`.

---

# 37. Patient Search Cancellation

When query changes:

```text
Query A
 ↓
Request A
 ↓
Query B
 ↓
Cancel Request A
 ↓
Request B
```

Riverpod controller owns the cancellation token.

---

# 38. Patient Details

Use:

```text
patientProvider(patientId)
```

for details.

Avoid storing the entire patient object globally.

---

# 39. Patient Timeline

```text
patientTimelineProvider(patientId)
```

State should support:

- initial loading
- refreshing
- pagination if required
- error
- stale/cache indicator

---

# 40. Patient Mutation

Examples:

```text
create patient
update patient
add allergy
remove allergy
add condition
```

Use:

```text
patientControllerProvider
```

After successful mutation:

```text
invalidate patient
invalidate patients list
invalidate timeline if relevant
```

---

# 41. Appointment State

Providers:

```text
appointmentsProvider
appointmentProvider(id)
appointmentCalendarProvider
appointmentFilterProvider
appointmentControllerProvider
```

---

# 42. Appointment Filter

Synchronous state:

```dart
@riverpod
class AppointmentFilter extends _$AppointmentFilter {
  @override
  AppointmentFilterState build() {
    return const AppointmentFilterState();
  }

  void setDate(DateTime date) {
    state = state.copyWith(date: date);
  }
}
```

---

# 43. Appointment Calendar

Calendar state should distinguish:

```text
selected date
visible date range
loading
appointments
error
```

Avoid refetching identical date ranges unnecessarily.

---

# 44. Appointment Mutations

Operations:

```text
create
confirm
reschedule
cancel
update
```

Each should have explicit mutation state.

Do not use one global `isLoading` for all operations.

---

# 45. Queue Architecture

Queue is a high-frequency feature.

Providers:

```text
todayQueueProvider
queueControllerProvider
queuePollingProvider
queueStatsProvider
```

---

# 46. Queue State

```dart
class QueueState {
  final List<QueueEntry> entries;
  final QueueStats? stats;
  final bool isLoading;
  final bool isRefreshing;
  final Failure? failure;
}
```

---

# 47. Queue Controller

Actions:

```text
checkIn
call
recall
skip
start
complete
```

Each action should:

```text
validate UI state
 ↓
send API
 ↓
wait server confirmation
 ↓
refresh/update queue
```

---

# 48. Queue Polling Provider

Polling should only run while the queue screen is active.

```text
QueueScreen enters
 ↓
start polling
 ↓
5–10 sec
 ↓
refresh
 ↓
QueueScreen leaves
 ↓
stop polling
```

Do not run queue polling globally.

---

# 49. Queue Optimistic Updates

Avoid optimistic updates for:

```text
call
skip
start
complete
```

because queue state is shared and changes rapidly.

Server confirmation is required.

---

# 50. Encounter State

Providers:

```text
encounterProvider(id)
encounterControllerProvider
clinicalNotesProvider(id)
vitalsProvider(id)
diagnosesProvider(id)
investigationsProvider(id)
```

---

# 51. Consultation State

Consultation is one of the most important stateful screens.

State includes:

```text
encounter
notes
vitals
diagnoses
investigations
prescription
dirty state
save state
error
```

---

# 52. Consultation State Model

```dart
class ConsultationState {
  final Encounter encounter;
  final bool isDirty;
  final bool isSaving;
  final DateTime? lastSavedAt;
  final Failure? failure;
}
```

---

# 53. Dirty State

Dirty state becomes true when:

```text
notes changed
vitals changed
diagnosis changed
investigation changed
prescription draft changed
```

Example:

```text
isDirty = true
```

After successful save:

```text
isDirty = false
lastSavedAt = now
```

---

# 54. Auto-Save

Auto-save should be controlled.

```text
User edits
 ↓
Dirty
 ↓
Debounce
 ↓
Save draft
 ↓
Success
 ↓
Clean
```

Do not save every keystroke.

---

# 55. Auto-Save Failure

If auto-save fails:

```text
Local draft remains
isDirty = true
Show subtle warning
Allow retry
```

Never discard the doctor's input.

---

# 56. Encounter State Machine

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

Provider actions must respect this state.

---

# 57. Encounter Completion

Completion should:

```text
validate local state
 ↓
confirm required data
 ↓
API request
 ↓
server confirmation
 ↓
update encounter state
```

Never optimistically mark the encounter completed.

---

# 58. Vitals State

Provider:

```text
encounterVitalsProvider(encounterId)
```

Patient trends:

```text
patientVitalsProvider(patientId)
```

These are separate use cases.

---

# 59. Diagnosis State

Providers:

```text
diagnosisSearchProvider
encounterDiagnosesProvider(encounterId)
```

Diagnosis catalog is cacheable.

Encounter diagnoses are clinical state.

---

# 60. Investigation State

Providers:

```text
investigationCatalogProvider
encounterInvestigationsProvider(encounterId)
```

Catalog:

```text
cacheable
```

Encounter results:

```text
authoritative clinical data
```

---

# 61. Diagnostic Reports

Providers:

```text
encounterReportsProvider(encounterId)
reportProvider(reportId)
reportAnalysisProvider(reportId)
```

Report analysis may be asynchronous.

---

# 62. Medicine State

Providers:

```text
medicineSearchProvider
medicineProvider(id)
medicineFavoritesProvider
```

Medicine catalog can be cached.

---

# 63. Prescription Architecture

Providers:

```text
prescriptionProvider(id)
prescriptionControllerProvider
prescriptionItemsProvider(id)
prescriptionHistoryProvider(id)
prescriptionPreviewProvider(id)
```

---

# 64. Prescription Builder State

The prescription builder needs local draft state.

```dart
class PrescriptionDraftState {
  final List<PrescriptionItemDraft> items;
  final String? advice;
  final String? followUp;
  final bool isDirty;
  final bool isSaving;
}
```

---

# 65. Prescription Draft Rules

Local draft state can be edited freely while:

```text
DRAFT
AI_ASSISTED
REVIEW_REQUIRED
```

Once:

```text
FINALIZED
```

state becomes immutable.

---

# 66. AI Prescription Integration

AI flow:

```text
Doctor requests AI draft
        ↓
AI controller
        ↓
AI API
        ↓
AI result
        ↓
Prescription draft state
        ↓
Doctor reviews
        ↓
Doctor edits
        ↓
Doctor explicitly finalizes
```

AI must never mutate finalized prescription state.

---

# 67. Prescription Finalization State

```text
idle
 ↓
confirming
 ↓
finalizing
 ↓
success
```

Failure:

```text
finalizing
 ↓
failure
```

Do not mark finalization successful until API confirmation.

---

# 68. Prescription Finalization Conflict

If backend returns:

```text
409
PRESCRIPTION_ALREADY_FINALIZED
```

then:

```text
refresh prescription
 ↓
show finalized state
 ↓
disable editing
```

---

# 69. Prescription Amendment

Amendment must be a separate operation.

```text
Finalized Prescription
       ↓
Amend
       ↓
POST /prescriptions/:id/amend
       ↓
New version
```

The provider should refresh:

```text
prescription
history
timeline
```

---

# 70. Payment State

Providers:

```text
paymentsProvider
paymentProvider(id)
paymentControllerProvider
receiptProvider(paymentId)
```

---

# 71. Payment Mutation

Flow:

```text
Enter payment
 ↓
Validate
 ↓
Generate idempotency key
 ↓
POST /payments
 ↓
Server confirmation
 ↓
Update payment state
```

---

# 72. Payment Duplicate Submission

UI must prevent:

```text
Tap Pay
Tap Pay
Tap Pay
```

while request is processing.

Use:

```text
isSubmitting
```

and backend idempotency.

---

# 73. Refund State

Refund is a critical mutation.

```text
idle
 ↓
confirming
 ↓
processing
 ↓
success/failure
```

Never optimistically mark payment refunded.

---

# 74. AI State Architecture

AI has different workflows.

Providers:

```text
aiPatientSummaryProvider
aiClinicalChatProvider
aiPrescriptionDraftProvider
aiReportAnalysisProvider
aiRequestProvider(requestId)
```

---

# 75. AI Chat State

```dart
class AiChatState {
  final List<AiMessage> messages;
  final bool isSending;
  final Failure? failure;
}
```

Messages should remain associated with the relevant clinical context.

---

# 76. AI Request State

```text
idle
submitting
processing
completed
failed
cancelled
```

---

# 77. AI Request Polling

```text
POST AI operation
      ↓
requestId
      ↓
AiRequestProvider(requestId)
      ↓
poll
      ↓
completed
```

Polling must stop when:

```text
completed
failed
cancelled
screen disposed
```

---

# 78. AI Error Handling

Handle:

```text
AI provider unavailable
timeout
rate limit
invalid output
authorization failure
unsafe output
```

UI should allow:

```text
Retry
Dismiss
Continue manually
```

---

# 79. AI Safety State

AI responses should include metadata:

```text
isAiGenerated
requiresReview
source/context
```

Example:

```dart
class AiSuggestion {
  final String content;
  final bool isAiGenerated;
  final bool requiresReview;
}
```

---

# 80. AI → Prescription Boundary

The state architecture must maintain:

```text
AiPrescriptionDraft
        ≠
FinalPrescription
```

AI output is copied into editable draft state.

The doctor controls the transition.

---

# 81. Dashboard State

Providers:

```text
dashboardProvider
dashboardStatsProvider
todayAppointmentsProvider
todayQueueProvider
```

If backend provides a dedicated dashboard endpoint, prefer it for initial dashboard loading.

---

# 82. Dashboard Loading Strategy

Use parallel reads where appropriate:

```text
Dashboard
 ├── appointments
 ├── queue
 ├── revenue
 └── statistics
```

One failed widget should not necessarily blank the entire dashboard.

---

# 83. Notifications State

Providers:

```text
notificationsProvider
unreadNotificationCountProvider
notificationControllerProvider
```

Read action:

```text
POST /notifications/:id/read
```

then invalidate unread count.

---

# 84. Analytics State

Providers:

```text
analyticsDashboardProvider
revenueAnalyticsProvider
patientAnalyticsProvider
appointmentAnalyticsProvider
```

Analytics state can use caching more aggressively than clinical state.

---

# 85. File State

Providers:

```text
fileUploadControllerProvider
fileDownloadProvider(fileId)
```

Upload state:

```text
idle
requestingUrl
uploading
completing
success
failure
```

---

# 86. File Upload Progress

The upload controller should expose:

```text
0–100%
```

Example:

```dart
class FileUploadState {
  final double progress;
  final UploadStatus status;
}
```

---

# 87. Connectivity State

Global:

```text
connectivityProvider
```

States:

```text
online
offline
unknown
```

Connectivity must not automatically imply API success.

---

# 88. Offline State

Offline state should be represented independently from cached data.

Example:

```text
Online + Fresh
Online + Loading
Online + Stale
Offline + Cached
Offline + No Cache
```

---

# 89. Cache State

Recommended:

```dart
class CacheState<T> {
  final T? data;
  final DateTime? cachedAt;
  final bool isStale;
}
```

Use only where useful.

Do not make every provider artificially complex.

---

# 90. Refresh Strategy

For read providers:

```text
ref.invalidate(provider)
```

or:

```text
ref.refresh(provider)
```

Choose intentionally.

`invalidate` is useful when state should be recomputed on next read.

`refresh` immediately recomputes.

---

# 91. Mutation → Invalidation Matrix

Example:

| Mutation | Invalidate |
|---|---|
| Create Patient | patient list |
| Update Patient | patient details, list |
| Add Allergy | patient details, allergies |
| Create Appointment | appointments, dashboard |
| Cancel Appointment | appointments, dashboard |
| Check-in | queue, appointment |
| Call Queue | queue |
| Complete Queue | queue, dashboard |
| Update Encounter | encounter, timeline |
| Finalize Prescription | prescription, encounter, timeline |
| Payment | payments, dashboard, receipt |
| Refund | payment, analytics |

---

# 92. Provider Invalidation Principle

Invalidate the smallest useful set.

Avoid:

```dart
ref.invalidateAll();
```

after every mutation.

This causes:

- unnecessary network calls
- poor performance
- flickering
- excessive API usage

---

# 93. Derived Providers

Use derived providers for computed values.

Example:

```dart
@riverpod
bool canFinalizePrescription(Ref ref) {
  final permissions = ref.watch(permissionsProvider).value ?? {};
  final prescription =
      ref.watch(prescriptionProvider(id)).value;

  return permissions.contains('prescription.finalize') &&
      prescription?.status == PrescriptionStatus.reviewRequired;
}
```

Derived providers should remain side-effect free.

---

# 94. No Side Effects in Derived Providers

Avoid:

```dart
final provider = Provider((ref) {
  api.call();
});
```

unless explicitly designed as a lifecycle/background provider.

Normal providers should derive values, not perform hidden mutations.

---

# 95. Provider Dependency Rules

Allowed:

```text
Controller → Use Case
Use Case → Repository
Repository → Data Source
Provider → Provider
```

Avoid:

```text
UI → Repository directly
Repository → Riverpod
Domain → Riverpod
Domain → Flutter
```

---

# 96. Domain Layer Independence

Domain classes must not import:

```text
flutter_riverpod
riverpod
flutter
dio
json_annotation
```

Domain remains framework-independent.

---

# 97. Presentation Layer

Presentation may depend on:

```text
Riverpod
Flutter
Domain models
```

Presentation should not depend directly on:

```text
Dio
Prisma
API DTOs
database implementation
```

---

# 98. Controller Responsibilities

Controllers may:

- invoke use cases
- update UI state
- coordinate multiple use cases
- trigger provider invalidation
- manage mutation lifecycle
- expose user-facing operation state

Controllers should not:

- construct SQL
- parse JSON
- directly call Dio
- contain authorization rules
- make clinical decisions

---

# 99. Async Controller Pattern

Recommended:

```dart
@riverpod
class PatientController extends _$PatientController {
  @override
  FutureOr<void> build() {}

  Future<void> updatePatient(
    UpdatePatientRequest request,
  ) async {
    state = const AsyncLoading();

    final result = await ref
        .read(updatePatientUseCaseProvider)
        .execute(request);

    result.when(
      success: (_) {
        ref.invalidate(patientProvider(request.id));
      },
      failure: (failure) {
        state = AsyncError(
          failure,
          StackTrace.current,
        );
      },
    );
  }
}
```

The exact implementation can vary, but the pattern must remain consistent.

---

# 100. Mutation State

For complex screens, prefer an explicit mutation state:

```dart
enum MutationStatus {
  idle,
  submitting,
  success,
  failure,
}
```

Example:

```dart
class MutationState {
  final MutationStatus status;
  final Failure? failure;
}
```

---

# 101. Multiple Mutations

Do not use one:

```text
isLoading
```

for:

```text
save
delete
refund
finalize
```

Instead:

```text
saveStatus
deleteStatus
refundStatus
finalizeStatus
```

or separate controllers.

---

# 102. Form State

Forms should generally be local to the screen/provider.

Example:

```text
PatientFormController
AppointmentFormController
ChamberFormController
PrescriptionFormController
```

Avoid putting temporary form input into global providers.

---

# 103. Form State Lifecycle

```text
Open Screen
 ↓
Initialize Form
 ↓
User Edits
 ↓
Validate
 ↓
Submit
 ↓
Success
 ↓
Reset/Close
```

---

# 104. Form Dirty State

Forms should expose:

```text
isDirty
```

before navigation.

If:

```text
isDirty = true
```

and user attempts to leave:

> You have unsaved changes. Do you want to leave?

---

# 105. Consultation Form Special Rule

Consultation data is clinically important.

The app should preserve unsaved input through:

- temporary navigation
- network failure
- token refresh
- widget rebuild

where safely possible.

---

# 106. Pagination State

Reusable pagination model:

```dart
class PaginationState<T> {
  final List<T> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasNext;
  final int page;
  final Failure? failure;
}
```

Use for:

- patients
- appointments
- notifications
- payments
- audit logs

---

# 107. Pagination Controller

Flow:

```text
Initial load
 ↓
Page 1
 ↓
User scrolls
 ↓
Load page 2
 ↓
Append
```

Prevent:

```text
page 2
page 2
page 2
```

from being requested multiple times.

---

# 108. Search + Pagination

Search state should reset pagination.

```text
Query A
 ↓
Pages 1–3

Query B
 ↓
Reset
 ↓
Page 1
```

---

# 109. Pull-to-Refresh + Pagination

Refresh:

```text
replace items
page = 1
```

Load more:

```text
append items
page++
```

Do not duplicate records.

---

# 110. Provider Families for Pagination

Use stable query objects.

Example:

```dart
@freezed
class PatientQuery with _$PatientQuery {
  const factory PatientQuery({
    String? search,
    int? pageSize,
  }) = _PatientQuery;
}
```

Then pagination state remains associated with the query.

---

# 111. Search Provider Lifecycle

Recommended:

```text
autoDispose
```

with debounce and cancellation.

When screen disappears:

```text
dispose
cancel request
release memory
```

---

# 112. Queue Provider Lifecycle

Queue provider can remain active only while the queue screen or chamber dashboard needs it.

Avoid permanent polling.

---

# 113. Dashboard Provider Lifecycle

Dashboard can be:

```text
keepAlive
```

for a short navigation session, or:

```text
autoDispose
```

with caching.

Do not force permanent background refresh.

---

# 114. Session Provider Lifecycle

Session must remain alive for the entire application lifecycle.

Use:

```text
keepAlive
```

or root-level provider architecture.

---

# 115. Selected Chamber Lifecycle

Selected chamber should persist for the session and optionally across application launches.

Store the ID locally.

On startup:

```text
read selected chamber
 ↓
validate membership
 ↓
use it
```

---

# 116. Chamber Switcher Flow

```text
User taps chamber
 ↓
Load accessible chambers
 ↓
Select chamber
 ↓
Persist selection
 ↓
Update selectedChamberProvider
 ↓
Invalidate chamber-scoped providers
 ↓
Reload dashboard
```

---

# 117. Staff State

Providers:

```text
staffProvider
staffMemberProvider(id)
staffControllerProvider
```

Staff list is chamber-scoped.

---

# 118. Staff Permission Changes

After changing staff permissions:

```text
update staff
 ↓
invalidate staff list
invalidate staff details
```

Current user's permissions should also be refreshed if the operation changes their own membership.

---

# 119. Schedule State

Providers:

```text
schedulesProvider
scheduleControllerProvider
```

Schedules are chamber-scoped.

After update:

```text
invalidate schedulesProvider
```

---

# 120. Doctor Profile State

Providers:

```text
doctorProvider
professionalProfileProvider
doctorControllerProvider
```

Profile mutations invalidate corresponding providers.

---

# 121. Verification State

Provider:

```text
verificationStatusProvider
```

State:

```text
notSubmitted
submitted
underReview
approved
rejected
resubmitted
```

Polling should only be used if backend requires it.

---

# 122. Notification Badge

Unread count:

```text
unreadNotificationCountProvider
```

When notification is read:

```text
invalidate unread count
```

---

# 123. Application Settings

Global settings:

```text
language
theme
notification preference
selected chamber
```

Should be managed separately from clinical state.

---

# 124. Localization State

```dart
@riverpod
class AppLocale extends _$AppLocale {
  @override
  Locale build() {
    return const Locale('bn');
  }

  void setLocale(Locale locale) {
    state = locale;
  }
}
```

Supported:

```text
বাংলা
English
```

---

# 125. Theme State

Theme selection:

```text
system
light
dark
```

Should not affect business providers.

---

# 126. Global Error State

Avoid one giant global error provider.

Errors should normally remain close to their feature.

Use global error handling only for:

- session expiration
- application-level maintenance
- unrecoverable infrastructure events

---

# 127. Global Session Expiration Event

If API interceptor detects expired session:

```text
Auth interceptor
 ↓
Session manager
 ↓
Session state
 ↓
Unauthenticated
 ↓
Navigation to Login
```

Do not let every provider independently navigate to login.

---

# 128. Navigation Integration

Router listens to:

```text
sessionProvider
```

and possibly:

```text
onboardingStatusProvider
```

Routing logic:

```text
Unauthenticated
    → Login

Authenticated + onboarding incomplete
    → Onboarding

Authenticated + complete
    → Dashboard
```

---

# 129. Provider Override for Testing

Riverpod's overrides are important.

Example:

```dart
ProviderScope(
  overrides: [
    patientRepositoryProvider.overrideWithValue(
      FakePatientRepository(),
    ),
  ],
  child: const App(),
);
```

---

# 130. Unit Testing Providers

Test:

```text
initial state
loading
success
failure
refresh
mutation
invalidation
```

Example:

```text
Given patient API succeeds
When patient provider loads
Then Patient is returned
```

---

# 131. Controller Testing

For each controller:

```text
action
 ↓
mock use case
 ↓
expected state
 ↓
provider invalidation
```

Example:

```text
updatePatient()
 ↓
UseCase called
 ↓
Success
 ↓
patientProvider invalidated
```

---

# 132. Provider Error Testing

Test:

```text
401
403
404
409
422
429
500
timeout
offline
```

Verify each maps to expected UI state.

---

# 133. Refresh Testing

Critical test:

```text
Five providers receive 401
        ↓
One refresh
        ↓
All requests retry
```

This belongs primarily to the API integration layer but should also be tested through provider behavior.

---

# 134. Chamber Isolation Tests

Scenario:

```text
Doctor has A and B
```

Test:

```text
Select A
 ↓
Load queue
 ↓
Select B
 ↓
Queue must reload
 ↓
No A queue remains visible
```

---

# 135. Clinical State Tests

Test:

```text
Encounter DRAFT
 ↓
IN_PROGRESS
```

but prevent:

```text
LOCKED
 ↓
EDIT
```

---

# 136. Prescription State Tests

Test:

```text
DRAFT
 ↓
REVIEW_REQUIRED
 ↓
FINALIZED
```

After finalization:

```text
edit → rejected
delete → rejected
AI update → rejected
```

---

# 137. AI State Tests

Test:

```text
AI request
 ↓
processing
 ↓
success
```

and:

```text
processing
 ↓
failure
```

Also:

```text
AI draft
 ≠
final prescription
```

---

# 138. Payment State Tests

Test:

```text
idle
 ↓
processing
 ↓
paid
```

and:

```text
processing
 ↓
timeout
```

The UI must not assume payment succeeded after timeout.

It should query authoritative payment status where appropriate.

---

# 139. Provider Naming Convention

Use:

```text
<feature>Provider
<feature>ControllerProvider
<feature>State
<feature>Query
```

Examples:

```text
patientProvider
patientControllerProvider
patientListProvider
patientSearchProvider
patientTimelineProvider
```

---

# 140. Provider File Naming

Recommended:

```text
patient_providers.dart
patient_controller.dart
patient_state.dart
patient_queries.dart
```

For large features:

```text
presentation/
├── providers/
├── controllers/
└── state/
```

---

# 141. Feature Directory

Example:

```text
features/patients/
├── data/
├── domain/
└── presentation/
    ├── providers/
    ├── controllers/
    ├── state/
    ├── screens/
    └── widgets/
```

---

# 142. Provider Inventory

Core:

```text
appConfigProvider
dioProvider
apiClientProvider
connectivityProvider
sessionProvider
currentUserProvider
selectedChamberProvider
permissionsProvider
appLocaleProvider
appThemeProvider
```

---

# 143. Doctor Providers

```text
doctorProvider
professionalProfileProvider
verificationStatusProvider
doctorControllerProvider
```

---

# 144. Chamber Providers

```text
chambersProvider
chamberProvider(id)
selectedChamberProvider
chamberControllerProvider
schedulesProvider
scheduleControllerProvider
```

---

# 145. Staff Providers

```text
staffProvider
staffMemberProvider(id)
staffControllerProvider
permissionsProvider
```

---

# 146. Patient Providers

```text
patientsProvider
patientProvider(id)
patientSearchProvider
patientTimelineProvider(id)
patientVitalsProvider(id)
patientControllerProvider
```

---

# 147. Appointment Providers

```text
appointmentsProvider
appointmentProvider(id)
appointmentCalendarProvider
appointmentFilterProvider
appointmentControllerProvider
```

---

# 148. Queue Providers

```text
todayQueueProvider
queueControllerProvider
queuePollingProvider
queueStatsProvider
```

---

# 149. Encounter Providers

```text
encounterProvider(id)
encounterControllerProvider
clinicalNotesProvider(id)
clinicalNotesControllerProvider
encounterVitalsProvider(id)
encounterDiagnosesProvider(id)
encounterInvestigationsProvider(id)
```

---

# 150. Report Providers

```text
encounterReportsProvider(id)
reportProvider(id)
reportAnalysisProvider(id)
```

---

# 151. Medicine Providers

```text
medicineSearchProvider
medicineProvider(id)
medicineFavoritesProvider
medicineFavoritesControllerProvider
```

---

# 152. Prescription Providers

```text
prescriptionProvider(id)
prescriptionControllerProvider
prescriptionItemsProvider(id)
prescriptionHistoryProvider(id)
prescriptionPreviewProvider(id)
prescriptionDraftProvider
```

---

# 153. Payment Providers

```text
paymentsProvider
paymentProvider(id)
paymentControllerProvider
receiptProvider(id)
refundControllerProvider
```

---

# 154. Notification Providers

```text
notificationsProvider
unreadNotificationCountProvider
notificationControllerProvider
```

---

# 155. AI Providers

```text
aiPatientSummaryProvider
aiClinicalChatProvider
aiPrescriptionDraftProvider
aiReportAnalysisProvider
aiRequestProvider(id)
```

---

# 156. Analytics Providers

```text
analyticsDashboardProvider
revenueAnalyticsProvider
patientAnalyticsProvider
appointmentAnalyticsProvider
```

---

# 157. File Providers

```text
fileUploadControllerProvider
fileDownloadProvider(id)
```

---

# 158. Export Providers

```text
exportControllerProvider
exportProvider(id)
```

---

# 159. Provider Dependency Graph

```text
AppConfig
    │
    ▼
Dio
    │
    ▼
ApiClient
    │
    ▼
Repositories
    │
    ▼
Use Cases
    │
    ▼
Feature Controllers / Providers
    │
    ├── Patients
    ├── Appointments
    ├── Queue
    ├── Encounter
    ├── Prescription
    ├── Payment
    └── AI
```

Global context:

```text
Session
  ↓
Current User
  ↓
Selected Chamber
  ↓
Permissions
  ↓
Chamber-scoped providers
```

---

# 160. Consultation Dependency Graph

```text
Selected Chamber
       ↓
Patient
       ↓
Appointment
       ↓
Queue
       ↓
Encounter
       ├── Vitals
       ├── Notes
       ├── Diagnosis
       ├── Investigation
       └── Prescription
                 ↓
               AI
```

---

# 161. Prescription Dependency Graph

```text
Encounter
   ↓
Prescription
   ├── Medicine Search
   ├── Favorites
   ├── Items
   ├── AI Draft
   ├── Review
   └── Finalize
```

---

# 162. Patient Context Provider

A consultation screen may need:

```text
patient
appointment
encounter
allergies
conditions
timeline
vitals
```

Avoid making every widget independently load the same data.

Use shared providers and provider composition.

---

# 163. Patient Context Model

Optional composed state:

```dart
class PatientContext {
  final Patient patient;
  final Appointment? appointment;
  final Encounter? encounter;
  final List<Allergy> allergies;
  final List<Condition> conditions;
}
```

This should be a presentation/application convenience, not a replacement for domain entities.

---

# 164. Avoid Provider Explosion

Not every field needs its own provider.

Bad:

```text
patientNameProvider
patientPhoneProvider
patientAgeProvider
patientGenderProvider
```

Better:

```text
patientProvider(patientId)
```

Use derived providers only where they provide meaningful reuse.

---

# 165. Provider Granularity Rule

Use a separate provider when:

- lifecycle differs
- caching differs
- loading differs
- mutation differs
- data is reused independently

Otherwise keep related state together.

---

# 166. AutoDispose Rules

Use autoDispose for:

```text
search
temporary forms
screen-specific data
AI request polling
temporary filters
```

Avoid autoDispose for:

```text
session
selected chamber
application configuration
```

---

# 167. KeepAlive Rules

Use keepAlive selectively.

Good:

```text
current user
session
selected chamber
medicine catalog
diagnosis catalog
```

Avoid making every provider keepAlive.

---

# 168. Provider Refresh on App Resume

When application resumes:

```text
App lifecycle
 ↓
If authenticated
 ↓
refresh selected critical data
```

Do not refresh every provider.

Potential refresh:

```text
queue
appointments
notifications
```

---

# 169. Queue App Resume

If user returns to app after inactivity:

```text
resume
 ↓
refresh queue
```

This avoids showing stale queue status.

---

# 170. Appointment App Resume

For appointment calendar:

```text
resume
 ↓
refresh if stale
```

Use a freshness threshold rather than unconditional refresh.

---

# 171. Staleness

Example:

```text
data fetched < 30 sec ago
    → probably fresh

> 5 min
    → stale
```

Actual thresholds should be feature-specific.

Queue should have a much shorter freshness threshold than analytics.

---

# 172. State Restoration

State restoration may include:

```text
selected chamber
selected tab
selected date
filters
draft form
```

Avoid restoring sensitive clinical content unnecessarily.

---

# 173. Deep Link State

When opening:

```text
/patients/:id
```

provider:

```text
patientProvider(id)
```

loads authoritative patient details.

---

# 174. Notification Navigation

Notification contains:

```text
appointmentId
```

Flow:

```text
notification
 ↓
router
 ↓
appointmentProvider(id)
 ↓
API
 ↓
screen
```

Do not trust notification payload as authoritative state.

---

# 175. Provider Error Boundary

Each major screen should handle:

```text
loading
data
error
```

For complex screens:

```text
partial data
partial error
```

is preferable to all-or-nothing rendering.

---

# 176. Partial Dashboard Failure

Example:

```text
Appointments → success
Queue → success
Revenue → failure
```

Dashboard should still display:

```text
Appointments
Queue
```

and show:

```text
Revenue unavailable
[Retry]
```

---

# 177. Clinical Screen Failure

For consultation:

```text
Patient loaded
Encounter loaded
Vitals API failed
```

Do not destroy the rest of the screen.

Preserve local input.

---

# 178. Optimistic Updates Policy

Allowed for low-risk UI-only state:

```text
favorite medicine
local filters
theme
selected tab
```

Potentially allowed for reversible metadata after design review.

Not allowed for:

```text
prescription finalization
payment
queue transitions
encounter completion
clinical locking
```

---

# 179. Server Confirmation Policy

Required for:

```text
clinical mutations
financial mutations
queue transitions
prescription finalization
permission changes
staff changes
```

---

# 180. Concurrency Policy

Controllers must prevent duplicate operations.

Example:

```text
if state.isSubmitting:
    return
```

For backend conflicts:

```text
409
 ↓
refresh
 ↓
inform user
```

Do not overwrite automatically.

---

# 181. Background Polling Policy

Polling must:

- have a bounded lifetime
- stop on dispose
- stop on completion
- respect app lifecycle
- avoid overlapping requests
- back off when appropriate

---

# 182. Polling State

```text
idle
polling
paused
completed
failed
```

Never start a second polling loop while one is active.

---

# 183. AI Polling Policy

AI polling should use increasing intervals where appropriate:

```text
1 sec
2 sec
4 sec
5 sec
...
```

with a reasonable maximum interval and timeout.

---

# 184. Provider Observers

Use provider observers for development diagnostics.

Track:

```text
provider created
provider disposed
state changed
```

Never log sensitive state contents.

---

# 185. Provider Logging

Good:

```text
PatientProvider state changed: loading → data
```

Avoid:

```text
PatientProvider data = {
  name: ...
  phone: ...
  diagnosis: ...
}
```

---

# 186. Memory Management

Avoid retaining:

- entire patient histories globally
- large diagnostic files
- AI conversations indefinitely
- large report PDFs
- unnecessary image bytes

Use:

```text
pagination
cache limits
autoDispose
temporary storage
```

---

# 187. Large File State

Do not store large file bytes inside Riverpod state.

Instead:

```text
upload/download stream
 ↓
temporary file
 ↓
viewer
```

---

# 188. AI Chat Memory

AI chat history should have controlled lifecycle.

For long conversations:

```text
paginate / trim / summarize
```

rather than keeping unbounded state.

---

# 189. Provider Testing Strategy

Testing layers:

```text
Provider Unit Tests
Controller Tests
Repository Tests
Integration Tests
Widget Tests
E2E Tests
```

---

# 190. Provider Test Example

Scenario:

```text
Given patient repository returns Patient
When patientProvider loads
Then state is AsyncData<Patient>
```

Failure:

```text
Given repository throws NotFoundFailure
When provider loads
Then state is AsyncError
```

---

# 191. Controller Test Example

```text
Given update patient succeeds
When updatePatient() is called
Then:
  state = success
  patientProvider invalidated
```

---

# 192. Queue Test Example

```text
Given queue contains WAITING patient
When call() succeeds
Then patient becomes CALLED
```

And:

```text
Given API returns conflict
Then state remains safe
And queue refreshes
```

---

# 193. Prescription Test Example

```text
Given prescription is REVIEW_REQUIRED
When finalize succeeds
Then state becomes FINALIZED
And editing is disabled
```

---

# 194. AI Test Example

```text
Given AI generates draft
Then draft is stored as AI suggestion
And prescription remains editable
And finalization is still a separate action
```

---

# 195. Payment Test Example

```text
Given payment request times out
Then UI does not mark payment as PAID
And payment status can be rechecked
```

---

# 196. Multi-Chamber Test Example

```text
Select Chamber A
 ↓
Load appointments
 ↓
Select Chamber B
 ↓
Provider invalidation
 ↓
Load Chamber B appointments
```

Verify no stale Chamber A data remains.

---

# 197. Performance Testing

Monitor:

```text
provider rebuild frequency
provider creation/disposal
API request duplication
unnecessary invalidation
memory usage
```

---

# 198. Rebuild Optimization

Avoid watching large providers when only one field is required.

Prefer:

```dart
ref.watch(
  patientProvider(id).select(
    (state) => state.value?.fullName,
  ),
);
```

where appropriate.

---

# 199. Provider Select

Use `.select()` to minimize widget rebuilds.

Good candidates:

```text
queue count
unread notification count
selected chamber name
isSubmitting
```

---

# 200. Riverpod Code Generation

Recommended annotations:

```dart
@riverpod
Future<Patient> patient(
  Ref ref,
  String patientId,
) async {
  ...
}
```

Generated provider:

```text
patientProvider
```

This reduces boilerplate and improves consistency.

---

# 201. Generated Provider Files

Generated files should not be manually edited.

Example:

```text
patient_providers.dart
patient_providers.g.dart
```

Only source file is committed/maintained according to project convention.

---

# 202. Provider Naming Consistency

Do not mix:

```text
patientsProvider
patientListProvider
patientsListProvider
```

without a defined meaning.

Recommended:

```text
patientsProvider
```

for collection.

```text
patientProvider(id)
```

for details.

---

# 203. State Naming

Recommended:

```text
PatientListState
PatientFormState
QueueState
ConsultationState
PrescriptionDraftState
AiChatState
PaymentState
```

Avoid generic:

```text
DataState
AppState
CommonState
```

unless truly global.

---

# 204. Controller Naming

Examples:

```text
PatientController
AppointmentController
QueueController
ConsultationController
PrescriptionController
PaymentController
AiController
```

---

# 205. One Controller vs Multiple Controllers

Use one controller when operations belong to the same lifecycle.

Split controllers when:

- state becomes too large
- operations have different lifecycle
- permissions differ
- testing becomes difficult

Example:

```text
PrescriptionController
PrescriptionFinalizationController
```

may be appropriate for a complex implementation.

---

# 206. Consultation Controller

Consultation may coordinate:

```text
saveNotes
saveVitals
addDiagnosis
addInvestigation
completeEncounter
```

But domain logic remains in use cases.

---

# 207. Prescription Controller

May coordinate:

```text
create
addItem
updateItem
removeItem
review
finalize
amend
deliver
```

Finalization must have explicit state.

---

# 208. AI Controller

May coordinate:

```text
generateSummary
sendChat
generatePrescriptionDraft
analyzeReport
pollRequest
```

AI controller must never call prescription finalization.

---

# 209. Provider Interaction Example

```text
Doctor opens patient
        ↓
patientProvider(patientId)
        ↓
Doctor starts consultation
        ↓
encounterProvider(encounterId)
        ↓
Vitals provider
Diagnosis provider
Investigation provider
        ↓
Prescription provider
        ↓
AI draft provider
```

---

# 210. Cross-Feature Invalidation

Example:

```text
Finalize Prescription
        ↓
Invalidate:
  prescriptionProvider
  prescriptionHistoryProvider
  encounterProvider
  patientTimelineProvider
```

This keeps related views synchronized.

---

# 211. Cross-Feature Navigation

Navigation should use IDs:

```text
patientId
appointmentId
encounterId
prescriptionId
```

Destination provider loads the latest data.

---

# 212. State Synchronization Principle

Riverpod state is:

```text
UI cache / application state
```

not:

```text
source of truth
```

The backend is authoritative for server data.

---

# 213. Clinical Source of Truth

For finalized clinical data:

```text
Backend
   ↓
Database
```

is authoritative.

Riverpod state is temporary application state.

---

# 214. Offline Clinical Draft

If offline support is enabled:

```text
Local Draft
   ↓
Pending Sync
```

must be visually distinct from:

```text
Server-confirmed clinical record
```

---

# 215. Sync State

Advanced state:

```text
synced
pending
syncing
conflict
failed
```

Conflicts must require explicit resolution where clinical records are involved.

---

# 216. Offline Provider Architecture

```text
Provider
   ↓
Repository
   ├── Remote
   └── Local
```

Riverpod should not implement synchronization logic itself.

Sync belongs to a dedicated application/data service.

---

# 217. Cache Invalidation Strategy

Cache invalidation must happen after successful mutations.

Example:

```text
Create Patient
 ↓
API success
 ↓
invalidate patientsProvider
```

Do not invalidate before success.

---

# 218. Error Recovery

Controller should distinguish:

```text
retryable
nonRetryable
conflict
authorization
validation
```

Example:

```text
NetworkFailure → Retry
ConflictFailure → Refresh + Review
ValidationFailure → Fix form
Forbidden → Permission message
```

---

# 219. API Failure → Riverpod State

```text
API
 ↓
Failure
 ↓
Repository Result
 ↓
Controller
 ↓
AsyncError / MutationFailure
 ↓
UI
```

---

# 220. State Transition Documentation

Every major stateful feature should document:

```text
initial
loading
success
failure
refresh
mutation
conflict
offline
```

This becomes part of feature implementation and QA.

---

# 221. MVP Provider Priority

## P0

```text
session
currentUser
selectedChamber
permissions

patients
appointments
queue

encounter
vitals
diagnosis
investigation

prescription
payments

dashboard
```

---

# 222. MVP P1

```text
timeline
diagnostic reports
notifications
medicine favorites
AI summary
AI prescription draft
AI chat
```

---

# 223. Advanced Providers

```text
offline sync
voice AI
patient portal
telemedicine
advanced analytics
lab integrations
pharmacy integrations
predictive analytics
```

---

# 224. Sprint Implementation Plan

## Sprint 1 — Riverpod Foundation

Tasks:

- Riverpod installation
- code generation
- provider conventions
- core providers
- environment providers
- Dio provider
- API client provider
- error handling
- ProviderScope
- ProviderObserver

Deliverable:

```text
Working Riverpod foundation
```

---

## Sprint 2 — Authentication

Tasks:

- session provider
- login controller
- OTP controller
- current user
- logout
- session expiration
- router integration

Deliverable:

```text
Complete authentication state architecture
```

---

## Sprint 3 — Chamber Context

Tasks:

- chamber list
- selected chamber
- chamber details
- permissions
- schedules
- staff
- chamber switching
- provider invalidation

Deliverable:

```text
Complete chamber context architecture
```

---

## Sprint 4 — Patients

Tasks:

- patient list
- search
- details
- timeline
- allergies
- conditions
- pagination
- caching
- mutation controllers

Deliverable:

```text
Complete patient state management
```

---

## Sprint 5 — Appointment & Queue

Tasks:

- calendar
- filters
- appointment mutations
- queue state
- polling
- queue controller
- server confirmation

Deliverable:

```text
Complete chamber operations state
```

---

## Sprint 6 — Consultation

Tasks:

- encounter state
- clinical notes
- vitals
- diagnosis
- investigations
- dirty state
- auto-save
- completion
- locking

Deliverable:

```text
Complete consultation state architecture
```

---

## Sprint 7 — Prescription

Tasks:

- medicine search
- favorites
- prescription draft
- items
- review
- finalize
- amendment
- history
- delivery

Deliverable:

```text
Complete prescription state architecture
```

---

## Sprint 8 — Payments

Tasks:

- payment list
- payment details
- create
- receipt
- refund
- idempotency state
- conflict handling

Deliverable:

```text
Complete payment state architecture
```

---

## Sprint 9 — AI

Tasks:

- patient summary
- clinical chat
- prescription draft
- report analysis
- async request state
- polling
- AI safety state

Deliverable:

```text
Complete AI state architecture
```

---

## Sprint 10 — Reports & Notifications

Tasks:

- analytics
- notifications
- unread count
- exports
- audit views
- deep-link state

Deliverable:

```text
Complete reporting state architecture
```

---

## Sprint 11 — Offline

Tasks:

- connectivity
- cache state
- local repositories
- stale state
- offline read
- draft preservation
- sync foundation

Deliverable:

```text
Offline-aware Riverpod architecture
```

---

## Sprint 12 — Hardening

Tasks:

- provider performance
- rebuild optimization
- lifecycle testing
- concurrency testing
- provider memory testing
- session testing
- multi-chamber testing
- clinical integrity testing
- E2E testing

Deliverable:

```text
Production-ready Riverpod architecture
```

---

# 225. Complete Provider Inventory

## Core

```text
appConfigProvider
dioProvider
apiClientProvider
connectivityProvider
```

## Authentication

```text
sessionProvider
loginControllerProvider
otpControllerProvider
currentUserProvider
```

## User

```text
userPreferencesProvider
appLocaleProvider
appThemeProvider
```

## Doctor

```text
doctorProvider
professionalProfileProvider
verificationStatusProvider
doctorControllerProvider
```

## Chamber

```text
chambersProvider
chamberProvider
selectedChamberProvider
chamberControllerProvider
```

## Schedule

```text
schedulesProvider
scheduleControllerProvider
```

## Staff

```text
staffProvider
staffMemberProvider
staffControllerProvider
permissionsProvider
```

## Patient

```text
patientsProvider
patientProvider
patientSearchProvider
patientTimelineProvider
patientVitalsProvider
patientControllerProvider
```

## Appointment

```text
appointmentsProvider
appointmentProvider
appointmentCalendarProvider
appointmentFilterProvider
appointmentControllerProvider
```

## Queue

```text
todayQueueProvider
queueStatsProvider
queuePollingProvider
queueControllerProvider
```

## Encounter

```text
encounterProvider
encounterControllerProvider
clinicalNotesProvider
clinicalNotesControllerProvider
encounterVitalsProvider
encounterDiagnosesProvider
encounterInvestigationsProvider
```

## Reports

```text
encounterReportsProvider
reportProvider
reportAnalysisProvider
```

## Medicines

```text
medicineSearchProvider
medicineProvider
medicineFavoritesProvider
medicineFavoritesControllerProvider
```

## Prescription

```text
prescriptionProvider
prescriptionDraftProvider
prescriptionItemsProvider
prescriptionHistoryProvider
prescriptionPreviewProvider
prescriptionControllerProvider
```

## Payment

```text
paymentsProvider
paymentProvider
paymentControllerProvider
receiptProvider
refundControllerProvider
```

## Notifications

```text
notificationsProvider
unreadNotificationCountProvider
notificationControllerProvider
```

## AI

```text
aiPatientSummaryProvider
aiClinicalChatProvider
aiPrescriptionDraftProvider
aiReportAnalysisProvider
aiRequestProvider
```

## Analytics

```text
analyticsDashboardProvider
revenueAnalyticsProvider
patientAnalyticsProvider
appointmentAnalyticsProvider
```

## Files

```text
fileUploadControllerProvider
fileDownloadProvider
```

## Export

```text
exportControllerProvider
exportProvider
```

---

# 226. Provider Architecture Summary

```text
                        ProviderScope
                             │
             ┌───────────────┴───────────────┐
             │                               │
         Global State                  Infrastructure
             │                               │
       ┌─────┼─────┐                    Dio/API
       │     │     │                       │
    Session Chamber Permissions            │
       │     │     │                       │
       └─────┴─────┘                       │
             │                             │
             └──────────────┬──────────────┘
                            ▼
                    Feature Providers
                            │
        ┌──────────┬────────┼────────┬──────────┐
        ▼          ▼        ▼        ▼          ▼
    Patients   Appointments Queue  Clinical  Prescription
                                             │
                                             ▼
                                            AI
                                             │
                                             ▼
                                         Payments
```

---

# 227. Final Riverpod Rules

The following rules are mandatory.

### Rule 1

Riverpod manages application state, not business logic.

### Rule 2

UI never calls repositories directly.

### Rule 3

Controllers never call Dio directly.

### Rule 4

Domain layer never depends on Riverpod.

### Rule 5

Every state has one clear owner.

### Rule 6

Chamber-scoped data always depends on selected chamber context.

### Rule 7

Switching chambers invalidates chamber-scoped state.

### Rule 8

Critical mutations require server confirmation.

### Rule 9

Finalized prescriptions are immutable.

### Rule 10

AI state cannot finalize prescriptions.

### Rule 11

Clinical conflicts must never be silently overwritten.

### Rule 12

Search requests must support cancellation.

### Rule 13

Polling must have a bounded lifecycle.

### Rule 14

Do not globally cache unnecessary clinical information.

### Rule 15

Do not log sensitive provider state.

### Rule 16

Use `autoDispose` for temporary screen state.

### Rule 17

Use `keepAlive` only when justified.

### Rule 18

Avoid provider explosion.

### Rule 19

Use `.select()` where rebuild optimization matters.

### Rule 20

Backend remains the authoritative source of server data.

---

# 228. Final Architecture

The final Riverpod architecture is:

```text
                         Flutter UI
                             │
                             ▼
                    Riverpod Providers
                             │
                    ┌────────┴────────┐
                    │                 │
               Read Providers    Controllers
                    │                 │
                    └────────┬────────┘
                             ▼
                         Use Cases
                             │
                             ▼
                        Repositories
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
                 Remote             Local
                    │                 │
                    ▼                 ▼
                   API              Cache
```

Global context:

```text
Session
   ↓
Current User
   ↓
Selected Chamber
   ↓
Permissions
   ↓
Feature Providers
```

Clinical context:

```text
Patient
   ↓
Appointment
   ↓
Queue
   ↓
Encounter
   ├── Vitals
   ├── Notes
   ├── Diagnosis
   ├── Investigation
   └── Prescription
             ↓
            AI
             ↓
       Doctor Review
             ↓
         Finalization
```

---

# 229. Final State Management Principle

The most important principle for this application is:

> **Riverpod should make the application reactive without making the application's business rules reactive or implicit.**

The state flow should remain explicit:

```text
User Action
     ↓
Controller
     ↓
Use Case
     ↓
Repository
     ↓
API
     ↓
Server Confirmation
     ↓
Provider State
     ↓
UI
```

For ordinary reads:

```text
Provider
   ↓
Repository
   ↓
API/Cache
   ↓
State
   ↓
UI
```

For critical clinical operations:

```text
Doctor Action
      ↓
Explicit Confirmation
      ↓
Controller
      ↓
Use Case
      ↓
API
      ↓
Server Transaction
      ↓
Confirmed State
      ↓
UI
```

For AI:

```text
Clinical Context
      ↓
AI Provider
      ↓
AI Request
      ↓
AI Result
      ↓
AI Suggestion State
      ↓
Doctor Review/Edit
      ↓
Clinical Domain Action
      ↓
Server Confirmation
```

This architecture keeps Riverpod **predictable, testable, scalable, and safe for a clinical workflow**, while allowing the Flutter application to remain responsive as the product grows from MVP into advanced offline, AI, communication, analytics, and ecosystem features.

---

# 230. Next Document

The logical next document is:

**Document 19 — Complete Flutter UI Component & Design System Specification**

It should define:

- Design system architecture
- Colors
- Typography
- Spacing
- Radius
- Elevation
- Icons
- Buttons
- Inputs
- Dropdowns
- Search
- Cards
- Tables
- Dialogs
- Bottom sheets
- Navigation
- App bars
- Queue components
- Patient components
- Clinical components
- Prescription components
- AI components
- Payment components
- Loading states
- Error states
- Empty states
- Offline indicators
- Accessibility
- Bangla typography
- Responsive layouts
- Component naming
- Widget directory structure
- Reusable component APIs
- Design tokens
- Flutter implementation standards
- Storybook/component preview strategy
- UI testing
- Screen composition rules
- MVP vs advanced components