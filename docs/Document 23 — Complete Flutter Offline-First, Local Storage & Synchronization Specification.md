# Document 23 — Complete Flutter Offline-First, Local Storage & Synchronization Specification

**Project:** Chamber Management  
**Platform:** Flutter  
**State Management:** Riverpod  
**Architecture:** Clean Architecture + Feature-First  
**Backend:** NestJS + PostgreSQL + Prisma  
**Local Storage:** Hive-based local persistence/cache  
**Networking:** Dio  
**Security:** flutter_secure_storage + encrypted local sensitive storage  
**Primary Language:** Dart  
**Target Market:** Bangladesh  
**Document Status:** Implementation Specification  
**Version:** 1.0

---

# 1. Purpose

This document defines the complete **offline-first, local storage, caching, synchronization, conflict-resolution, and recovery architecture** for the Chamber Management Flutter application.

The objective is to allow doctors and chamber staff to continue working during:

- poor internet connectivity
- intermittent mobile networks
- temporary server unavailability
- network switching
- application backgrounding
- application restart
- temporary offline periods

while protecting:

- patient information
- clinical records
- prescriptions
- diagnostic reports
- payments
- queue state
- chamber isolation
- user permissions
- audit history

The offline architecture must **never compromise clinical data integrity or authorization**.

---

# 2. Core Offline-First Principle

The application follows:

> **Offline-capable where safe, server-authoritative where necessary.**

Not every operation should be allowed offline.

The system classifies operations into three categories.

| Category | Offline | Example |
|---|---:|---|
| Read/cache | Yes | Patient history |
| Draft/local work | Yes | Consultation notes |
| Server-authoritative mutation | No | Finalize prescription |
| Server-authoritative financial operation | No | Payment |
| Server-authoritative queue operation | No | Call patient |
| Critical record locking | No | Lock encounter |

---

# 3. Offline Capability Matrix

## 3.1 Fully Offline-Capable

These features can work from local data:

- previously loaded patient list
- previously loaded patient profile
- patient timeline
- previously loaded clinical history
- medicine favorites
- diagnosis catalog cache
- investigation catalog cache
- chamber configuration cache
- doctor profile
- staff profile
- appointment cache
- consultation draft
- clinical notes draft
- vitals draft
- diagnosis draft
- investigation draft
- prescription draft
- AI request preparation
- UI preferences
- localization
- selected chamber
- recently accessed patients

---

# 4. Offline-Capable With Restrictions

These features can operate locally but require synchronization before becoming official records:

- new patient registration
- appointment creation
- consultation creation
- vitals recording
- clinical notes
- diagnosis selection
- investigation selection
- prescription drafting
- follow-up information

The UI must clearly identify these records as:

> **Pending Sync**

They must not be presented as permanently committed server records until synchronization succeeds.

---

# 5. Online-Only Operations

The following operations must require server connectivity:

### Queue

- check-in
- call patient
- recall patient
- skip patient
- start consultation
- complete queue entry

### Prescription

- prescription finalization
- prescription amendment
- prescription delivery confirmation

### Payment

- payment recording
- refund
- payment confirmation

### Clinical Record

- encounter locking
- finalized clinical record modification

### Security

- permission changes
- staff role changes
- account changes
- professional verification

### AI

AI processing normally requires network connectivity unless an explicitly approved on-device AI capability is introduced.

---

# 6. Architecture

```text
┌──────────────────────────────────────┐
│             Flutter UI               │
└───────────────────┬──────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│       Riverpod Controllers           │
└───────────────────┬──────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│             Use Cases                │
└───────────────────┬──────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│            Repository                │
│     Online/Offline Decision          │
└───────────────┬───────────┬──────────┘
                │           │
        Online  │           │ Offline
                ▼           ▼
       ┌────────────┐ ┌───────────────┐
       │ Remote     │ │ Local         │
       │ DataSource │ │ DataSource    │
       └─────┬──────┘ └──────┬────────┘
             │               │
             ▼               ▼
         Dio/API           Hive
             │               │
             ▼               │
      NestJS Backend         │
             │               │
             └───────┬───────┘
                     ▼
             Synchronization
                  Engine
                     │
                     ▼
             Sync Queue / Jobs
```

---

# 7. Clean Architecture Boundary

The offline implementation must not leak storage details into presentation.

Correct:

```text
Widget
  ↓
Riverpod Controller
  ↓
UseCase
  ↓
Repository
  ↓
LocalDataSource / RemoteDataSource
```

Incorrect:

```text
Widget
  ↓
Hive
```

or:

```text
Widget
  ↓
Dio
```

---

# 8. Repository Responsibility

Repositories determine whether data should come from:

- local storage
- remote API
- both

Example:

```dart
abstract class PatientRepository {
  Future<Result<List<Patient>>> getPatients();

  Future<Result<Patient>> getPatient(String patientId);

  Future<Result<Patient>> createPatient(
    CreatePatientInput input,
  );
}
```

The repository hides whether the operation is:

- online
- offline
- cached
- synchronized later

---

# 9. Local Storage Strategy

Hive is used for:

- cached API responses
- drafts
- synchronization metadata
- offline mutation queue
- application preferences
- lightweight structured local records

Sensitive tokens remain in:

```text
flutter_secure_storage
```

rather than ordinary Hive storage.

---

# 10. Local Storage Categories

Local storage is divided into:

```text
1. Session Data
2. Configuration Cache
3. Reference Data
4. Application Cache
5. Clinical Drafts
6. Sync Metadata
7. Pending Mutations
8. User Preferences
9. Temporary Files
```

---

# 11. Hive Box Architecture

Suggested boxes:

```text
auth_box
profile_box
chamber_box
patient_cache_box
appointment_cache_box
queue_cache_box
encounter_draft_box
prescription_draft_box
medicine_cache_box
diagnosis_cache_box
investigation_cache_box
report_cache_box
notification_cache_box
sync_queue_box
sync_metadata_box
settings_box
search_cache_box
```

---

# 12. Hive Box Ownership

Each box must have a clear owner.

Example:

```text
patient_cache_box
    ↓
PatientLocalDataSource

encounter_draft_box
    ↓
EncounterLocalDataSource

sync_queue_box
    ↓
SyncQueueLocalDataSource
```

No feature should directly manipulate another feature's Hive box.

---

# 13. Local Entity Design

Local models should contain synchronization metadata.

Example:

```dart
class LocalPatient {
  final String id;
  final String? serverId;

  final String name;
  final String phone;

  final SyncStatus syncStatus;

  final DateTime updatedAt;
  final DateTime? lastSyncedAt;

  final int localVersion;
  final int? serverVersion;
}
```

---

# 14. Sync Status

Use a common status model:

```dart
enum SyncStatus {
  synced,
  pendingCreate,
  pendingUpdate,
  pendingDelete,
  syncing,
  failed,
  conflict,
}
```

---

# 15. Sync Metadata

Each synchronized entity should maintain:

```text
localVersion
serverVersion
lastSyncedAt
syncStatus
lastSyncAttemptAt
lastSyncError
retryCount
```

Example:

```json
{
  "localVersion": 4,
  "serverVersion": 3,
  "syncStatus": "pendingUpdate",
  "lastSyncedAt": "2026-09-05T12:30:00Z"
}
```

---

# 16. Local IDs vs Server IDs

Offline-created records require temporary IDs.

Use UUIDs.

Example:

```text
local ID:
550e8400-e29b-41d4-a716-446655440000
```

The same ID can preferably be accepted by the backend as the idempotency/client reference where architecture permits.

Otherwise:

```text
localId → serverId
```

mapping must be maintained.

---

# 17. Client Mutation ID

Every offline mutation must have a unique ID.

```text
mutationId = UUID
```

Example:

```json
{
  "mutationId": "8b3d...",
  "operation": "CREATE_PATIENT",
  "entityId": "550e...",
  "createdAt": "2026-09-05T12:00:00Z"
}
```

This prevents duplicate processing.

---

# 18. Idempotency

All synchronization mutations should support:

```http
Idempotency-Key: <mutationId>
```

This is particularly important when:

- network disconnects after request transmission
- client retries
- application restarts
- background sync repeats

---

# 19. Pending Mutation Queue

Offline writes are stored in a durable queue.

Example:

```dart
class PendingMutation {
  final String mutationId;
  final String entityType;
  final String entityId;
  final MutationType operation;

  final Map<String, dynamic> payload;

  final DateTime createdAt;

  final int retryCount;

  final SyncStatus status;

  final String? lastError;
}
```

---

# 20. Mutation Types

```dart
enum MutationType {
  create,
  update,
  delete,
  action,
}
```

Examples:

```text
CREATE_PATIENT
UPDATE_PATIENT
CREATE_APPOINTMENT
CREATE_ENCOUNTER
UPDATE_ENCOUNTER
CREATE_VITAL
CREATE_PRESCRIPTION_DRAFT
```

---

# 21. Mutation Ordering

Mutations must preserve dependency order.

Example:

```text
Create Patient
      ↓
Create Appointment
      ↓
Create Encounter
      ↓
Save Vitals
      ↓
Save Diagnosis
      ↓
Save Prescription
```

Do not synchronize a dependent entity before its parent exists.

---

# 22. Dependency Graph

Each pending mutation may optionally contain:

```text
dependsOnMutationId
```

Example:

```text
M1 Create Patient
M2 Create Appointment → dependsOn M1
M3 Create Encounter → dependsOn M2
M4 Save Vitals → dependsOn M3
```

---

# 23. Sync Queue Processing

The synchronization engine should:

1. load pending mutations
2. validate authentication
3. validate chamber context
4. resolve dependencies
5. send mutation
6. process response
7. update local state
8. mark mutation successful
9. continue next mutation

---

# 24. Sync Engine

Suggested interface:

```dart
abstract class SyncEngine {
  Future<void> sync();

  Future<void> syncEntity(String entityId);

  Future<void> retryFailed();

  Future<void> cancelPending(String mutationId);
}
```

---

# 25. Sync Manager

Recommended Riverpod provider:

```dart
final syncManagerProvider =
    AsyncNotifierProvider<SyncManager, SyncState>(
  SyncManager.new,
);
```

State:

```dart
class SyncState {
  final bool isSyncing;
  final int pendingCount;
  final int failedCount;
  final DateTime? lastSyncAt;
  final SyncError? error;
}
```

---

# 26. Connectivity Detection

Use a connectivity service.

Possible states:

```dart
enum ConnectivityStatus {
  online,
  offline,
  unknown,
}
```

Connectivity should not be interpreted as guaranteed internet access.

For example:

```text
Wi-Fi connected
        ≠
Internet available
```

A lightweight API health check can confirm actual backend reachability when required.

---

# 27. Connectivity Provider

```dart
final connectivityProvider =
    StreamProvider<ConnectivityStatus>((ref) {
  return ref.watch(connectivityServiceProvider).statusStream;
});
```

---

# 28. Offline Detection Rules

The application should enter offline mode when:

- connectivity is unavailable
- repeated network failures occur
- API health check fails
- timeout thresholds are exceeded

The application should not switch to offline mode merely because one request returned HTTP 500.

---

# 29. Online Recovery

When connectivity returns:

```text
Connectivity Restored
        ↓
Check Authentication
        ↓
Check Chamber
        ↓
Refresh Permissions
        ↓
Sync Pending Mutations
        ↓
Refresh Critical Data
        ↓
Update UI
```

---

# 30. Automatic Sync Triggers

Synchronization can be triggered by:

- application startup
- login
- chamber selection
- connectivity restoration
- application resume
- manual "Sync Now"
- periodic background task
- successful mutation
- returning to dashboard

---

# 31. Background Synchronization

Background synchronization should be treated as an optimization.

The application must not depend on background execution for clinical correctness.

Platform restrictions may prevent background execution.

Therefore:

> Foreground synchronization remains the guaranteed mechanism.

---

# 32. Manual Sync

Provide:

```text
Settings → Data & Sync → Sync Now
```

Display:

```text
Syncing...
12 items remaining
```

Success:

```text
Everything is up to date
```

Failure:

```text
Some changes could not be synchronized
[Retry]
```

---

# 33. Sync Status UI

Global app shell should expose subtle sync state:

```text
● Synced
↻ Syncing
⚠ Pending
✕ Sync failed
```

Do not display technical errors to ordinary users.

---

# 34. Offline Banner

Example:

```text
You're offline. Changes will be saved and synced when connection returns.
```

The banner should not block cached reads or safe drafts.

---

# 35. Critical Offline Warning

For online-only operations:

```text
Internet connection required

This action requires a secure connection to the server.

[Retry]
```

---

# 36. Local Cache Policy

Each feature must define:

```text
cache duration
cache size
cache priority
offline availability
invalidation rule
```

---

# 37. Cache Classes

Use:

### Hot Cache

Recently accessed information.

Examples:

- today's queue
- current patient
- current consultation

### Warm Cache

Recently used information.

Examples:

- recent patients
- recent appointments
- recent prescriptions

### Cold Cache

Reference information.

Examples:

- medicine catalog
- diagnosis catalog
- investigation catalog

---

# 38. Patient Cache

Patient information is sensitive.

Cache only what is necessary.

Recommended:

```text
recent patients
currently selected patient
patients required for active appointments
recent timeline
```

Avoid caching the entire lifetime patient database unnecessarily.

---

# 39. Patient Cache Retention

Recommended initial policy:

```text
Recently accessed patients:
7–30 days

Active consultation:
until consultation completed + sync confirmed

Reference catalogs:
longer TTL

Sensitive temporary data:
shortest practical retention
```

Exact retention should be configurable and aligned with privacy requirements.

---

# 40. Chamber Isolation

Local storage must be chamber-aware.

Never use:

```text
patient_123
```

as the sole cache key.

Use:

```text
chamber_<chamberId>_patient_<patientId>
```

or equivalent namespacing.

---

# 41. User Isolation

Cache keys must also be scoped by account where appropriate.

Recommended:

```text
<userId>:<chamberId>:<entity>:<entityId>
```

Example:

```text
userA:chamber1:patient:patient123
```

---

# 42. Account Switching

When switching accounts:

1. stop synchronization
2. cancel active requests
3. clear previous user's sensitive cache
4. clear pending mutations belonging to previous account or safely retain them in isolated storage
5. clear selected chamber
6. clear AI context
7. clear local patient cache
8. initialize new account storage

Never display previous-user data after account switching.

---

# 43. Chamber Switching

When switching chambers:

```text
Stop active chamber sync
        ↓
Persist new chamber ID
        ↓
Clear chamber-scoped transient state
        ↓
Invalidate chamber providers
        ↓
Load new chamber cache
        ↓
Refresh server data
        ↓
Resume synchronization
```

---

# 44. Cross-Chamber Protection

A mutation must contain:

```text
userId
chamberId
entityId
```

Before synchronization:

```text
Authenticated user == mutation owner
AND
Selected/authorized chamber == mutation chamber
```

If not:

```text
REJECT
```

---

# 45. Permission Changes

Permissions are server-authoritative.

Before sensitive synchronization:

```text
Validate current permission
```

Example:

A receptionist may create a patient but cannot finalize a prescription.

Even if the local UI previously allowed an action, the backend remains authoritative.

---

# 46. Offline Patient Creation

Patient creation can be supported offline.

Workflow:

```text
Register Patient
      ↓
Generate local UUID
      ↓
Save local patient
      ↓
Mark Pending Sync
      ↓
Add CREATE_PATIENT mutation
      ↓
Show patient immediately
      ↓
Sync later
```

---

# 47. Offline Duplicate Detection

Offline duplicate detection is only advisory.

Possible matching:

- phone number
- patient ID
- name + date of birth
- normalized name

Display:

```text
Possible duplicate
```

Do not claim uniqueness until server validation succeeds.

---

# 48. Offline Appointment Creation

Appointment can be locally drafted.

However, final server acceptance depends on:

- doctor schedule
- chamber availability
- appointment conflicts
- other bookings

Therefore:

```text
Local:
Appointment Pending

After Sync:
Confirmed / Rejected / Conflict
```

---

# 49. Offline Queue

The queue is **not fully offline-capable**.

Reason:

Multiple staff devices may modify the queue simultaneously.

Example:

```text
Receptionist A → calls patient 10
Receptionist B → calls patient 11
Doctor → completes patient 10
```

A local queue cannot safely determine global ordering.

Therefore queue mutations require server confirmation.

---

# 50. Offline Consultation

Consultation is the most important offline workflow.

The doctor may continue working with an active consultation if connectivity disappears.

Allowed:

- view cached patient context
- record vitals
- write notes
- select diagnosis
- select investigations
- build prescription draft
- add follow-up notes

These remain local until synchronized.

---

# 51. Consultation Draft

Local consultation state:

```text
DRAFT
```

Synchronization state:

```text
LOCAL_ONLY
PENDING_SYNC
SYNCED
CONFLICT
```

---

# 52. Consultation Autosave

Autosave locally:

```text
500–1500 ms debounce
```

Example:

```text
Doctor types note
      ↓
Debounce
      ↓
Save local draft
      ↓
UI: Saved locally
```

This must work even without internet.

---

# 53. Local Draft Indicator

Display:

```text
Saved locally • Waiting for connection
```

Online:

```text
Saved
```

Synchronizing:

```text
Saving to server...
```

---

# 54. Consultation Recovery

If the application crashes:

```text
Open consultation
      ↓
Find local draft
      ↓
Compare server version
      ↓
Restore draft
```

Display:

```text
Unsynced local changes found
[Restore] [Discard]
```

Never silently discard clinical notes.

---

# 55. Consultation Conflict

A conflict can occur when:

```text
Device A edits encounter
Device B edits same encounter
```

or:

```text
Server version changed
while local draft is pending
```

Clinical records must not use silent last-write-wins.

---

# 56. Conflict Strategy

For clinical records:

> **Detect → preserve both → require user decision.**

Example:

```text
Server Version
Local Version
```

Allow:

```text
Keep Local
Keep Server
Merge
Review Differences
```

Where automated merge is unsafe, require manual review.

---

# 57. Version Checking

Every mutable clinical resource should preferably contain:

```text
version
updatedAt
updatedBy
```

Client sends:

```http
If-Match: <version>
```

or equivalent version field.

Server returns:

```text
409 Conflict
```

when versions differ.

---

# 58. Clinical Data Conflict Rule

Never:

```text
local data silently overwrites server data
```

Never:

```text
server data silently overwrites local clinical draft
```

---

# 59. Prescription Draft Offline

Prescription drafting may work offline.

Doctor can:

- add medicines
- edit dose
- edit frequency
- edit duration
- add instructions
- add notes

The draft remains:

```text
DRAFT
```

until synchronized.

---

# 60. Prescription Finalization

Prescription finalization requires:

```text
Authenticated session
+
Valid permission
+
Current encounter
+
Current prescription version
+
Server connectivity
```

Only then:

```text
FINALIZED
```

---

# 61. Finalization Failure

If finalization fails:

```text
Prescription remains editable draft
```

Never display:

```text
Finalized
```

until the backend confirms success.

---

# 62. Payment Offline Rule

Payment recording requires server connectivity.

Reason:

- financial integrity
- duplicate transaction prevention
- receipt numbering
- refund tracking
- audit trail

Offline UI may prepare a payment form but cannot mark it as paid.

---

# 63. AI Offline Rule

Default:

```text
AI requires connectivity
```

If offline:

```text
AI assistant unavailable while offline.
```

The user can continue manually.

---

# 64. Offline AI Request Queue

AI requests should generally **not** be blindly queued for later processing.

Reasons:

- clinical context may change
- authorization may change
- encounter may be completed
- stale patient context may become unsafe

Prefer:

```text
Retry AI request manually after reconnecting
```

---

# 65. Diagnostic Reports

Previously downloaded reports may be viewed offline.

New uploads require network connectivity unless an explicitly designed local upload queue is introduced.

Large medical files should not be automatically cached indefinitely.

---

# 66. File Storage

Use:

```text
Temporary local file
        ↓
Encrypted/private storage
        ↓
Upload when online
        ↓
Server confirms
        ↓
Remove temporary copy
```

Do not retain unnecessary copies.

---

# 67. File Upload Queue

For supported offline upload workflows:

```text
PENDING_UPLOAD
UPLOADING
UPLOADED
FAILED
```

Each upload must include:

```text
fileId
entityId
chamberId
userId
checksum
file size
mime type
```

---

# 68. File Security

Do not trust:

- file extension
- MIME type from client
- filename

Server must validate:

- content type
- file signature
- file size
- authorization
- malware/security policy where applicable

---

# 69. Cache Invalidation

Mutation should invalidate affected caches.

Example:

```text
Create Patient
    ↓
patientsProvider
patientSearchProvider
dashboardProvider
```

Appointment:

```text
Create Appointment
    ↓
appointmentsProvider
patientTimelineProvider
dashboardProvider
```

---

# 70. Clinical Invalidation

Encounter update:

```text
encounter
patient timeline
dashboard
prescription
follow-up
```

Prescription finalization:

```text
prescription
encounter
patient timeline
dashboard
```

Payment:

```text
payment
receipt
dashboard
revenue analytics
```

---

# 71. Stale-While-Revalidate

For non-critical reads:

```text
Load cached data immediately
        ↓
Display cached data
        ↓
Fetch server data
        ↓
Update local cache
        ↓
Refresh UI
```

Example:

Patient list.

UI may display:

```text
Showing recently cached patients
Refreshing...
```

---

# 72. Cache-First Strategy

Suitable for:

- reference catalogs
- medicine favorites
- diagnosis catalog
- investigation catalog
- UI configuration

---

# 73. Network-First Strategy

Suitable for:

- dashboard
- queue
- appointment availability
- permissions
- payment state
- prescription finalization
- encounter locking

---

# 74. Local-Only Strategy

Suitable for:

- UI preferences
- theme
- language
- draft typing state
- temporary form state

---

# 75. Sync Strategy by Feature

| Feature | Read | Draft Offline | Mutation Offline | Server Required |
|---|---:|---:|---:|---:|
| Patient | Yes | Yes | Yes* | Final validation |
| Appointment | Yes | Yes | Limited | Final acceptance |
| Queue | Yes/cache | No | No | Yes |
| Consultation | Yes | Yes | Yes | Final commit |
| Vitals | Yes | Yes | Yes | Final commit |
| Diagnosis | Yes | Yes | Yes | Final commit |
| Investigation | Yes | Yes | Yes | Final commit |
| Prescription | Yes | Yes | Draft only | Finalization |
| Payment | Yes | Form only | No | Yes |
| AI | Cache result | No | No | Yes |
| Reports | Yes | No | Limited | Upload/download |
| Notifications | Cache | No | No | Yes |

\* Subject to server duplicate/conflict validation.

---

# 76. Sync Retry Policy

Use exponential backoff.

Example:

```text
1st retry: 2 sec
2nd retry: 5 sec
3rd retry: 15 sec
4th retry: 30 sec
5th retry: 60 sec
```

Add jitter.

After repeated failures:

```text
FAILED
```

and require later retry.

---

# 77. Retryable Errors

Retry:

- network timeout
- connection reset
- temporary DNS failure
- HTTP 502
- HTTP 503
- HTTP 504
- rate limiting with Retry-After

Do not automatically retry:

- validation failure
- forbidden
- unauthorized after refresh failure
- not found
- business rule violation
- clinical conflict
- invalid prescription

---

# 78. Sync Error Classification

```dart
enum SyncFailureType {
  network,
  authentication,
  authorization,
  validation,
  conflict,
  notFound,
  server,
  rateLimit,
  unknown,
}
```

---

# 79. Permanent vs Temporary Failure

### Temporary

```text
Network unavailable
Server unavailable
Timeout
Rate limited
```

### Permanent

```text
Invalid data
Permission denied
Record no longer exists
Clinical conflict
Business rule failure
```

Permanent failures should not endlessly retry.

---

# 80. Failed Mutation UI

Example:

```text
3 changes need attention
```

Tap:

```text
Sync Issues
```

Display:

```text
Patient update
Could not be saved because the record was changed elsewhere.

[Review]
```

---

# 81. Sync Queue Persistence

The queue must survive:

- app restart
- app crash
- OS process termination
- temporary logout where safe
- device restart

Do not keep the only copy in memory.

---

# 82. App Startup Recovery

Startup:

```text
Initialize Storage
       ↓
Load Session
       ↓
Load Selected Chamber
       ↓
Initialize Connectivity
       ↓
Recover Drafts
       ↓
Recover Pending Mutations
       ↓
Initialize Sync Engine
       ↓
Authenticate
       ↓
Sync
```

---

# 83. Crash Recovery

After crash:

1. recover persisted drafts
2. recover pending mutations
3. recover sync state
4. discard only known temporary state
5. validate session
6. resume safely

---

# 84. Draft Recovery Rules

Never restore a draft into a different:

- user
- chamber
- patient
- encounter

without explicit validation.

---

# 85. Data Encryption

Sensitive local data should be encrypted.

At minimum:

- access/refresh tokens → secure storage
- sensitive clinical drafts → encrypted local storage
- patient cache → encrypted or protected storage strategy
- AI context → protected storage
- temporary medical files → private application storage

---

# 86. Encryption Key Strategy

Encryption keys must not be hardcoded.

Use platform-secure key material where possible.

Example architecture:

```text
Android Keystore
iOS Keychain
       ↓
Encryption Key
       ↓
Encrypted Local Store
```

---

# 87. Logout

Logout must:

```text
stop sync
cancel requests
clear auth state
clear sensitive cache
clear chamber cache
clear patient cache
clear AI context
clear temporary files
```

Pending unsynced clinical data requires special handling.

Before destructive logout:

```text
Unsynced changes detected

You have 3 unsynchronized changes.

[Sync Now]
[Keep Securely]
[Cancel]
```

Do not silently destroy clinical drafts.

---

# 88. Session Expiration During Sync

If API returns:

```text
401
```

then:

1. attempt token refresh
2. retry safely
3. if refresh fails, stop sync
4. preserve encrypted pending data
5. require login
6. after successful login, validate ownership before resuming

---

# 89. Authorization Failure During Sync

If:

```text
403
```

do not retry endlessly.

Mark:

```text
ACTION_NOT_AUTHORIZED
```

Require user intervention.

---

# 90. Server Record Deleted

If local mutation targets a deleted server record:

```text
404
```

Do not recreate automatically.

Display:

```text
This record is no longer available on the server.
```

For clinical records, preserve local evidence for review rather than silently discarding it.

---

# 91. Time Synchronization

All server timestamps use:

```text
UTC
```

Flutter renders using:

```text
Asia/Dhaka
```

Local device time must not be trusted for authoritative ordering.

---

# 92. Offline Date Handling

Offline-created data may have:

```text
clientCreatedAt
```

and eventually:

```text
serverCreatedAt
```

The server timestamp is authoritative.

---

# 93. Queue Date

Queue business date must be calculated by chamber timezone.

Do not calculate queue date from UTC alone.

For Bangladesh:

```text
Asia/Dhaka
```

---

# 94. Search Offline

Patient search can search local cache.

Search fields:

- name
- phone
- patient ID

Use normalized forms for:

- Bangla
- English
- phone numbers

---

# 95. Search Strategy

Online:

```text
Local cache + server search
```

Offline:

```text
Local search only
```

Display:

```text
Offline results may not include recently registered patients.
```

---

# 96. Bangla Search

Normalize:

- Unicode
- whitespace
- punctuation
- common phone formats

The local search engine should support both:

```text
বাংলা নাম
English name
```

---

# 97. Reference Data Synchronization

Reference catalogs include:

- medicines
- diagnoses
- investigations
- dosage units
- frequency options
- routes
- appointment types

These can be periodically synchronized.

---

# 98. Reference Data Version

Use:

```text
catalogVersion
```

Example:

```json
{
  "medicineCatalogVersion": 24,
  "diagnosisCatalogVersion": 11
}
```

Client requests updates only when version differs.

---

# 99. Delta Synchronization

Where practical, synchronize changes rather than downloading entire datasets.

Example:

```text
Current Version: 100
Server Version: 105
```

Download:

```text
101
102
103
104
105
```

rather than full catalog.

---

# 100. Sync Cursor

For large datasets, use a cursor:

```text
lastSyncCursor
```

Example:

```json
{
  "cursor": "eyJ0cyI6..."
}
```

---

# 101. Server Change Feed

Future backend support can expose:

```text
GET /sync/changes?cursor=...
```

Response:

```json
{
  "changes": [],
  "nextCursor": "..."
}
```

This allows scalable synchronization.

---

# 102. Full Sync

A full sync should be available for recovery.

Use cases:

- corrupted cache
- reinstall recovery
- schema migration
- major server version change

It must not download unrestricted patient history by default.

---

# 103. Sync Scope

Sync should preferably be scoped to:

```text
user
+
chamber
+
recent data
+
active work
```

rather than the entire database.

---

# 104. Sync Priority

Priority:

```text
P0
Active consultation
Clinical drafts

P1
Patient
Appointment

P2
Reference data

P3
Analytics
Historical cache
```

---

# 105. Sync While Consultation Active

If a consultation is active:

```text
Current encounter
patient context
vitals
notes
diagnosis
prescription draft
```

receive highest sync priority.

---

# 106. Sync Concurrency

Do not execute unlimited mutations simultaneously.

Recommended:

```text
1–3 concurrent mutations
```

depending on dependency relationships.

Clinical mutations should generally preserve order.

---

# 107. Duplicate Prevention

A mutation should be considered successful only when:

- backend confirms success
- local state updated
- mutation marked completed

If response is lost after server processing:

```text
retry with same Idempotency-Key
```

The server should return the original result.

---

# 108. Sync Transaction Boundaries

The client should update local sync metadata atomically.

Example:

```text
Server success
     ↓
Update local entity
     ↓
Mark mutation complete
     ↓
Remove/retain audit metadata
```

Avoid state where:

```text
server succeeded
but local mutation remains indefinitely pending
```

unless recovery can safely reconcile it.

---

# 109. Local Transaction Strategy

Where supported, related local updates should be transactional.

Example:

```text
Update Patient
+
Remove Pending Mutation
+
Update Sync Metadata
```

must behave as one logical operation.

---

# 110. Repository Read Strategy

Example:

```dart
Future<Result<Patient>> getPatient(String id) async {
  final local = await localDataSource.get(id);

  if (local != null) {
    unawaited(refreshFromServer(id));
    return Success(local.toDomain());
  }

  if (await connectivity.isOnline()) {
    return remoteDataSource.getPatient(id);
  }

  return Failure(CacheMissFailure());
}
```

The exact implementation may vary by feature.

---

# 111. Repository Write Strategy

For safe offline writes:

```text
Validate locally
      ↓
Save local state
      ↓
Create mutation
      ↓
If online → synchronize
      ↓
If offline → remain pending
```

---

# 112. Optimistic Updates

Optimistic updates are allowed only for safe local state.

Examples:

- favorite medicine
- local draft
- UI preference

Avoid optimistic confirmation for:

- payment
- prescription finalization
- queue actions
- encounter locking

---

# 113. Clinical Optimistic Rule

For clinical records:

```text
Local draft ≠ Server confirmation
```

UI must communicate the distinction.

---

# 114. Riverpod Integration

Recommended providers:

```text
connectivityProvider
syncManagerProvider
syncQueueProvider
syncStatusProvider
offlineModeProvider
cacheManagerProvider
localStorageProvider
```

Feature providers depend on repositories, not directly on sync internals.

---

# 115. Sync Provider Example

```dart
final syncStatusProvider = Provider<SyncStatus>((ref) {
  return ref.watch(syncManagerProvider).valueOrNull?.status
      ?? SyncStatus.idle;
});
```

---

# 116. Connectivity-Aware Controller

Controllers should inspect repository results rather than manually branching everywhere.

Prefer:

```text
Controller
  ↓
UseCase
  ↓
Repository
```

over:

```text
Controller
  ↓
if offline
  ↓
Hive
else
  ↓
Dio
```

---

# 117. Offline State Model

Recommended:

```dart
enum DataSource {
  local,
  remote,
  mixed,
}
```

UI can display:

```text
DataSource.local
```

as:

```text
Offline data
```

---

# 118. Async State

Use Riverpod `AsyncValue` together with sync metadata.

Example:

```dart
class PatientListState {
  final List<Patient> patients;
  final DataSource source;
  final bool isRefreshing;
  final int pendingChanges;
}
```

---

# 119. Offline Search Provider

```text
patientSearchProvider
       ↓
connectivityProvider
       ↓
PatientRepository
       ↓
local search / remote search
```

Search should never directly query Hive from UI.

---

# 120. Autosave Architecture

```text
TextField
   ↓
Controller
   ↓
Debounce
   ↓
Draft UseCase
   ↓
Local Repository
   ↓
Hive
```

Server synchronization happens separately.

---

# 121. Autosave Status

Use:

```dart
enum DraftSaveStatus {
  idle,
  saving,
  savedLocally,
  syncing,
  synced,
  failed,
}
```

UI:

```text
Saving...
Saved locally
Syncing...
Saved
```

---

# 122. Draft Debouncing

Recommended:

```text
500–1500 ms
```

Avoid saving on every keystroke.

For critical field changes, immediate local persistence may be appropriate.

---

# 123. Local Draft Versioning

Each draft should contain:

```text
draftVersion
lastEditedAt
serverVersion
```

Example:

```text
Draft Version: 8
Server Version: 7
```

---

# 124. Conflict Resolution UI

Example:

```text
This consultation was updated elsewhere.

Your changes:
• Headache for 3 days
• BP 140/90

Server changes:
• Headache for 5 days
• BP 135/85

[Keep Mine]
[Keep Server]
[Review & Merge]
```

---

# 125. Merge Policy

Automatic merging is acceptable only for clearly independent fields.

Example:

```text
Local note changed
Server weight changed
```

Potential safe merge:

```text
note = local
weight = server
```

But overlapping clinical text should require review.

---

# 126. Prescription Conflict

Prescription conflicts require stricter handling.

If another user modifies the prescription:

```text
Do not automatically merge medicine items.
```

Require review.

---

# 127. Finalized Record Conflict

Finalized records are immutable.

If a local pending mutation targets a finalized record:

```text
Reject mutation
```

and preserve the local data for user review.

---

# 128. Amendment Workflow

Corrections to finalized prescriptions use:

```text
Amend
```

rather than updating the finalized record.

The server creates a new amendment/version.

---

# 129. Sync Audit

Every synchronized mutation should be traceable through backend audit logs.

Client should include:

```text
requestId
mutationId
device/session metadata where appropriate
```

Never include unnecessary patient content in logs.

---

# 130. Logging Rules

Never log:

```text
access token
refresh token
password
OTP
patient clinical notes
full prescription
AI prompt containing patient data
AI response containing patient data
medical report contents
```

Safe:

```text
mutationId
requestId
operation type
status
duration
error category
```

---

# 131. Offline Analytics

Analytics events can be queued locally.

Examples:

```text
screen_view
button_click
sync_started
sync_completed
```

But analytics must never contain clinical content.

---

# 132. Crash Reporting

Crash reports must avoid:

- patient names
- patient IDs where unnecessary
- prescription details
- clinical notes
- tokens
- AI content

Use anonymized technical identifiers.

---

# 133. Local Storage Size Management

The application should monitor:

```text
cache size
draft size
file cache
sync queue size
```

---

# 134. Cache Eviction

Evict:

1. expired cache
2. old search results
3. old non-critical records
4. temporary files

Never automatically evict:

- unsynced clinical drafts
- pending clinical mutations
- unresolved conflicts

unless explicitly handled by the user.

---

# 135. Storage Pressure

If device storage becomes low:

```text
Remove temporary cache
```

before:

```text
Remove clinical drafts
```

Clinical drafts require explicit user action.

---

# 136. Local Database Migration

When Hive/local schema changes:

```text
detect schema version
      ↓
run migration
      ↓
verify
      ↓
mark migrated
```

Never simply delete local data during a normal application update.

---

# 137. Migration Failure

If migration fails:

```text
Backup local data
      ↓
Prevent destructive migration
      ↓
Report technical error
      ↓
Attempt recovery
```

---

# 138. App Reinstallation

Reinstallation may destroy local data.

Therefore important server data must not depend solely on local storage.

Users should be informed:

```text
Unsynced changes cannot be recovered after uninstalling the app.
```

when applicable.

---

# 139. Backup Strategy

Server database remains the authoritative backup.

Local device storage is not considered a reliable backup.

Future encrypted export may provide additional user-controlled backup.

---

# 140. Cloud Drive Backup

If cloud-drive backup is introduced later:

- encrypt sensitive export
- require explicit user action
- do not silently upload medical data
- clearly explain what is included
- support restore validation

---

# 141. Offline Security Boundary

Offline mode must never bypass backend authorization.

Example:

```text
Local UI says:
"You can perform this action."

Server says:
"Forbidden."

Server wins.
```

---

# 142. Device Trust

A logged-in device should not be considered permanently trusted.

Use:

- session expiration
- optional biometric unlock
- secure storage
- auto-lock
- remote session revocation where supported

---

# 143. Background Privacy

When application enters background:

- obscure sensitive content where supported
- avoid exposing patient information in app switcher previews
- pause sensitive workflows where appropriate

---

# 144. Notification Privacy

Offline/sync notifications should not contain:

```text
patient diagnosis
medicine
clinical notes
```

Use:

```text
"3 changes need attention"
```

instead.

---

# 145. Offline Accessibility

Offline state must be communicated through:

- text
- icon
- status indicator

Do not rely only on color.

---

# 146. Offline Localization

Support:

```text
English
বাংলা
```

Examples:

English:

```text
Offline
Changes saved locally
Waiting for connection
```

Bangla:

```text
অফলাইন
পরিবর্তন স্থানীয়ভাবে সংরক্ষিত হয়েছে
ইন্টারনেট সংযোগের অপেক্ষায়
```

---

# 147. Sync UX Principle

The application should feel reliable rather than technical.

Avoid:

```text
HTTP 503
Queue mutation failed
Hive box unavailable
```

Prefer:

```text
Couldn't sync this change.
We'll try again when the connection is available.
```

---

# 148. User-Controlled Sync

Provide:

```text
Sync Now
Retry
Review Changes
Discard Draft
```

when appropriate.

Never automatically discard clinical work.

---

# 149. Sync Dashboard

Optional advanced screen:

```text
Data & Sync

Connection       Online
Last Sync        2 minutes ago
Pending Changes  3
Failed Changes   0

[Sync Now]
[View Sync Details]
```

---

# 150. Sync Detail Screen

Show:

```text
3 Pending Changes

Patient Registration     Pending
Consultation Notes       Syncing
Appointment              Failed
```

Do not expose sensitive clinical details unnecessarily.

---

# 151. Conflict Dashboard

Display:

```text
1 item needs review
```

Then:

```text
Consultation updated elsewhere
```

with controlled clinical review.

---

# 152. Offline Indicator Priority

Global status:

```text
Offline
Pending Sync
Syncing
Synced
Sync Error
```

The indicator should remain subtle unless action is required.

---

# 153. API Requirements for Offline Architecture

Backend should support:

- idempotency keys
- UUID client identifiers
- resource versioning
- optimistic concurrency
- conflict responses
- server timestamps
- mutation result replay
- audit logging
- change cursors
- scoped synchronization
- permission validation

---

# 154. Recommended Sync API Extensions

Existing API can be extended with:

```http
POST /sync/mutations
GET /sync/changes
GET /sync/status
```

or feature-specific idempotent endpoints can be retained.

---

# 155. Mutation API Example

```http
POST /patients
Idempotency-Key: 550e8400...
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "patient-server-id"
  },
  "requestId": "req-123"
}
```

---

# 156. Conflict API Example

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_VERSION_CONFLICT",
    "message": "The encounter was modified by another user.",
    "details": {
      "serverVersion": 8,
      "clientVersion": 7
    }
  },
  "requestId": "req-456"
}
```

---

# 157. Sync Response Requirements

A successful mutation should ideally return:

```text
server entity
server version
server timestamp
requestId
```

This allows the client to reconcile local state.

---

# 158. Server Authority

The server remains authoritative for:

- permissions
- patient identity
- appointment conflicts
- queue position
- payment state
- prescription finalization
- encounter locking
- finalized clinical data
- audit history

---

# 159. Offline Authority

The device is authoritative only for:

- temporary drafts
- unsynchronized local work
- UI preferences
- cached reference data

---

# 160. Offline Patient Timeline

Timeline can display cached history.

Label:

```text
Last synchronized: 10 minutes ago
```

If offline:

```text
Some recent activity may not be shown.
```

---

# 161. Offline Dashboard

Dashboard can display:

```text
Cached data
```

but must identify stale information.

For example:

```text
Today's revenue
Last updated 15 minutes ago
```

---

# 162. Offline Queue Dashboard

Display cached queue as:

```text
Last synchronized queue
```

Do not allow critical queue actions while offline.

---

# 163. Offline Appointment Calendar

Cached appointments can be displayed.

Creation/editing may be saved as pending.

Appointment conflicts are resolved when synchronized.

---

# 164. Offline Patient Registration UX

After registration:

```text
Patient created locally

Patient ID:
TMP-20260905-001

Waiting for synchronization.
```

After successful sync:

```text
Patient synchronized

Patient ID:
P-000123
```

---

# 165. Temporary Business IDs

Offline records may require temporary identifiers:

```text
TMP-...
```

Never present temporary IDs as permanent medical record identifiers.

---

# 166. Local-to-Server ID Mapping

Maintain:

```text
localId
serverId
```

Mapping table:

```text
localPatientId → serverPatientId
```

Dependent mutations must automatically resolve the server ID after synchronization.

---

# 167. Temporary ID Dependency Example

```text
Local Patient:
TMP-P1

Local Appointment:
TMP-A1
patientId = TMP-P1
```

After sync:

```text
TMP-P1 → P-1001
TMP-A1 → A-2001
```

The appointment mutation must use:

```text
P-1001
```

after patient creation succeeds.

---

# 168. Sync Dependency Resolver

Implement:

```dart
abstract class MutationDependencyResolver {
  Future<ResolvedMutation> resolve(
    PendingMutation mutation,
  );
}
```

It maps temporary IDs to server IDs.

---

# 169. Synchronization State Machine

```text
PENDING
   ↓
READY
   ↓
SYNCING
   ↓
SUCCESS
```

Failure:

```text
SYNCING
   ↓
RETRYABLE_FAILURE
   ↓
READY
```

Permanent:

```text
SYNCING
   ↓
FAILED
```

Conflict:

```text
SYNCING
   ↓
CONFLICT
   ↓
USER_REVIEW
   ↓
RESOLVED
```

---

# 170. Sync Engine State

```dart
enum SyncEngineStatus {
  idle,
  syncing,
  completed,
  hasPending,
  hasErrors,
  hasConflicts,
}
```

---

# 171. Sync Events

Possible events:

```text
ConnectivityChanged
SyncRequested
SyncStarted
MutationStarted
MutationSucceeded
MutationFailed
ConflictDetected
SyncCompleted
```

---

# 172. Riverpod Event Handling

Use `ref.listen` for side effects.

Examples:

```text
connectivityProvider
    ↓
ref.listen
    ↓
syncManager.sync()
```

Avoid triggering synchronization from every widget.

---

# 173. Prevent Duplicate Sync Runs

Use a synchronization lock:

```dart
bool _syncInProgress = false;
```

or an async mutex.

If sync already runs:

```text
do not start another full sync
```

---

# 174. Sync Coalescing

If multiple triggers occur:

```text
resume
+
connectivity restored
+
manual sync
```

combine them into one synchronization cycle.

---

# 175. Request Cancellation

When:

- account switches
- chamber switches
- logout occurs

cancel non-critical requests.

Pending durable mutations remain persisted.

---

# 176. Chamber Sync Scope

Sync engine must receive:

```text
userId
chamberId
```

and synchronize only authorized data.

---

# 177. Patient Shared Identity

Because patients may theoretically be associated with multiple chambers, local storage should distinguish:

```text
global patient identity
```

from:

```text
chamber patient relationship
```

The offline cache must respect the backend authorization model.

---

# 178. Clinical Record Chamber Scope

Clinical records must remain chamber-scoped.

Local storage should never infer access merely because it has a patient ID.

---

# 179. Local Authorization Metadata

Cache permission information only as a UI optimization.

Never use stale permissions as final authority.

Before sensitive server mutation:

```text
server authorization
```

wins.

---

# 180. Sync After Permission Change

If server permission changes:

```text
403
```

then:

1. mark mutation unauthorized
2. refresh permissions
3. notify user
4. stop retrying
5. preserve local draft where appropriate

---

# 181. Offline Testing Architecture

Tests must simulate:

```text
online
offline
flaky network
slow network
server failure
timeout
401
403
404
409
429
500
502
503
```

---

# 182. Unit Tests

Test:

- cache policy
- sync status
- mutation queue
- dependency resolver
- retry policy
- conflict resolver
- ID mapping
- cache invalidation
- storage migration

---

# 183. Repository Tests

Test:

```text
online → remote
offline → local
cache hit
cache miss
network fallback
local write + queued mutation
sync reconciliation
```

---

# 184. Sync Engine Tests

Test:

1. empty queue
2. single mutation
3. multiple mutations
4. dependency ordering
5. retry
6. permanent failure
7. conflict
8. duplicate trigger
9. authentication expiry
10. chamber switch
11. logout
12. app restart recovery

---

# 185. Offline Consultation Tests

Critical tests:

```text
Open consultation online
Disconnect network
Enter vitals
Enter notes
Add diagnosis
Build prescription
Kill app
Restart
Restore draft
Reconnect
Sync
Verify server
```

---

# 186. Prescription Safety Tests

Verify:

```text
Offline draft allowed
Offline finalization blocked
Online finalization succeeds
401 prevents finalization
403 prevents finalization
409 prevents finalization
Finalized prescription becomes read-only
```

---

# 187. Payment Safety Tests

Verify:

```text
Offline payment cannot become PAID
Retry does not duplicate payment
Idempotency key is preserved
Server response determines final state
```

---

# 188. Queue Safety Tests

Verify:

```text
Offline call action blocked
Offline skip blocked
Offline start blocked
Server determines queue state
```

---

# 189. Chamber Isolation Tests

Critical:

```text
Login User A
Select Chamber A
Create local patient

Switch Chamber B

Patient from Chamber A must not appear
Mutation from Chamber A must not sync under Chamber B
```

---

# 190. Account Isolation Tests

Critical:

```text
User A logout
User B login

User A:
patients
drafts
AI context
pending mutations

must not appear for User B.
```

---

# 191. Conflict Tests

Simulate:

```text
Local version = 5
Server version = 6
```

Expected:

```text
409
→ conflict state
→ preserve local draft
→ require review
```

---

# 192. App Restart Tests

Test:

```text
Create offline mutation
Force kill app
Restart
Verify mutation exists
Reconnect
Sync
```

---

# 193. Storage Migration Tests

For every schema migration:

```text
old storage
↓
migration
↓
new storage
↓
data integrity
```

---

# 194. Performance Testing

Measure:

- startup with cache
- patient search
- local patient list
- sync 10 mutations
- sync 100 mutations
- large reference catalog
- consultation draft autosave
- cache eviction

---

# 195. Memory Testing

Monitor:

- Hive box loading
- patient timeline
- diagnostic report lists
- large files
- AI responses
- sync queue

Avoid loading entire datasets into memory.

---

# 196. Offline Stress Testing

Test:

```text
10 minutes offline
1 hour offline
1 working day offline
```

and ensure:

- drafts survive
- queue does not corrupt
- storage remains manageable
- synchronization eventually succeeds
- conflicts are surfaced

---

# 197. Flaky Network Testing

Simulate:

```text
online
offline
online
offline
online
```

during:

- autosave
- patient creation
- consultation
- prescription draft
- sync

---

# 198. Security Testing

Verify:

- encrypted local storage
- token protection
- chamber isolation
- account isolation
- no sensitive logs
- no unauthorized synchronization
- no stale data after logout
- no stale data after account switch

---

# 199. Offline DoR

A feature is ready for offline implementation when:

- online API contract exists
- local model exists
- cache policy is defined
- sync behavior is defined
- conflict behavior is defined
- authorization behavior is defined
- retry behavior is defined
- retention policy is defined
- tests are identified

---

# 200. Offline Definition of Done

A feature is complete when:

- offline behavior is implemented
- online behavior works
- local cache works
- sync queue works where required
- retry behavior works
- conflicts are handled
- chamber isolation is verified
- account isolation is verified
- sensitive data is protected
- UI communicates sync state
- automated tests pass
- crash/restart recovery works
- documentation is updated

---

# 201. Recommended Flutter Directory Structure

```text
lib/
├── core/
│   ├── connectivity/
│   ├── storage/
│   ├── sync/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── cache/
│   ├── security/
│   ├── networking/
│   └── errors/
│
├── features/
│   ├── patients/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── patient_local_datasource.dart
│   │   │   │   └── patient_remote_datasource.dart
│   │   │   ├── models/
│   │   │   └── repositories/
│   │   ├── domain/
│   │   └── presentation/
│   │
│   ├── consultation/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   │
│   └── prescription/
│
└── app/
```

---

# 202. Core Offline Components

Recommended:

```text
ConnectivityService
LocalStorageService
CacheManager
SyncEngine
SyncQueue
SyncRepository
ConflictResolver
MutationDependencyResolver
LocalIdMapper
DraftManager
StorageMigrationManager
```

---

# 203. Storage Interfaces

```dart
abstract class LocalStorage {
  Future<void> put<T>(
    String box,
    String key,
    T value,
  );

  Future<T?> get<T>(
    String box,
    String key,
  );

  Future<void> delete(
    String box,
    String key,
  );

  Future<void> clear(String box);
}
```

---

# 204. Cache Manager

```dart
abstract class CacheManager {
  Future<void> set<T>(
    String key,
    T value, {
    Duration? ttl,
  });

  Future<T?> get<T>(String key);

  Future<void> invalidate(String key);

  Future<void> clearScope(String scope);
}
```

---

# 205. Sync Repository

```dart
abstract class SyncRepository {
  Future<List<PendingMutation>> getPending();

  Future<void> enqueue(PendingMutation mutation);

  Future<void> markSuccess(String mutationId);

  Future<void> markFailed(
    String mutationId,
    SyncFailure failure,
  );

  Future<void> markConflict(
    String mutationId,
    SyncConflict conflict,
  );
}
```

---

# 206. Conflict Resolver

```dart
abstract class ConflictResolver {
  Future<ConflictResolution> resolve(
    LocalEntity local,
    RemoteEntity remote,
  );
}
```

Possible result:

```dart
enum ConflictResolutionType {
  useLocal,
  useRemote,
  merged,
  requiresReview,
}
```

---

# 207. Sync Orchestration

High-level flow:

```text
SyncManager
   ↓
Connectivity Check
   ↓
Authentication Check
   ↓
Load Pending Mutations
   ↓
Resolve Dependencies
   ↓
Execute Mutation
   ↓
Handle Response
   ↓
Update Local Store
   ↓
Invalidate Providers
   ↓
Continue
```

---

# 208. Provider Invalidation After Sync

Example:

```text
Patient mutation succeeds
        ↓
invalidate:
patientsProvider
patientSearchProvider
patientDetailsProvider
dashboardProvider
```

Avoid invalidating the entire application unnecessarily.

---

# 209. Sync and Riverpod Cache

When local state changes:

```text
Repository updates local storage
        ↓
Controller/provider refreshes
```

For active screens, prefer targeted state updates where possible.

---

# 210. Offline UI Rules

Every offline-capable screen should define:

```text
What can I view?
What can I edit?
What is pending?
What requires internet?
What happens when synchronization fails?
```

---

# 211. Feature Offline Contract

Each feature should document:

```text
Offline Reads
Offline Drafts
Offline Mutations
Server-only Actions
Cache TTL
Sync Priority
Conflict Strategy
Retention
```

---

# 212. Example — Patient Feature Contract

```text
Offline Reads:
Yes

Offline Create:
Yes

Offline Update:
Yes

Offline Delete:
No

Cache:
30 days

Sync:
P1

Conflict:
Server validation

Search:
Local + remote

Sensitive:
Yes
```

---

# 213. Example — Prescription Feature Contract

```text
Offline Read:
Yes

Offline Draft:
Yes

Offline Item Editing:
Yes

Offline Finalization:
No

Offline Delivery:
No

Cache:
Active encounter only

Sync:
P0

Conflict:
Manual review

Immutable after finalization:
Yes
```

---

# 214. Example — Payment Feature Contract

```text
Offline Read:
Cached

Offline Draft:
Optional

Offline Payment:
No

Offline Refund:
No

Sync:
Server only

Conflict:
Server authoritative
```

---

# 215. Offline Product Principle

The user should never wonder:

> "Did my data save?"

The UI should clearly distinguish:

```text
Saved locally
```

from:

```text
Saved to server
```

---

# 216. Data State Vocabulary

Use consistent terminology:

### Saved

Server confirmed.

### Saved Locally

Persisted on device but not server-confirmed.

### Syncing

Being transmitted.

### Pending

Waiting for synchronization.

### Failed

Synchronization failed.

### Conflict

Server and local versions differ.

---

# 217. Avoid Ambiguous UI

Do not display:

```text
Saved
```

when data exists only locally.

Instead:

```text
Saved locally
Waiting for sync
```

---

# 218. Offline Error UX

Bad:

```text
DioException: connection timeout
```

Good:

```text
No internet connection.
Your changes are محفوظ locally and will sync automatically.
```

For Bangla:

```text
ইন্টারনেট সংযোগ নেই।
আপনার পরিবর্তনগুলো ডিভাইসে সংরক্ষিত হয়েছে এবং সংযোগ ফিরে এলে সিঙ্ক হবে।
```

---

# 219. Clinical Safety UX

For prescription finalization:

```text
Internet connection required

Prescription finalization must be confirmed by the server.

[Retry]
```

---

# 220. Offline Architecture Anti-Patterns

Never:

- store tokens in plain Hive
- bypass backend authorization
- treat local queue as authoritative
- finalize prescriptions offline
- mark payments as paid offline
- silently overwrite clinical conflicts
- discard drafts automatically
- synchronize across chambers
- retry permanent failures forever
- log clinical payloads
- store unlimited patient history locally
- assume Wi-Fi means internet
- assume local state is authoritative

---

# 221. Recommended MVP Offline Scope

MVP should implement:

### Local

- secure session storage
- selected chamber persistence
- patient cache
- appointment cache
- consultation draft
- prescription draft
- medicine cache
- diagnosis cache
- investigation cache
- sync metadata
- basic mutation queue
- connectivity detection
- offline indicators
- app restart recovery

### Server-only

- queue actions
- payment
- prescription finalization
- encounter locking
- AI processing

---

# 222. Phase 2 Offline Scope

Add:

- robust mutation dependency graph
- conflict UI
- advanced retry
- delta synchronization
- reference catalog versioning
- background synchronization
- offline patient creation
- offline appointment creation
- offline clinical updates
- advanced cache management
- sync dashboard

---

# 223. Phase 3 Offline Scope

Potentially add:

- sophisticated change feed
- encrypted backup
- cloud backup
- advanced multi-device synchronization
- selective patient offline availability
- advanced conflict resolution
- offline analytics
- smarter background sync
- device-to-device recovery mechanisms

---

# 224. Sprint Mapping

## Sprint 1 — Offline Foundation

Tasks:

- connectivity service
- Hive initialization
- storage abstraction
- encryption strategy
- cache manager
- storage versioning

---

## Sprint 2 — Authentication Storage

Tasks:

- secure token storage
- session persistence
- logout cleanup
- account isolation
- session recovery

---

## Sprint 3 — Chamber Cache

Tasks:

- chamber cache
- selected chamber persistence
- chamber-scoped keys
- chamber switching cleanup
- permission cache

---

## Sprint 4 — Patient Cache

Tasks:

- patient local datasource
- patient cache
- offline search
- recent patient cache
- local patient draft

---

## Sprint 5 — Appointment Cache

Tasks:

- appointment cache
- calendar cache
- pending appointment creation
- synchronization

---

## Sprint 6 — Consultation Offline

Tasks:

- encounter draft
- notes autosave
- vitals draft
- diagnosis draft
- investigation draft
- crash recovery

---

## Sprint 7 — Prescription Offline Draft

Tasks:

- prescription draft
- medicine local catalog
- local draft persistence
- synchronization
- finalization online-only enforcement

---

## Sprint 8 — Sync Engine

Tasks:

- mutation queue
- idempotency
- retry
- dependency resolution
- local/server ID mapping

---

## Sprint 9 — Conflict Handling

Tasks:

- version checking
- 409 handling
- conflict state
- clinical conflict UI
- prescription conflict rules

---

## Sprint 10 — Offline UX

Tasks:

- offline banner
- sync indicators
- pending changes
- retry UI
- sync status

---

## Sprint 11 — Advanced Sync

Tasks:

- background sync
- delta synchronization
- reference-data versions
- advanced cache eviction
- sync dashboard

---

## Sprint 12 — Hardening

Tasks:

- security tests
- storage migration tests
- crash recovery
- performance
- long offline sessions
- flaky network testing
- production readiness

---

# 225. Critical End-to-End Offline Test

The most important E2E test:

```text
Login
 ↓
Select Chamber
 ↓
Open Patient
 ↓
Open Consultation
 ↓
Disconnect Internet
 ↓
Enter Vitals
 ↓
Enter Clinical Notes
 ↓
Add Diagnosis
 ↓
Add Investigation
 ↓
Create Prescription Draft
 ↓
Kill App
 ↓
Restart App
 ↓
Restore Consultation
 ↓
Reconnect Internet
 ↓
Sync
 ↓
Review Server Data
 ↓
Finalize Prescription Online
 ↓
Complete Encounter
 ↓
Record Payment Online
```

Expected:

```text
No clinical data loss
No duplicate records
No cross-chamber data
No unauthorized finalization
No duplicate payment
```

---

# 226. Multi-Device Offline Test

Scenario:

```text
Device A:
Doctor consultation

Device B:
Assistant updates patient
```

Then:

```text
Device A reconnects
Device B reconnects
```

Expected:

```text
Non-conflicting changes merge safely.
Conflicting clinical changes require review.
```

---

# 227. Duplicate Request Test

Scenario:

```text
Create Patient
Server receives request
Network disconnects
Client does not receive response
Client retries
```

Expected:

```text
One patient
Same Idempotency-Key
No duplicate record
```

---

# 228. Finalization Safety Test

Scenario:

```text
Doctor taps Finalize
Internet disconnects
```

Expected:

```text
UI does NOT say Finalized
```

After reconnect:

```text
Check server status
```

If finalized:

```text
Read-only
```

If not:

```text
Allow retry
```

---

# 229. Payment Safety Test

Scenario:

```text
Payment submitted
Network disconnects
```

Expected:

```text
Client does not create a second payment blindly.
```

Retry uses:

```text
same Idempotency-Key
```

---

# 230. Security Acceptance Criteria

The offline system must pass:

- account isolation
- chamber isolation
- encrypted local storage
- secure token storage
- no sensitive logs
- logout cleanup
- session expiration handling
- permission revalidation
- conflict protection
- prescription finalization protection
- payment protection

---

# 231. Performance Acceptance Criteria

Recommended targets:

| Operation | Target |
|---|---:|
| Load cached dashboard | < 500 ms |
| Local patient search | < 300 ms |
| Open cached patient | < 500 ms |
| Save local draft | < 200 ms |
| Start sync | < 1 sec |
| Normal mutation sync | < 2 sec excluding network |
| App startup storage initialization | < 1 sec where practical |

Targets should be validated on representative low/mid-range Android devices.

---

# 232. Reliability Targets

The offline architecture should guarantee:

- drafts survive app restart
- pending mutations survive restart
- no duplicate mutation because of retry
- no silent clinical overwrite
- no cross-user cache leakage
- no cross-chamber synchronization
- no false prescription finalization
- no false payment confirmation

---

# 233. Observability

Monitor technical metrics:

```text
sync_success_rate
sync_failure_rate
sync_duration
pending_mutation_count
conflict_count
cache_hit_rate
cache_miss_rate
offline_session_duration
draft_recovery_count
storage_errors
```

Never collect clinical content for these metrics.

---

# 234. Production Alerts

Potential alerts:

```text
High sync failure rate
High conflict rate
High mutation backlog
Storage migration failures
API idempotency failures
Repeated authentication failures
```

---

# 235. Feature Implementation Checklist

For every feature:

```text
[ ] Local model
[ ] Local datasource
[ ] Remote datasource
[ ] Repository strategy
[ ] Cache policy
[ ] Offline policy
[ ] Mutation policy
[ ] Sync priority
[ ] Retry policy
[ ] Conflict strategy
[ ] Authorization strategy
[ ] Retention policy
[ ] Riverpod provider
[ ] UI state
[ ] Offline UX
[ ] Unit tests
[ ] Repository tests
[ ] Sync tests
[ ] E2E tests
```

---

# 236. Architecture Decision Summary

The Chamber Management application uses:

```text
Flutter
+
Riverpod
+
Clean Architecture
+
Dio
+
Hive
+
Secure Storage
+
Offline Drafts
+
Durable Mutation Queue
+
Idempotent API
+
Version-Based Conflict Detection
+
Server-Authoritative Clinical Operations
```

---

# 237. Most Important Design Rules

### Rule 1

**Local storage is not the security boundary.**

### Rule 2

**Backend authorization is always authoritative.**

### Rule 3

**Offline draft does not mean server-confirmed record.**

### Rule 4

**Queue operations remain server-authoritative.**

### Rule 5

**Payment remains server-authoritative.**

### Rule 6

**Prescription finalization requires server confirmation.**

### Rule 7

**Finalized clinical records are immutable.**

### Rule 8

**Clinical conflicts must never silently overwrite data.**

### Rule 9

**Every offline mutation requires durable identification and idempotency.**

### Rule 10

**Chamber and user isolation applies to local storage as well as APIs.**

### Rule 11

**Unsynced clinical work must never be silently deleted.**

### Rule 12

**The user must always know whether information is locally saved or server-confirmed.**

---

# 238. Relationship With Previous Documents

This document depends directly on:

### Document 8
**Database Architecture & Prisma Schema Specification**

Provides:

- server data model
- versioning
- chamber isolation
- audit
- clinical immutability

### Document 10
**Complete API Contract**

Provides:

- endpoint behavior
- status codes
- idempotency
- optimistic concurrency

### Document 13
**NestJS Backend Architecture**

Provides:

- synchronization APIs
- authorization
- persistence
- transactions
- audit

### Document 16
**Flutter Feature-by-Feature Implementation Specification**

Provides:

- feature boundaries
- repository architecture
- offline foundation

### Document 17
**Flutter API Integration Layer**

Provides:

- Dio
- retry
- token refresh
- error handling
- idempotency
- request IDs

### Document 18
**Flutter Riverpod State Management**

Provides:

- providers
- controllers
- cache invalidation
- chamber isolation
- autosave
- concurrency

### Document 19
**Flutter UI Component & Design System**

Provides:

- offline indicators
- loading states
- error states
- banners
- dialogs

### Document 20
**Flutter Screen-by-Screen Implementation**

Provides:

- screen-level offline behavior

### Document 22
**Flutter Security, Privacy & Data Protection**

Provides:

- secure local storage
- privacy
- encryption
- account isolation
- clinical data protection

---

# 239. Final Architecture

The complete offline architecture is:

```text
                    ┌─────────────────────┐
                    │      Flutter UI     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Riverpod State     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Use Cases      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Repository      │
                    └───────┬───────┬─────┘
                            │       │
                   Local    │       │    Remote
                            ▼       ▼
                    ┌──────────┐ ┌──────────┐
                    │   Hive   │ │   Dio    │
                    └────┬─────┘ └────┬─────┘
                         │            │
                         │            ▼
                         │     ┌──────────────┐
                         │     │ NestJS API   │
                         │     └──────┬───────┘
                         │            │
                         │            ▼
                         │     ┌──────────────┐
                         │     │ PostgreSQL   │
                         │     └──────────────┘
                         │
                         ▼
                  ┌───────────────┐
                  │ Sync Engine   │
                  └───────┬───────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
          Mutation     Conflict     Retry
           Queue       Resolver     Manager
```

---

# 240. Final Product Principle

The Chamber Management application should behave like:

> **An application that continues working when the internet disappears, but never pretends that locally stored clinical or financial information is server-confirmed when it is not.**

The system should prioritize:

```text
Data safety
    ↓
Clinical integrity
    ↓
User continuity
    ↓
Synchronization reliability
    ↓
Performance
    ↓
Convenience
```

The offline architecture is successful when a doctor can lose connectivity in the middle of a consultation, continue safely, close and reopen the application, reconnect later, synchronize without duplicate or lost clinical data, and still retain full control over what ultimately becomes an official medical record.

---

# 241. Next Recommended Document

The next logical architecture document is:

**Document 24 — Complete Flutter Networking, API Error Handling & Resilience Implementation Specification**

It should consolidate the API integration behavior into an implementation-level specification covering:

- Dio architecture
- interceptors
- authentication
- token refresh
- concurrent 401 handling
- retry
- timeout
- connectivity
- idempotency
- request cancellation
- pagination
- API error mapping
- rate limiting
- circuit breaker concepts
- API caching
- request correlation
- logging
- observability
- file upload/download
- AI asynchronous requests
- network testing
- mock server
- contract testing
- production resilience
- relationship between networking, Riverpod, offline sync, and the NestJS backend.