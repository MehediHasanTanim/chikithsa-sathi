# Chamber Management
## Document 10 — Complete API Contract

**Product:** AI-Powered Chamber & Prescription Management  
**API Style:** REST  
**Backend:** NestJS + Fastify  
**Database:** PostgreSQL + Prisma  
**Cache:** Redis  
**Queue:** BullMQ  
**API Version:** `v1`  
**Base URL:** `/api/v1`  
**Primary Client:** Flutter Mobile / Web  
**Primary Market:** Bangladesh  
**Status:** Implementation Specification  
**Date:** September 2026

---

# 1. Purpose

This document defines the complete REST API contract for the Chamber Management MVP.

It provides a common contract for:

- Flutter/Web developers
- Backend developers
- QA engineers
- AI engineers
- DevOps engineers
- Product managers

The API contract defines:

- endpoints
- HTTP methods
- authentication
- permissions
- path parameters
- query parameters
- request bodies
- validation
- response structures
- error codes
- state transitions
- pagination
- business rules
- audit requirements

---

# 2. API Architecture

```text
Client
  │
  ▼
API Gateway / Load Balancer
  │
  ▼
NestJS + Fastify
  │
  ├── Authentication
  ├── Authorization
  ├── Validation
  ├── Business Services
  ├── Prisma
  ├── Redis
  └── BullMQ
```

---

# 3. Base URL

All APIs use:

```text
/api/v1
```

Example:

```text
POST /api/v1/auth/login
GET  /api/v1/patients
POST /api/v1/appointments
```

Production domain should be configured separately:

```text
https://api.<production-domain>/api/v1
```

---

# 4. HTTP Standards

Use standard HTTP methods:

| Method | Purpose |
|---|---|
| GET | Retrieve |
| POST | Create/action |
| PATCH | Partial update |
| DELETE | Delete/deactivate where permitted |

Clinical records should generally use action/versioning endpoints instead of destructive DELETE operations.

---

# 5. Authentication

Protected APIs require:

```http
Authorization: Bearer <access_token>
```

Example:

```http
Authorization: Bearer eyJ...
```

Public endpoints:

```text
POST /auth/register
POST /auth/verify-otp
POST /auth/login
POST /auth/refresh
POST /auth/resend-otp
```

All other endpoints require authentication unless explicitly stated.

---

# 6. Standard Headers

Recommended headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>
X-Client-Version: 1.0.0
X-Platform: ios
```

Optional:

```http
Accept-Language: bn
```

Supported languages:

```text
bn
en
```

---

# 7. Standard Success Response

Single resource:

```json
{
  "success": true,
  "data": {}
}
```

List:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "limit": 25,
      "nextCursor": "abc",
      "hasMore": true
    }
  }
}
```

Action:

```json
{
  "success": true,
  "data": {
    "message": "Operation completed successfully"
  }
}
```

---

# 8. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient was not found",
    "details": []
  },
  "requestId": "4e8b1c8f..."
}
```

---

# 9. Standard HTTP Error Mapping

| HTTP | Meaning |
|---:|---|
| 400 | Bad request |
| 401 | Authentication required/invalid |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict |
| 422 | Validation/business rule failure |
| 429 | Rate limit |
| 500 | Internal server error |
| 502 | External provider failure |
| 503 | Service unavailable |

---

# 10. Pagination

Default:

```text
limit = 25
maximum = 100
```

Example:

```text
GET /patients?limit=25&cursor=abc
```

Response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "limit": 25,
      "nextCursor": "xyz",
      "hasMore": true
    }
  }
}
```

---

# 11. Sorting

Supported pattern:

```text
?sortBy=createdAt&sortOrder=desc
```

Only whitelisted fields should be accepted.

Never pass arbitrary client-provided column names directly to Prisma.

---

# 12. Date & Time

All timestamps returned by API:

```text
ISO 8601 UTC
```

Example:

```text
2026-09-04T15:30:00.000Z
```

Business scheduling uses:

```text
Asia/Dhaka
```

Clients should convert timestamps for display.

---

# 13. Common Authentication APIs

---

# 14. POST `/auth/register`

## Purpose

Register a new user.

## Authentication

Public.

## Request

```json
{
  "phone": "+8801712345678",
  "email": "doctor@example.com",
  "password": "StrongPassword123!",
  "fullName": "Dr. Rahman",
  "preferredLanguage": "bn"
}
```

## Validation

```text
phone: required
password: minimum configured length
fullName: required
email: optional
preferredLanguage: bn | en
```

## Response

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "verificationRequired": true,
    "otpExpiresAt": "2026-09-04T16:00:00Z"
  }
}
```

## Errors

```text
AUTH_PHONE_ALREADY_EXISTS
AUTH_EMAIL_ALREADY_EXISTS
AUTH_INVALID_PHONE
AUTH_INVALID_EMAIL
AUTH_WEAK_PASSWORD
```

---

# 15. POST `/auth/verify-otp`

## Request

```json
{
  "phone": "+8801712345678",
  "otp": "123456"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "verified": true
  }
}
```

## Errors

```text
AUTH_OTP_INVALID
AUTH_OTP_EXPIRED
AUTH_OTP_MAX_ATTEMPTS
AUTH_ACCOUNT_NOT_FOUND
```

---

# 16. POST `/auth/resend-otp`

## Request

```json
{
  "phone": "+8801712345678"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "otpExpiresAt": "2026-09-04T16:00:00Z"
  }
}
```

Rate limited.

---

# 17. POST `/auth/login`

## Request

```json
{
  "phone": "+8801712345678",
  "password": "StrongPassword123!",
  "device": {
    "deviceId": "device-123",
    "platform": "ios",
    "appVersion": "1.0.0"
  }
}
```

## Response

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "fullName": "Dr. Rahman"
    }
  }
}
```

## Errors

```text
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_NOT_VERIFIED
AUTH_ACCOUNT_SUSPENDED
AUTH_ACCOUNT_LOCKED
```

---

# 18. POST `/auth/refresh`

## Request

```json
{
  "refreshToken": "..."
}
```

## Response

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900
  }
}
```

---

# 19. POST `/auth/logout`

## Authentication

Required.

## Request

```json
{
  "refreshToken": "..."
}
```

## Response

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

# 20. GET `/users/me`

## Permission

Authenticated user.

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "+8801712345678",
    "email": "doctor@example.com",
    "fullName": "Dr. Rahman",
    "preferredLanguage": "bn",
    "status": "ACTIVE"
  }
}
```

---

# 21. PATCH `/users/me`

## Request

```json
{
  "fullName": "Dr. Abdul Rahman",
  "email": "doctor@example.com"
}
```

---

# 22. PATCH `/users/me/preferences`

## Request

```json
{
  "preferredLanguage": "bn",
  "timezone": "Asia/Dhaka"
}
```

---

# 23. Doctor APIs

---

# 24. GET `/doctors/me`

Returns the authenticated doctor's profile.

## Permission

Doctor.

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Dr. Rahman",
    "specialization": "Medicine",
    "bmdcNumber": "A-12345",
    "qualifications": [
      "MBBS",
      "FCPS"
    ]
  }
}
```

---

# 25. PATCH `/doctors/me`

Updates doctor profile.

---

# 26. GET `/doctors/me/professional-profile`

Returns detailed professional information.

---

# 27. PATCH `/doctors/me/professional-profile`

Updates:

```text
Specialization
Qualifications
BMDC number
Professional bio
Consultation settings
```

---

# 28. Verification APIs

---

# 29. POST `/verification/submit`

Submit professional verification.

## Request

```json
{
  "bmdcNumber": "A-12345",
  "documents": [
    {
      "fileId": "uuid",
      "type": "BMDC_CERTIFICATE"
    }
  ]
}
```

## Response

```json
{
  "success": true,
  "data": {
    "status": "SUBMITTED"
  }
}
```

---

# 30. GET `/verification/status`

Returns:

```json
{
  "success": true,
  "data": {
    "status": "UNDER_REVIEW",
    "submittedAt": "2026-09-04T10:00:00Z",
    "reviewedAt": null,
    "rejectionReason": null
  }
}
```

---

# 31. Chamber APIs

---

# 32. POST `/chambers`

## Permission

Doctor/practice owner.

## Request

```json
{
  "name": "Tanim Medical Chamber",
  "address": {
    "line1": "House 10, Road 5",
    "area": "Dhanmondi",
    "city": "Dhaka",
    "district": "Dhaka"
  },
  "phone": "+8801712345678",
  "consultationFee": 1000,
  "currency": "BDT"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Tanim Medical Chamber",
    "status": "ACTIVE"
  }
}
```

---

# 33. GET `/chambers`

Returns chambers accessible to the current user.

---

# 34. GET `/chambers/:chamberId`

Returns chamber details.

## Authorization

User must have membership/access.

---

# 35. PATCH `/chambers/:chamberId`

Update chamber.

---

# 36. POST `/chambers/:chamberId/activate`

Activate chamber.

---

# 37. POST `/chambers/:chamberId/deactivate`

Deactivate chamber.

---

# 38. Schedule APIs

---

# 39. GET `/chambers/:chamberId/schedules`

Returns chamber schedule.

---

# 40. POST `/chambers/:chamberId/schedules`

## Request

```json
{
  "dayOfWeek": 1,
  "startTime": "17:00",
  "endTime": "21:00",
  "slotDurationMinutes": 15,
  "maxAppointments": 20
}
```

---

# 41. PATCH `/schedules/:scheduleId`

Update schedule.

---

# 42. DELETE `/schedules/:scheduleId`

Delete/deactivate schedule.

Deletion must not invalidate existing historical appointments.

---

# 43. Staff APIs

---

# 44. GET `/chambers/:chamberId/staff`

Returns chamber staff.

---

# 45. POST `/chambers/:chamberId/staff/invite`

## Request

```json
{
  "phone": "+8801812345678",
  "role": "RECEPTIONIST"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "membershipId": "uuid",
    "status": "INVITED"
  }
}
```

---

# 46. PATCH `/staff/:membershipId`

Update:

```json
{
  "role": "CHAMBER_MANAGER",
  "status": "ACTIVE"
}
```

---

# 47. DELETE `/staff/:membershipId`

Deactivate/remove membership.

Historical audit records must remain.

---

# 48. POST `/staff/:membershipId/resend-invitation`

Resend invitation.

---

# 49. Permission APIs

---

# 50. GET `/chambers/:chamberId/permissions`

Returns available permissions/roles.

---

# 51. GET `/chambers/:chamberId/my-permissions`

Returns permissions for current user.

Example:

```json
{
  "success": true,
  "data": {
    "role": "RECEPTIONIST",
    "permissions": [
      "patients.read",
      "patients.create",
      "appointments.create",
      "queue.manage"
    ]
  }
}
```

---

# 52. Patient APIs

---

# 53. POST `/patients`

## Permission

`patients.create`

## Request

```json
{
  "chamberId": "uuid",
  "fullName": "Abdul Karim",
  "fullNameBn": "আব্দুল করিম",
  "phone": "+8801712345678",
  "dateOfBirth": "1980-05-12",
  "gender": "MALE",
  "address": {
    "line1": "Mirpur",
    "city": "Dhaka",
    "district": "Dhaka"
  }
}
```

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientNumber": "P-000123",
    "fullName": "Abdul Karim"
  }
}
```

---

# 54. GET `/patients`

## Query

```text
chamberId
search
gender
dateOfBirthFrom
dateOfBirthTo
limit
cursor
sortBy
sortOrder
```

Example:

```text
GET /patients?chamberId=abc&search=karim&limit=25
```

---

# 55. GET `/patients/search`

Optimized patient lookup.

## Query

```text
q=Abdul Karim
```

Search fields:

```text
Patient number
Name
Bangla name
Phone
```

---

# 56. GET `/patients/:patientId`

Returns patient profile.

---

# 57. PATCH `/patients/:patientId`

Update demographic information.

---

# 58. POST `/patients/:patientId/chambers`

Associate patient with a chamber.

---

# 59. GET `/patients/:patientId/timeline`

Returns chronological history.

## Response

```json
{
  "success": true,
  "data": [
    {
      "type": "ENCOUNTER",
      "id": "uuid",
      "date": "2026-09-04T10:00:00Z",
      "summary": "Follow-up consultation"
    },
    {
      "type": "PRESCRIPTION",
      "id": "uuid",
      "date": "2026-09-04T10:30:00Z"
    }
  ]
}
```

---

# 60. GET `/patients/:patientId/allergies`

---

# 61. POST `/patients/:patientId/allergies`

## Request

```json
{
  "allergen": "Penicillin",
  "reaction": "Rash",
  "severity": "MODERATE"
}
```

---

# 62. DELETE `/patients/:patientId/allergies/:allergyId`

Deletion should be implemented as deactivation/history preservation where clinically appropriate.

---

# 63. GET `/patients/:patientId/conditions`

---

# 64. POST `/patients/:patientId/conditions`

---

# 65. Appointment APIs

---

# 66. POST `/appointments`

## Permission

`appointments.create`

## Request

```json
{
  "chamberId": "uuid",
  "patientId": "uuid",
  "scheduledAt": "2026-09-05T18:30:00+06:00",
  "type": "NEW_PATIENT",
  "notes": "First consultation"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "appointmentNumber": "A-00125",
    "status": "BOOKED",
    "scheduledAt": "2026-09-05T12:30:00Z"
  }
}
```

---

# 67. GET `/appointments`

## Filters

```text
chamberId
date
dateFrom
dateTo
patientId
status
doctorId
```

Example:

```text
GET /appointments?chamberId=abc&date=2026-09-05
```

---

# 68. GET `/appointments/:appointmentId`

Returns appointment details.

---

# 69. PATCH `/appointments/:appointmentId`

Update appointment details where allowed.

---

# 70. POST `/appointments/:appointmentId/reschedule`

## Request

```json
{
  "scheduledAt": "2026-09-06T18:30:00+06:00"
}
```

The backend must revalidate schedule and conflict rules.

---

# 71. POST `/appointments/:appointmentId/cancel`

## Request

```json
{
  "reason": "Patient requested cancellation"
}
```

---

# 72. POST `/appointments/:appointmentId/confirm`

Confirm appointment.

---

# 73. Queue APIs

---

# 74. GET `/queue/today`

## Query

```text
chamberId
status
```

Returns current chamber queue.

---

# 75. POST `/queue/check-in`

## Permission

`queue.manage`

## Request

```json
{
  "chamberId": "uuid",
  "patientId": "uuid",
  "appointmentId": "uuid"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "queueEntryId": "uuid",
    "queueNumber": 12,
    "status": "WAITING"
  }
}
```

---

# 76. POST `/queue/:queueEntryId/call`

Calls the patient.

---

# 77. POST `/queue/:queueEntryId/recall`

Recalls skipped/unresponsive patient.

---

# 78. POST `/queue/:queueEntryId/skip`

## Request

```json
{
  "reason": "Patient not present"
}
```

---

# 79. POST `/queue/:queueEntryId/start`

Starts consultation.

This may create or activate an encounter.

---

# 80. POST `/queue/:queueEntryId/complete`

Completes queue entry.

---

# 81. Queue State Rules

Allowed transitions:

```text
WAITING
  ↓
CALLED
  ↓
IN_CONSULTATION
  ↓
COMPLETED
```

Alternative:

```text
WAITING → SKIPPED
CALLED → RECALLED
WAITING → CANCELLED
```

Invalid transitions must return:

```text
QUEUE_INVALID_STATE_TRANSITION
```

---

# 82. Encounter APIs

---

# 83. POST `/encounters`

## Request

```json
{
  "chamberId": "uuid",
  "patientId": "uuid",
  "appointmentId": "uuid",
  "queueEntryId": "uuid"
}
```

---

# 84. GET `/encounters/:encounterId`

Returns complete encounter summary.

---

# 85. PATCH `/encounters/:encounterId`

Updates editable encounter fields.

---

# 86. POST `/encounters/:encounterId/start`

Changes:

```text
DRAFT → IN_PROGRESS
```

---

# 87. POST `/encounters/:encounterId/ready-for-review`

Changes:

```text
IN_PROGRESS → READY_FOR_REVIEW
```

---

# 88. POST `/encounters/:encounterId/complete`

Changes:

```text
READY_FOR_REVIEW → COMPLETED
```

---

# 89. POST `/encounters/:encounterId/lock`

Changes:

```text
COMPLETED → LOCKED
```

Locked encounters cannot be normally edited.

---

# 90. Vitals APIs

---

# 91. POST `/encounters/:encounterId/vitals`

## Request

```json
{
  "weightKg": 72.5,
  "heightCm": 170,
  "systolicBp": 125,
  "diastolicBp": 80,
  "pulseBpm": 76,
  "temperatureC": 36.8,
  "spo2": 98,
  "respiratoryRate": 16
}
```

---

# 92. GET `/encounters/:encounterId/vitals`

---

# 93. PATCH `/vitals/:vitalId`

Only editable while encounter remains editable.

---

# 94. GET `/patients/:patientId/vitals`

Returns historical vitals.

---

# 95. Clinical Notes APIs

---

# 96. POST `/encounters/:encounterId/notes`

## Request

```json
{
  "chiefComplaint": "Fever and cough",
  "history": "Fever for 3 days",
  "examination": "Chest clear",
  "assessment": "Likely viral infection",
  "plan": "Rest and hydration"
}
```

---

# 97. GET `/encounters/:encounterId/notes`

---

# 98. PATCH `/notes/:noteId`

---

# 99. Diagnosis APIs

---

# 100. GET `/diagnoses/search`

## Query

```text
q=fever
```

---

# 101. POST `/encounters/:encounterId/diagnoses`

## Request

```json
{
  "diagnosisId": "uuid",
  "type": "PRIMARY",
  "notes": "Likely viral"
}
```

---

# 102. DELETE `/encounters/:encounterId/diagnoses/:diagnosisId`

Only before encounter lock and subject to permission.

---

# 103. Investigation APIs

---

# 104. GET `/investigations/catalog`

Search/filter investigation catalog.

---

# 105. POST `/encounters/:encounterId/investigations`

## Request

```json
{
  "investigationId": "uuid",
  "priority": "ROUTINE",
  "instructions": "Fasting required"
}
```

---

# 106. GET `/encounters/:encounterId/investigations`

---

# 107. PATCH `/investigations/:investigationId`

---

# 108. Diagnostic Report APIs

---

# 109. POST `/encounters/:encounterId/reports`

## Request

```json
{
  "investigationId": "uuid",
  "title": "CBC Report",
  "reportDate": "2026-09-04",
  "fileId": "uuid"
}
```

---

# 110. GET `/encounters/:encounterId/reports`

---

# 111. GET `/reports/:reportId`

Returns report metadata.

---

# 112. POST `/reports/:reportId/analyze`

Requests AI report analysis.

This operation should normally be asynchronous.

---

# 113. File APIs

---

# 114. POST `/files/upload-url`

## Request

```json
{
  "fileName": "cbc-report.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 2456789
}
```

## Response

```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "uploadUrl": "signed-url",
    "expiresAt": "2026-09-04T16:00:00Z"
  }
}
```

The signed URL itself is returned as data but must not be logged.

---

# 115. POST `/files/complete`

## Request

```json
{
  "fileId": "uuid"
}
```

The backend verifies object existence and expected metadata.

---

# 116. GET `/files/:fileId`

Returns a temporary authorized download URL or file stream.

---

# 117. DELETE `/files/:fileId`

For unreferenced files.

Referenced clinical files should normally be retained rather than physically deleted.

---

# 118. Medicine APIs

---

# 119. GET `/medicines/search`

## Query

```text
q=paracetamol
form=tablet
limit=20
```

Search:

```text
Brand
Generic
Strength
Form
```

---

# 120. GET `/medicines/:medicineId`

Returns medicine details.

---

# 121. GET `/doctors/me/medicine-favorites`

---

# 122. POST `/doctors/me/medicine-favorites`

## Request

```json
{
  "medicineId": "uuid"
}
```

---

# 123. DELETE `/doctors/me/medicine-favorites/:medicineId`

---

# 124. Prescription APIs

---

# 125. POST `/encounters/:encounterId/prescriptions`

Creates a draft.

## Request

```json
{
  "language": "en",
  "notes": "Take plenty of fluids",
  "items": [
    {
      "medicineId": "uuid",
      "dose": "500 mg",
      "frequency": "1+1+1",
      "route": "ORAL",
      "durationValue": 5,
      "durationUnit": "DAY",
      "instructions": "After food",
      "quantity": 15
    }
  ]
}
```

---

# 126. GET `/prescriptions/:prescriptionId`

Returns complete prescription.

---

# 127. PATCH `/prescriptions/:prescriptionId`

Updates draft prescription.

Only allowed before finalization.

---

# 128. POST `/prescriptions/:prescriptionId/items`

Adds medicine.

---

# 129. PATCH `/prescriptions/:prescriptionId/items/:itemId`

Updates prescription item.

---

# 130. DELETE `/prescriptions/:prescriptionId/items/:itemId`

Removes prescription item while editable.

---

# 131. POST `/prescriptions/:prescriptionId/review`

Marks prescription as reviewed.

## Request

```json
{
  "reviewed": true
}
```

---

# 132. POST `/prescriptions/:prescriptionId/finalize`

## Permission

`prescriptions.finalize`

## Request

```json
{
  "confirmation": true
}
```

## Required server-side checks

```text
Prescription exists
Encounter exists
Encounter accessible
User authorized
Prescription editable
All required fields valid
Doctor review completed
```

## Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "FINALIZED",
    "finalizedAt": "2026-09-04T12:30:00Z"
  }
}
```

## Errors

```text
PRESCRIPTION_NOT_FOUND
PRESCRIPTION_ALREADY_FINALIZED
PRESCRIPTION_REVIEW_REQUIRED
PRESCRIPTION_INVALID
PRESCRIPTION_FINALIZE_FORBIDDEN
ENCOUNTER_LOCKED
```

---

# 133. Prescription Amendment

---

# 134. POST `/prescriptions/:prescriptionId/amend`

## Permission

Restricted clinical permission.

## Request

```json
{
  "reason": "Incorrect dosage entered",
  "items": [
    {
      "medicineId": "uuid",
      "dose": "250 mg",
      "frequency": "1+1+1"
    }
  ]
}
```

The original finalized prescription remains immutable.

---

# 135. GET `/prescriptions/:prescriptionId/history`

Returns:

```text
Original
Amendment
Version
Actor
Timestamp
Reason
```

---

# 136. GET `/prescriptions/:prescriptionId/preview`

Returns printable prescription data.

---

# 137. GET `/prescriptions/:prescriptionId/pdf`

Returns/generates prescription PDF.

If PDF does not exist:

```text
202 Accepted
```

may be returned with a processing status.

---

# 138. POST `/prescriptions/:prescriptionId/deliver`

Marks prescription as delivered.

---

# 139. Payment APIs

---

# 140. POST `/payments`

## Request

```json
{
  "chamberId": "uuid",
  "patientId": "uuid",
  "encounterId": "uuid",
  "amount": 1000,
  "currency": "BDT",
  "method": "CASH",
  "notes": "Consultation fee"
}
```

---

# 141. GET `/payments`

## Filters

```text
chamberId
patientId
encounterId
dateFrom
dateTo
method
status
```

---

# 142. GET `/payments/:paymentId`

---

# 143. GET `/payments/:paymentId/receipt`

Returns receipt.

---

# 144. POST `/payments/:paymentId/refund`

## Request

```json
{
  "amount": 1000,
  "reason": "Payment reversal"
}
```

Refund cannot exceed refundable balance.

---

# 145. Notification APIs

---

# 146. GET `/notifications`

## Query

```text
unread=true
limit=25
cursor=abc
```

---

# 147. GET `/notifications/unread-count`

Response:

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

# 148. POST `/notifications/:notificationId/read`

Marks notification as read.

---

# 149. POST `/notifications/read-all`

Marks all current user's notifications as read.

---

# 150. AI APIs

AI endpoints are available only to authorized users.

---

# 151. POST `/ai/patient-summary`

## Permission

Clinical access.

## Request

```json
{
  "patientId": "uuid",
  "encounterId": "uuid",
  "language": "en"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "status": "COMPLETED",
    "summary": "...",
    "warnings": [],
    "generatedBy": "AI",
    "requiresReview": true
  }
}
```

---

# 152. POST `/ai/clinical-chat`

## Request

```json
{
  "patientId": "uuid",
  "encounterId": "uuid",
  "message": "What are possible causes of this patient's symptoms?",
  "language": "en"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "answer": "...",
    "warnings": [],
    "requiresReview": true
  }
}
```

AI output must not be represented as a confirmed diagnosis.

---

# 153. POST `/ai/prescription-draft`

## Request

```json
{
  "patientId": "uuid",
  "encounterId": "uuid",
  "language": "en"
}
```

## Response

```json
{
  "success": true,
  "data": {
    "draftId": "uuid",
    "status": "REVIEW_REQUIRED",
    "items": [
      {
        "medicineId": "uuid",
        "dose": "500 mg",
        "frequency": "1+1+1",
        "durationValue": 5,
        "durationUnit": "DAY"
      }
    ],
    "warnings": [],
    "requiresDoctorReview": true
  }
}
```

---

# 154. POST `/ai/report-analysis`

## Request

```json
{
  "reportId": "uuid",
  "language": "en"
}
```

May return:

```json
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "status": "PROCESSING"
  }
}
```

---

# 155. GET `/ai/requests/:requestId`

Returns AI request status.

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "feature": "PATIENT_SUMMARY",
    "createdAt": "2026-09-04T12:00:00Z"
  }
}
```

---

# 156. AI Safety Rules

The API must enforce:

```text
AI cannot finalize prescriptions
AI cannot modify finalized prescriptions
AI cannot lock encounters
AI cannot create payments
AI cannot directly write clinical records
```

AI generates suggestions/drafts only.

---

# 157. AI Voice-to-Note

Future/P2 API:

```text
POST /ai/voice-note
```

Input:

```text
audioFileId
encounterId
language
```

Output:

```text
transcription
structuredNote
requiresReview = true
```

This should not be part of the MVP critical path.

---

# 158. Analytics APIs

---

# 159. GET `/analytics/dashboard`

## Query

```text
chamberId
date
```

Response:

```json
{
  "success": true,
  "data": {
    "patients": {
      "total": 35,
      "completed": 27,
      "waiting": 5
    },
    "appointments": {
      "total": 40,
      "completed": 27,
      "cancelled": 3,
      "noShow": 5
    },
    "revenue": {
      "amount": 27000,
      "currency": "BDT"
    }
  }
}
```

---

# 160. GET `/analytics/revenue`

Filters:

```text
chamberId
dateFrom
dateTo
```

---

# 161. GET `/analytics/patients`

Returns patient statistics.

---

# 162. GET `/analytics/appointments`

Returns appointment statistics.

---

# 163. Audit APIs

Audit logs should generally not be exposed to ordinary users.

---

# 164. GET `/chambers/:chamberId/audit-logs`

## Permission

Administrative/audit permission.

## Filters

```text
actorId
action
resourceType
resourceId
dateFrom
dateTo
```

Sensitive audit information should be protected.

---

# 165. Export APIs

---

# 166. POST `/exports`

Create an export job.

## Request

```json
{
  "chamberId": "uuid",
  "type": "PATIENTS",
  "format": "CSV"
}
```

---

# 167. GET `/exports/:exportId`

Returns:

```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "downloadUrl": "temporary-url"
  }
}
```

Exports should be processed asynchronously.

---

# 168. Health APIs

---

# 169. GET `/health`

Basic application health.

---

# 170. GET `/health/live`

Kubernetes/container liveness.

---

# 171. GET `/health/ready`

Checks:

```text
PostgreSQL
Redis
```

Do not expose credentials or detailed infrastructure information.

---

# 172. API State Transition Summary

## Appointment

```text
BOOKED
 ↓
CONFIRMED
 ↓
CHECKED_IN
 ↓
IN_QUEUE
 ↓
IN_CONSULTATION
 ↓
COMPLETED
```

Alternative:

```text
BOOKED → CANCELLED
CONFIRMED → CANCELLED
CONFIRMED → NO_SHOW
```

---

# 173. Queue

```text
WAITING
 ↓
CALLED
 ↓
IN_CONSULTATION
 ↓
COMPLETED
```

Alternative:

```text
WAITING → SKIPPED
CALLED → RECALLED
```

---

# 174. Encounter

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

# 175. Prescription

```text
DRAFT
 ↓
REVIEW_REQUIRED
 ↓
FINALIZED
 ↓
DELIVERED
```

AI-assisted:

```text
DRAFT
 ↓
AI_ASSISTED
 ↓
REVIEW_REQUIRED
 ↓
FINALIZED
```

---

# 176. Payment

Recommended:

```text
PENDING
 ↓
PAID
 ↓
PARTIALLY_REFUNDED
 ↓
REFUNDED
```

---

# 177. Verification

```text
NOT_SUBMITTED
 ↓
SUBMITTED
 ↓
UNDER_REVIEW
 ├── APPROVED
 └── REJECTED
       ↓
   RESUBMITTED
```

---

# 178. Authorization Matrix

| Feature | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| Chamber settings | ✓ | ✗ | ✗ | ✓ | ✗ |
| Staff management | ✓ | ✗ | ✗ | ✓ | ✗ |
| Patient create | ✓ | ✓ | ✓ | ✓ | Optional |
| Patient read | ✓ | ✓ | ✓ | ✓ | Limited |
| Appointment | ✓ | ✓ | ✓ | ✓ | ✗ |
| Queue | ✓ | ✓ | ✓ | ✓ | ✗ |
| Clinical notes | ✓ | ✓ | ✗ | Limited | ✗ |
| Vitals | ✓ | ✓ | ✗ | ✗ | ✗ |
| Diagnosis | ✓ | ✓ | ✗ | ✗ | ✗ |
| Prescription create | ✓ | ✓ | ✗ | ✗ | ✗ |
| Prescription finalize | ✓ | Configurable | ✗ | ✗ | ✗ |
| Payment | ✓ | Optional | Optional | ✓ | ✓ |
| Refund | ✓ | ✗ | ✗ | Configurable | ✓ |
| AI clinical | ✓ | ✓ | ✗ | ✗ | ✗ |
| Analytics | ✓ | Limited | Limited | ✓ | ✓ |
| Audit | ✓ | Limited | ✗ | ✓ | ✗ |

Actual permissions should be implemented using permission codes rather than hard-coded role checks.

---

# 179. Idempotency

Critical POST operations should support:

```http
Idempotency-Key: <unique-key>
```

Required for:

```text
Appointment creation
Queue check-in
Prescription finalization
Payment creation
Refund
Export creation
AI requests
```

Example:

```http
Idempotency-Key: 9c6e...
```

The backend should return the original result for a repeated identical request.

---

# 180. Request Correlation

Every request should have:

```text
requestId
```

The request ID must appear in:

- API response
- application logs
- error logs
- background jobs where applicable
- audit metadata where appropriate

---

# 181. Optimistic Concurrency

Clinical and financial resources should support concurrency protection.

Possible implementation:

```text
version
updatedAt
```

Example:

```json
{
  "version": 4
}
```

Update fails if the resource version has changed.

Error:

```text
RESOURCE_VERSION_CONFLICT
```

---

# 182. API Security Requirements

All protected endpoints must verify:

```text
Authentication
 ↓
Chamber membership
 ↓
Permission
 ↓
Resource access
```

For clinical operations:

```text
Authentication
 ↓
Chamber access
 ↓
Clinical permission
 ↓
Encounter/patient access
```

---

# 183. Sensitive API Rules

Never return unnecessary:

```text
password hash
OTP
refresh token metadata
internal provider credentials
AI provider credentials
private object storage credentials
```

Do not expose unnecessary patient information in list APIs.

---

# 184. API Rate Limits

Recommended starting limits:

```text
Login
5 requests/minute

OTP
5 requests/10 minutes

Patient search
60 requests/minute

General API
120 requests/minute

AI
20 requests/minute
```

Exact values should be tuned through production telemetry.

---

# 185. API Documentation

Swagger/OpenAPI must be generated from NestJS decorators.

Every endpoint should include:

```text
Summary
Description
Authentication
Permission
Parameters
Request schema
Response schema
Errors
Examples
```

---

# 186. API Contract Testing

Frontend and backend teams should use contract tests.

Example:

```text
OpenAPI
   ↓
Generated Client Types
   ↓
Flutter/Web
```

Backend CI should validate that implementation remains compatible with the published OpenAPI contract.

---

# 187. API Versioning Rules

V1 should remain backward compatible.

Do not silently change:

```text
Response field meaning
Field type
Enum values
Required fields
Endpoint semantics
```

Breaking changes require a new API version.

---

# 188. Critical E2E API Sequence

A complete automated test should execute:

```text
POST /auth/register
POST /auth/verify-otp
POST /auth/login

POST /chambers
POST /chambers/:id/schedules
POST /chambers/:id/staff/invite

POST /patients
POST /appointments

POST /queue/check-in
POST /queue/:id/call
POST /queue/:id/start

POST /encounters
POST /encounters/:id/start
POST /encounters/:id/vitals
POST /encounters/:id/notes
POST /encounters/:id/diagnoses
POST /encounters/:id/investigations

POST /ai/patient-summary
POST /ai/prescription-draft

POST /encounters/:id/prescriptions
POST /prescriptions/:id/review
POST /prescriptions/:id/finalize

POST /payments
GET  /payments/:id/receipt

POST /encounters/:id/complete
POST /encounters/:id/lock
```

---

# 189. MVP API Priority

## P0 — Mandatory

```text
Auth
Users
Doctors
Chambers
Schedules
Staff
RBAC
Patients
Appointments
Queue
Encounters
Vitals
Clinical Notes
Diagnosis
Investigations
Medicines
Prescriptions
Payments
Receipts
AI
Audit
Health
```

## P1

```text
Diagnostic Reports
Files
Notifications
Analytics
Prescription Amendments
Exports
```

## P2

```text
AI Voice-to-Note
Advanced AI Report Analysis
Offline Sync
Patient Portal
Telemedicine
WhatsApp
Lab Integration
Pharmacy Integration
```

---

# 190. API Implementation Sequence

```text
Foundation
    ↓
Auth
    ↓
Users
    ↓
Doctors
    ↓
Chambers
    ↓
Schedules
    ↓
Staff/RBAC
    ↓
Patients
    ↓
Appointments
    ↓
Queue
    ↓
Encounters
    ↓
Vitals/Notes
    ↓
Diagnosis/Investigation
    ↓
Medicines
    ↓
Prescription
    ↓
Prescription Finalization
    ↓
Payments
    ↓
Files/Reports
    ↓
AI
    ↓
Notifications
    ↓
Analytics
    ↓
Audit
```

---

# 191. API Error Catalog

## Authentication

```text
AUTH_INVALID_CREDENTIALS
AUTH_ACCOUNT_NOT_FOUND
AUTH_ACCOUNT_SUSPENDED
AUTH_ACCOUNT_LOCKED
AUTH_ACCOUNT_NOT_VERIFIED
AUTH_OTP_INVALID
AUTH_OTP_EXPIRED
AUTH_OTP_MAX_ATTEMPTS
AUTH_REFRESH_TOKEN_INVALID
AUTH_SESSION_REVOKED
```

## Chamber

```text
CHAMBER_NOT_FOUND
CHAMBER_ACCESS_DENIED
CHAMBER_INACTIVE
CHAMBER_DUPLICATE
```

## Staff

```text
STAFF_NOT_FOUND
STAFF_ALREADY_MEMBER
STAFF_INVITATION_EXPIRED
STAFF_ROLE_INVALID
STAFF_PERMISSION_DENIED
```

## Patient

```text
PATIENT_NOT_FOUND
PATIENT_ACCESS_DENIED
PATIENT_DUPLICATE_WARNING
PATIENT_INVALID_DATA
```

## Appointment

```text
APPOINTMENT_NOT_FOUND
APPOINTMENT_CONFLICT
APPOINTMENT_OUTSIDE_SCHEDULE
APPOINTMENT_INVALID_STATE
APPOINTMENT_ALREADY_CANCELLED
```

## Queue

```text
QUEUE_ENTRY_NOT_FOUND
QUEUE_ALREADY_CHECKED_IN
QUEUE_INVALID_STATE_TRANSITION
QUEUE_NUMBER_GENERATION_FAILED
```

## Encounter

```text
ENCOUNTER_NOT_FOUND
ENCOUNTER_ACCESS_DENIED
ENCOUNTER_INVALID_STATE
ENCOUNTER_LOCKED
```

## Prescription

```text
PRESCRIPTION_NOT_FOUND
PRESCRIPTION_INVALID
PRESCRIPTION_REVIEW_REQUIRED
PRESCRIPTION_ALREADY_FINALIZED
PRESCRIPTION_FINALIZE_FORBIDDEN
PRESCRIPTION_LOCKED
PRESCRIPTION_AMENDMENT_FORBIDDEN
```

## Payment

```text
PAYMENT_NOT_FOUND
PAYMENT_INVALID_AMOUNT
PAYMENT_ALREADY_REFUNDED
PAYMENT_REFUND_EXCEEDS_BALANCE
PAYMENT_PERMISSION_DENIED
```

## AI

```text
AI_REQUEST_NOT_FOUND
AI_PROVIDER_UNAVAILABLE
AI_REQUEST_TIMEOUT
AI_OUTPUT_INVALID
AI_SAFETY_BLOCKED
AI_CONTEXT_ACCESS_DENIED
```

## Files

```text
FILE_NOT_FOUND
FILE_ACCESS_DENIED
FILE_TYPE_NOT_SUPPORTED
FILE_TOO_LARGE
FILE_UPLOAD_INCOMPLETE
```

---

# 192. API Governance

Any API change must answer:

1. Does it change the database?
2. Does it change authorization?
3. Does it change the OpenAPI contract?
4. Does it break existing clients?
5. Does it require migration?
6. Does it require audit logging?
7. Does it require an event?
8. Does it affect clinical integrity?
9. Does it affect offline synchronization later?

---

# 193. Final API Architecture

```text
                         Client Applications
                    ┌───────────┴───────────┐
                    │                       │
                 Flutter                   Web
                    │                       │
                    └───────────┬───────────┘
                                │
                                ▼
                       /api/v1 REST API
                                │
                ┌───────────────┼────────────────┐
                │               │                │
                ▼               ▼                ▼
             Auth/RBAC      Operations        Clinical
                │               │                │
                │               ├── Patients     ├── Encounters
                │               ├── Appointments  ├── Vitals
                │               ├── Queue         ├── Notes
                │               ├── Chambers      ├── Diagnosis
                │               └── Staff         ├── Investigation
                │                                └── Prescription
                │
                ├────────────── AI
                │
                ├────────────── Payments
                │
                ├────────────── Files
                │
                ├────────────── Notifications
                │
                ├────────────── Analytics
                │
                └────────────── Audit
                                │
                                ▼
                        Application Services
                                │
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
              PostgreSQL      Redis          BullMQ
                 │                              │
                 │                              ▼
                 │                         Workers
                 │
                 ▼
             Object Storage
```

---

# 194. Final API Principles

The Chamber Management API must follow these rules:

### 1. Security first

Every protected resource must verify authentication, chamber access and permission.

### 2. Clinical integrity

Finalized clinical records are immutable.

### 3. AI is advisory

```text
AI → Suggest
Doctor → Review
Doctor → Approve
System → Record
```

### 4. Transactional critical workflows

Use database transactions for:

- queue numbering
- appointment creation
- prescription finalization
- payment creation
- refunds

### 5. Idempotent operations

Critical POST requests must be safely retryable.

### 6. Auditability

Sensitive actions must produce audit events.

### 7. Multi-chamber isolation

Never allow chamber-scoped data access solely because a `chamberId` was supplied by the client.

### 8. API compatibility

V1 should remain backward compatible.

### 9. Bangladesh-ready

Support:

```text
Bangla
English
BDT
+880 phone numbers
Asia/Dhaka timezone
Bangla names
Local addresses
```

### 10. Doctor remains in control

The ultimate rule is:

> **The API should automate chamber operations, but the doctor remains the final authority over clinical decisions.**

---

# 195. Next Document

The next recommended document is:

## Document 11 — Complete Compile-Ready Prisma Schema

Document 11 should convert the database architecture into the actual production Prisma implementation.

It should include:

```text
User
UserSession
DoctorProfile
ProfessionalVerification

Chamber
ChamberMembership
Role
Permission
RolePermission
Schedule
ScheduleBreak

Patient
PatientChamber
PatientAllergy
PatientCondition
Family
FamilyMember

Appointment
DailyQueueCounter
QueueEntry

Encounter
ClinicalNote
Vital
Diagnosis
EncounterDiagnosis
Investigation
DiagnosticReport

FileObject

Medicine
DoctorMedicineFavorite

Prescription
PrescriptionItem
PrescriptionAmendment
PrescriptionTemplate

Payment
Receipt
PaymentRefund

Notification

AIRequest
AIDraft
AIUsage

AuditLog
ExportJob

Subscription
```

The schema should be **compile-ready rather than merely conceptual**, with all Prisma relations, indexes, unique constraints, enums, cascading/restrict behavior, versioning fields, and concurrency considerations resolved.