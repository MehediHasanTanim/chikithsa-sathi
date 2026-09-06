# Chamber Management
## Domain Model & Database Design

**Document:** Domain Model & Database Design  
**Version:** 1.0  
**Product:** AI-Powered Chamber & Prescription Management Platform  
**Target Market:** Bangladesh  
**Primary Database:** PostgreSQL  
**Backend Direction:** REST API / modular monolith initially, with service extraction later if required

---

# 1. Purpose

This document defines the domain model and database architecture for Chamber Management.

The database must support:

- Multiple doctors
- Multiple chambers per doctor
- Multiple staff members
- Assistant doctors
- Patient management
- Appointments
- Daily queues
- Clinical encounters
- Vitals
- Diagnoses
- Investigations
- Diagnostic reports
- Prescriptions
- Payments
- Follow-ups
- AI conversations and outputs
- Notifications
- Audit logging
- File management
- Subscription management

The architecture must also support:

- Multi-tenant data isolation
- Role-based access control
- Chamber-level access
- Clinical record versioning
- Soft deletion
- Auditability
- Future offline synchronization
- Future integrations

---

# 2. Database Principles

The database design follows these principles:

### Principle 1 — Practice Isolation

Every business resource must belong to a practice/tenant.

```text
Practice A
    ├── Chamber A1
    ├── Chamber A2
    └── Patients
```

must never be accessible by:

```text
Practice B
```

---

### Principle 2 — Chamber Scoping

Operational records should normally identify the chamber where the activity occurred.

---

### Principle 3 — Clinical Immutability

Finalized clinical records should be versioned rather than overwritten.

---

### Principle 4 — Audit Everything Important

Important clinical, financial, security, and administrative actions must produce audit records.

---

### Principle 5 — Soft Delete

Clinical, financial, and important operational records should generally be archived rather than physically deleted.

---

### Principle 6 — UUID Primary Keys

Use UUIDs for externally exposed entity identifiers.

Example:

```text
patient_id = UUID
```

rather than:

```text
patient_id = 123
```

This reduces predictable identifiers and simplifies distributed/offline architecture.

---

# 3. High-Level Domain Model

```text
                           ┌───────────────┐
                           │     User      │
                           └───────┬───────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
              Doctor Profile              User Roles
                     │
                     ▼
                  Practice
                     │
              ┌──────┴───────┐
              ▼              ▼
          Chambers         Staff
              │
              ▼
          Patients
              │
              ▼
        Appointments
              │
              ▼
          Queue Entry
              │
              ▼
          Encounter
        ┌─────┼─────┬──────────┐
        ▼     ▼     ▼          ▼
      Vitals Notes Diagnosis Investigations
                                  │
                                  ▼
                           Diagnostic Reports
                                  │
                                  ▼
                             Prescription
                                  │
                                  ▼
                               Follow-up
```

---

# 4. Major Bounded Domains

The application can be logically divided into the following domains:

```text
Identity & Access
Practice Management
Chamber Operations
Patient Management
Clinical Management
Prescription
Billing
AI
Communication
Reporting
Audit & Security
Platform Management
```

---

# 5. Core Entity List

## Identity & Access

```text
User
DoctorProfile
Role
Permission
RolePermission
UserRole
```

## Practice

```text
Practice
Chamber
ChamberMembership
ChamberSchedule
ScheduleSlot
Holiday
```

## Staff

```text
StaffProfile
AssistantDoctorProfile
StaffInvitation
```

## Patient

```text
Patient
PatientContact
PatientAddress
EmergencyContact
PatientFamily
PatientTag
```

## Appointment & Queue

```text
Appointment
QueueEntry
```

## Clinical

```text
Encounter
ClinicalNote
Vital
Diagnosis
PatientDiagnosis
Investigation
PatientInvestigation
MedicalHistory
Allergy
```

## Diagnostic Reports

```text
DiagnosticReport
DiagnosticReportFile
```

## Prescription

```text
Prescription
PrescriptionVersion
PrescriptionItem
Medicine
MedicineFavorite
PrescriptionTemplate
```

## Billing

```text
FeeConfiguration
Payment
Receipt
Refund
```

## Follow-up

```text
FollowUp
```

## AI

```text
AIConversation
AIMessage
AIRequest
AIResponse
AIPrescriptionDraft
AIUsage
```

## Communication

```text
Notification
NotificationPreference
PatientCommunication
```

## Platform

```text
FileAsset
AuditLog
DataExportJob
Subscription
SubscriptionPlan
Invoice
```

---

# 6. Practice Model

A **Practice** represents a doctor's overall medical practice.

A doctor may operate multiple chambers under one practice.

```text
Doctor
   │
   ▼
Practice
   ├── Chamber A
   ├── Chamber B
   └── Chamber C
```

## Practice Fields

```text
Practice
---------
id
owner_user_id
name
slug
default_language
timezone
currency
status
created_at
updated_at
deleted_at
```

Recommended default values for Bangladesh:

```text
timezone = Asia/Dhaka
currency = BDT
language = bn/en
```

---

# 7. User Model

The User represents authentication identity.

```text
User
----
id
phone
email
password_hash
status
phone_verified_at
email_verified_at
last_login_at
created_at
updated_at
deleted_at
```

Important:

> Authentication identity and doctor professional information should remain separate.

---

# 8. Doctor Profile

```text
DoctorProfile
-------------
id
user_id
practice_id
full_name
display_name
title
specialization
qualifications
bmdc_number
years_of_experience
gender
date_of_birth
profile_photo_id
bio
verification_status
created_at
updated_at
```

Relationship:

```text
User 1 ─── 1 DoctorProfile
```

---

# 9. Role Model

```text
Role
----
id
code
name
description
is_system_role
created_at
updated_at
```

Example roles:

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
PLATFORM_ADMIN
```

---

# 10. Permission Model

```text
Permission
----------
id
code
name
resource
action
description
```

Examples:

```text
patient.read
patient.create
patient.update

clinical.read
clinical.write

prescription.draft
prescription.finalize

payment.create
payment.refund

ai.chat
ai.prescription
ai.report_analysis
```

---

# 11. Role-Permission Relationship

```text
Role
  │
  └── RolePermission
          │
          └── Permission
```

```text
RolePermission
--------------
role_id
permission_id
```

Unique constraint:

```text
(role_id, permission_id)
```

---

# 12. User Role

```text
UserRole
--------
id
user_id
role_id
practice_id
chamber_id
created_at
```

This allows a user to have different roles/scopes.

Example:

```text
User A
 ├── Receptionist → Chamber A
 └── Receptionist → Chamber B
```

---

# 13. Chamber

```text
Chamber
-------
id
practice_id
name
address
phone
description
status
created_at
updated_at
deleted_at
```

Relationship:

```text
Practice 1 ─── N Chamber
```

---

# 14. Chamber Membership

```text
ChamberMembership
-----------------
id
user_id
practice_id
chamber_id
role_id
status
joined_at
left_at
created_at
updated_at
```

This becomes the primary scope mechanism for staff and assistant doctors.

---

# 15. Chamber Schedule

```text
ChamberSchedule
---------------
id
chamber_id
day_of_week
start_time
end_time
appointment_duration_minutes
max_patients
status
created_at
updated_at
```

Example:

```text
Saturday
17:00 → 21:00
10-minute appointment slots
```

---

# 16. Holiday

```text
Holiday
-------
id
chamber_id
date
reason
created_at
updated_at
```

Useful for:

- Eid holidays
- Doctor leave
- Chamber closure
- Emergency closure

---

# 17. Staff Invitation

```text
StaffInvitation
---------------
id
practice_id
chamber_id
invited_by
phone
email
role_id
token
status
expires_at
accepted_at
created_at
```

Statuses:

```text
PENDING
ACCEPTED
EXPIRED
CANCELLED
```

---

# 18. Patient Model

Patient is a practice-level entity.

```text
Patient
-------
id
practice_id
patient_number
first_name
last_name
preferred_name
date_of_birth
gender
blood_group
phone
email
nationality
occupation
photo_id
status
created_at
updated_at
deleted_at
```

Important:

A patient should normally belong to the **practice**, not only a chamber.

This allows:

```text
Patient
   ↓
Practice
   ├── Chamber A visit
   ├── Chamber B visit
   └── Chamber C visit
```

---

# 19. Patient Number

Each practice should have its own patient numbering system.

Example:

```text
PAT-000001
PAT-000002
PAT-000003
```

Database constraint:

```text
UNIQUE(practice_id, patient_number)
```

---

# 20. Patient Contact

For future flexibility:

```text
PatientContact
--------------
id
patient_id
type
value
is_primary
verified_at
created_at
updated_at
```

Types:

```text
PHONE
EMAIL
WHATSAPP
OTHER
```

---

# 21. Emergency Contact

```text
EmergencyContact
----------------
id
patient_id
name
relationship
phone
address
created_at
updated_at
```

---

# 22. Patient Address

```text
PatientAddress
--------------
id
patient_id
type
address_line
area
city
district
division
postal_code
country
is_primary
created_at
updated_at
```

Bangladesh-specific address fields are useful for local deployments.

---

# 23. Patient Family

Patients may belong to a family/household.

```text
PatientFamily
-------------
id
practice_id
name
created_at
updated_at
```

Relationship:

```text
Family
 ├── Patient A
 ├── Patient B
 └── Patient C
```

This is useful for:

- Family history
- Family appointment management
- Children
- Elderly patients
- Household billing

---

# 24. Patient Tags

```text
PatientTag
----------
id
practice_id
name
```

Relationship:

```text
PatientTagAssignment
--------------------
patient_id
tag_id
```

Examples:

```text
Diabetic
Hypertension
Follow-up
VIP
Chronic
```

Clinical tags should be permission-protected.

---

# 25. Appointment

```text
Appointment
-----------
id
practice_id
chamber_id
patient_id
doctor_id
assistant_doctor_id
appointment_date
start_time
end_time
appointment_type
status
reason
notes
created_by
created_at
updated_at
cancelled_at
```

Statuses:

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

---

# 26. Queue Entry

Queue is separate from appointment.

This is important because:

> Not every queue patient must originate from a scheduled appointment.

```text
QueueEntry
----------
id
practice_id
chamber_id
patient_id
appointment_id
doctor_id
queue_date
queue_number
priority
status
checked_in_at
called_at
consultation_started_at
completed_at
created_at
updated_at
```

Statuses:

```text
WAITING
CALLED
IN_CONSULTATION
COMPLETED
SKIPPED
CANCELLED
```

---

# 27. Encounter

An Encounter represents one clinical consultation.

```text
Encounter
---------
id
practice_id
chamber_id
patient_id
doctor_id
assistant_doctor_id
appointment_id
queue_entry_id
encounter_number
started_at
completed_at
status
created_at
updated_at
```

Statuses:

```text
DRAFT
IN_PROGRESS
COMPLETED
AMENDED
```

---

# 28. Clinical Note

```text
ClinicalNote
------------
id
encounter_id
subjective
objective
assessment
plan
additional_notes
created_by
updated_by
created_at
updated_at
```

This supports a simplified SOAP structure:

```text
S → Subjective
O → Objective
A → Assessment
P → Plan
```

---

# 29. Vital

Vitals should be stored as time-based records.

```text
Vital
-----
id
encounter_id
patient_id
recorded_by
weight
height
bmi
temperature
pulse
respiratory_rate
systolic_bp
diastolic_bp
spo2
blood_glucose
recorded_at
created_at
```

This allows historical trend analysis.

---

# 30. Medical History

```text
MedicalHistory
--------------
id
patient_id
category
description
onset_date
status
recorded_by
created_at
updated_at
```

Categories:

```text
CHRONIC_DISEASE
SURGERY
HOSPITALIZATION
FAMILY_HISTORY
SOCIAL_HISTORY
OTHER
```

---

# 31. Allergy

```text
Allergy
-------
id
patient_id
allergen
reaction
severity
status
recorded_by
created_at
updated_at
```

Severity:

```text
MILD
MODERATE
SEVERE
UNKNOWN
```

---

# 32. Diagnosis

Maintain a reusable diagnosis catalog.

```text
Diagnosis
---------
id
code
name
description
system
created_at
updated_at
```

The `system` can later support:

```text
ICD-10
ICD-11
CUSTOM
```

---

# 33. Patient Diagnosis

A diagnosis assigned to a patient should be stored separately.

```text
PatientDiagnosis
---------------
id
patient_id
encounter_id
diagnosis_id
diagnosis_text
status
is_primary
notes
recorded_by
created_at
updated_at
```

This separates:

```text
Diagnosis Catalog
```

from:

```text
Diagnosis assigned to Patient
```

---

# 34. Investigation

```text
Investigation
-------------
id
code
name
category
description
created_at
updated_at
```

Examples:

```text
CBC
HbA1c
Lipid Profile
Creatinine
TSH
Chest X-Ray
ECG
```

---

# 35. Patient Investigation

```text
PatientInvestigation
--------------------
id
patient_id
encounter_id
investigation_id
status
requested_by
requested_at
completed_at
notes
created_at
updated_at
```

Statuses:

```text
REQUESTED
IN_PROGRESS
COMPLETED
CANCELLED
```

---

# 36. Diagnostic Report

```text
DiagnosticReport
----------------
id
patient_id
encounter_id
patient_investigation_id
report_type
title
report_date
laboratory_name
summary
status
uploaded_by
created_at
updated_at
deleted_at
```

---

# 37. Diagnostic Report File

Actual files should not be stored directly inside PostgreSQL.

```text
DiagnosticReportFile
--------------------
id
diagnostic_report_id
file_asset_id
created_at
```

The actual file can reside in object storage.

---

# 38. File Asset

```text
FileAsset
---------
id
practice_id
owner_type
owner_id
storage_provider
storage_key
file_name
mime_type
size_bytes
checksum
encryption_status
created_by
created_at
deleted_at
```

Potential storage:

```text
S3-compatible Object Storage
```

The application stores metadata and references rather than binary files in the main relational database.

---

# 39. Medicine

Medicine should be modeled independently from prescriptions.

```text
Medicine
--------
id
name
generic_name
strength
dosage_form
manufacturer
country
is_active
created_at
updated_at
```

Examples:

```text
Paracetamol
500 mg
Tablet
```

---

# 40. Prescription

Prescription represents the logical prescription.

```text
Prescription
------------
id
practice_id
chamber_id
patient_id
encounter_id
doctor_id
assistant_doctor_id
status
current_version
issued_at
finalized_at
finalized_by
created_at
updated_at
```

Statuses:

```text
DRAFT
PENDING_REVIEW
FINALIZED
AMENDED
CANCELLED
```

---

# 41. Prescription Version

Prescription versioning is mandatory.

```text
PrescriptionVersion
-------------------
id
prescription_id
version_number
created_by
created_at
reason
status
```

Example:

```text
Prescription
    ├── V1 FINALIZED
    ├── V2 AMENDED
    └── V3 FINALIZED
```

---

# 42. Prescription Item

```text
PrescriptionItem
----------------
id
prescription_version_id
medicine_id
medicine_name_snapshot
strength_snapshot
dosage
frequency
duration
duration_unit
route
instructions
quantity
sort_order
```

Important:

Store medicine snapshots.

If the medicine catalog changes later, the historical prescription must remain unchanged.

---

# 43. Prescription Template

Doctors can save frequently used prescription structures.

```text
PrescriptionTemplate
--------------------
id
doctor_id
practice_id
name
description
created_at
updated_at
deleted_at
```

Items:

```text
PrescriptionTemplateItem
------------------------
id
template_id
medicine_id
dosage
frequency
duration
instructions
sort_order
```

---

# 44. Medicine Favorites

```text
MedicineFavorite
----------------
id
doctor_id
medicine_id
created_at
```

Unique constraint:

```text
UNIQUE(doctor_id, medicine_id)
```

---

# 45. Follow-up

```text
FollowUp
--------
id
patient_id
encounter_id
doctor_id
scheduled_date
reason
notes
status
created_at
updated_at
```

Statuses:

```text
PENDING
COMPLETED
MISSED
CANCELLED
```

---

# 46. Fee Configuration

```text
FeeConfiguration
----------------
id
practice_id
chamber_id
consultation_fee
followup_fee
emergency_fee
currency
effective_from
effective_to
status
created_at
updated_at
```

---

# 47. Payment

```text
Payment
-------
id
practice_id
chamber_id
patient_id
appointment_id
encounter_id
amount
currency
payment_method
status
transaction_reference
received_by
received_at
created_at
updated_at
```

Payment methods:

```text
CASH
CARD
BANK_TRANSFER
MOBILE_PAYMENT
OTHER
```

---

# 48. Receipt

```text
Receipt
-------
id
payment_id
receipt_number
issued_at
issued_by
file_asset_id
created_at
```

Receipt number should be unique within the practice.

---

# 49. Refund

```text
Refund
------
id
payment_id
amount
reason
status
requested_by
approved_by
processed_at
created_at
```

Refunds should not overwrite the original payment.

---

# 50. AI Conversation

AI conversations should be separate from clinical records.

```text
AIConversation
-------------
id
practice_id
user_id
patient_id
encounter_id
title
context_type
created_at
updated_at
archived_at
```

Context types:

```text
GENERAL
PATIENT
ENCOUNTER
PRESCRIPTION
REPORT
```

---

# 51. AI Message

```text
AIMessage
---------
id
conversation_id
sender_type
content
model
created_at
```

Sender:

```text
USER
AI
SYSTEM
```

---

# 52. AI Request

Every AI request should have an auditable request record.

```text
AIRequest
---------
id
practice_id
user_id
patient_id
encounter_id
request_type
model
prompt_version
status
created_at
completed_at
```

Request types:

```text
CHAT
PATIENT_SUMMARY
PRESCRIPTION_DRAFT
REPORT_ANALYSIS
VOICE_TO_NOTE
CLINICAL_DOCUMENTATION
```

---

# 53. AI Response

```text
AIResponse
----------
id
ai_request_id
response_text
structured_output
safety_flags
confidence
created_at
```

The system should not assume `confidence` is a clinically validated probability.

It should be treated as an AI/system metadata field only.

---

# 54. AI Prescription Draft

```text
AIPrescriptionDraft
-------------------
id
ai_request_id
patient_id
encounter_id
doctor_id
status
draft_data
reviewed_by
reviewed_at
created_at
```

Statuses:

```text
GENERATED
REVIEWED
ACCEPTED
REJECTED
EXPIRED
```

Important:

```text
AI Draft
   ≠
Prescription
```

The draft must be explicitly converted into a prescription draft by an authorized clinician.

---

# 55. AI Usage

Track AI consumption.

```text
AIUsage
-------
id
practice_id
user_id
ai_request_id
model
input_tokens
output_tokens
total_tokens
estimated_cost
created_at
```

This supports:

- Usage monitoring
- Subscription limits
- Cost analysis
- AI billing

---

# 56. Notification

```text
Notification
------------
id
user_id
practice_id
type
title
message
data
read_at
created_at
```

Examples:

```text
NEW_APPOINTMENT
PATIENT_WAITING
FOLLOWUP_REMINDER
PAYMENT_RECEIVED
AI_TASK_COMPLETED
SYSTEM_ALERT
```

---

# 57. Notification Preference

```text
NotificationPreference
----------------------
id
user_id
notification_type
in_app_enabled
push_enabled
sms_enabled
email_enabled
created_at
updated_at
```

---

# 58. Patient Communication

```text
PatientCommunication
--------------------
id
practice_id
patient_id
appointment_id
channel
message_type
message
status
sent_at
created_by
created_at
```

Channels:

```text
SMS
EMAIL
PUSH
WHATSAPP
IN_APP
```

---

# 59. Audit Log

Audit logs are one of the most important platform entities.

```text
AuditLog
--------
id
practice_id
chamber_id
actor_user_id
action
resource_type
resource_id
patient_id
metadata
ip_address
user_agent
created_at
```

Examples:

```text
PATIENT_CREATED
CLINICAL_NOTE_UPDATED
PRESCRIPTION_FINALIZED
PAYMENT_CREATED
AI_REQUEST_CREATED
DATA_EXPORTED
STAFF_PERMISSION_CHANGED
```

Audit records should be append-only.

---

# 60. Data Export Job

Large exports should be asynchronous.

```text
DataExportJob
-------------
id
practice_id
requested_by
export_type
filters
status
file_asset_id
requested_at
completed_at
expires_at
```

Statuses:

```text
QUEUED
PROCESSING
COMPLETED
FAILED
EXPIRED
```

---

# 61. Subscription

```text
Subscription
------------
id
practice_id
plan_id
status
started_at
renewal_at
cancelled_at
created_at
updated_at
```

---

# 62. Subscription Plan

```text
SubscriptionPlan
----------------
id
code
name
monthly_price
annual_price
currency
max_chambers
max_staff
max_patients
ai_quota
features
status
created_at
updated_at
```

---

# 63. Invoice

```text
Invoice
-------
id
practice_id
subscription_id
invoice_number
amount
currency
status
period_start
period_end
due_date
paid_at
created_at
```

---

# 64. Entity Relationship Overview

The most important relationships are:

```text
User
 │
 ├── DoctorProfile
 │       │
 │       └── Practice
 │              │
 │              ├── Chamber
 │              │      │
 │              │      ├── Schedule
 │              │      ├── Appointment
 │              │      └── Queue
 │              │
 │              └── Patient
 │                     │
 │                     ├── Appointment
 │                     ├── Encounter
 │                     │     ├── Vitals
 │                     │     ├── Clinical Notes
 │                     │     ├── Diagnosis
 │                     │     ├── Investigation
 │                     │     └── Prescription
 │                     │
 │                     ├── Diagnostic Reports
 │                     └── Follow-ups
 │
 └── User Roles
```

---

# 65. Core Cardinality

| Relationship | Cardinality |
|---|---|
| Practice → Chamber | 1:N |
| Practice → Patient | 1:N |
| Practice → User Membership | 1:N |
| Chamber → Appointment | 1:N |
| Patient → Appointment | 1:N |
| Patient → Encounter | 1:N |
| Encounter → Vital | 1:N |
| Encounter → Diagnosis | 1:N |
| Encounter → Investigation | 1:N |
| Encounter → Prescription | 1:N |
| Prescription → Version | 1:N |
| Prescription Version → Items | 1:N |
| Patient → Diagnostic Report | 1:N |
| Patient → Follow-up | 1:N |
| User → AI Conversation | 1:N |
| AI Conversation → Messages | 1:N |
| Practice → Audit Log | 1:N |

---

# 66. Important Database Constraints

## Patient Number

```text
UNIQUE(practice_id, patient_number)
```

## Chamber Name

Recommended:

```text
UNIQUE(practice_id, name)
```

## Receipt Number

```text
UNIQUE(practice_id, receipt_number)
```

## Prescription Version

```text
UNIQUE(prescription_id, version_number)
```

## Medicine Favorite

```text
UNIQUE(doctor_id, medicine_id)
```

## Role Permission

```text
UNIQUE(role_id, permission_id)
```

---

# 67. Recommended Indexes

High-frequency query indexes should include:

```text
Patient
-------
(practice_id, phone)
(practice_id, patient_number)
(practice_id, created_at)

Appointment
-----------
(chamber_id, appointment_date)
(patient_id, appointment_date)
(doctor_id, appointment_date)
(status, appointment_date)

QueueEntry
----------
(chamber_id, queue_date, status)
(patient_id, queue_date)

Encounter
---------
(patient_id, created_at)
(doctor_id, created_at)
(chamber_id, created_at)

Prescription
------------
(patient_id, created_at)
(encounter_id)

Payment
-------
(practice_id, received_at)
(patient_id, received_at)

AuditLog
--------
(practice_id, created_at)
(actor_user_id, created_at)
(resource_type, resource_id)
```

---

# 68. Multi-Tenant Strategy

The initial architecture should use a **shared PostgreSQL database with tenant IDs**.

Most business tables should include:

```text
practice_id
```

Example:

```text
patients.practice_id
appointments.practice_id
encounters.practice_id
payments.practice_id
audit_logs.practice_id
```

Advantages:

- Lower infrastructure complexity
- Easier MVP deployment
- Easier reporting
- Lower cost
- Easier migrations

---

# 69. Tenant Isolation

Every repository/service query should apply tenant filtering.

Bad:

```sql
SELECT *
FROM patients
WHERE id = :patient_id;
```

Better:

```sql
SELECT *
FROM patients
WHERE id = :patient_id
AND practice_id = :practice_id;
```

This should be enforced systematically rather than relying on developers to remember it manually.

---

# 70. PostgreSQL Row-Level Security

RLS can be considered for high-security environments.

Conceptually:

```text
Application
    ↓
Set current tenant
    ↓
PostgreSQL RLS
    ↓
Tenant-isolated data
```

For MVP, application-level authorization may be sufficient if implemented rigorously.

RLS becomes attractive when:

- Multiple engineering teams access the database
- Analytics systems access production data
- Enterprise customers require stronger isolation
- Regulatory/security requirements increase

---

# 71. Soft Delete Strategy

Tables requiring soft deletion should have:

```text
deleted_at
```

Optional:

```text
deleted_by
delete_reason
```

Example:

```text
Patient
-------
deleted_at
deleted_by
delete_reason
```

Queries should exclude deleted records by default.

---

# 72. Timestamp Strategy

Use UTC internally.

Recommended fields:

```text
created_at
updated_at
deleted_at
```

The application converts timestamps to:

```text
Asia/Dhaka
```

for Bangladesh users.

Do not store local time without timezone context.

---

# 73. Optimistic Concurrency

Clinical and prescription records can potentially be edited from multiple devices.

Use:

```text
version
```

or:

```text
updated_at
```

for optimistic concurrency.

Example:

```text
Client version = 5
Database version = 6

→ Reject update
→ Ask client to refresh
```

This prevents silent overwriting.

---

# 74. Offline Synchronization Readiness

Even if full offline support is not part of MVP, entities should be designed with synchronization in mind.

Useful fields:

```text
id
created_at
updated_at
deleted_at
version
```

Future sync metadata:

```text
sync_version
last_synced_at
device_id
```

should only be introduced where required.

---

# 75. Clinical Record Versioning

The following should support versioning:

```text
ClinicalNote
Prescription
DiagnosticReport metadata
Important clinical assessments
```

For example:

```text
Encounter
   │
   └── ClinicalNote V1
          ↓
       Amendment
          ↓
      ClinicalNote V2
```

The original should remain recoverable.

---

# 76. Data Retention

The platform should eventually define retention policies for:

- Clinical records
- Prescriptions
- Diagnostic reports
- Payments
- Audit logs
- AI conversations
- AI-generated data
- Uploaded files

Retention periods should be configurable based on applicable Bangladesh legal/business requirements.

The application architecture should therefore avoid assumptions such as:

```text
DELETE clinical record permanently after X days
```

until the retention policy has been formally established.

---

# 77. Sensitive Data Classification

## Highly Sensitive

```text
Clinical notes
Diagnosis
Prescription
Diagnostic reports
AI patient-context data
Medical history
Allergies
```

## Sensitive

```text
Patient phone
Address
Date of birth
Emergency contact
Financial information
```

## Operational

```text
Queue status
Appointment time
Chamber schedule
Staff assignment
```

Access control should reflect these categories.

---

# 78. Database Security

Recommended controls:

- Encryption at rest
- TLS for database connections
- Encrypted object storage
- Secrets stored outside source code
- Database credentials rotated
- Restricted database network access
- Separate production credentials
- Automated backups
- Backup encryption
- Restore testing
- Audit logging

---

# 79. Backup Strategy

At minimum:

```text
Daily automated backup
+
Point-in-time recovery
+
Periodic restore test
```

Production backup should be geographically separated from the primary database where practical.

---

# 80. Migration Strategy

Use version-controlled database migrations.

Example:

```text
001_initial_schema
002_add_doctor_onboarding
003_add_chambers
004_add_patients
005_add_encounters
006_add_prescriptions
007_add_ai
```

Never manually modify production schema without a corresponding migration.

---

# 81. Recommended PostgreSQL Schema Organization

Initially, a single PostgreSQL schema can be used:

```text
public
```

Application modules should still maintain clear ownership.

For larger deployments, logical schemas can later be introduced:

```text
identity
practice
patient
clinical
prescription
billing
ai
platform
audit
```

For MVP:

> Keep one physical PostgreSQL schema unless there is a strong operational reason to split it.

---

# 82. Recommended Backend Module Mapping

The database should map cleanly to backend modules.

```text
src/
├── auth/
├── users/
├── doctors/
├── practices/
├── chambers/
├── staff/
├── patients/
├── appointments/
├── queue/
├── encounters/
├── clinical/
├── diagnoses/
├── investigations/
├── diagnostic-reports/
├── prescriptions/
├── medicines/
├── billing/
├── followups/
├── ai/
├── notifications/
├── files/
├── reports/
├── audit/
└── subscriptions/
```

---

# 83. Transaction Boundaries

Certain operations should execute within database transactions.

## Patient Registration

```text
Create Patient
+
Generate Patient Number
+
Create Contact
```

---

## Check-in

```text
Update Appointment
+
Create Queue Entry
```

---

## Consultation Completion

```text
Complete Encounter
+
Finalize associated workflow
+
Create follow-up
+
Trigger notification
```

---

## Payment

```text
Create Payment
+
Generate Receipt
```

---

## Prescription Finalization

```text
Validate Draft
+
Create Version
+
Finalize Prescription
+
Write Audit Log
```

---

# 84. Prescription Finalization Transaction

The critical transaction should resemble:

```text
BEGIN

Validate user permission

Validate encounter

Validate prescription draft

Validate medicines

Create prescription version

Set prescription status = FINALIZED

Set finalized_by

Set finalized_at

Create audit log

COMMIT
```

If any step fails:

```text
ROLLBACK
```

No partially finalized prescription should exist.

---

# 85. AI Data Separation

AI tables should reference clinical entities but should not replace them.

Correct:

```text
AIRequest
   ↓
Patient / Encounter
```

Incorrect:

```text
AIResponse = ClinicalRecord
```

AI output must remain an assistive layer.

---

# 86. Reporting Architecture

Operational reports can query transactional tables directly at MVP scale.

Example:

```text
Daily Patient Count
    ↓
QueueEntry / Appointment
```

For larger scale, introduce:

```text
Reporting DB
     or
Materialized Views
     or
Data Warehouse
```

Only when required.

---

# 87. Materialized Views

Potential future materialized views:

```text
daily_chamber_statistics
doctor_daily_statistics
monthly_revenue
patient_visit_summary
prescription_statistics
```

These can improve reporting performance without complicating MVP transactional logic.

---

# 88. Search Strategy

For MVP:

```text
PostgreSQL
+
B-tree indexes
+
ILIKE / trigram indexes
```

Patient search should support:

```text
Patient name
Phone number
Patient number
```

Future:

```text
OpenSearch / Elasticsearch
```

only if search requirements become significantly more complex.

---

# 89. Database Technology Recommendation

## Primary

**PostgreSQL**

Why:

- Strong relational integrity
- Excellent transaction support
- JSONB support
- Mature indexing
- Full-text search
- Strong ecosystem
- Excellent support with Django/NestJS
- Suitable for clinical + financial workloads

---

# 90. Redis Usage

Redis should not be the system of record.

Use Redis for:

```text
Session/cache
Queue state caching
Rate limiting
OTP
Temporary AI task state
Background job coordination
```

Do not store authoritative:

```text
Clinical records
Prescriptions
Payments
Patients
```

only in Redis.

---

# 91. Background Jobs

Use asynchronous workers for:

```text
AI processing
PDF generation
Prescription delivery
Notifications
Report generation
Data exports
File processing
Backup operations
```

Conceptually:

```text
API
 ↓
Job Queue
 ↓
Worker
 ↓
Database / External Service
```

---

# 92. Core MVP Tables

The initial MVP database should prioritize:

```text
users
doctor_profiles
practices
chambers
chamber_memberships
roles
permissions
role_permissions

patients
appointments
queue_entries

encounters
clinical_notes
vitals
diagnoses
patient_diagnoses
investigations
patient_investigations

medicines
prescriptions
prescription_versions
prescription_items

payments
receipts
follow_ups

ai_requests
ai_responses
ai_prescription_drafts

notifications
audit_logs
file_assets
```

---

# 93. Phase 2 Tables

Add:

```text
patient_family
patient_tags
allergies
medical_history

prescription_templates
medicine_favorites

diagnostic_reports

ai_conversations
ai_messages
ai_usage

patient_communications
notification_preferences

data_export_jobs
```

---

# 94. Phase 3 Tables

Potential additions:

```text
telemedicine_sessions
lab_integrations
pharmacy_integrations
referrals
insurance_claims
external_patient_identifiers
device_sync_records
advanced_analytics
```

These should not complicate the MVP schema unnecessarily.

---

# 95. Domain Relationship Summary

The core business relationship is:

```text
Doctor
  │
  ▼
Practice
  │
  ├───────────────┐
  ▼               ▼
Chamber          Staff
  │
  ▼
Appointment
  │
  ▼
Queue
  │
  ▼
Patient
  │
  ▼
Encounter
  │
  ├── Vitals
  ├── Clinical Notes
  ├── Diagnoses
  ├── Investigations
  ├── Diagnostic Reports
  │
  └── Prescription
          │
          ├── Version
          └── Items
```

Parallel business flows:

```text
Encounter → Payment
Encounter → Follow-up
Encounter → AI
Patient → Medical History
Patient → Allergies
Patient → Diagnostic Reports
```

---

# 96. Final Architectural Decision

For MVP, the recommended stack is:

```text
                Flutter / Web
                     │
                     ▼
               REST API
                     │
             ┌───────┴────────┐
             ▼                ▼
        Application       Background
          Server            Workers
             │                │
             └───────┬────────┘
                     ▼
                PostgreSQL
                     │
              ┌──────┴──────┐
              ▼             ▼
            Redis       Object Storage
                            │
                            ▼
                      Reports / Files
```

AI operates as an external/service boundary:

```text
Application
    ↓
AI Orchestrator
    ↓
LLM / AI Services
    ↓
Structured AI Output
    ↓
Human Review
    ↓
Clinical Record
```

---

# 97. Most Important Database Rules

The following should be treated as architectural invariants:

1. Every practice-owned resource must be tenant-isolated.
2. Every chamber-scoped resource must be chamber-isolated.
3. Patient records belong to the practice.
4. Appointments belong to a chamber and patient.
5. Queue entries are independent operational records.
6. Encounters represent actual clinical consultations.
7. Prescriptions are versioned.
8. Finalized clinical records cannot be silently overwritten.
9. AI outputs remain separate from official clinical records.
10. Payments cannot be modified without audit.
11. Important clinical actions must generate audit records.
12. Files belong in object storage, not PostgreSQL binary columns.
13. Redis is not the source of truth.
14. Soft deletion is preferred for important business records.
15. All timestamps are stored consistently and displayed in the user's timezone.
16. UUIDs should be used for externally exposed identifiers.
17. Database constraints should enforce critical uniqueness and integrity rules.
18. Authorization must be enforced at the API/service layer.
19. Sensitive clinical data must never be exposed simply because a user can access a patient.
20. Prescription finalization must be transactional and auditable.

---

# 98. Next Document

The next document should convert this domain model into an implementation-ready API architecture:

## Document 7 — Backend Architecture & API Specification

It should define:

### Architecture

- Modular monolith vs microservices
- Module boundaries
- Dependency rules
- Service/repository architecture
- Domain/application/infrastructure layers

### Authentication

- Signup
- OTP
- Login
- Refresh token
- Logout
- Password reset
- Session management

### Doctor APIs

- Profile
- Verification
- Chambers
- Schedules
- Staff

### Patient APIs

- Registration
- Search
- Profile
- Timeline
- Clinical history

### Appointment APIs

- Create
- Reschedule
- Cancel
- Check-in
- Queue

### Clinical APIs

- Encounter
- Vitals
- Notes
- Diagnosis
- Investigations
- Reports

### Prescription APIs

- Draft
- Edit
- AI draft
- Review
- Finalize
- Versioning
- PDF

### Billing APIs

- Payment
- Receipt
- Refund
- Reports

### AI APIs

- Chat
- Patient summary
- Prescription generation
- Report analysis
- Voice-to-note

### Platform APIs

- Notifications
- Audit
- Reports
- Export
- Subscription

The API specification should include **endpoint naming, HTTP methods, request/response structures, authentication requirements, permission requirements, validation rules, error responses, pagination, filtering, idempotency and transaction behavior**.