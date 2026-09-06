# Document 24 — Complete Flutter Networking, API Error Handling & Resilience Implementation Specification

**Project:** Chamber Management  
**Platform:** Flutter  
**Language:** Dart  
**Architecture:** Clean Architecture + Feature-First  
**State Management:** Riverpod  
**HTTP Client:** Dio  
**Backend:** NestJS + Fastify  
**Database:** PostgreSQL  
**Local Storage:** Hive  
**Secure Storage:** flutter_secure_storage  
**API Style:** REST `/api/v1`  
**Target Market:** Bangladesh  
**Document Status:** Implementation Specification  
**Version:** 1.0

---

# 1. Purpose

This document defines the complete Flutter networking architecture for Chamber Management.

It covers:

- HTTP client architecture
- Dio configuration
- request/response handling
- authentication
- access-token refresh
- concurrent 401 handling
- retries
- timeouts
- connectivity
- API errors
- validation errors
- pagination
- filtering
- sorting
- idempotency
- optimistic concurrency
- request cancellation
- file upload/download
- AI asynchronous requests
- offline integration
- caching
- observability
- security
- resilience
- testing
- production hardening

The networking layer must provide a stable boundary between the Flutter application and the NestJS backend.

---

# 2. Networking Principles

The networking architecture follows these principles:

1. UI never directly calls Dio.
2. Features never directly manipulate HTTP responses.
3. API models never leak into domain entities.
4. All authentication is centrally managed.
5. Token refresh is centralized.
6. Concurrent 401 responses share one refresh operation.
7. Retry only when safe.
8. Idempotency protects retryable mutations.
9. Server remains authoritative.
10. Clinical and financial operations require strict confirmation.
11. Sensitive information is never logged.
12. Offline synchronization is handled above the networking transport layer.
13. Every request should have a correlation/request ID.
14. Every API error must map to a predictable domain failure.
15. Network behavior must be testable without a real backend.

---

# 3. Architecture

```text
┌─────────────────────────────────────┐
│              Flutter UI             │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│        Riverpod Controller           │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│              Use Case                │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│             Repository              │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Remote Data Source          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│              ApiClient               │
│                                     │
│  Auth → Retry → Request ID → Error  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│               Dio                    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          NestJS REST API             │
└─────────────────────────────────────┘
```

---

# 4. Directory Structure

Recommended:

```text
lib/
├── core/
│   ├── networking/
│   │   ├── api_client.dart
│   │   ├── api_config.dart
│   │   ├── api_endpoints.dart
│   │   ├── api_response.dart
│   │   ├── api_error.dart
│   │   ├── api_exception.dart
│   │   │
│   │   ├── dio/
│   │   │   ├── dio_factory.dart
│   │   │   ├── auth_interceptor.dart
│   │   │   ├── request_id_interceptor.dart
│   │   │   ├── retry_interceptor.dart
│   │   │   ├── logging_interceptor.dart
│   │   │   └── error_interceptor.dart
│   │   │
│   │   ├── auth/
│   │   │   ├── token_storage.dart
│   │   │   ├── token_manager.dart
│   │   │   └── token_refresh_manager.dart
│   │   │
│   │   ├── connectivity/
│   │   ├── retry/
│   │   ├── cancellation/
│   │   ├── pagination/
│   │   ├── upload/
│   │   └── download/
│   │
│   ├── errors/
│   │   ├── failures.dart
│   │   ├── exception_mapper.dart
│   │   └── error_codes.dart
│   │
│   ├── sync/
│   └── security/
│
├── features/
│   ├── auth/
│   ├── patients/
│   ├── appointments/
│   ├── queue/
│   ├── consultation/
│   ├── prescription/
│   ├── payments/
│   ├── reports/
│   └── ai/
│
└── app/
```

---

# 5. Package Stack

Recommended packages:

```yaml
dependencies:
  dio:
  flutter_riverpod:
  freezed_annotation:
  json_annotation:
  connectivity_plus:
  flutter_secure_storage:
  hive:
  hive_flutter:
  path_provider:
  uuid:

dev_dependencies:
  build_runner:
  freezed:
  json_serializable:
  mocktail:
  http_mock_adapter:
```

Package versions should be pinned according to the project's dependency-management policy.

---

# 6. Environment Configuration

Support:

```text
development
testing
staging
production
```

Configuration:

```dart
enum AppEnvironment {
  development,
  testing,
  staging,
  production,
}
```

---

# 7. API Configuration

Example:

```dart
class ApiConfig {
  final String baseUrl;
  final Duration connectTimeout;
  final Duration receiveTimeout;
  final Duration sendTimeout;

  const ApiConfig({
    required this.baseUrl,
    required this.connectTimeout,
    required this.receiveTimeout,
    required this.sendTimeout,
  });
}
```

---

# 8. Environment Separation

Never hardcode production URLs inside feature code.

Use:

```text
AppConfig
    ↓
ApiConfig
    ↓
Dio
```

Example:

```text
DEV:
https://api-dev.example.com

STAGING:
https://api-staging.example.com

PROD:
https://api.example.com
```

Actual production domain should come from deployment configuration.

---

# 9. Base URL Rules

All API requests use:

```text
/api/v1
```

Example:

```text
/api/v1/auth/login
/api/v1/patients
/api/v1/appointments
```

Feature code should reference endpoint constants rather than constructing URLs repeatedly.

---

# 10. Endpoint Registry

Recommended:

```dart
abstract final class ApiEndpoints {
  static const login = '/auth/login';
  static const refresh = '/auth/refresh';

  static const me = '/users/me';

  static const patients = '/patients';
  static const appointments = '/appointments';

  static String patient(String id) =>
      '/patients/$id';

  static String encounter(String id) =>
      '/encounters/$id';
}
```

---

# 11. Dio Factory

Create one configured Dio instance.

```dart
Dio createDio(ApiConfig config) {
  final dio = Dio(
    BaseOptions(
      baseUrl: config.baseUrl,
      connectTimeout: config.connectTimeout,
      receiveTimeout: config.receiveTimeout,
      sendTimeout: config.sendTimeout,
    ),
  );

  return dio;
}
```

---

# 12. Dio Interceptor Pipeline

Recommended order:

```text
Request
 ↓
Request ID
 ↓
Authentication
 ↓
Idempotency
 ↓
Logging/Telemetry
 ↓
Dio
 ↓
Response
 ↓
Error Handling
 ↓
Retry
 ↓
Repository
```

Actual interceptor ordering must be tested because Dio executes interceptors according to its interceptor pipeline behavior.

---

# 13. Request ID

Every request should carry:

```http
X-Request-ID: <uuid>
```

Example:

```text
X-Request-ID: 7b6c...
```

Purpose:

- debugging
- support
- backend correlation
- distributed tracing
- incident investigation

---

# 14. Request ID Generation

Generate client-side UUID if no request ID exists.

```dart
final requestId = const Uuid().v4();
```

The backend should echo the request ID in the response where possible.

---

# 15. Request Metadata

Safe metadata:

```text
requestId
HTTP method
endpoint template
status code
duration
retry count
environment
```

Avoid logging:

```text
Authorization
patient content
clinical notes
prescription content
AI content
password
OTP
```

---

# 16. Authentication Architecture

```text
Secure Storage
      ↓
Token Manager
      ↓
Auth Interceptor
      ↓
Dio
```

Access token:

```text
Authorization: Bearer <accessToken>
```

---

# 17. Token Storage

Use:

```text
flutter_secure_storage
```

for:

- access token where persisted
- refresh token
- token metadata

Never store tokens in:

- Hive plain storage
- SharedPreferences
- application logs
- URL query parameters

---

# 18. Token Manager

```dart
abstract class TokenManager {
  Future<String?> getAccessToken();

  Future<String?> getRefreshToken();

  Future<void> saveTokens(TokenPair tokens);

  Future<void> clearTokens();

  Future<TokenPair?> refresh();
}
```

---

# 19. Auth Interceptor

Before request:

```text
Read access token
       ↓
Attach Authorization header
```

Do not attach the access token to:

```text
/auth/login
/auth/register
/auth/verify-otp
/auth/refresh
```

unless explicitly required.

---

# 20. Access Token Expiration

If the server returns:

```text
401 Unauthorized
```

the client should determine whether the request can be retried after refresh.

---

# 21. Refresh Token Flow

```text
Request
 ↓
401
 ↓
Check refresh token
 ↓
Refresh access token
 ↓
Save new tokens
 ↓
Retry original request
```

---

# 22. Concurrent 401 Problem

Example:

```text
Request A → 401
Request B → 401
Request C → 401
```

Do not execute:

```text
Refresh A
Refresh B
Refresh C
```

Instead:

```text
A ─┐
B ─┼──→ One Refresh Request
C ─┘
             ↓
       New Access Token
             ↓
       Retry A/B/C
```

---

# 23. Token Refresh Manager

Use a single-flight mechanism.

Conceptually:

```dart
Future<TokenPair?> refreshOnce() async {
  if (_refreshing != null) {
    return _refreshing!.future;
  }

  // Start one refresh operation.
}
```

All waiting requests receive the same result.

---

# 24. Refresh Loop Prevention

The refresh request must not itself trigger another refresh.

Mark:

```text
Options.extra['skipAuthRefresh'] = true
```

or equivalent.

---

# 25. Retry Original Request

After successful refresh:

```text
new access token
       ↓
clone original request
       ↓
replace Authorization
       ↓
retry once
```

Do not retry indefinitely.

---

# 26. Refresh Failure

If refresh fails:

```text
401
 ↓
refresh failed
 ↓
clear session
 ↓
stop pending authenticated requests
 ↓
auth state = expired
 ↓
route to login
```

---

# 27. Pending Requests During Refresh

While refresh is active:

```text
Request A → waiting
Request B → waiting
Request C → waiting
```

After success:

```text
retry A/B/C
```

After failure:

```text
fail A/B/C with UnauthorizedFailure
```

---

# 28. Logout During Refresh

If logout occurs:

```text
cancel refresh
clear tokens
invalidate session
```

Requests waiting on refresh must fail safely.

---

# 29. Account Switching During Refresh

Stop all authenticated network operations before switching accounts.

Never allow an old user's token to be used for the new user's requests.

---

# 30. Standard API Envelope

Backend responses should follow:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "req-123"
}
```

---

# 31. Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  },
  "requestId": "req-123"
}
```

---

# 32. ApiResponse Model

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

# 33. API Error Model

```dart
@freezed
class ApiError with _$ApiError {
  const factory ApiError({
    required String code,
    required String message,
    dynamic details,
  }) = _ApiError;
}
```

---

# 34. Domain Failure Model

Networking errors must be converted into domain-level failures.

```dart
sealed class Failure {}

class UnauthorizedFailure extends Failure {}

class ForbiddenFailure extends Failure {}

class ValidationFailure extends Failure {}

class ConflictFailure extends Failure {}

class NetworkFailure extends Failure {}

class TimeoutFailure extends Failure {}

class ServerFailure extends Failure {}

class NotFoundFailure extends Failure {}

class RateLimitFailure extends Failure {}
```

---

# 35. Why Domain Failures?

The UI should not know:

```text
DioException
SocketException
HTTP 502
```

Instead it should receive:

```text
NetworkFailure
ServerFailure
TimeoutFailure
```

---

# 36. HTTP Status Mapping

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
| 504 | Timeout/Server |
| Network error | Network |
| Timeout | Timeout |

---

# 37. Backend Error Code Mapping

HTTP status alone is not enough.

Use backend codes:

```text
VALIDATION_ERROR
INVALID_OTP
ACCOUNT_LOCKED
PERMISSION_DENIED
RESOURCE_NOT_FOUND
RESOURCE_VERSION_CONFLICT
APPOINTMENT_CONFLICT
PRESCRIPTION_ALREADY_FINALIZED
PAYMENT_ALREADY_PROCESSED
RATE_LIMIT_EXCEEDED
```

---

# 38. Validation Error

Example:

```json
{
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "phone",
      "message": "Invalid Bangladesh phone number"
    }
  ]
}
```

Map to:

```dart
ValidationFailure(
  fieldErrors: {
    'phone': 'Invalid Bangladesh phone number',
  },
)
```

---

# 39. Field-Level Validation

UI should be able to map:

```text
error.details[].field
```

to:

```text
TextFormField
```

Example:

```text
phone → phoneField
name → nameField
dateOfBirth → dateOfBirthField
```

---

# 40. Business Rule Errors

Example:

```text
APPOINTMENT_CONFLICT
```

should become:

```dart
BusinessRuleFailure(
  code: 'APPOINTMENT_CONFLICT',
)
```

The UI can then show:

```text
This appointment time is no longer available.
```

---

# 41. Clinical Conflict

For:

```text
RESOURCE_VERSION_CONFLICT
```

map to:

```dart
ConflictFailure(
  resourceType: 'encounter',
  serverVersion: 8,
  clientVersion: 7,
)
```

This feeds Document 23's conflict-resolution workflow.

---

# 42. Prescription Finalization Errors

Possible:

```text
PRESCRIPTION_ALREADY_FINALIZED
PRESCRIPTION_INVALID
ENCOUNTER_NOT_READY
INSUFFICIENT_PERMISSION
RESOURCE_VERSION_CONFLICT
```

None should be retried blindly.

---

# 43. Payment Errors

Possible:

```text
PAYMENT_ALREADY_PROCESSED
INVALID_PAYMENT_AMOUNT
PAYMENT_NOT_ALLOWED
DUPLICATE_PAYMENT
```

Payment errors require server-authoritative handling.

---

# 44. Queue Errors

Possible:

```text
QUEUE_ENTRY_ALREADY_CALLED
QUEUE_ENTRY_NOT_ACTIVE
QUEUE_ACTION_NOT_ALLOWED
QUEUE_VERSION_CONFLICT
```

Queue operations should not be blindly retried unless explicitly safe.

---

# 45. Network Errors

Typical:

```text
connection timeout
connection refused
DNS failure
socket closed
network unavailable
```

Map to:

```text
NetworkFailure
```

or:

```text
TimeoutFailure
```

---

# 46. Timeout Classification

Different timeouts:

```text
connect timeout
send timeout
receive timeout
```

All should be represented clearly.

Example:

```dart
TimeoutFailure(
  operation: TimeoutOperation.receive,
)
```

---

# 47. Timeout Policy

Suggested defaults:

```text
Connect: 10 seconds
Send: 30 seconds
Receive: 30 seconds
```

Long-running operations may use explicit overrides.

AI/report processing should not simply use an extremely long HTTP timeout; use asynchronous backend jobs where appropriate.

---

# 48. AI Request Architecture

AI requests can be:

```text
POST /ai/patient-summary
```

If processing is asynchronous:

```text
POST /ai/patient-summary
       ↓
202 Accepted
       ↓
requestId
       ↓
GET /ai/requests/:requestId
```

---

# 49. AI Polling

Use bounded polling:

```text
2 sec
4 sec
6 sec
10 sec
15 sec
```

Stop after a defined maximum duration.

Do not poll indefinitely.

---

# 50. AI Cancellation

Allow user cancellation when backend supports it.

If cancellation is not supported:

```text
stop client polling
```

but recognize that server-side processing may continue.

---

# 51. AI Safety

Networking must treat AI output as untrusted.

The API client must not expose any method that implies:

```text
finalizePrescriptionFromAI()
```

Correct:

```text
requestPrescriptionDraft()
```

Then doctor reviews and finalizes through the normal prescription API.

---

# 52. Retry Principles

Retry is not automatically safe for every request.

Classify requests:

```text
SAFE_READ
IDEMPOTENT_WRITE
NON_IDEMPOTENT_WRITE
CRITICAL_ACTION
```

---

# 53. Safe Reads

Examples:

```text
GET /patients
GET /patients/:id
GET /appointments
```

Can generally retry transient failures.

---

# 54. Idempotent Writes

Examples:

```text
PUT /resource/:id
```

can be retried if backend semantics guarantee idempotency.

---

# 55. Non-Idempotent Writes

Examples:

```text
POST /payments
POST /appointments
```

require:

```text
Idempotency-Key
```

before automatic retry.

---

# 56. Critical Actions

Examples:

```text
Finalize prescription
Record payment
Refund payment
Queue action
Lock encounter
```

Automatic retry should be carefully controlled.

The client should first determine whether the server already processed the request.

---

# 57. Retry Policy

Retry only:

```text
network failure
timeout
502
503
504
429
```

subject to request safety.

---

# 58. Retry With Exponential Backoff

Example:

```text
attempt 1 → 2 sec
attempt 2 → 5 sec
attempt 3 → 15 sec
attempt 4 → 30 sec
```

Add random jitter.

---

# 59. Retry-After

If backend returns:

```http
Retry-After: 20
```

respect the server's requested delay for rate limiting.

---

# 60. Maximum Retry Attempts

Recommended:

```text
3–5 attempts
```

depending on operation.

Do not retry indefinitely.

---

# 61. Retry Budget

Each request should have a retry budget.

Example:

```dart
class RetryPolicy {
  final int maxAttempts;
  final Duration maxDelay;
}
```

---

# 62. Retry Context

Store:

```text
attempt
startedAt
operation
requestId
idempotencyKey
```

This allows consistent retry decisions.

---

# 63. Circuit Breaker Concept

A client-side circuit breaker may be introduced for severe backend instability.

States:

```text
CLOSED
  ↓
OPEN
  ↓
HALF_OPEN
  ↓
CLOSED
```

---

# 64. Circuit Breaker Purpose

If the backend is consistently unavailable:

```text
do not send hundreds of requests
```

Instead:

```text
fail fast
use cache/offline path
```

This is especially useful for:

- dashboards
- reference data
- background synchronization

---

# 65. Circuit Breaker Restrictions

Do not let a circuit breaker incorrectly suppress critical recovery operations such as:

- authentication
- token refresh
- user-triggered retry
- critical synchronization

unless carefully designed.

---

# 66. Connectivity Integration

Networking must integrate with Document 23's:

```text
ConnectivityService
```

The networking layer can identify:

```text
network unavailable
```

but connectivity state should not replace actual API success/failure detection.

---

# 67. Connectivity vs Internet

Important:

```text
Wi-Fi connected
```

does not guarantee:

```text
Internet available
```

Therefore:

```text
connectivity_plus
+
actual request outcome
```

should determine practical availability.

---

# 68. Offline Short-Circuiting

Repositories decide whether to use local data.

The ApiClient itself should generally remain a transport client.

Avoid putting feature-specific offline behavior into Dio.

Correct:

```text
Repository
 ↓
Offline/Online decision
 ↓
ApiClient
```

---

# 69. Request Cancellation

Use Dio `CancelToken`.

Example:

```dart
final cancelToken = CancelToken();

await dio.get(
  '/patients/search',
  queryParameters: {'q': query},
  cancelToken: cancelToken,
);
```

---

# 70. Search Cancellation

Patient search should:

```text
User types
 ↓
debounce 250–350 ms
 ↓
cancel previous request
 ↓
send new request
```

---

# 71. Latest-Request-Wins

Example:

```text
search "rah"
search "rahim"
```

If `"rah"` returns after `"rahim"`:

```text
ignore "rah" result
```

The newer query wins.

---

# 72. Request Generation IDs

For additional safety:

```dart
final generation = ++_searchGeneration;
```

Response is applied only if:

```text
generation == currentGeneration
```

---

# 73. Request Cancellation on Navigation

Cancel unnecessary requests when:

- leaving screen
- changing patient
- changing chamber
- logging out
- switching accounts

Do not cancel durable synchronization operations merely because a screen disappears.

---

# 74. Pagination

Standardize pagination.

Request:

```text
GET /patients?page=1&limit=20
```

or preferably cursor-based pagination for large datasets.

---

# 75. Pagination Model

```dart
@freezed
class PageMeta with _$PageMeta {
  const factory PageMeta({
    required int page,
    required int limit,
    required int total,
    required bool hasNext,
  }) = _PageMeta;
}
```

---

# 76. Cursor Pagination

For large or frequently changing datasets:

```text
GET /patients?limit=20&cursor=abc
```

Response:

```json
{
  "items": [],
  "nextCursor": "xyz"
}
```

---

# 77. Pagination Recommendation

Use:

### Offset/page pagination

For:

- reports
- static admin lists

### Cursor pagination

For:

- patient timeline
- notifications
- large patient lists
- audit logs
- synchronization feeds

---

# 78. Infinite Scroll

Flutter:

```text
List
 ↓
near bottom
 ↓
load next page
```

Prevent duplicate requests:

```text
isLoadingNextPage == true
```

must block additional calls.

---

# 79. Pagination Error

If page 1 fails:

```text
show full error state
```

If page 3 fails:

```text
keep existing items
show:
"Couldn't load more"
[Retry]
```

---

# 80. Filtering

Query parameters:

```text
?status=CONFIRMED
&dateFrom=...
&dateTo=...
```

Use typed query models where practical.

---

# 81. Sorting

Example:

```text
?sortBy=createdAt
&sortOrder=desc
```

Avoid arbitrary raw strings throughout feature code.

Use enums:

```dart
enum SortOrder {
  ascending,
  descending,
}
```

---

# 82. Search Query Encoding

Always allow Dio to encode query parameters.

Do not manually concatenate:

```text
'?q=' + query
```

Use:

```dart
queryParameters: {
  'q': query,
}
```

---

# 83. Bangladesh Phone Formatting

Network payload should use a canonical representation.

Recommended:

```text
+8801XXXXXXXXX
```

The UI may accept:

```text
017XXXXXXXX
01XXXXXXXXX
+8801XXXXXXXXX
```

but normalize before API submission.

---

# 84. Currency

Backend should remain authoritative for monetary values.

Flutter should:

- send decimal-safe values
- avoid floating-point calculations for money where possible
- render BDT appropriately

Example:

```text
৳ 1,500.00
```

---

# 85. Date and Time

API payloads should use UTC timestamps where appropriate.

Example:

```text
2026-09-05T16:30:00Z
```

Flutter converts to:

```text
Asia/Dhaka
```

for display.

---

# 86. Appointment Time

Appointment APIs must define whether a datetime represents:

- UTC instant
- chamber-local time
- date + local time

Do not rely on implicit timezone interpretation.

---

# 87. Serialization

Use:

```text
json_serializable
Freezed
```

for DTOs.

Example:

```dart
@freezed
class PatientDto with _$PatientDto {
  const factory PatientDto({
    required String id,
    required String name,
    required String phone,
  }) = _PatientDto;

  factory PatientDto.fromJson(
    Map<String, dynamic> json,
  ) => _$PatientDtoFromJson(json);
}
```

---

# 88. DTO → Domain Mapping

Never expose DTOs directly to UI.

```text
PatientDto
 ↓
PatientMapper
 ↓
Patient
 ↓
UI
```

---

# 89. Domain → Request DTO

Input models should also be separated.

```text
CreatePatientInput
 ↓
CreatePatientRequestDto
 ↓
JSON
```

---

# 90. Null Handling

Distinguish:

```text
field absent
```

from:

```text
field = null
```

especially for PATCH operations.

A patch model may need explicit semantics.

---

# 91. PATCH Semantics

Example:

```json
{
  "email": null
}
```

may mean:

```text
clear email
```

while absence means:

```text
do not change email
```

DTO serialization must preserve this distinction.

---

# 92. API Client Interface

Recommended:

```dart
abstract class ApiClient {
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic json) parser,
    CancelToken? cancelToken,
  });

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic json) parser,
    String? idempotencyKey,
  });

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic json) parser,
  });

  Future<void> delete(
    String path, {
    Map<String, dynamic>? queryParameters,
  });
}
```

---

# 93. Remote Data Source

Example:

```dart
class PatientRemoteDataSource {
  final ApiClient apiClient;

  Future<PatientDto> getPatient(String id) async {
    final response = await apiClient.get(
      ApiEndpoints.patient(id),
      parser: PatientDto.fromJson,
    );

    return response.data!;
  }
}
```

---

# 94. Repository

```dart
class PatientRepositoryImpl implements PatientRepository {
  final PatientRemoteDataSource remote;
  final PatientLocalDataSource local;

  @override
  Future<Result<Patient>> getPatient(String id) async {
    // Online/offline/cache strategy.
  }
}
```

---

# 95. Error Mapping Boundary

Recommended:

```text
DioException
 ↓
ApiException
 ↓
ExceptionMapper
 ↓
Failure
 ↓
UseCase
 ↓
Riverpod State
 ↓
UI
```

---

# 96. API Exception

```dart
class ApiException implements Exception {
  final int? statusCode;
  final String? code;
  final String message;
  final String? requestId;

  const ApiException({
    this.statusCode,
    this.code,
    required this.message,
    this.requestId,
  });
}
```

---

# 97. Exception Mapper

```dart
Failure mapException(Object error) {
  if (error is DioException) {
    // Map transport failure.
  }

  if (error is ApiException) {
    // Map API failure.
  }

  return UnknownFailure();
}
```

---

# 98. Global Error Handling

Global error handling should cover:

- authentication
- network
- server
- rate limiting
- unexpected exceptions

Feature-specific business errors remain feature-aware.

---

# 99. User-Friendly Error Messages

Technical:

```text
HTTP 503
```

User:

```text
The service is temporarily unavailable.
Please try again shortly.
```

---

# 100. Error Localization

Error messages should be localizable.

Backend may provide:

```text
error.code
```

Flutter maps code to localized text.

Example:

```text
APPOINTMENT_CONFLICT
```

→ English:

```text
This appointment time is no longer available.
```

→ Bangla:

```text
এই সময়ে অ্যাপয়েন্টমেন্ট আর পাওয়া যাচ্ছে না।
```

---

# 101. Server Message Handling

Backend `message` may be used as fallback.

However, stable error codes should drive UI behavior.

Do not build application logic around English error text.

---

# 102. Rate Limiting

HTTP:

```text
429 Too Many Requests
```

Map to:

```text
RateLimitFailure
```

Display:

```text
Too many requests. Please try again shortly.
```

---

# 103. Rate Limit Retry

Respect:

```http
Retry-After
```

where available.

Do not aggressively retry 429 responses.

---

# 104. Authentication Rate Limits

Specially handle:

- login attempts
- OTP requests
- OTP verification
- password reset

Do not automatically retry authentication actions.

---

# 105. File Upload Architecture

Use pre-signed URLs.

Flow:

```text
Flutter
 ↓
POST /files/upload-url
 ↓
Signed URL
 ↓
Upload directly to object storage
 ↓
POST /files/complete
 ↓
Backend confirms file
```

---

# 106. File Upload API

Request:

```json
{
  "fileName": "report.pdf",
  "contentType": "application/pdf",
  "size": 123456
}
```

Response:

```json
{
  "fileId": "file-123",
  "uploadUrl": "...",
  "expiresAt": "..."
}
```

---

# 107. File Upload Retry

If upload fails:

- refresh/re-request signed URL when expired
- retry only when safe
- verify file checksum where supported

Do not expose signed URLs in logs.

---

# 108. File Upload Completion

After upload:

```text
POST /files/complete
```

The backend verifies:

- file ownership
- chamber
- expected object
- metadata
- authorization

---

# 109. File Download

Use authenticated API or short-lived signed URLs.

Do not expose permanent public URLs for medical reports.

---

# 110. PDF Download

Prescription PDF:

```text
GET /prescriptions/:id/pdf
```

Should verify:

- authenticated user
- chamber access
- prescription access
- finalized state if required

---

# 111. Download Storage

Downloaded files should use application-private storage.

Avoid unrestricted public directories.

---

# 112. Download Cancellation

Allow cancellation when user leaves a screen or closes a preview.

---

# 113. Upload Progress

Provide:

```text
Uploading 65%
```

For large files.

Do not show progress for tiny files where it creates unnecessary UI complexity.

---

# 114. Request Size Limits

Flutter should avoid sending unexpectedly large payloads.

Backend should enforce final limits.

Examples:

```text
JSON payload max
file max
image max
AI request max
```

---

# 115. AI Payload Minimization

Only send necessary patient context.

Do not send:

```text
entire patient history
```

if the AI feature needs only:

```text
current encounter
relevant medications
allergies
recent history
```

---

# 116. AI Request Authorization

Before AI request:

```text
authenticated
+
authorized chamber
+
authorized patient
+
authorized encounter
```

---

# 117. AI Response Validation

AI output must be validated.

For structured prescription draft:

```text
medicine
dose
frequency
duration
route
instructions
```

must conform to expected schema.

---

# 118. AI Network Failure

If AI fails:

```text
AI unavailable
```

The doctor must still be able to continue manually.

---

# 119. AI Timeout

Do not leave the UI indefinitely in:

```text
Processing...
```

Use bounded timeout/polling.

---

# 120. Offline + Networking Boundary

Document 23 owns:

```text
offline decisions
local persistence
mutation queue
sync
```

Document 24 owns:

```text
HTTP transport
authentication
retry
errors
timeouts
request lifecycle
```

---

# 121. Sync Engine + ApiClient

Correct:

```text
Sync Engine
 ↓
Repository
 ↓
Remote Data Source
 ↓
ApiClient
```

Incorrect:

```text
Sync Engine
 ↓
Dio directly
```

---

# 122. Idempotency

All mutation operations that may be retried should support:

```http
Idempotency-Key: <UUID>
```

Examples:

- patient creation
- appointment creation
- payment
- refund
- supported clinical writes

---

# 123. Idempotency Key Storage

For offline mutations:

```text
mutationId
```

from Document 23 should be reused as:

```text
Idempotency-Key
```

This creates one consistent identity for the operation.

---

# 124. Idempotency Lifetime

The backend must retain idempotency results long enough to handle realistic retries.

The client should not assume indefinite server retention.

---

# 125. Optimistic Concurrency

Clinical APIs should support:

```text
version
```

or:

```http
If-Match
```

Flutter should send the version associated with the local record.

---

# 126. 409 Handling

When:

```text
409 RESOURCE_VERSION_CONFLICT
```

do not retry automatically.

Instead:

```text
mark conflict
preserve local state
fetch server version
open conflict workflow
```

---

# 127. Prescription Concurrency

If:

```text
local prescription version = 5
server version = 6
```

then:

```text
finalization must fail
```

until the doctor reviews the latest version.

---

# 128. Encounter Locking

If another user locks an encounter:

```text
409 / business error
```

Flutter must transition the screen to:

```text
read-only
```

where appropriate.

---

# 129. Request Deduplication

Avoid sending duplicate read requests caused by multiple widgets.

Riverpod should coordinate shared requests.

Example:

```text
patientDetailsProvider(patientId)
```

provides one logical data source for all dependent widgets.

---

# 130. API Caching

Networking-level cache should remain limited.

Primary caching responsibility belongs to repositories/local data sources.

Avoid adding opaque HTTP caching that makes clinical state difficult to reason about.

---

# 131. Cache Headers

Backend may use:

```http
ETag
If-None-Match
Last-Modified
```

for appropriate non-critical resources.

Do not rely on browser-style caching semantics for clinical correctness.

---

# 132. ETag Support

Potential:

```text
GET patient
→ ETag: "v8"
```

Next request:

```text
If-None-Match: "v8"
```

Response:

```text
304 Not Modified
```

This can reduce bandwidth.

---

# 133. Sensitive API Response Caching

Do not cache sensitive API responses at an uncontrolled proxy or third-party layer.

Use:

```text
private
```

cache semantics where appropriate.

---

# 134. Request Headers

Standard headers:

```http
Authorization: Bearer ...
Content-Type: application/json
Accept: application/json
X-Request-ID: ...
X-App-Version: ...
X-Platform: android
X-Client-Version: ...
```

Add:

```http
Idempotency-Key: ...
```

when applicable.

---

# 135. App Version

Include app version in requests for observability.

Example:

```text
X-App-Version: 1.4.0
```

This helps identify:

- outdated clients
- compatibility issues
- rollout problems

---

# 136. API Version Compatibility

Backend should support controlled API evolution.

Flutter should not depend on undocumented response fields.

---

# 137. API Deprecation

If an endpoint is deprecated:

Backend should provide:

```http
Deprecation
Sunset
```

headers where useful.

Flutter releases should migrate before removal.

---

# 138. Feature Flags

Networking may support backend feature flags.

But security-critical authorization must never rely solely on client-side flags.

---

# 139. Maintenance Mode

Backend may return:

```text
503 SERVICE_UNAVAILABLE
```

with:

```text
SERVICE_MAINTENANCE
```

Flutter should show:

```text
The service is temporarily unavailable.
Please try again later.
```

Cached/offline functionality can remain available where safe.

---

# 140. Server Clock

Server timestamps are authoritative.

Do not use client clock for:

- payment ordering
- queue ordering
- prescription finalization
- audit timestamps

---

# 141. Network Security

Production API must use:

```text
HTTPS
```

Never:

```text
HTTP
```

for production clinical traffic.

---

# 142. TLS Certificate Validation

Never disable certificate validation in production.

Do not use:

```dart
badCertificateCallback = (...) => true;
```

in production.

---

# 143. Certificate Pinning

Certificate/public-key pinning may be evaluated as an advanced security measure.

If implemented, establish a safe certificate rotation strategy.

Do not introduce pinning without a recovery plan.

---

# 144. Debug Networking

Development may use:

```text
Dio LogInterceptor
```

but:

```text
Authorization
patient data
clinical payload
AI content
```

must be redacted.

---

# 145. Production Logging

Production logs should include:

```text
requestId
endpoint category
status
duration
retry count
failure type
```

Never:

```text
token
password
OTP
patient content
prescription content
```

---

# 146. Network Performance Metrics

Track:

```text
request duration
DNS/connect duration where available
response size
failure rate
retry rate
timeout rate
```

Do not collect sensitive payloads.

---

# 147. Correlation

A support incident should be traceable:

```text
Flutter requestId
      ↓
API gateway
      ↓
NestJS
      ↓
service
      ↓
database/job
```

This dramatically improves production debugging.

---

# 148. Request Timing

Measure:

```text
startedAt
completedAt
duration
```

Use monotonic timing where available for duration measurements.

---

# 149. Slow Request Threshold

Example:

```text
> 2 seconds
```

can be classified as slow for normal APIs.

AI/report processing may use different thresholds.

---

# 150. API Health

The Flutter app may use:

```text
GET /health
```

or:

```text
GET /health/ready
```

for explicit health checks.

Do not continuously poll health endpoints unnecessarily.

---

# 151. Health Check Policy

Use health checks when:

- reconnecting after offline
- user requests retry
- application resumes after long suspension
- diagnosing backend availability

---

# 152. Session Expiration

Riverpod session state:

```text
unknown
loading
authenticated
unauthenticated
expired
```

Networking updates this state when authentication fails permanently.

---

# 153. Router Integration

On session expiration:

```text
Networking
 ↓
AuthState = expired
 ↓
Router redirect
 ↓
Login
```

Avoid navigating directly from Dio interceptor.

The auth/session layer should communicate state to the router.

---

# 154. Error Presentation Responsibility

Networking:

```text
detect error
```

Repository:

```text
map error
```

Use case:

```text
return failure
```

Riverpod:

```text
update state
```

UI:

```text
display message
```

---

# 155. Global Error UI

Use reusable:

```text
AppErrorView
RetryButton
OfflineBanner
SessionExpiredDialog
RateLimitMessage
ConflictDialog
```

---

# 156. Retry UI

User-triggered retry:

```text
[Try Again]
```

should create a new logical request unless retrying an idempotent operation with an existing idempotency key.

---

# 157. Critical Action Retry

For payment/finalization:

```text
Unknown result
```

should trigger:

```text
GET current resource status
```

before submitting another mutation.

---

# 158. Unknown Payment Result

Scenario:

```text
POST payment
 ↓
server processes
 ↓
network fails
```

Do not immediately POST again.

First:

```text
GET payment status
```

using:

- payment reference
- idempotency key
- transaction reference

---

# 159. Unknown Prescription Finalization Result

Scenario:

```text
POST finalize
 ↓
server finalizes
 ↓
network fails
```

Client should:

```text
GET prescription
```

and determine current state.

If:

```text
FINALIZED
```

show read-only.

---

# 160. Unknown Queue Action Result

If a queue action times out:

```text
GET /queue/today
```

or relevant queue entry state should be refreshed before repeating the action.

---

# 161. Request Classification

Each API operation should declare:

```dart
enum RequestSafety {
  readOnly,
  idempotentWrite,
  retryableMutation,
  criticalMutation,
}
```

---

# 162. Example Request Policy

```text
GET patient
→ readOnly
→ retry allowed

POST patient
→ retryableMutation
→ requires idempotency key

POST payment
→ criticalMutation
→ status reconciliation required

POST prescription/finalize
→ criticalMutation
→ no blind retry
```

---

# 163. API Operation Metadata

Possible:

```dart
class RequestPolicy {
  final RequestSafety safety;
  final bool requiresAuth;
  final bool allowRetry;
  final bool allowRefresh;
  final Duration timeout;
}
```

---

# 164. Testing Architecture

Networking tests must not depend on production servers.

Use:

```text
Mock Dio
HTTP mock adapter
Fake Token Manager
Fake Connectivity
Fake Clock
```

---

# 165. Unit Tests

Test:

- URL construction
- headers
- request IDs
- token attachment
- token refresh
- error mapping
- retry calculation
- idempotency
- timeout mapping
- pagination parsing
- date conversion

---

# 166. Auth Interceptor Tests

Test:

### Case 1

Valid token:

```text
request → Authorization attached
```

### Case 2

401 + refresh succeeds:

```text
refresh → retry original
```

### Case 3

401 + refresh fails:

```text
session expired
```

---

# 167. Concurrent Refresh Test

Simulate:

```text
10 requests
all return 401
```

Expected:

```text
1 refresh request
10 retried requests
```

Not:

```text
10 refresh requests
```

---

# 168. Refresh Loop Test

Ensure:

```text
refresh endpoint → 401
```

does not cause infinite recursion.

---

# 169. Retry Tests

Test:

```text
timeout
502
503
504
429
```

and verify correct retry behavior.

---

# 170. Non-Retry Tests

Verify no automatic retry for:

```text
400
401 after refresh failure
403
404
409
422
```

---

# 171. Idempotency Tests

Verify:

```text
POST patient
```

includes:

```text
Idempotency-Key
```

when required.

Verify retries reuse the same key.

---

# 172. Request ID Tests

Every request should contain:

```text
X-Request-ID
```

unless explicitly excluded.

---

# 173. Error Mapping Tests

Example:

```text
409
RESOURCE_VERSION_CONFLICT
```

must map to:

```text
ConflictFailure
```

not generic ServerFailure.

---

# 174. Validation Tests

Given:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "phone",
        "message": "Invalid phone"
      }
    ]
  }
}
```

verify:

```text
phone → field error
```

---

# 175. Cancellation Tests

Verify:

```text
cancel search
```

does not update UI when response arrives.

---

# 176. Pagination Tests

Test:

- first page
- next page
- no next page
- duplicate next-page request
- page failure
- cursor expiration

---

# 177. File Upload Tests

Test:

- signed URL request
- upload
- completion
- expired URL
- retry
- cancellation
- progress
- checksum mismatch

---

# 178. AI Networking Tests

Test:

- successful request
- async response
- polling
- timeout
- cancellation
- malformed AI response
- server failure
- authorization failure

---

# 179. Security Tests

Verify:

- tokens never appear in logs
- patient data never appears in logs
- signed URLs never appear in logs
- HTTP production configuration is rejected
- invalid certificates are rejected
- authorization headers are not persisted in plain cache

---

# 180. Integration Tests

Test against a staging/mock backend:

```text
login
refresh
patient
appointment
queue
consultation
prescription
payment
AI
reports
```

---

# 181. Contract Tests

Frontend/backend contracts should validate:

- endpoint paths
- request schema
- response schema
- error schema
- status codes
- pagination
- enums

---

# 182. API Contract Fixtures

Maintain fixtures:

```text
test/fixtures/api/
├── auth/
├── patients/
├── appointments/
├── queue/
├── encounters/
├── prescriptions/
├── payments/
├── reports/
└── ai/
```

---

# 183. Mock Server

Recommended behavior:

```text
Mock server
 ↓
Dio
 ↓
Remote Data Source
 ↓
Repository
```

It should simulate:

- success
- timeout
- 401
- 403
- 404
- 409
- 422
- 429
- 500
- 503

---

# 184. Flaky Network Tests

Simulate:

```text
request starts
 ↓
connection lost
 ↓
retry
 ↓
success
```

and:

```text
request starts
 ↓
server processes
 ↓
response lost
 ↓
client reconnects
```

---

# 185. Offline Integration

Combine Document 23 and Document 24:

```text
Offline
 ↓
Repository
 ↓
Local
 ↓
Mutation Queue

Online
 ↓
Sync Engine
 ↓
Repository
 ↓
ApiClient
 ↓
Backend
```

---

# 186. App Restart Networking Test

Scenario:

```text
pending mutation
 ↓
app killed
 ↓
restart
 ↓
restore mutation
 ↓
network available
 ↓
sync
```

---

# 187. Account Switching Test

Scenario:

```text
User A
 ↓
request pending
 ↓
logout
 ↓
User B login
```

Expected:

```text
User A request must not execute under User B credentials.
```

---

# 188. Chamber Switching Test

Scenario:

```text
Chamber A
 ↓
request pending
 ↓
switch Chamber B
```

Expected:

```text
Chamber A mutation retains Chamber A scope.
```

It must never be rewritten to Chamber B.

---

# 189. Security Boundary

Flutter networking must enforce:

```text
authentication
```

but backend enforces:

```text
authorization
```

The client cannot grant itself permissions.

---

# 190. RBAC Headers

Do not send arbitrary client-controlled:

```text
role=DOCTOR
```

and assume authorization.

The server determines roles from authenticated membership.

---

# 191. Chamber Context

Where backend APIs require chamber context, use an explicit mechanism.

Possible:

```http
X-Chamber-ID: <chamberId>
```

or:

```text
/chambers/:chamberId/...
```

Do not rely solely on client-side state.

---

# 192. Chamber Header Validation

If `X-Chamber-ID` is used:

Backend must verify:

```text
authenticated user
+
chamber membership
+
resource permission
```

---

# 193. Request Context

Networking can expose:

```dart
class RequestContext {
  final String? chamberId;
  final String? userId;
}
```

However, the backend remains authoritative.

---

# 194. Sensitive Headers

Never log:

```text
Authorization
Cookie
X-API-Key
signed URLs
```

---

# 195. Secrets

Do not embed:

- backend database credentials
- service account keys
- OpenAI API keys
- cloud storage credentials
- payment provider secrets

in Flutter.

---

# 196. AI Provider Keys

AI provider credentials remain on the backend.

Flutter calls:

```text
/api/v1/ai/...
```

not the AI provider directly.

---

# 197. Payment Provider Keys

Payment credentials remain server-side.

Flutter never receives privileged payment secrets.

---

# 198. Production Build Rules

Production:

```text
debug logging OFF
mock backend OFF
test authentication OFF
development certificates OFF
verbose request bodies OFF
```

---

# 199. API Compatibility

Flutter should tolerate:

- additional response fields
- optional fields
- new enum values where safe

Do not crash because backend adds an unrelated JSON property.

---

# 200. Unknown Enum Handling

For server enums, consider:

```dart
unknown
```

fallback.

Example:

```text
AppointmentStatus.unknown
```

rather than crashing deserialization.

---

# 201. Breaking API Changes

Avoid silently changing:

```text
field type
enum semantics
required field
endpoint behavior
```

without coordinated client release.

---

# 202. API Error Recovery Matrix

| Error | Retry | Refresh Auth | Local Fallback | User Action |
|---|---:|---:|---:|---|
| Network | Yes | No | Yes | Optional |
| Timeout | Conditional | No | Yes | Retry |
| 401 | No | Yes | No | Login if refresh fails |
| 403 | No | No | No | Permission message |
| 404 | No | No | Cache maybe | Review |
| 409 | No | No | Preserve draft | Resolve |
| 422 | No | No | No | Correct data |
| 429 | Delayed | No | Maybe | Wait |
| 500 | Limited | No | Maybe | Retry |
| 503 | Limited | No | Yes | Retry |
| 504 | Conditional | No | Yes | Retry |

---

# 203. Critical Mutation Recovery Matrix

| Operation | Network Failure | Action |
|---|---|---|
| Patient Create | Unknown | Reconcile/idempotent retry |
| Appointment Create | Unknown | Reconcile/idempotent retry |
| Queue Call | Unknown | Refresh queue first |
| Prescription Finalize | Unknown | Fetch prescription status |
| Payment | Unknown | Fetch payment status |
| Refund | Unknown | Fetch refund/payment status |
| Encounter Lock | Unknown | Fetch encounter state |

---

# 204. Networking + Offline Decision Tree

```text
User Action
    ↓
Repository
    ↓
Is operation offline-capable?
    │
 ┌──┴──┐
Yes    No
 │      │
Local  Online required
 │      │
Queue  Network?
 │      │
 │   ┌──┴──┐
 │  Yes    No
 │   │      │
 │   API   Error
 │
 ↓
Sync later
```

---

# 205. Network Request Lifecycle

```text
Create Request
 ↓
Validate Request Policy
 ↓
Attach Request ID
 ↓
Attach Auth
 ↓
Attach Idempotency
 ↓
Send
 ↓
Response?
 ├── Success
 ├── 401
 ├── Retryable Error
 ├── Business Error
 └── Network Error
```

---

# 206. Success Lifecycle

```text
HTTP 2xx
 ↓
Validate envelope
 ↓
Deserialize DTO
 ↓
Map DTO
 ↓
Repository
 ↓
Domain
 ↓
Riverpod
 ↓
UI
```

---

# 207. Error Lifecycle

```text
HTTP/network error
 ↓
Parse response
 ↓
Extract error code
 ↓
Create ApiException
 ↓
Map to Failure
 ↓
Repository/UseCase
 ↓
Riverpod state
 ↓
UI
```

---

# 208. Unexpected Response

If:

```text
HTTP 200
```

but:

```text
invalid JSON
```

or:

```text
success = missing
```

return:

```text
MalformedResponseFailure
```

Do not silently accept malformed responses.

---

# 209. Backend Contract Violation

Track technical telemetry for:

- invalid envelope
- unknown required fields
- impossible enum
- invalid timestamp
- malformed pagination

But do not log sensitive response content.

---

# 210. Large Response Handling

Avoid loading unnecessarily large responses into memory.

Use:

- pagination
- field selection where supported
- streaming/download APIs for files

---

# 211. Patient Timeline

Use pagination.

Do not download an entire lifetime history by default.

---

# 212. Audit Logs

Audit logs should use cursor pagination.

They are:

- sensitive
- potentially large
- rarely required in full

---

# 213. Notification Pagination

Use cursor pagination.

Unread count can use:

```text
GET /notifications/unread-count
```

rather than downloading all notifications.

---

# 214. Dashboard Requests

Dashboard can aggregate multiple resources.

Prefer backend aggregation:

```text
GET /analytics/dashboard
```

rather than making many independent requests.

This reduces:

- latency
- battery use
- network load

---

# 215. Parallel Requests

For independent reads:

```text
profile
chamber
appointments
queue
```

can execute concurrently.

Do not parallelize dependent mutations.

---

# 216. Request Concurrency Limits

Avoid uncontrolled parallel API requests.

Typical screen:

```text
3–6 independent requests
```

rather than dozens.

---

# 217. Mobile Network Optimization

Bangladesh-focused considerations:

- intermittent mobile data
- expensive bandwidth
- variable latency
- network switching
- lower-end devices

Therefore:

- paginate
- cache
- compress where appropriate
- avoid repeated requests
- minimize AI payloads
- minimize report downloads

---

# 218. Request Compression

Backend may support:

```text
gzip
brotli
```

where appropriate.

Large JSON responses benefit from compression.

---

# 219. Image Optimization

Before uploading images where appropriate:

- resize
- compress
- remove unnecessary metadata

Do not modify diagnostic images where fidelity is clinically important without an explicit policy.

---

# 220. Network-Aware File Upload

For large uploads:

```text
Wi-Fi
```

may be preferred.

Provide user controls where appropriate:

```text
Upload over mobile data?
```

---

# 221. Network-Aware AI

AI features can warn users when network quality is poor.

Do not block based solely on connection type.

---

# 222. Resilience During App Backgrounding

When app backgrounds:

- cancel unnecessary reads
- persist important draft state
- preserve sync queue
- resume safely when foregrounded

---

# 223. Foreground Resume

On resume:

```text
restore session
 ↓
check connectivity
 ↓
refresh critical data
 ↓
resume sync
```

---

# 224. Stale Session

If app was backgrounded for a long period:

```text
access token may expire
```

Use normal refresh flow.

---

# 225. Stale Chamber Context

After long suspension:

```text
refresh permissions
```

before sensitive operations.

---

# 226. Network Resilience and UX

Do not freeze the entire application because one endpoint is unavailable.

Example:

```text
Analytics unavailable
```

should not prevent:

```text
Patient consultation
```

where safe.

---

# 227. Partial Failure

Dashboard may contain:

```text
Queue ✓
Appointments ✓
Revenue ✕
```

Display available information and allow targeted retry.

---

# 228. Feature Isolation

Network failures should remain scoped to features.

Avoid:

```text
global network failure
→ entire app unusable
```

unless authentication/backend availability genuinely requires it.

---

# 229. Critical Backend Failure

If backend is completely unavailable:

```text
cached data
+
offline consultation drafts
```

remain available where supported.

Server-only operations clearly show:

```text
Internet connection required.
```

---

# 230. Production Resilience Metrics

Monitor:

```text
API success rate
API latency
timeout rate
retry rate
401 rate
refresh success rate
refresh failure rate
409 conflict rate
429 rate
5xx rate
offline duration
sync backlog
```

---

# 231. Authentication Metrics

Track:

```text
login success rate
OTP verification success
refresh success
refresh failure
session expiration
```

Do not record OTP values or passwords.

---

# 232. Endpoint Health Metrics

Example:

```text
POST /prescriptions/:id/finalize
```

Monitor:

- success
- conflict
- unauthorized
- timeout
- server error

This is especially important because prescription finalization is clinically critical.

---

# 233. Financial Endpoint Monitoring

Monitor:

```text
payment success
payment duplicate
payment timeout
payment reconciliation
refund failure
```

---

# 234. API Alert Thresholds

Potential production alerts:

```text
5xx > threshold
401 spike
refresh failure spike
payment failure spike
prescription finalization failure spike
sync backlog spike
```

Thresholds should be established after observing real production baselines.

---

# 235. Testing Pyramid

```text
           E2E
          /   \
     Integration
        /       \
     Widget     Contract
       /           \
      Unit + Networking
```

Most networking logic should be tested at unit level.

---

# 236. CI Pipeline

Recommended:

```text
flutter format --set-exit-if-changed
flutter analyze
dart run build_runner build --delete-conflicting-outputs
flutter test
flutter test integration_test
```

Security/static checks should also run.

---

# 237. CI Network Tests

CI should include:

- mocked API tests
- token refresh tests
- retry tests
- error mapping tests
- contract tests
- offline/sync integration tests

---

# 238. Staging Tests

Before production:

```text
Flutter staging
        ↓
Staging API
        ↓
Staging database
```

Never run test mutations against production.

---

# 239. Production Smoke Tests

After deployment:

- login
- refresh
- patient search
- appointment read
- consultation read
- prescription read
- health check

Avoid creating real clinical/financial records unless using controlled test accounts/data.

---

# 240. Feature-Level Networking Checklist

For every feature:

```text
[ ] Endpoint defined
[ ] Request DTO
[ ] Response DTO
[ ] Domain entity
[ ] Mapper
[ ] Remote datasource
[ ] Repository
[ ] Error mapping
[ ] Retry policy
[ ] Timeout policy
[ ] Idempotency policy
[ ] Concurrency policy
[ ] Offline policy
[ ] Cache policy
[ ] Cancellation policy
[ ] Tests
```

---

# 241. Authentication Checklist

```text
[ ] Login
[ ] Registration
[ ] OTP
[ ] Refresh
[ ] Logout
[ ] Token storage
[ ] Concurrent refresh
[ ] Refresh loop prevention
[ ] Session expiry
[ ] Account switching
[ ] Secure logging
```

---

# 242. Clinical Networking Checklist

```text
[ ] Patient
[ ] Encounter
[ ] Vitals
[ ] Diagnosis
[ ] Investigation
[ ] Reports
[ ] Prescription
[ ] Version checking
[ ] Conflict handling
[ ] Finalization protection
```

---

# 243. Financial Networking Checklist

```text
[ ] Payment
[ ] Receipt
[ ] Refund
[ ] Idempotency
[ ] Unknown-result reconciliation
[ ] Server-authoritative state
[ ] No blind retry
```

---

# 244. AI Networking Checklist

```text
[ ] Authorization
[ ] Context minimization
[ ] Request DTO
[ ] Async processing
[ ] Polling
[ ] Timeout
[ ] Cancellation
[ ] Output validation
[ ] No provider secrets in Flutter
[ ] AI safety labels
```

---

# 245. Offline Networking Checklist

```text
[ ] Connectivity
[ ] Local fallback
[ ] Sync queue
[ ] Idempotency
[ ] Retry
[ ] Conflict
[ ] Reconciliation
[ ] Account isolation
[ ] Chamber isolation
[ ] App restart recovery
```

---

# 246. Security Checklist

```text
[ ] HTTPS
[ ] Certificate validation
[ ] Secure tokens
[ ] Redacted logs
[ ] No secrets
[ ] No sensitive query parameters
[ ] Signed URL protection
[ ] Request authorization
[ ] Session expiry
[ ] Permission refresh
```

---

# 247. Definition of Ready

A networking feature is ready for development when:

- endpoint exists
- request contract exists
- response contract exists
- error codes exist
- HTTP status behavior exists
- authentication requirements are known
- retry policy is defined
- idempotency policy is defined
- offline behavior is defined
- concurrency behavior is defined

---

# 248. Definition of Done

A networking implementation is complete when:

- endpoint works
- DTOs are implemented
- repository integration works
- error mapping works
- retry behavior is tested
- auth refresh is tested
- request cancellation works where needed
- idempotency is implemented where required
- concurrency is handled
- offline integration works
- security checks pass
- automated tests pass
- staging integration succeeds
- documentation is updated

---

# 249. Recommended Core Classes

```text
ApiClient
DioFactory
ApiConfig
ApiEndpoints

AuthInterceptor
RequestIdInterceptor
RetryInterceptor
ErrorInterceptor
LoggingInterceptor

TokenManager
TokenStorage
TokenRefreshManager

ExceptionMapper
ApiException
ApiError

ConnectivityService
RequestPolicy
RetryPolicy

Pagination
CancelTokenManager

UploadManager
DownloadManager
```

---

# 250. Recommended Provider Graph

```text
apiConfigProvider
        ↓
dioProvider
        ↓
apiClientProvider
        ↓
remoteDataSourceProvider
        ↓
repositoryProvider
        ↓
useCaseProvider
        ↓
controllerProvider
        ↓
UI
```

Authentication:

```text
secureStorageProvider
        ↓
tokenManagerProvider
        ↓
authInterceptor
        ↓
dioProvider
```

Connectivity:

```text
connectivityServiceProvider
        ↓
connectivityProvider
        ↓
repository / sync engine
```

---

# 251. Relationship With Riverpod

Document 18 defines:

- provider lifecycle
- controllers
- invalidation
- state management
- concurrency

Document 24 defines:

- HTTP transport
- API lifecycle
- network failures
- retry
- authentication

They should remain separate.

---

# 252. Relationship With Offline Architecture

Document 23 defines:

```text
local storage
cache
mutation queue
sync
conflict
offline behavior
```

Document 24 provides:

```text
network transport
```

The sync engine consumes Document 24's API client.

---

# 253. Relationship With Security

Document 22 defines:

- token security
- sensitive data handling
- logging
- TLS
- account isolation
- chamber isolation

Document 24 implements these protections at the network boundary.

---

# 254. Relationship With Backend API

Document 10 defines:

```text
endpoint contract
```

Document 24 implements:

```text
Flutter consumption
```

Document 13 defines:

```text
NestJS implementation
```

---

# 255. End-to-End Request Example

Patient lookup:

```text
PatientScreen
 ↓
patientSearchProvider
 ↓
PatientSearchController
 ↓
SearchPatientsUseCase
 ↓
PatientRepository
 ↓
PatientRemoteDataSource
 ↓
ApiClient
 ↓
Dio
 ↓
AuthInterceptor
 ↓
RequestIdInterceptor
 ↓
NestJS
 ↓
PostgreSQL
```

Response:

```text
PostgreSQL
 ↓
NestJS
 ↓
JSON
 ↓
Dio
 ↓
ApiClient
 ↓
PatientDto
 ↓
Mapper
 ↓
Patient
 ↓
Riverpod
 ↓
UI
```

---

# 256. End-to-End Failed Request

```text
Patient Search
 ↓
Dio
 ↓
Timeout
 ↓
Retry Policy
 ↓
Retry
 ↓
Still timeout
 ↓
TimeoutFailure
 ↓
Repository
 ↓
UseCase
 ↓
Riverpod
 ↓
Error UI
```

---

# 257. End-to-End 401

```text
Request
 ↓
401
 ↓
TokenRefreshManager
 ↓
Refresh
 ↓
New token
 ↓
Retry original
 ↓
Success
```

If refresh fails:

```text
401
 ↓
Refresh failed
 ↓
Clear session
 ↓
AuthState = expired
 ↓
Router → Login
```

---

# 258. End-to-End Offline Mutation

```text
Doctor updates consultation
 ↓
Repository
 ↓
Offline
 ↓
Local Storage
 ↓
Mutation Queue
 ↓
Saved Locally
```

When online:

```text
Connectivity Restored
 ↓
Sync Engine
 ↓
Repository
 ↓
Remote Data Source
 ↓
ApiClient
 ↓
Idempotency-Key
 ↓
NestJS
 ↓
Success
 ↓
Local state reconciled
 ↓
Provider refresh
```

---

# 259. End-to-End Clinical Conflict

```text
Local encounter v7
        ↓
Sync
        ↓
Server encounter v8
        ↓
409 Conflict
        ↓
ConflictFailure
        ↓
Sync marks conflict
        ↓
Fetch server version
        ↓
Conflict UI
        ↓
Doctor reviews
        ↓
Explicit resolution
```

---

# 260. End-to-End Payment Timeout

```text
POST payment
 ↓
Timeout
 ↓
Unknown state
 ↓
DO NOT POST AGAIN blindly
 ↓
GET payment status
 ↓
PAID?
 ├── Yes → show receipt
 └── No → allow controlled retry
```

---

# 261. End-to-End Prescription Finalization Timeout

```text
POST finalize
 ↓
Timeout
 ↓
Unknown state
 ↓
GET prescription
 ↓
FINALIZED?
 ├── Yes → read-only
 └── No → controlled retry
```

---

# 262. Production Architecture Summary

```text
                   Flutter
                      │
                 Riverpod
                      │
                  UseCase
                      │
                 Repository
                      │
              Remote DataSource
                      │
                  ApiClient
                      │
       ┌──────────────┼──────────────┐
       │              │              │
      Auth          Retry         Errors
       │              │              │
       └──────────────┼──────────────┘
                      │
                     Dio
                      │
                 HTTPS/TLS
                      │
                 NestJS API
                      │
             ┌────────┴────────┐
             │                 │
        PostgreSQL         Redis/Jobs
```

Offline:

```text
Repository
    │
    ├── Remote
    │
    └── Local
          │
        Hive
          │
     Sync Engine
          │
      Mutation Queue
```

---

# 263. Final Networking Rules

### Rule 1

UI never calls Dio directly.

### Rule 2

Repositories own online/offline decisions.

### Rule 3

ApiClient owns HTTP transport.

### Rule 4

Access tokens are stored securely.

### Rule 5

Concurrent 401s share one refresh operation.

### Rule 6

Refresh failure expires the session.

### Rule 7

Retry only when the operation is safe.

### Rule 8

Retryable mutations require idempotency.

### Rule 9

Critical operations must reconcile unknown results before retry.

### Rule 10

409 clinical conflicts require explicit resolution.

### Rule 11

Payment state is always server-authoritative.

### Rule 12

Prescription finalization is always server-confirmed.

### Rule 13

AI credentials never exist in Flutter.

### Rule 14

Sensitive data never appears in logs.

### Rule 15

Offline synchronization uses the same ApiClient as normal network operations.

### Rule 16

Chamber and account isolation apply to every network request and synchronization mutation.

### Rule 17

The backend is the final authority for authorization.

### Rule 18

Technical network errors must become predictable domain failures.

### Rule 19

Network failures in one feature should not unnecessarily disable the entire application.

### Rule 20

The application must always distinguish local persistence from server confirmation.

---

# 264. Final Architecture Principle

The Chamber Management networking layer should provide:

> **A secure, predictable, observable and resilient communication boundary between Flutter and the backend that can tolerate Bangladesh's variable network conditions without sacrificing clinical or financial integrity.**

The final architecture is:

```text
                    ┌──────────────────┐
                    │   Flutter UI     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │     Riverpod      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │     Use Cases     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │    Repository     │
                    └──────┬─────┬─────┘
                           │     │
                     Local │     │ Remote
                           │     │
                    ┌──────▼─┐ ┌─▼─────────┐
                    │  Hive  │ │  ApiClient │
                    └────┬───┘ └────┬──────┘
                         │           │
                    ┌────▼────┐ ┌───▼────────┐
                    │Sync     │ │ Dio         │
                    │Engine   │ │ Interceptors│
                    └────┬────┘ └───┬────────┘
                         │           │
                         │      HTTPS/TLS
                         │           │
                         │      ┌────▼────────┐
                         └─────►│ NestJS API  │
                                └────┬─────────┘
                                     │
                              ┌──────▼──────┐
                              │ PostgreSQL  │
                              └─────────────┘
```

---

# 265. Next Recommended Document

The next logical document is:

**Document 25 — Complete Flutter Navigation, Routing, Deep Linking & Application Shell Implementation Specification**

It should define:

- GoRouter architecture
- route tree
- authentication guards
- onboarding guards
- chamber guards
- permission-aware routing
- deep links
- notification navigation
- patient/appointment/encounter deep links
- session-expiry redirects
- nested navigation
- shell routes
- bottom navigation
- tablet/desktop navigation
- browser/web routing if required
- route parameters
- query parameters
- state restoration
- navigation after mutations
- unsaved consultation protection
- back-navigation rules
- account/chamber switching
- unauthorized route handling
- 404/unknown route handling
- route analytics
- navigation testing
- relationship with Riverpod, networking, offline state and security.