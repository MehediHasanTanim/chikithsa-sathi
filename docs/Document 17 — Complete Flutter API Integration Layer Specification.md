# Document 17 — Complete Flutter API Integration Layer Specification

**Project:** AI-Powered Chamber & Prescription Management  
**Platform:** Flutter Mobile Application  
**Architecture:** Clean Architecture + Riverpod  
**Backend:** NestJS + Fastify + PostgreSQL + Prisma  
**API:** REST API `/api/v1`  
**Document:** 17  
**Status:** Implementation Ready  
**Target:** MVP + Advanced Architecture

---

# 1. Purpose

This document defines the complete API integration architecture for the Flutter application.

It establishes how Flutter communicates with the backend for:

- Authentication
- Doctor profile
- Chamber management
- Staff/RBAC
- Patients
- Appointments
- Queue
- Clinical encounters
- Vitals
- Diagnoses
- Investigations
- Diagnostic reports
- Medicines
- Prescriptions
- Payments
- Notifications
- AI
- Analytics
- Files
- Exports
- Settings

The API integration layer must provide:

1. Strong typing
2. Centralized networking
3. Secure authentication
4. Automatic token refresh
5. Consistent error handling
6. Request cancellation
7. Retry handling
8. Pagination
9. File upload/download
10. Offline awareness
11. API response mapping
12. Testability
13. Observability
14. Privacy protection
15. Multi-chamber isolation

---

# 2. Architectural Position

The API integration layer belongs primarily inside the **Data Layer**.

```text
Presentation
    │
    ▼
Riverpod Providers / Controllers
    │
    ▼
Domain Use Cases
    │
    ▼
Repository Interfaces
    │
    ▼
Repository Implementations
    │
    ├───────────────┐
    ▼               ▼
Remote Data       Local Data
Source             Source
    │               │
    ▼               ▼
Dio API           Hive / Local DB
    │
    ▼
NestJS REST API
```

The UI must never directly call Dio.

Incorrect:

```dart
ref.read(dioProvider).get('/patients');
```

Correct:

```dart
ref.read(patientRepositoryProvider).getPatients();
```

---

# 3. Technology Stack

Recommended packages:

```yaml
dependencies:
  dio:
  freezed_annotation:
  json_annotation:
  flutter_riverpod:
  riverpod_annotation:
  flutter_secure_storage:
  hive:
  connectivity_plus:
  intl:
  uuid:

dev_dependencies:
  freezed:
  json_serializable:
  riverpod_generator:
  build_runner:
```

Optional:

```yaml
  pretty_dio_logger:
  dio_smart_retry:
  retrofit:
```

For this project, a custom API abstraction around Dio is recommended instead of allowing generated Retrofit APIs to dictate the entire architecture.

---

# 4. API Base URL Architecture

Environment-specific configuration:

```text
Development
https://dev-api.example.com/api/v1

Staging
https://staging-api.example.com/api/v1

Production
https://api.example.com/api/v1
```

The actual URLs must come from environment configuration and must not be hardcoded into feature repositories.

Recommended:

```text
lib/
└── core/
    └── config/
        ├── app_config.dart
        ├── environment.dart
        └── environment_config.dart
```

Example:

```dart
enum AppEnvironment {
  development,
  staging,
  production,
}
```

---

# 5. Directory Structure

Recommended API integration structure:

```text
lib/
├── core/
│   ├── config/
│   │   ├── app_config.dart
│   │   ├── environment.dart
│   │   └── environment_config.dart
│   │
│   ├── network/
│   │   ├── api_client.dart
│   │   ├── dio_factory.dart
│   │   ├── interceptors/
│   │   │   ├── auth_interceptor.dart
│   │   │   ├── request_id_interceptor.dart
│   │   │   ├── logging_interceptor.dart
│   │   │   └── retry_interceptor.dart
│   │   ├── models/
│   │   │   ├── api_response.dart
│   │   │   ├── api_error.dart
│   │   │   └── pagination.dart
│   │   └── exceptions/
│   │       ├── api_exception.dart
│   │       └── network_exception.dart
│   │
│   ├── auth/
│   │   ├── token_storage.dart
│   │   └── session_manager.dart
│   │
│   ├── storage/
│   │   ├── secure_storage.dart
│   │   └── local_storage.dart
│   │
│   └── failures/
│       ├── failure.dart
│       ├── auth_failure.dart
│       ├── network_failure.dart
│       ├── validation_failure.dart
│       └── server_failure.dart
│
└── features/
    ├── patients/
    │   └── data/
    │       ├── datasources/
    │       │   └── patient_remote_data_source.dart
    │       ├── models/
    │       │   └── patient_dto.dart
    │       └── repositories/
    │           └── patient_repository_impl.dart
    │
    ├── appointments/
    ├── queue/
    ├── encounters/
    ├── prescriptions/
    ├── payments/
    └── ai/
```

---

# 6. API Client Responsibilities

`ApiClient` is the central HTTP abstraction.

It must handle:

- GET
- POST
- PATCH
- PUT
- DELETE
- Multipart requests
- Query parameters
- Headers
- Timeout
- Cancellation
- Response parsing
- Error conversion

Example interface:

```dart
abstract class ApiClient {
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? parser,
  });

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? parser,
  });

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? parser,
  });

  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    Options? options,
    CancelToken? cancelToken,
    T Function(dynamic json)? parser,
  });
}
```

---

# 7. API Response Envelope

The backend standard response should be:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "req_123456"
}
```

Flutter should represent this with:

```dart
@freezed
class ApiResponse<T> with _$ApiResponse<T> {
  const factory ApiResponse({
    required bool success,
    T? data,
    Map<String, dynamic>? meta,
    String? requestId,
  }) = _ApiResponse<T>;
}
```

---

# 8. Error Response

Standard backend error:

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient was not found.",
    "details": []
  },
  "requestId": "req_123456"
}
```

Flutter model:

```dart
@freezed
class ApiError with _$ApiError {
  const factory ApiError({
    required String code,
    required String message,
    List<ApiErrorDetail>? details,
  }) = _ApiError;
}
```

---

# 9. Domain Failure Model

UI should not know about HTTP status codes.

Instead:

```text
HTTP 401
   ↓
UnauthorizedFailure
   ↓
Session Manager
   ↓
Login
```

Recommended failure types:

```dart
sealed class Failure {}

class UnauthorizedFailure extends Failure {}

class ForbiddenFailure extends Failure {}

class ValidationFailure extends Failure {
  final Map<String, List<String>> fields;
}

class NotFoundFailure extends Failure {}

class ConflictFailure extends Failure {}

class RateLimitFailure extends Failure {}

class NetworkFailure extends Failure {}

class TimeoutFailure extends Failure {}

class ServerFailure extends Failure {}

class UnknownFailure extends Failure {}
```

---

# 10. HTTP Status Mapping

| HTTP | Domain Failure |
|---|---|
| 400 | Validation/BadRequest |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | NotFound |
| 409 | Conflict |
| 422 | Validation |
| 429 | RateLimit |
| 500 | Server |
| 502 | Server |
| 503 | Server |
| timeout | Timeout |
| no connection | Network |

---

# 11. Auth Token Architecture

Authentication uses:

```text
Access Token
Refresh Token
```

Storage:

```text
flutter_secure_storage
```

Never store authentication tokens in:

- Hive
- SharedPreferences
- plain files
- application logs

Recommended abstraction:

```dart
abstract class TokenStorage {
  Future<String?> getAccessToken();
  Future<String?> getRefreshToken();

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  });

  Future<void> clear();
}
```

---

# 12. Authentication Interceptor

Every authenticated request automatically receives:

```http
Authorization: Bearer <access-token>
```

The interceptor must:

1. Read access token.
2. Add Authorization header.
3. Send request.
4. Detect 401.
5. Attempt refresh.
6. Retry original request.
7. If refresh fails, clear session.
8. Navigate user to login.

---

# 13. Concurrent Token Refresh

This is critical.

Suppose five API calls simultaneously receive:

```text
401
401
401
401
401
```

Flutter must **not** perform five refresh requests.

Instead:

```text
Request A ─┐
Request B ─┤
Request C ─┼──> Refresh Lock ──> One Refresh Request
Request D ─┤
Request E ─┘
                       │
                       ▼
                 New Access Token
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
           A           B          C...
```

Implement a shared refresh future/lock.

Conceptually:

```dart
Future<void>? _refreshFuture;

Future<void> refreshToken() {
  if (_refreshFuture != null) {
    return _refreshFuture!;
  }

  _refreshFuture = _performRefresh();

  return _refreshFuture!.whenComplete(() {
    _refreshFuture = null;
  });
}
```

---

# 14. Prevent Infinite Refresh Loops

The refresh endpoint itself must not trigger another refresh.

Use a request option:

```dart
Options(
  extra: {
    'skipAuthRefresh': true,
  },
)
```

Interceptor logic:

```text
401
 │
 ├── skipAuthRefresh = true?
 │       │
 │       └── Yes → Fail
 │
 └── No → Refresh
```

Maximum one retry of the original request.

---

# 15. Session Expiration

If refresh token is invalid:

```text
Refresh → 401
      ↓
Clear tokens
      ↓
Clear user session
      ↓
Clear protected cache
      ↓
Reset navigation
      ↓
Login Screen
```

The application must not leave the user on a protected screen with an invalid session.

---

# 16. Request ID / Correlation ID

Every request should have a unique request ID.

Header:

```http
X-Request-ID: <uuid>
```

The backend returns:

```json
{
  "requestId": "..."
}
```

The request ID should be available for:

- debugging
- support
- audit correlation
- production diagnostics

Do not expose sensitive request data in support logs.

---

# 17. Logging Rules

Development logging may include:

```text
GET /patients
Status: 200
Duration: 182ms
Request ID: ...
```

Never log:

```text
Authorization
Access token
Refresh token
Patient clinical notes
Diagnosis details
Prescription contents
AI conversations
Medical reports
Private file URLs
Personal health information
```

Production should use structured logging with sensitive fields redacted.

---

# 18. Timeout Configuration

Recommended initial configuration:

```text
Connect timeout: 10 seconds
Receive timeout: 30 seconds
Send timeout: 30 seconds
```

AI requests may require longer server-side processing.

For asynchronous AI requests, do not simply increase the HTTP timeout indefinitely.

Use:

```text
POST /ai/...
       ↓
requestId
       ↓
GET /ai/requests/:requestId
```

---

# 19. Retry Policy

Retries should be selective.

Retry:

- connection failures
- temporary network failures
- 502
- 503
- 504

Do not automatically retry:

- 400
- 401
- 403
- 404
- 409
- validation errors
- clinical mutation requests unless idempotency is guaranteed

For critical mutation endpoints, retry only when an idempotency key is available.

---

# 20. Idempotency

Critical mutation requests should support:

```http
Idempotency-Key: <uuid>
```

Use for:

- appointment creation
- queue check-in
- payment creation
- prescription finalization
- file completion
- exports
- other retry-sensitive operations

Client helper:

```dart
String generateIdempotencyKey() {
  return const Uuid().v4();
}
```

The same key must be reused when retrying the same logical operation.

A new key represents a new operation.

---

# 21. Optimistic Concurrency

Clinical records must not be silently overwritten.

Where supported:

```http
If-Match: <version>
```

or:

```json
{
  "version": 4,
  "notes": "Updated notes"
}
```

If backend returns:

```http
409 Conflict
```

Flutter should show:

> This record was updated by another user. Please review the latest version before saving your changes.

Never automatically overwrite clinical data after a conflict.

---

# 22. Pagination

List APIs should use a common pagination model.

Example:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 125,
    "hasNext": true
  }
}
```

Flutter:

```dart
@freezed
class PaginationMeta with _$PaginationMeta {
  const factory PaginationMeta({
    int? page,
    int? pageSize,
    int? total,
    bool? hasNext,
    String? nextCursor,
  }) = _PaginationMeta;
}
```

Repositories should expose domain-level pagination rather than raw API metadata.

---

# 23. Search Requests

Patient and medicine search must support:

- Bangla
- English
- phone number
- patient ID
- medicine name
- partial matching

Search UX:

```text
User types
   ↓
Debounce ~300ms
   ↓
Cancel previous request
   ↓
Send new request
   ↓
Display results
```

Use Dio cancellation.

```dart
final cancelToken = CancelToken();
```

When a newer search begins:

```dart
cancelToken.cancel();
```

This prevents stale search responses from replacing newer results.

---

# 24. Date and Time

Backend stores timestamps in UTC.

Flutter receives:

```text
UTC
```

and displays:

```text
Asia/Dhaka
```

Use:

```dart
DateTime.parse(value).toLocal();
```

However, business-date fields such as:

```text
queueDate
```

must not be blindly converted from UTC.

The backend defines chamber-local business dates.

Example:

```text
queueDate = 2026-09-04
```

This represents the chamber's business date, not an arbitrary UTC timestamp.

---

# 25. Date Serialization

Use ISO-8601:

```text
2026-09-04T15:30:00Z
```

Do not send:

```text
09/04/26
```

or locale-dependent strings.

Recommended:

```dart
String toApiDateTime(DateTime value) {
  return value.toUtc().toIso8601String();
}
```

---

# 26. Bangladesh Phone Number Handling

UI may accept:

```text
01712345678
+8801712345678
8801712345678
```

The API layer should normalize the number according to the backend's canonical format.

Recommended canonical representation:

```text
+8801712345678
```

Validation belongs to both:

- Flutter UX validation
- backend validation

Backend remains authoritative.

---

# 27. Currency

All financial values from API should be represented using decimal-safe types.

Do not convert monetary values to floating-point calculations.

For display:

```text
৳ 1,500.00
```

The backend should remain the source of truth for calculated amounts.

Flutter should not recalculate authoritative payment totals unless explicitly required for UI previews.

---

# 28. DTO Architecture

DTOs represent API structures.

Example:

```dart
@freezed
class PatientDto with _$PatientDto {
  const factory PatientDto({
    required String id,
    required String patientNumber,
    required String fullName,
    String? phone,
    DateTime? dateOfBirth,
    String? gender,
  }) = _PatientDto;

  factory PatientDto.fromJson(Map<String, dynamic> json) =>
      _$PatientDtoFromJson(json);
}
```

DTOs should never be passed directly to UI.

Mapping:

```text
JSON
 ↓
PatientDto
 ↓
Patient Entity
 ↓
Presentation
```

---

# 29. DTO → Domain Mapping

Example:

```dart
extension PatientDtoMapper on PatientDto {
  Patient toDomain() {
    return Patient(
      id: id,
      patientNumber: patientNumber,
      fullName: fullName,
      phone: phone,
      dateOfBirth: dateOfBirth,
      gender: gender,
    );
  }
}
```

Benefits:

- API changes remain isolated
- domain remains stable
- UI remains independent
- easier testing

---

# 30. Remote Data Source

Each feature should have a remote data source.

Example:

```dart
abstract class PatientRemoteDataSource {
  Future<PatientDto> getPatient(String patientId);

  Future<List<PatientDto>> searchPatients(
    String query,
  );

  Future<PaginatedResult<PatientDto>> getPatients({
    int page = 1,
    int pageSize = 20,
  });

  Future<PatientDto> createPatient(
    CreatePatientRequest request,
  );
}
```

Implementation:

```dart
class PatientRemoteDataSourceImpl
    implements PatientRemoteDataSource {

  final ApiClient apiClient;

  PatientRemoteDataSourceImpl(this.apiClient);

  @override
  Future<PatientDto> getPatient(String patientId) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/patients/$patientId',
    );

    return PatientDto.fromJson(response.data!);
  }
}
```

---

# 31. Repository

Repository hides the data-source implementation.

```dart
abstract class PatientRepository {
  Future<Result<Patient>> getPatient(String patientId);

  Future<Result<List<Patient>>> searchPatients(String query);

  Future<Result<PaginatedResult<Patient>>> getPatients();

  Future<Result<Patient>> createPatient(
    CreatePatientRequest request,
  );
}
```

Implementation:

```dart
class PatientRepositoryImpl implements PatientRepository {
  final PatientRemoteDataSource remote;

  PatientRepositoryImpl(this.remote);

  @override
  Future<Result<Patient>> getPatient(String patientId) async {
    try {
      final dto = await remote.getPatient(patientId);
      return Success(dto.toDomain());
    } on ApiException catch (e) {
      return FailureResult(e.toFailure());
    }
  }
}
```

---

# 32. Result Pattern

The application can use:

```dart
sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  final T data;

  const Success(this.data);
}

class FailureResult<T> extends Result<T> {
  final Failure failure;

  const FailureResult(this.failure);
}
```

This avoids throwing raw HTTP exceptions into the presentation layer.

---

# 33. Authentication API Integration

Backend endpoints:

```text
POST /auth/register
POST /auth/verify-otp
POST /auth/resend-otp
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

Flutter data source:

```text
auth_remote_data_source.dart
```

Repository:

```text
auth_repository.dart
auth_repository_impl.dart
```

Use cases:

```text
register
verifyOtp
resendOtp
login
refreshSession
logout
```

---

# 34. User API Integration

Endpoints:

```text
GET /users/me
PATCH /users/me
PATCH /users/me/preferences
```

Used for:

- current user
- profile
- language
- notification preferences
- application preferences

---

# 35. Doctor API Integration

Endpoints:

```text
GET /doctors/me
PATCH /doctors/me

GET /doctors/me/professional-profile
PATCH /doctors/me/professional-profile
```

Professional information should remain separate from general user profile.

---

# 36. Verification API

Endpoints:

```text
POST /verification/submit
GET /verification/status
```

Verification state:

```text
NOT_SUBMITTED
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
RESUBMITTED
```

The UI should map these states to presentation states.

---

# 37. Chamber API Integration

Endpoints:

```text
POST /chambers
GET /chambers
GET /chambers/:chamberId
PATCH /chambers/:chamberId
POST /chambers/:chamberId/activate
POST /chambers/:chamberId/deactivate
```

Providers:

```text
chambersProvider
selectedChamberProvider
chamberDetailsProvider
chamberControllerProvider
```

Every chamber-scoped request must include the correct chamber context.

---

# 38. Selected Chamber Header

For chamber-scoped endpoints, the application should determine the active chamber from application state.

Do not rely on a user-editable arbitrary chamber ID.

Flow:

```text
Authenticated User
       ↓
Memberships
       ↓
Selected Chamber
       ↓
Permission Check
       ↓
API Request
```

The backend remains authoritative for authorization.

---

# 39. Schedule API

Endpoints:

```text
GET /chambers/:chamberId/schedules
POST /chambers/:chamberId/schedules
PATCH /schedules/:scheduleId
DELETE /schedules/:scheduleId
```

Schedule models must support:

- day of week
- start/end time
- breaks
- enabled/disabled
- chamber association
- doctor association where applicable

---

# 40. Staff API

Endpoints:

```text
GET /chambers/:chamberId/staff
POST /chambers/:chamberId/staff/invite
PATCH /staff/:membershipId
DELETE /staff/:membershipId
POST /staff/:membershipId/resend-invitation
```

Frontend must not assume that a user can perform an operation simply because the button is visible.

Permission checks should exist at:

1. UI level
2. Riverpod/controller level
3. backend level

Backend remains authoritative.

---

# 41. Patient API Integration

Endpoints:

```text
POST /patients
GET /patients
GET /patients/search
GET /patients/:patientId
PATCH /patients/:patientId

POST /patients/:patientId/chambers

GET /patients/:patientId/timeline

GET /patients/:patientId/allergies
POST /patients/:patientId/allergies
DELETE /patients/:patientId/allergies/:allergyId

GET /patients/:patientId/conditions
POST /patients/:patientId/conditions
```

Patient repository should expose domain operations such as:

```text
createPatient
searchPatients
getPatient
updatePatient
getTimeline
getAllergies
addAllergy
removeAllergy
getConditions
addCondition
```

---

# 42. Patient Search Optimization

Patient search is one of the most frequently used APIs.

Requirements:

- debounce
- cancellation
- caching recent searches
- minimum query length
- pagination where applicable
- Bangla/English support

Example:

```text
Query < 2 characters
    ↓
No API request

Query >= 2
    ↓
Debounce
    ↓
API
```

For phone numbers, allow shorter input if the backend supports it.

---

# 43. Appointment API

Endpoints:

```text
POST /appointments
GET /appointments
GET /appointments/:appointmentId
PATCH /appointments/:appointmentId

POST /appointments/:appointmentId/reschedule
POST /appointments/:appointmentId/cancel
POST /appointments/:appointmentId/confirm
```

Appointment repository should support:

```text
create
list
details
update
confirm
reschedule
cancel
```

Appointment creation must use idempotency where supported.

---

# 44. Queue API

Endpoints:

```text
GET /queue/today
POST /queue/check-in
POST /queue/:queueEntryId/call
POST /queue/:queueEntryId/recall
POST /queue/:queueEntryId/skip
POST /queue/:queueEntryId/start
POST /queue/:queueEntryId/complete
```

Queue mutation rule:

> Never treat a queue mutation as successful until the server confirms it.

Incorrect:

```text
Tap "Call"
↓
Immediately move card to CALLED
```

Preferred:

```text
Tap "Call"
↓
Loading
↓
API
↓
Success
↓
Update queue state
```

---

# 45. Queue Polling

MVP can use controlled polling.

Example:

```text
Every 5–10 seconds while queue screen is active
```

Avoid aggressive polling.

Future:

```text
WebSocket / Server-Sent Events
```

can replace polling.

---

# 46. Encounter API

Endpoints:

```text
POST /encounters
GET /encounters/:encounterId
PATCH /encounters/:encounterId

POST /encounters/:encounterId/start
POST /encounters/:encounterId/ready-for-review
POST /encounters/:encounterId/complete
POST /encounters/:encounterId/lock
```

Encounter status:

```text
DRAFT
IN_PROGRESS
READY_FOR_REVIEW
COMPLETED
LOCKED
```

Flutter must display the current state and restrict actions accordingly.

---

# 47. Clinical Notes API

```text
POST /encounters/:encounterId/notes
GET /encounters/:encounterId/notes
PATCH /notes/:noteId
```

Auto-save should use controlled debouncing.

Example:

```text
Doctor types
    ↓
Dirty state
    ↓
1–2 second debounce
    ↓
Save draft
```

Do not send an API request for every keystroke.

---

# 48. Vitals API

```text
POST /encounters/:encounterId/vitals
GET /encounters/:encounterId/vitals
PATCH /vitals/:vitalId
GET /patients/:patientId/vitals
```

The API layer must preserve numeric precision.

Examples:

```text
weight
height
temperature
pulse
SpO2
systolic BP
diastolic BP
BMI
```

---

# 49. Diagnosis API

```text
GET /diagnoses/search
POST /encounters/:encounterId/diagnoses
DELETE /encounters/:encounterId/diagnoses/:diagnosisId
```

Diagnosis search should support:

- ICD code
- English name
- Bangla name
- partial matching

---

# 50. Investigation API

```text
GET /investigations/catalog
POST /encounters/:encounterId/investigations
GET /encounters/:encounterId/investigations
PATCH /investigations/:investigationId
```

Use typed DTOs.

Do not treat catalog data as arbitrary strings in the presentation layer.

---

# 51. Diagnostic Report API

```text
POST /encounters/:encounterId/reports
GET /encounters/:encounterId/reports
GET /reports/:reportId
POST /reports/:reportId/analyze
```

Report analysis may be asynchronous.

Example:

```text
POST /reports/:id/analyze
        ↓
requestId
        ↓
GET /ai/requests/:requestId
```

---

# 52. File Upload Architecture

Files must not normally be uploaded through the application backend.

Preferred flow:

```text
Flutter
   │
   ▼
POST /files/upload-url
   │
   ▼
Pre-signed URL
   │
   ▼
Object Storage
   │
   ▼
POST /files/complete
   │
   ▼
File Metadata
```

Benefits:

- lower backend load
- better upload performance
- scalable object storage
- resumability potential

---

# 53. File Upload API

```text
POST /files/upload-url
POST /files/complete
GET /files/:fileId
DELETE /files/:fileId
```

Upload metadata:

```text
fileName
contentType
fileSize
purpose
entityType
entityId
```

Validate:

- MIME type
- size
- allowed purpose
- authorization

Both client and backend must validate files.

Backend remains authoritative.

---

# 54. Prescription API

Endpoints:

```text
POST /encounters/:encounterId/prescriptions
GET /prescriptions/:prescriptionId
PATCH /prescriptions/:prescriptionId

POST /prescriptions/:prescriptionId/items
PATCH /prescriptions/:prescriptionId/items/:itemId
DELETE /prescriptions/:prescriptionId/items/:itemId

POST /prescriptions/:prescriptionId/review
POST /prescriptions/:prescriptionId/finalize
POST /prescriptions/:prescriptionId/amend

GET /prescriptions/:prescriptionId/history
GET /prescriptions/:prescriptionId/preview
GET /prescriptions/:prescriptionId/pdf
POST /prescriptions/:prescriptionId/deliver
```

---

# 55. Prescription State Handling

```text
DRAFT
  ↓
AI_ASSISTED
  ↓
REVIEW_REQUIRED
  ↓
FINALIZED
  ↓
DELIVERED
```

Flutter must treat `FINALIZED` as immutable/read-only.

---

# 56. Prescription Finalization

Finalization is a critical mutation.

Flow:

```text
Review
 ↓
Doctor confirms
 ↓
POST /prescriptions/:id/finalize
 ↓
Server transaction
 ↓
Success
 ↓
Read-only prescription
```

Never:

```text
Doctor taps finalize
↓
UI immediately marks finalized
```

The server must confirm finalization.

Use an idempotency key where supported.

---

# 57. AI Prescription Draft API

Endpoint:

```text
POST /ai/prescription-draft
```

AI output must be represented as:

```text
AI Generated
Review Required
```

The API layer must not provide any method such as:

```dart
ai.finalizePrescription();
```

AI can only generate a draft.

Finalization remains a prescription-domain operation requiring explicit doctor action.

---

# 58. Medicine API

```text
GET /medicines/search
GET /medicines/:medicineId

GET /doctors/me/medicine-favorites
POST /doctors/me/medicine-favorites
DELETE /doctors/me/medicine-favorites/:medicineId
```

Search supports:

- brand name
- generic name
- Bangla
- English
- manufacturer
- dosage form
- strength

---

# 59. Payment API

```text
POST /payments
GET /payments
GET /payments/:paymentId
GET /payments/:paymentId/receipt
POST /payments/:paymentId/refund
```

Payment status:

```text
PENDING
PAID
PARTIALLY_REFUNDED
REFUNDED
```

Payment creation should use idempotency.

---

# 60. Receipt API

Receipt may return:

```text
receipt metadata
```

or a downloadable document.

For PDF:

```text
GET /payments/:paymentId/receipt
```

should return metadata or a signed download URL according to backend contract.

---

# 61. Notifications API

```text
GET /notifications
GET /notifications/unread-count
POST /notifications/:notificationId/read
POST /notifications/read-all
```

Notifications should be cached locally for short periods.

Read operations should be server-confirmed.

---

# 62. AI API Architecture

Endpoints:

```text
POST /ai/patient-summary
POST /ai/clinical-chat
POST /ai/prescription-draft
POST /ai/report-analysis
GET /ai/requests/:requestId
```

Future:

```text
POST /ai/voice-note
```

AI repository:

```text
AiRepository
    │
    ├── generatePatientSummary
    ├── clinicalChat
    ├── generatePrescriptionDraft
    ├── analyzeReport
    └── getRequestStatus
```

---

# 63. AI Async Request Handling

If API returns:

```json
{
  "requestId": "ai_req_123",
  "status": "PROCESSING"
}
```

Riverpod should maintain:

```text
AiRequestState
```

States:

```text
idle
submitting
processing
success
failure
cancelled
```

Polling:

```text
GET /ai/requests/:requestId
```

Use exponential/backoff-aware polling rather than aggressive polling.

---

# 64. AI Privacy

Do not log:

- patient context
- diagnosis
- prescription
- AI prompt
- AI response

unless specifically required by secure audit architecture.

AI requests should use minimum necessary clinical context.

---

# 65. Analytics API

```text
GET /analytics/dashboard
GET /analytics/revenue
GET /analytics/patients
GET /analytics/appointments
```

Analytics requests are read-only.

Caching can be more aggressive than clinical mutations.

---

# 66. Audit API

```text
GET /chambers/:chamberId/audit-logs
```

Audit logs should be treated as immutable historical information.

Flutter must not expose modification/delete operations.

---

# 67. Export API

```text
POST /exports
GET /exports/:exportId
```

Exports are asynchronous.

Flow:

```text
POST /exports
     ↓
Export ID
     ↓
PROCESSING
     ↓
GET /exports/:id
     ↓
COMPLETED
     ↓
Download
```

---

# 68. Health APIs

```text
GET /health
GET /health/live
GET /health/ready
```

These are primarily used by:

- monitoring
- diagnostics
- environment validation

They should not expose sensitive infrastructure information.

---

# 69. Caching Strategy

Not all API responses should be cached equally.

### Cache aggressively

```text
Medicine catalog
Diagnosis catalog
Investigation catalog
User preferences
Doctor profile
Chamber configuration
```

### Cache moderately

```text
Patient list
Appointment list
Analytics
Notifications
```

### Do not blindly cache

```text
Queue mutations
Encounter mutations
Prescription finalization
Payment creation
AI clinical requests
```

---

# 70. Cache Invalidation

After mutation:

```text
PATCH Patient
   ↓
Invalidate patient details
Invalidate patient list
Invalidate patient search if needed
```

For prescription:

```text
Finalize prescription
   ↓
Invalidate prescription
Invalidate encounter
Invalidate patient timeline
Invalidate relevant dashboard data
```

Riverpod providers should be invalidated deliberately.

---

# 71. Offline Awareness

Connectivity state:

```text
online
offline
unknown
```

Use:

```text
connectivity_plus
```

But connectivity status is only a signal.

A device can have Wi-Fi without Internet access.

Therefore API errors remain authoritative.

---

# 72. Offline Read Strategy

MVP:

```text
Cache recently accessed data
```

Examples:

- recent patients
- recent appointments
- chamber configuration
- medicine favorites

Advanced:

```text
Offline-first clinical workflow
        +
Sync engine
```

must be implemented only after conflict rules are established.

---

# 73. Offline Mutation Strategy

Do not automatically queue all clinical mutations.

Especially dangerous:

```text
Prescription finalization
Payment creation
Queue completion
Encounter completion
```

These require carefully designed idempotent offline workflows.

---

# 74. Request Cancellation

Cancellation is useful for:

- search
- AI requests
- report loading
- rapidly changing filters
- navigation away from expensive requests

Repositories should optionally accept a cancellation token where appropriate.

---

# 75. Repository Cancellation Example

```dart
Future<List<Patient>> searchPatients(
  String query, {
  CancelToken? cancelToken,
}) async {
  ...
}
```

---

# 76. API Query Parameters

Use typed query objects.

Example:

```dart
@freezed
class PatientQuery with _$PatientQuery {
  const factory PatientQuery({
    String? search,
    int? page,
    int? pageSize,
    String? chamberId,
  }) = _PatientQuery;
}
```

Avoid:

```dart
Map<String, dynamic> everywhere
```

inside domain logic.

Maps are acceptable at the network boundary.

---

# 77. Sorting

Common parameters:

```text
sortBy
sortOrder
```

Example:

```text
GET /patients?sortBy=createdAt&sortOrder=desc
```

Only supported fields should be exposed through typed enums.

---

# 78. Filtering

Example:

```text
AppointmentFilter
QueueFilter
PaymentFilter
PatientFilter
```

These belong in the data/domain boundary rather than being scattered across UI widgets.

---

# 79. API Error Mapping

Example backend:

```json
{
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "Appointment slot is already booked."
  }
}
```

Flutter maps:

```text
APPOINTMENT_CONFLICT
        ↓
ConflictFailure
        ↓
AppointmentConflictException
        ↓
UI message
```

Do not display raw backend exception text blindly when a safer localized message is available.

---

# 80. Localization of API Errors

Backend error code:

```text
PATIENT_DUPLICATE
```

Flutter localization:

```text
patient_duplicate_title
patient_duplicate_message
```

This allows:

```text
English
বাংলা
```

without changing backend error semantics.

---

# 81. API Error Code Registry

Maintain a shared document:

```text
docs/api/error-codes.md
```

Example:

```text
AUTH_INVALID_CREDENTIALS
AUTH_OTP_EXPIRED
AUTH_SESSION_EXPIRED

PATIENT_NOT_FOUND
PATIENT_DUPLICATE

APPOINTMENT_CONFLICT
APPOINTMENT_NOT_FOUND

QUEUE_INVALID_STATE

ENCOUNTER_INVALID_STATE

PRESCRIPTION_ALREADY_FINALIZED
PRESCRIPTION_CONFLICT

PAYMENT_ALREADY_PAID
PAYMENT_CONFLICT

AI_REQUEST_FAILED
AI_PROVIDER_UNAVAILABLE
```

---

# 82. API Contract Generation

Backend should expose OpenAPI.

Flutter development should use the OpenAPI specification as the contract reference.

Recommended CI flow:

```text
Backend change
    ↓
Generate OpenAPI
    ↓
Validate API contract
    ↓
Flutter integration tests
    ↓
CI
```

The Flutter API layer should not independently invent endpoint contracts.

---

# 83. API Versioning

Base URL:

```text
/api/v1
```

Future:

```text
/api/v2
```

Feature repositories should not hardcode version strings.

Use:

```dart
AppConfig.apiBaseUrl
```

---

# 84. Environment Configuration

Recommended:

```text
.env.development
.env.staging
.env.production
```

Never commit production secrets.

Build configurations:

```text
flutter run --flavor development
flutter run --flavor staging
flutter build apk --flavor production
```

---

# 85. Secure Configuration

Never place:

- backend secrets
- database credentials
- private API keys
- service account credentials

inside the Flutter application.

Remember:

> Anything shipped inside a mobile application should be considered discoverable.

---

# 86. API Client Provider

Riverpod:

```dart
final apiClientProvider = Provider<ApiClient>((ref) {
  return DioApiClient(
    dio: ref.watch(dioProvider),
  );
});
```

Repositories depend on this provider.

---

# 87. Dio Provider

```dart
final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: config.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
    ),
  );

  return dio;
});
```

Interceptors are registered centrally.

---

# 88. Repository Provider Example

```dart
final patientRepositoryProvider = Provider<PatientRepository>((ref) {
  return PatientRepositoryImpl(
    remote: ref.watch(patientRemoteDataSourceProvider),
  );
});
```

Remote provider:

```dart
final patientRemoteDataSourceProvider =
    Provider<PatientRemoteDataSource>((ref) {
  return PatientRemoteDataSourceImpl(
    ref.watch(apiClientProvider),
  );
});
```

---

# 89. Provider Dependency Graph

```text
appConfigProvider
       ↓
dioProvider
       ↓
apiClientProvider
       ↓
patientRemoteDataSourceProvider
       ↓
patientRepositoryProvider
       ↓
patient use case
       ↓
Riverpod controller
       ↓
UI
```

This makes testing straightforward.

---

# 90. Authentication Provider Graph

```text
secureStorageProvider
        ↓
tokenStorageProvider
        ↓
sessionManagerProvider
        ↓
authRepositoryProvider
        ↓
authControllerProvider
        ↓
authState
```

---

# 91. Session State

Recommended:

```dart
sealed class SessionState {
  const SessionState();
}

class SessionUnknown extends SessionState {}

class SessionAuthenticated extends SessionState {
  final User user;
}

class SessionUnauthenticated extends SessionState {}

class SessionExpired extends SessionState {}
```

Application routing listens to session state.

---

# 92. API Request Lifecycle

Every API request follows:

```text
UI Action
   ↓
Controller
   ↓
Use Case
   ↓
Repository
   ↓
Remote Data Source
   ↓
ApiClient
   ↓
Dio
   ↓
Interceptor
   ↓
HTTP
   ↓
Backend
   ↓
JSON
   ↓
DTO
   ↓
Domain Entity
   ↓
Controller
   ↓
UI
```

---

# 93. API Response Lifecycle

```text
HTTP Response
     ↓
Dio
     ↓
ApiResponse
     ↓
DTO
     ↓
Domain Mapper
     ↓
Domain Entity
     ↓
Riverpod State
     ↓
UI
```

---

# 94. Standard Repository Error Flow

```text
DioException
    ↓
ApiException
    ↓
FailureMapper
    ↓
Failure
    ↓
Repository Result
    ↓
Controller
    ↓
UI
```

Never expose:

```text
DioException
```

directly to widgets.

---

# 95. Loading State

Each API-driven screen should distinguish:

```text
initial loading
refreshing
loading next page
submitting
retrying
```

Example:

```dart
class PatientListState {
  final bool isInitialLoading;
  final bool isRefreshing;
  final bool isLoadingMore;
  final bool isSubmitting;
  final Failure? failure;
}
```

---

# 96. Pull-to-Refresh

Refresh flow:

```text
User pulls
 ↓
invalidate provider / repository refresh
 ↓
API
 ↓
update state
```

Existing data should generally remain visible while refreshing.

Avoid blanking the entire screen.

---

# 97. Empty State

Differentiate:

```text
No data exists
```

from:

```text
API failed
```

and:

```text
Loading
```

These are separate states.

---

# 98. Error Retry

Every recoverable API screen should provide:

```text
Retry
```

Examples:

```text
Unable to load patients.
[Retry]
```

For a clinical workflow, preserve unsaved local data before retrying.

---

# 99. API Mocking

Development should support a mock API implementation.

Architecture:

```text
Repository
   │
   ├── RemoteDataSource
   │
   └── MockDataSource
```

Riverpod overrides can inject mocks.

Example:

```dart
ProviderScope(
  overrides: [
    patientRepositoryProvider.overrideWithValue(
      FakePatientRepository(),
    ),
  ],
)
```

---

# 100. Contract Testing

Critical API contracts should be tested.

Example:

```text
Flutter expects:
POST /patients

Backend provides:
POST /patients
```

Validate:

- HTTP method
- URL
- request fields
- required fields
- response fields
- error structure
- status codes

---

# 101. Authentication Tests

Must test:

### Login

```text
valid credentials → success
invalid credentials → failure
```

### OTP

```text
valid OTP → success
expired OTP → failure
invalid OTP → failure
```

### Refresh

```text
valid refresh → new token
invalid refresh → logout
```

### Concurrent refresh

```text
5 simultaneous 401s
→ exactly 1 refresh request
```

---

# 102. Patient API Tests

Test:

```text
create patient
search patient
get patient
update patient
duplicate patient
timeline
allergies
conditions
```

Also:

```text
Bangla search
English search
phone search
patient ID search
```

---

# 103. Appointment API Tests

Test:

```text
create
confirm
reschedule
cancel
list
details
conflict
```

Critical:

```text
double-submit
network timeout
retry
idempotency
```

---

# 104. Queue API Tests

Test:

```text
check-in
call
recall
skip
start
complete
```

Also invalid transitions:

```text
COMPLETED → CALL
WAITING → COMPLETE
```

Backend should reject them.

Flutter should map errors correctly.

---

# 105. Clinical API Tests

Test:

```text
create encounter
start
update notes
save vitals
add diagnosis
add investigation
complete
lock
```

Ensure state transitions are respected.

---

# 106. Prescription API Tests

Critical tests:

```text
create draft
add medicine
update medicine
review
finalize
deliver
amend
history
PDF
```

Security test:

```text
AI draft cannot finalize prescription.
```

---

# 107. Payment API Tests

Test:

```text
create payment
payment details
receipt
refund
duplicate payment
payment conflict
```

Money values should be verified for precision.

---

# 108. AI API Tests

Test:

```text
patient summary
clinical chat
prescription draft
report analysis
request status
```

Test:

```text
AI unavailable
AI timeout
AI malformed response
AI unsafe response
AI authorization failure
```

---

# 109. File API Tests

Test:

```text
upload-url
upload
complete
download
delete
invalid type
file too large
expired signed URL
```

---

# 110. API Integration Test Environment

Recommended environments:

```text
Unit Tests
↓
Mock API
↓
Integration Tests
↓
Staging API
↓
Production Smoke Tests
```

Do not run automated destructive tests against production.

---

# 111. Production Smoke Tests

After deployment:

```text
GET /health
POST login
GET /users/me
GET chambers
GET patient search
GET queue
```

Avoid creating clinical or financial records during production smoke tests unless a dedicated test tenant exists.

---

# 112. Network Performance

Target:

```text
API request overhead < acceptable UX threshold
```

Optimize:

- response payload size
- pagination
- compression
- caching
- unnecessary requests
- duplicate requests
- aggressive polling

---

# 113. Duplicate Request Prevention

Avoid:

```text
Widget rebuild
↓
API call
↓
Widget rebuild
↓
API call
```

Use Riverpod providers and explicit controller actions.

---

# 114. Request Deduplication

For read operations:

```text
Two consumers request same patient
            ↓
Provider/cache
            ↓
One network request
```

This is particularly useful for:

- patient details
- chamber details
- current doctor
- dashboard data

---

# 115. Background API Work

Suitable for background processing:

```text
notifications
analytics refresh
exports
AI polling
file processing
```

Do not perform unnecessary background clinical writes.

---

# 116. API Security Principles

Flutter must:

- use HTTPS
- store tokens securely
- validate certificates using platform defaults
- avoid secrets
- avoid sensitive logging
- protect local caches
- clear session data on logout
- avoid screenshots of sensitive screens where appropriate

Backend remains the security boundary.

---

# 117. Logout

Logout should:

```text
POST /auth/logout
     ↓
Clear access token
Clear refresh token
Clear protected cache
Reset selected chamber
Reset providers
Reset navigation
```

If logout API fails because the session already expired, local logout should still complete.

---

# 118. Protected Cache Clearing

On logout, remove:

```text
patient cache
appointment cache
queue cache
clinical draft cache
AI context cache
private notifications
user profile cache
```

Do not leave patient information accessible to another device user.

---

# 119. Sensitive Local Data

Any locally stored clinical information should be evaluated carefully.

MVP should minimize persistence.

If clinical records are cached:

- encrypt where appropriate
- define retention period
- clear on logout/session expiration
- never store unnecessary clinical information
- document local-data security

---

# 120. API + Local Data Strategy

Recommended repository architecture:

```text
Repository
   │
   ├── Remote
   │
   └── Local
```

Example:

```dart
Future<Result<Patient>> getPatient(String id) async {
  try {
    final patient = await remote.getPatient(id);

    await local.cachePatient(patient);

    return Success(patient.toDomain());
  } catch (...) {
    return local.getCachedPatient(id);
  }
}
```

Fallback should only be used for explicitly cacheable/read-only data.

---

# 121. Clinical Data Safety Rule

Never silently substitute stale local clinical data for authoritative server state when the user is making a critical clinical decision.

Example:

```text
Cached prescription
      ≠
Current finalized prescription
```

The UI should indicate stale/offline state when relevant.

---

# 122. API Connectivity State

Global provider:

```dart
final connectivityProvider =
    StreamProvider<ConnectivityStatus>((ref) {
  ...
});
```

Possible state:

```text
online
offline
unknown
```

Display subtle global indicator:

```text
Offline
```

without unnecessarily blocking cached read operations.

---

# 123. API Retry UX

Automatic retry:

```text
temporary infrastructure/network failures
```

Manual retry:

```text
critical clinical operations
```

Never repeatedly retry a payment or prescription mutation without idempotency.

---

# 124. API Client Coding Standards

Rules:

1. No direct Dio calls from UI.
2. No raw URLs in widgets.
3. No DTOs in UI.
4. No HTTP status handling in widgets.
5. No authentication logic in repositories.
6. No token storage outside auth layer.
7. No sensitive logs.
8. No duplicated base URL configuration.
9. No duplicated error parsing.
10. No hardcoded chamber IDs.
11. No optimistic critical clinical mutations.
12. No AI direct prescription finalization.

---

# 125. Example Complete Feature Flow

Patient details:

```text
PatientScreen
      ↓
patientDetailsProvider
      ↓
GetPatientUseCase
      ↓
PatientRepository
      ↓
PatientRemoteDataSource
      ↓
ApiClient
      ↓
GET /patients/:patientId
      ↓
JSON
      ↓
PatientDto
      ↓
Patient
      ↓
Riverpod State
      ↓
PatientScreen
```

---

# 126. Example Mutation Flow

Create appointment:

```text
CreateAppointmentScreen
      ↓
AppointmentController
      ↓
CreateAppointmentUseCase
      ↓
AppointmentRepository
      ↓
RemoteDataSource
      ↓
POST /appointments
      +
Idempotency-Key
      ↓
Backend
      ↓
AppointmentDto
      ↓
Appointment
      ↓
Provider refresh
      ↓
Calendar / Queue
```

---

# 127. Example Clinical Flow

Consultation save:

```text
ConsultationScreen
      ↓
ConsultationController
      ↓
UpdateEncounterUseCase
      ↓
EncounterRepository
      ↓
PATCH /encounters/:id
      ↓
Server confirmation
      ↓
Update state
```

Auto-save must not interfere with doctor typing.

---

# 128. Example Prescription Finalization Flow

```text
PrescriptionReviewScreen
        ↓
Doctor taps Finalize
        ↓
Confirmation Dialog
        ↓
Controller
        ↓
FinalizePrescriptionUseCase
        ↓
Repository
        ↓
POST /prescriptions/:id/finalize
        +
Idempotency-Key
        ↓
Backend Transaction
        ↓
FINALIZED
        ↓
Flutter receives confirmation
        ↓
Read-only UI
```

---

# 129. API Integration with Global Search

Global search may query:

```text
patients
medicines
appointments
```

Avoid firing every search endpoint simultaneously for every keystroke.

Recommended:

```text
query
 ↓
debounce
 ↓
search orchestrator
 ↓
parallel read-only requests where useful
 ↓
merge results
```

Cancellation must cancel stale searches.

---

# 130. API Integration with Dashboard

Dashboard should load independent data in parallel when possible:

```text
Today's appointments
Today's queue
Today's revenue
Patient statistics
```

Use Riverpod providers rather than a single giant API request unless backend provides a dedicated dashboard endpoint.

Future:

```text
GET /chambers/:chamberId/dashboard
```

may reduce network overhead.

---

# 131. API Integration with Patient Timeline

Timeline aggregates:

```text
appointments
encounters
prescriptions
diagnostic reports
payments
```

The API should provide a single optimized timeline endpoint:

```text
GET /patients/:patientId/timeline
```

Flutter should not reconstruct the timeline from multiple endpoints unless required.

---

# 132. API Integration with Permissions

Backend permissions might look like:

```text
patient.read
patient.create
patient.update

appointment.read
appointment.create
appointment.update

queue.manage

encounter.read
encounter.write

prescription.create
prescription.finalize

payment.read
payment.create
payment.refund
```

Flutter should map permissions into a local immutable permission set.

---

# 133. Permission Provider

```dart
final permissionsProvider =
    Provider<Set<String>>((ref) {
  final user = ref.watch(currentUserProvider);

  return user.permissions.toSet();
});
```

Helper:

```dart
bool hasPermission(
  Set<String> permissions,
  String requiredPermission,
) {
  return permissions.contains(requiredPermission);
}
```

UI checks are convenience only.

Backend remains authoritative.

---

# 134. API Authorization Failure

If backend returns:

```text
403 FORBIDDEN
```

Flutter should:

1. Stop operation.
2. Preserve safe local input.
3. Display permission message.
4. Not retry automatically.
5. Refresh permissions if appropriate.
6. Allow user to continue where possible.

---

# 135. API Conflict Handling

Common conflicts:

```text
appointment slot already booked
patient modified by another user
prescription already finalized
queue state changed
payment already processed
```

All map to:

```text
ConflictFailure
```

with a specific error code.

---

# 136. API Maintenance Handling

If backend returns:

```text
503
```

display:

> Service temporarily unavailable. Please try again.

Do not expose:

```text
database connection pool exhausted
```

or infrastructure details.

---

# 137. API Rate Limit Handling

For:

```text
429
```

Flutter should:

- respect Retry-After if provided
- avoid immediate repeated retries
- display a user-friendly message
- apply client-side throttling where practical

Particularly important for:

- login
- OTP
- search
- AI
- report analysis

---

# 138. AI Request Rate Limiting UX

For expensive AI actions:

```text
Generate Summary
```

button should become disabled while request is active.

Prevent:

```text
Tap
Tap
Tap
Tap
```

from creating four AI requests.

---

# 139. API Request State

For mutation providers, use:

```text
idle
submitting
success
failure
```

Example:

```dart
final isSubmitting = state.isSubmitting;
```

Buttons should prevent duplicate submissions.

---

# 140. API Integration and Navigation

Do not navigate before critical API confirmation.

Example:

```text
Finalize Prescription
       ↓
API
       ↓
Success
       ↓
Navigate to Prescription Details
```

Not:

```text
Finalize
 ↓
Navigate
 ↓
API
```

---

# 141. API Integration and Dialogs

For destructive operations:

```text
Delete staff
Cancel appointment
Refund payment
Amend prescription
```

Use:

```text
Confirmation
 ↓
API
 ↓
Success
```

---

# 142. API Integration and Forms

Form flow:

```text
User input
 ↓
Local validation
 ↓
Request DTO
 ↓
Repository
 ↓
API
 ↓
Backend validation
 ↓
Success / ValidationFailure
```

Server validation must be mapped back to individual fields.

---

# 143. Field-Level Validation Error

Backend:

```json
{
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "phone",
      "message": "Invalid phone number"
    }
  ]
}
```

Flutter:

```text
phone → field error
```

The form should display the error beside the relevant field.

---

# 144. API Error UX

Avoid generic:

> Something went wrong.

when a meaningful error exists.

Prefer:

> This appointment slot is no longer available.

or:

> Your session has expired. Please sign in again.

---

# 145. API Documentation

Maintain:

```text
docs/
├── api/
│   ├── overview.md
│   ├── authentication.md
│   ├── error-codes.md
│   ├── pagination.md
│   ├── idempotency.md
│   └── api-versioning.md
```

Backend OpenAPI remains the authoritative machine-readable contract.

---

# 146. API Change Management

Any backend API change must evaluate:

```text
Backend DTO
↓
OpenAPI
↓
Flutter DTO
↓
Repository
↓
Use Case
↓
Provider
↓
UI
↓
Tests
```

Breaking changes require versioning or coordinated release.

---

# 147. Backward Compatibility

For mobile applications, backend changes must account for older app versions.

Prefer:

```text
additive API changes
```

Avoid immediately removing fields.

For example:

```text
old client expects:
fullName

new API adds:
displayName
```

Do not remove `fullName` until supported client versions are retired.

---

# 148. API Deprecation

Deprecated endpoint:

```text
POST /old-endpoint
```

should have:

- documentation notice
- deprecation timeline
- replacement endpoint
- analytics/usage tracking where appropriate

---

# 149. API Integration Performance Targets

Initial targets:

```text
Simple API request: < 1 sec typical
Search: < 500 ms typical
Patient details: < 1 sec typical
Queue refresh: < 1 sec typical
Cached reads: near-instant
```

These are UX targets, not backend SLAs.

---

# 150. Network Payload Guidelines

Avoid returning unnecessary:

```text
large diagnostic reports
full patient timeline
large AI context
```

Use:

```text
summary DTO
details DTO
```

where appropriate.

---

# 151. DTO Granularity

Example:

```text
PatientListItemDto
PatientDetailsDto
PatientTimelineItemDto
```

rather than one enormous:

```text
PatientDto
```

for every endpoint.

This reduces payload size and coupling.

---

# 152. API Response Mapping

Example:

```text
PatientListItemDto
        ↓
PatientSummary
```

and:

```text
PatientDetailsDto
        ↓
PatientDetails
```

Domain models should reflect use cases rather than mirror database tables.

---

# 153. API Integration and Files

Private files should not be exposed through permanent public URLs.

Use:

```text
authenticated API
```

or:

```text
short-lived signed URL
```

Flutter should not persist signed URLs for long periods.

---

# 154. PDF Handling

Prescription PDF:

```text
GET /prescriptions/:id/pdf
```

Possible flow:

```text
API
 ↓
bytes / signed URL
 ↓
temporary local file
 ↓
share / print / preview
```

Do not permanently store sensitive PDFs unless required.

---

# 155. Prescription Delivery

```text
POST /prescriptions/:id/deliver
```

Delivery may eventually support:

```text
print
download
SMS
email
WhatsApp
patient portal
```

MVP can support:

```text
PDF
print/share
```

---

# 156. API and Notifications

Notification events originate from backend.

Flutter retrieves:

```text
GET /notifications
```

and may later integrate:

```text
Firebase Cloud Messaging
```

for push notification delivery.

Push payload should contain identifiers rather than sensitive medical content.

Example:

```json
{
  "type": "APPOINTMENT_REMINDER",
  "appointmentId": "..."
}
```

not:

```json
{
  "diagnosis": "..."
}
```

---

# 157. Deep Link Handling

Notification:

```text
appointment reminder
```

can navigate to:

```text
AppointmentDetailsScreen
```

using:

```text
appointmentId
```

The destination screen must fetch authoritative data from API.

Never trust notification payload as the complete record.

---

# 158. API Integration and Analytics

Do not send patient clinical content to analytics systems.

Allowed:

```text
screen_view
button_clicked
api_latency
api_error_code
```

Avoid:

```text
patient name
phone
diagnosis
prescription
clinical notes
AI prompt
```

---

# 159. Observability

Track:

```text
API latency
HTTP status
error code
request ID
endpoint
app version
OS
network type
```

Avoid sensitive payloads.

Example event:

```text
api_error
endpoint=/patients/search
status=503
requestId=...
appVersion=1.2.0
```

---

# 160. API Monitoring

Monitor:

```text
401 rate
403 rate
409 rate
429 rate
5xx rate
timeout rate
average latency
p95 latency
```

These metrics help identify production issues.

---

# 161. App Version Header

Flutter may send:

```http
X-App-Version: 1.0.0
X-Platform: android
X-OS-Version: ...
```

Useful for troubleshooting compatibility issues.

---

# 162. Feature Flags

API integration can support feature flags:

```text
AI_ENABLED
OFFLINE_ENABLED
ADVANCED_ANALYTICS
PATIENT_PORTAL
```

Feature flags should not be treated as security controls.

Security remains server-side.

---

# 163. API Mock Data

Maintain:

```text
test/fixtures/
├── auth/
├── patients/
├── appointments/
├── queue/
├── encounters/
├── prescriptions/
├── payments/
└── ai/
```

Fixtures should contain synthetic data only.

---

# 164. Test Patient Data

Never use real patient information in:

- Git repository
- automated tests
- screenshots
- sample JSON
- development fixtures
- CI logs

Use synthetic Bangladesh-style data.

Example:

```text
Rahim Ahmed
01700000000
PAT-000001
```

---

# 165. Integration Test Matrix

| Module | API | Success | Validation | Auth | Conflict | Offline |
|---|---|---:|---:|---:|---:|---:|
| Auth | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| Patients | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Appointment | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Queue | ✓ | ✓ | ✓ | ✓ | ✓ | Limited |
| Encounter | ✓ | ✓ | ✓ | ✓ | ✓ | Advanced |
| Prescription | ✓ | ✓ | ✓ | ✓ | ✓ | Restricted |
| Payment | ✓ | ✓ | ✓ | ✓ | ✓ | Restricted |
| AI | ✓ | ✓ | ✓ | ✓ | ✓ | No |
| Files | ✓ | ✓ | ✓ | ✓ | ✓ | Limited |

---

# 166. Critical E2E API Flow

The most important integration test:

```text
Register
 ↓
Verify OTP
 ↓
Login
 ↓
Create Chamber
 ↓
Create Schedule
 ↓
Create Patient
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
Generate AI Draft
 ↓
Review Prescription
 ↓
Finalize Prescription
 ↓
Create Payment
 ↓
Complete Encounter
 ↓
Prescription Delivery
```

This flow must pass before MVP production release.

---

# 167. Multi-Chamber API Test

Test:

```text
Doctor
 ├── Chamber A
 └── Chamber B
```

Verify:

```text
A data visible in A
A data not visible in B
```

unless explicitly shared by business rules.

Critical entities:

- patients
- appointments
- queue
- encounters
- prescriptions
- payments
- staff
- reports

---

# 168. Staff API Authorization Test

Example:

```text
Receptionist
```

should be able to:

```text
create patient
create appointment
check in patient
manage queue
record payment
```

but should not necessarily be able to:

```text
finalize prescription
lock encounter
view restricted clinical information
refund payment
manage staff
```

Exact permissions come from backend RBAC.

---

# 169. Assistant Doctor API Authorization

Assistant doctor may:

```text
view patient
record history
record vitals
record notes
create prescription draft
```

Depending on configuration, may or may not:

```text
finalize prescription
lock encounter
```

Backend authorization is authoritative.

---

# 170. Doctor API Authorization

Doctor/practice owner can perform privileged operations including:

```text
manage chamber
manage staff
review clinical information
finalize prescription
complete encounter
view analytics
```

---

# 171. API Integration Sprint Plan

## Sprint 1 — Network Foundation

Tasks:

- Dio setup
- environment configuration
- API client
- response envelope
- error envelope
- exception mapper
- request ID
- logging
- timeout
- basic retry

Deliverable:

```text
Working API client
```

---

## Sprint 2 — Authentication

Tasks:

- token storage
- auth interceptor
- refresh
- concurrent refresh lock
- session manager
- logout
- route integration

Deliverable:

```text
Production-grade authentication layer
```

---

## Sprint 3 — Doctor & Chamber

Tasks:

- user APIs
- doctor APIs
- verification
- chamber APIs
- schedule
- staff
- permissions

Deliverable:

```text
Complete onboarding API integration
```

---

## Sprint 4 — Patient

Tasks:

- patient DTOs
- repository
- search
- details
- timeline
- allergies
- conditions
- caching

Deliverable:

```text
Complete patient data layer
```

---

## Sprint 5 — Appointment & Queue

Tasks:

- appointment APIs
- queue APIs
- polling
- cancellation
- idempotency
- state transitions

Deliverable:

```text
Complete chamber operation API layer
```

---

## Sprint 6 — Clinical

Tasks:

- encounter
- notes
- vitals
- diagnosis
- investigation
- reports
- files

Deliverable:

```text
Complete clinical API layer
```

---

## Sprint 7 — Prescription

Tasks:

- medicine
- favorites
- prescription
- prescription items
- review
- finalization
- amendment
- PDF
- delivery

Deliverable:

```text
Complete prescription API layer
```

---

## Sprint 8 — Payments

Tasks:

- payments
- receipt
- refund
- idempotency
- financial error handling

Deliverable:

```text
Complete payment API integration
```

---

## Sprint 9 — AI

Tasks:

- patient summary
- clinical chat
- prescription draft
- report analysis
- async request status
- polling
- AI error handling

Deliverable:

```text
Complete AI API integration
```

---

## Sprint 10 — Reports & Notifications

Tasks:

- analytics
- notifications
- exports
- audit
- deep links

Deliverable:

```text
Complete reporting/notification API layer
```

---

## Sprint 11 — Offline & Caching

Tasks:

- connectivity
- cache policies
- local data source
- cache invalidation
- offline UX
- safe read fallback

Deliverable:

```text
Offline-aware API architecture
```

---

## Sprint 12 — Hardening

Tasks:

- API integration tests
- contract tests
- performance testing
- security testing
- token refresh stress testing
- error handling
- production logging
- smoke tests
- CI API checks

Deliverable:

```text
Production-ready API integration layer
```

---

# 172. Definition of Ready

A feature is API-integration ready when:

- backend endpoint exists
- OpenAPI contract exists
- request schema is defined
- response schema is defined
- error codes are defined
- authorization is defined
- state transitions are defined
- idempotency requirement is defined
- pagination is defined if applicable
- offline behavior is defined
- API examples exist

---

# 173. Definition of Done

API integration is complete when:

- DTO implemented
- JSON serialization implemented
- domain mapping implemented
- remote data source implemented
- repository implemented
- Riverpod provider implemented
- loading state handled
- error state handled
- retry implemented
- authorization behavior implemented
- localization handled
- tests implemented
- API contract verified
- sensitive logging reviewed

---

# 174. Pull Request Checklist

Every API PR should verify:

```text
[ ] DTO
[ ] JSON serialization
[ ] Domain mapper
[ ] Repository
[ ] Remote data source
[ ] Error mapping
[ ] Loading state
[ ] Retry
[ ] Auth
[ ] Permission
[ ] Cancellation
[ ] Idempotency
[ ] Pagination
[ ] Tests
[ ] No sensitive logs
```

---

# 175. Backend Alignment Matrix

| Flutter Feature | Backend Module | Main APIs |
|---|---|---|
| Auth | Auth | `/auth/*` |
| User | Users | `/users/me` |
| Doctor | Doctors | `/doctors/me` |
| Verification | Verification | `/verification/*` |
| Chamber | Chambers | `/chambers/*` |
| Schedule | Schedules | `/schedules/*` |
| Staff | Staff | `/staff/*` |
| Permission | Permissions | `/permissions/*` |
| Patient | Patients | `/patients/*` |
| Appointment | Appointments | `/appointments/*` |
| Queue | Queue | `/queue/*` |
| Encounter | Encounters | `/encounters/*` |
| Vitals | Vitals | `/vitals/*` |
| Diagnosis | Diagnoses | `/diagnoses/*` |
| Investigation | Investigations | `/investigations/*` |
| Reports | Reports | `/reports/*` |
| Files | Files | `/files/*` |
| Medicines | Medicines | `/medicines/*` |
| Prescription | Prescriptions | `/prescriptions/*` |
| Payment | Payments | `/payments/*` |
| Notification | Notifications | `/notifications/*` |
| AI | AI | `/ai/*` |
| Analytics | Analytics | `/analytics/*` |
| Audit | Audit | `/audit-logs` |
| Export | Exports | `/exports/*` |
| Health | Health | `/health/*` |

---

# 176. Final API Integration Architecture

The final architecture is:

```text
                     Flutter UI
                         │
                         ▼
                 Riverpod Controller
                         │
                         ▼
                     Use Case
                         │
                         ▼
                    Repository
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Remote Data Source      Local Data Source
              │                     │
              ▼                     ▼
          ApiClient              Local DB
              │
              ▼
             Dio
              │
       ┌──────┼─────────┐
       ▼      ▼         ▼
     Auth   Request    Retry
Interceptor  ID       Policy
       │
       ▼
     HTTPS
       │
       ▼
 NestJS REST API
       │
       ▼
 PostgreSQL / Redis / Storage / AI
```

---

# 177. Core Architectural Rules

The following rules are mandatory.

### Rule 1

UI never calls Dio directly.

### Rule 2

DTOs never enter the presentation layer.

### Rule 3

HTTP exceptions never enter the presentation layer.

### Rule 4

Authentication is centralized.

### Rule 5

Concurrent 401 responses share one token refresh.

### Rule 6

Refresh must never recursively refresh itself.

### Rule 7

Critical mutations require server confirmation.

### Rule 8

Critical retries require idempotency.

### Rule 9

Clinical conflicts must never silently overwrite data.

### Rule 10

Finalized prescriptions are read-only.

### Rule 11

AI can generate drafts but cannot finalize prescriptions.

### Rule 12

Backend authorization is authoritative.

### Rule 13

Chamber isolation must always be respected.

### Rule 14

Sensitive clinical information must never appear in logs.

### Rule 15

UTC is used for timestamps; chamber business dates use chamber-local rules.

### Rule 16

Production secrets never belong in the Flutter application.

### Rule 17

Offline functionality must never compromise clinical integrity.

### Rule 18

API contracts are versioned and documented.

---

# 178. MVP API Integration Scope

MVP must implement:

```text
Authentication
Doctor
Verification
Chamber
Schedule
Staff/RBAC
Patients
Appointments
Queue
Encounters
Vitals
Diagnosis
Investigation
Reports
Medicines
Prescription
Payments
Notifications
AI
Analytics
Files
Audit
Health
```

The MVP API integration layer must be fully functional for the core chamber workflow.

---

# 179. Advanced API Integration Scope

Phase 2/3 can add:

```text
Advanced offline sync
WebSocket queue updates
Voice AI
Patient portal
SMS
WhatsApp
Telemedicine
Lab integration
Pharmacy integration
Insurance
Referral network
Advanced analytics
Predictive AI
```

These should not destabilize the MVP networking architecture.

---

# 180. Final Recommended API Integration Flow

The complete implementation sequence is:

```text
1. Environment
      ↓
2. Dio
      ↓
3. ApiClient
      ↓
4. Response/Error Models
      ↓
5. Token Storage
      ↓
6. Auth Interceptor
      ↓
7. Refresh Lock
      ↓
8. Session Manager
      ↓
9. Failure Mapping
      ↓
10. DTO Models
      ↓
11. Domain Mapping
      ↓
12. Remote Data Sources
      ↓
13. Repositories
      ↓
14. Riverpod Providers
      ↓
15. Feature APIs
      ↓
16. Caching
      ↓
17. File Upload
      ↓
18. AI Async Processing
      ↓
19. Offline Awareness
      ↓
20. Contract Testing
      ↓
21. Production Hardening
```

---

# 181. Final Architecture Principle

The Flutter API integration layer should remain **boring, predictable, strongly typed, centralized, and testable**.

The most important separation is:

```text
UI
  ≠
Networking
```

and:

```text
DTO
  ≠
Domain Entity
```

and:

```text
AI Suggestion
  ≠
Clinical Decision
```

and:

```text
Client Authorization
  ≠
Backend Authorization
```

The Flutter application should make API interaction easy for feature developers while ensuring that authentication, security, error handling, retries, concurrency, chamber isolation, clinical integrity, and observability are handled consistently across the entire application.

The target architecture is therefore:

```text
                     ┌─────────────────────┐
                     │      Flutter UI     │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Riverpod / UseCase  │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │     Repository      │
                     └──────────┬──────────┘
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
              ┌─────────────┐       ┌─────────────┐
              │ Remote DS   │       │  Local DS   │
              └──────┬──────┘       └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │  ApiClient  │
              └──────┬──────┘
                     │
                     ▼
                  ┌──────┐
                  │ Dio  │
                  └──┬───┘
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
       Auth       Request      Retry
    Interceptor      ID        Policy
          │          │           │
          └──────────┴───────────┘
                     │
                     ▼
              ┌─────────────┐
              │ HTTPS REST  │
              │  /api/v1    │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │ NestJS API  │
              └─────────────┘
```

This completes **Document 17 — Complete Flutter API Integration Layer Specification**.

## Next Document

The logical next document is:

**Document 18 — Complete Flutter Riverpod State Management Specification**

It should define, feature by feature:

- Provider architecture
- AsyncNotifier/Notifier strategy
- State models
- Controller patterns
- Repository integration
- Cache state
- Pagination state
- Search state
- Form state
- Queue state
- Consultation state
- Prescription state
- AI state
- Authentication/session state
- Permission state
- Chamber selection state
- Offline state
- Provider dependency graph
- Provider invalidation strategy
- AutoDispose/keepAlive strategy
- Testing strategy
- Complete provider inventory
- Feature-by-feature state transition diagrams
- Sprint implementation plan