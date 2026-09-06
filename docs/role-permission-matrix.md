# Chamber Management
## Detailed Role & Permission Matrix

**Document:** Role & Permission Matrix  
**Version:** 1.0  
**Product:** AI-Powered Chamber & Prescription Management Platform  
**Target Market:** Bangladesh  
**Status:** Product & Technical Design Baseline

---

# 1. Purpose

This document defines the complete authorization and permission model for the Chamber Management application.

The system supports multiple users working within a doctor's practice:

- Doctor / Practice Owner
- Assistant Doctor
- Receptionist / Chamber Staff
- Chamber Manager
- Billing Staff
- Platform Administrator

The permission system must ensure that:

1. Doctors retain control over clinical decisions.
2. Staff can efficiently operate the chamber without unnecessary access to medical information.
3. Assistant doctors can access clinical information only when explicitly authorized.
4. Financial information is restricted to authorized users.
5. Users can work across multiple chambers according to their assignments.
6. Sensitive clinical records are protected.
7. All important clinical and administrative actions are auditable.
8. AI-generated information can never bypass clinical approval.

---

# 2. Authorization Model

The application will use **Role-Based Access Control (RBAC)** combined with **scope-based access control**.

A user's effective permission is determined by:

```text
User
  ↓
Role
  ↓
Permissions
  ↓
Scope
  ↓
Resource Ownership / Chamber Assignment
  ↓
Access Decision
```

For example:

```text
Assistant Doctor
    +
clinical.read
    +
Chamber A assignment
    +
Patient assigned to Chamber A
    =
Clinical record access
```

The user should not automatically receive access to patients or chambers outside their assigned scope.

---

# 3. User Roles

## 3.1 Doctor / Practice Owner

The Doctor is the primary owner of the practice.

Responsibilities:

- Manage profile
- Manage chambers
- Manage schedules
- Manage staff
- Manage assistant doctors
- Manage patients
- Conduct consultations
- Create prescriptions
- Approve/finalize prescriptions
- Use AI clinical assistant
- View clinical reports
- View financial reports
- Configure permissions
- Export practice data
- Manage subscriptions

The Doctor has the highest level of access within their own practice.

---

# 4. Assistant Doctor

Assistant Doctors are medical professionals working under the primary doctor/practice.

Typical responsibilities:

- View assigned patients
- Review patient history
- Record clinical history
- Record vitals
- Add examination findings
- Add diagnoses
- Add investigations
- Create prescription drafts
- Use AI clinical assistance
- Prepare consultation notes

By default:

> Assistant Doctors should **not automatically have permission to finalize prescriptions**.

Prescription finalization should be explicitly enabled by the primary doctor if the practice requires it.

---

# 5. Receptionist / Chamber Staff

Receptionists are primarily responsible for operational activities.

Typical responsibilities:

- Register patients
- Search patients
- Create appointments
- Reschedule appointments
- Check patients in
- Manage queue
- Record payments
- Print/send receipts
- View basic patient information

By default, reception staff should **not have access to detailed clinical records**.

For example, they may see:

```text
Patient:
Name
Phone
Age
Gender
Appointment
Queue status
Payment status
```

But should not automatically see:

```text
Diagnosis
Clinical notes
Prescription
Lab interpretation
Medical history
AI clinical analysis
```

---

# 6. Chamber Manager

A Chamber Manager manages the operational side of one or more chambers.

Responsibilities may include:

- Staff management
- Chamber schedule
- Appointment configuration
- Queue configuration
- Operational reports
- Patient registration
- Payment monitoring

The Chamber Manager does not automatically receive clinical permissions.

---

# 7. Billing Staff

Billing Staff focuses on financial operations.

Typical responsibilities:

- Record payments
- View payment history
- Issue receipts
- Process refunds where authorized
- View financial reports
- Manage billing-related information

Billing staff should not have clinical access by default.

---

# 8. Platform Administrator

The Platform Administrator belongs to the Chamber Management platform itself rather than an individual doctor's practice.

Responsibilities:

- Platform user management
- Subscription management
- Platform configuration
- Support operations
- Abuse/security management
- System monitoring
- Account suspension
- Platform-level reporting

Platform administrators should not routinely access patient clinical information.

Clinical data access should require explicit privileged support authorization and should be fully audited.

---

# 9. Permission Scope

Permissions are not sufficient by themselves.

Every permission must also have a scope.

## 9.1 Scope Types

### OWN_ACCOUNT

Access to the user's own account.

Example:

```text
profile.read
profile.update
```

---

### OWN_PRACTICE

Access to all resources belonging to the doctor's practice.

Example:

```text
patient.read
reports.clinical
```

---

### OWN_CHAMBERS

Access to chambers owned by the doctor.

---

### ASSIGNED_CHAMBERS

Access only to chambers where the user has been assigned.

---

### ASSIGNED_PATIENTS

Access only to patients assigned to the user where applicable.

---

### PLATFORM

Platform-wide access.

Used primarily by Platform Administrators.

---

# 10. Permission Actions

The core permission actions are:

| Action | Meaning |
|---|---|
| View | Read information |
| Create | Create new information |
| Edit | Modify information |
| Archive | Soft-delete/deactivate |
| Approve | Approve a workflow |
| Finalize | Make a record official |
| Export | Export information |
| Manage | Configure/manage resources |
| AI | Access AI functionality |

---

# 11. Permission Naming Convention

Permissions should use a predictable naming convention:

```text
<resource>.<action>
```

Examples:

```text
patient.read
patient.create
patient.update

clinical.read
clinical.write

vitals.read
vitals.write

prescription.draft
prescription.finalize

payment.create
payment.refund

ai.chat
ai.prescription
ai.patient_context
```

---

# 12. Authentication Permissions

| Permission | Doctor | Assistant | Receptionist | Manager | Billing | Platform Admin |
|---|---:|---:|---:|---:|---:|---:|
| Login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Logout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Change password | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage own profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage own sessions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| MFA configuration | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

# 13. Doctor Profile Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing | Platform Admin |
|---|---:|---:|---:|---:|---:|---:|
| View doctor profile | ✓ | ✓ | ✓ | ✓ | ✓ | Support |
| Edit doctor profile | ✓ | ✗ | ✗ | ✗ | ✗ | Support |
| Edit professional information | ✓ | ✗ | ✗ | ✗ | ✗ | Support |
| Manage verification | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Upload professional documents | ✓ | ✗ | ✗ | ✗ | ✗ | Support |

---

# 14. Chamber Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing | Platform Admin |
|---|---:|---:|---:|---:|---:|---:|
| View chamber | ✓ | Assigned | Assigned | Assigned | Assigned | ✓ |
| Create chamber | ✓ | ✗ | ✗ | ✗ | ✗ | Support |
| Edit chamber | ✓ | ✗ | Limited | ✓ | ✗ | Support |
| Archive chamber | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Manage chamber settings | ✓ | ✗ | Limited | ✓ | ✗ | ✓ |
| Manage chamber schedule | ✓ | ✗ | Limited | ✓ | ✗ | ✓ |

---

# 15. Staff Management Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing | Platform Admin |
|---|---:|---:|---:|---:|---:|---:|
| View staff | ✓ | Limited | Limited | ✓ | Limited | ✓ |
| Invite staff | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Remove staff | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Change staff role | ✓ | ✗ | ✗ | ✓* | ✗ | ✓ |
| Disable staff | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Configure permissions | ✓ | ✗ | ✗ | ✓* | ✗ | ✓ |

`*` Only within permissions granted to the Chamber Manager.

A Chamber Manager cannot grant permissions that they themselves do not possess.

---

# 16. Assistant Doctor Permissions

| Action | Doctor | Assistant Doctor |
|---|---:|---:|
| Add assistant | ✓ | ✗ |
| Invite assistant | ✓ | ✗ |
| View assistant | ✓ | ✓ Self |
| Edit assistant assignment | ✓ | ✗ |
| Disable assistant | ✓ | ✗ |
| Configure assistant permissions | ✓ | ✗ |
| Remove assistant | ✓ | ✗ |

---

# 17. Patient Permissions

## 17.1 Patient Demographic Data

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| Search patient | ✓ | ✓ | ✓ | ✓ | ✓ |
| View basic profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register patient | ✓ | ✓ | ✓ | ✓ | Limited |
| Edit demographic data | ✓ | ✓ | ✓ | ✓ | Limited |
| Archive patient | ✓ | Limited | ✗ | ✓ | ✗ |
| Merge duplicate patient | ✓ | ✗ | Limited | ✓ | ✗ |

---

# 18. Clinical Record Permissions

Clinical records are significantly more restricted than demographic records.

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View clinical history | ✓ | Configurable | ✗ | ✗ | ✗ |
| Create clinical note | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit clinical note | ✓ | ✓* | ✗ | ✗ | ✗ |
| View diagnosis | ✓ | ✓ | ✗ | ✗ | ✗ |
| Add diagnosis | ✓ | ✓ | ✗ | ✗ | ✗ |
| View investigation | ✓ | ✓ | ✗ | ✗ | ✗ |
| Add investigation | ✓ | ✓ | ✗ | ✗ | ✗ |

`*` Editing should be limited by record status and audit policy.

---

# 19. Vital Signs Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View vitals | ✓ | ✓ | ✗ | ✗ | ✗ |
| Record weight | ✓ | ✓ | Optional | ✗ | ✗ |
| Record BP | ✓ | ✓ | Optional | ✗ | ✗ |
| Record pulse | ✓ | ✓ | Optional | ✗ | ✗ |
| Record temperature | ✓ | ✓ | Optional | ✗ | ✗ |
| Edit vitals | ✓ | ✓* | ✗ | ✗ | ✗ |

A practice may explicitly authorize trained staff to record basic vitals.

---

# 20. Encounter Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View encounter | ✓ | ✓ | ✗ | ✗ | ✗ |
| Start encounter | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create clinical notes | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit encounter | ✓ | ✓* | ✗ | ✗ | ✗ |
| Complete encounter | ✓ | Configurable | ✗ | ✗ | ✗ |
| Reopen encounter | ✓ | ✗ | ✗ | ✗ | ✗ |

---

# 21. Prescription Permissions

Prescription functionality requires special protection.

| Permission | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View prescription | ✓ | Configurable | ✗ | ✗ | ✗ |
| Create prescription draft | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit draft | ✓ | ✓ | ✗ | ✗ | ✗ |
| Save prescription draft | ✓ | ✓ | ✗ | ✗ | ✗ |
| Finalize prescription | ✓ | Configurable | ✗ | ✗ | ✗ |
| Amend finalized prescription | Versioned | Versioned | ✗ | ✗ | ✗ |
| Print prescription | ✓ | ✓ | Configurable | ✗ | ✗ |
| Share prescription | ✓ | ✓ | Configurable | ✗ | ✗ |
| Download PDF | ✓ | ✓ | Configurable | ✗ | ✗ |

---

# 22. Prescription Finalization Rule

The default rule is:

```text
Assistant Doctor
      ↓
Create Draft
      ↓
Primary Doctor Review
      ↓
Primary Doctor Approval
      ↓
Final Prescription
```

The assistant should not be able to bypass this workflow unless the doctor explicitly grants:

```text
prescription.finalize
```

Even then, the finalization event must record:

```text
finalized_by
finalized_at
role
chamber
device/session
prescription_version
```

---

# 23. Appointment Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View appointments | ✓ | ✓ | ✓ | ✓ | Limited |
| Create appointment | ✓ | ✓ | ✓ | ✓ | ✗ |
| Reschedule | ✓ | ✓ | ✓ | ✓ | ✗ |
| Cancel | ✓ | ✓ | ✓ | ✓ | ✗ |
| Mark no-show | ✓ | ✓ | ✓ | ✓ | ✗ |
| View appointment history | ✓ | ✓ | ✓ | ✓ | Limited |

---

# 24. Queue Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View queue | ✓ | ✓ | ✓ | ✓ | Limited |
| Add patient to queue | ✓ | ✓ | ✓ | ✓ | ✗ |
| Check in patient | ✓ | ✓ | ✓ | ✓ | ✗ |
| Call next patient | ✓ | ✓ | ✓ | ✓ | ✗ |
| Skip patient | ✓ | ✓ | ✓ | ✓ | ✗ |
| Reorder queue | ✓ | Configurable | ✓ | ✓ | ✗ |
| Mark consultation started | ✓ | ✓ | ✗ | ✗ | ✗ |
| Mark consultation completed | ✓ | Configurable | ✗ | ✗ | ✗ |

---

# 25. Payment Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View payment | ✓ | ✗ | ✓ | ✓ | ✓ |
| Create payment | ✓ | ✗ | ✓ | ✓ | ✓ |
| Edit payment | ✓ | ✗ | Limited | ✓ | ✓* |
| Issue receipt | ✓ | ✗ | ✓ | ✓ | ✓ |
| Refund payment | ✓ | ✗ | ✗ | Configurable | Configurable |
| View financial summary | ✓ | ✗ | Limited | ✓ | ✓ |
| Export financial report | ✓ | ✗ | ✗ | ✓ | ✓ |

`*` Financial record changes must be audited.

---

# 26. Financial Data Separation

Clinical and financial permissions should remain independent.

For example:

```text
Billing Staff
    ✓ Patient name
    ✓ Appointment
    ✓ Payment
    ✓ Receipt

    ✗ Diagnosis
    ✗ Clinical notes
    ✗ Prescription
    ✗ AI clinical analysis
```

This separation should be enforced at the API level, not only in the frontend.

---

# 27. Diagnostic Report Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View diagnostic report | ✓ | Configurable | ✗ | ✗ | ✗ |
| Upload report | ✓ | ✓ | Optional | ✗ | ✗ |
| Edit report metadata | ✓ | ✓ | Limited | ✗ | ✗ |
| Delete/archive report | ✓ | ✗ | ✗ | ✗ | ✗ |
| AI analyze report | ✓ | ✓ | ✗ | ✗ | ✗ |

---

# 28. AI Permissions

AI access must be independently permissioned.

| AI Capability | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| AI chat | ✓ | Configurable | ✗ | ✗ | ✗ |
| Patient-context AI | ✓ | Configurable | ✗ | ✗ | ✗ |
| Patient summary | ✓ | Configurable | ✗ | ✗ | ✗ |
| AI clinical reasoning | ✓ | Configurable | ✗ | ✗ | ✗ |
| AI prescription draft | ✓ | Configurable | ✗ | ✗ | ✗ |
| AI report analysis | ✓ | Configurable | ✗ | ✗ | ✗ |
| AI voice-to-note | ✓ | Configurable | ✗ | ✗ | ✗ |
| AI documentation | ✓ | Configurable | ✗ | ✗ | ✗ |

---

# 29. AI Safety Permission Rules

AI output is never automatically considered a clinical record.

The system must maintain:

```text
AI Output
    ↓
Suggestion
    ↓
Human Review
    ↓
Edit
    ↓
Doctor Approval
    ↓
Official Record
```

For prescriptions:

```text
AI
 ↓
Prescription Draft
 ↓
Doctor Review
 ↓
Doctor Finalization
```

The AI service must never directly execute:

```text
prescription.finalize
```

---

# 30. Reports Permissions

## Clinical Reports

| Report | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| Patient clinical history | ✓ | Configurable | ✗ | ✗ | ✗ |
| Diagnosis statistics | ✓ | Configurable | ✗ | ✗ | ✗ |
| Prescription statistics | ✓ | Configurable | ✗ | ✗ | ✗ |
| Investigation statistics | ✓ | Configurable | ✗ | ✗ | ✗ |

## Operational Reports

| Report | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| Appointment report | ✓ | ✓ | ✓ | ✓ | Limited |
| Queue report | ✓ | ✓ | ✓ | ✓ | ✗ |
| Patient count | ✓ | ✓ | ✓ | ✓ | ✓ |

## Financial Reports

| Report | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| Daily collection | ✓ | ✗ | Limited | ✓ | ✓ |
| Revenue report | ✓ | ✗ | ✗ | ✓ | ✓ |
| Payment history | ✓ | ✗ | ✓ | ✓ | ✓ |
| Refund report | ✓ | ✗ | ✗ | Configurable | ✓ |

---

# 31. Notification Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| View notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Configure own notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Send patient notification | ✓ | Configurable | ✓ | ✓ | Limited |
| Configure chamber notifications | ✓ | ✗ | Configurable | ✓ | ✗ |

---

# 32. Data Export Permissions

Data export is sensitive and should be restricted.

| Export Type | Doctor | Assistant | Receptionist | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| Patient demographic export | ✓ | Configurable | ✗ | Configurable | ✗ |
| Clinical data export | ✓ | ✗/Configurable | ✗ | ✗ | ✗ |
| Prescription export | ✓ | Configurable | ✗ | ✗ | ✗ |
| Financial export | ✓ | ✗ | ✗ | ✓ | ✓ |
| Full practice export | ✓ | ✗ | ✗ | ✗ | ✗ |

---

# 33. Audit Log Permissions

Audit logs are security-sensitive.

| Action | Doctor | Assistant | Receptionist | Manager | Billing | Platform Admin |
|---|---:|---:|---:|---:|---:|---:|
| View own actions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View chamber audit logs | ✓ | ✗ | ✗ | Configurable | ✗ | ✓ |
| View clinical audit logs | ✓ | ✗ | ✗ | ✗ | ✗ | Privileged |
| Export audit logs | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |

Audit records should never be editable by normal users.

---

# 34. Subscription Permissions

| Action | Doctor | Assistant | Receptionist | Manager | Billing | Platform Admin |
|---|---:|---:|---:|---:|---:|---:|
| View subscription | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Change plan | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| View billing account | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Cancel subscription | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Manage platform subscriptions | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

# 35. Platform Administrator Permissions

Platform administrators operate outside individual practice RBAC.

They may:

```text
platform.users.read
platform.users.manage

platform.practices.read
platform.practices.manage

platform.subscriptions.manage

platform.security.manage

platform.audit.read
```

However:

> Platform administrators should not have unrestricted clinical-data access by default.

If support requires temporary access:

```text
Support Request
      ↓
Reason Required
      ↓
Explicit Authorization
      ↓
Temporary Access
      ↓
Audit
      ↓
Access Automatically Expires
```

---

# 36. Default Role Profiles

## Doctor

```text
Full practice administration
Full clinical access
Full prescription access
Full AI access
Full financial access
Full reporting access
Staff management
Chamber management
Data export
```

---

## Assistant Doctor

```text
Patient: View/Create/Edit
Clinical: View/Create/Edit
Vitals: View/Create/Edit
Diagnosis: View/Create
Investigation: View/Create
Prescription: Draft
AI: Configurable
Appointments: View
Queue: Manage
Payment: No access
Staff: No access
```

---

## Receptionist

```text
Patient demographic: Full operational access
Appointments: Full
Queue: Full
Payments: Create/View
Receipts: Create
Clinical records: No access
Prescription: No access
AI: No access
Reports: Operational only
```

---

## Chamber Manager

```text
Chamber: Manage
Schedule: Manage
Staff: Manage
Appointments: Manage
Queue: Manage
Patients: Operational access
Payments: Manage if granted
Clinical: No access by default
AI: No access by default
```

---

## Billing Staff

```text
Payment: Full operational access
Receipts: Full
Financial reports: Full
Patient demographic: Limited
Clinical records: No access
Prescription: No access
AI: No access
Appointments: Limited
```

---

# 37. Doctor-Configurable Permissions

The Doctor may customize permissions for:

- Assistant Doctors
- Receptionists
- Chamber Managers
- Billing Staff

Example:

```text
Receptionist
    ↓
Can Record Vitals = ON
Can View Clinical Notes = OFF
Can View Prescription = OFF
Can Send Prescription = ON
```

However, doctors should not be able to grant permissions outside their own authority.

For example:

```text
Receptionist → Platform Administration
```

must never be possible.

---

# 38. Permission Groups

For easier administration, permissions should also be grouped.

## Patient Operations

```text
patient.read
patient.create
patient.update
patient.archive
patient.merge
```

## Clinical Operations

```text
clinical.read
clinical.write
clinical.edit
clinical.complete
clinical.reopen
```

## Prescription

```text
prescription.read
prescription.draft
prescription.edit
prescription.finalize
prescription.print
prescription.share
```

## AI

```text
ai.chat
ai.patient_context
ai.summary
ai.prescription
ai.report_analysis
ai.voice_notes
```

## Finance

```text
payment.read
payment.create
payment.update
payment.refund
receipt.create
financial_report.read
financial_report.export
```

## Administration

```text
staff.read
staff.invite
staff.update
staff.disable

chamber.read
chamber.create
chamber.update
chamber.archive

schedule.read
schedule.manage
```

---

# 39. Clinical Record Immutability

Clinical and financial records should not be treated like ordinary CRUD entities.

For example, after prescription finalization:

```text
Prescription V1
     ↓
FINALIZED
```

The system should not simply overwrite V1.

If a correction is required:

```text
Prescription V1
     ↓
Amend
     ↓
Prescription V2
```

Both versions should remain auditable.

---

# 40. Soft Delete Policy

The following records should generally use soft deletion/archive:

- Patients
- Chambers
- Staff
- Appointments
- Clinical records
- Prescriptions
- Diagnostic reports
- Payments
- Receipts

Hard deletion should be extremely restricted and generally limited to:

- Temporary/uncommitted data
- System cleanup
- Explicit platform-level data retention processes

---

# 41. Multi-Chamber Access

A doctor may have:

```text
Doctor
 ├── Chamber A
 ├── Chamber B
 └── Chamber C
```

A staff member may have:

```text
Staff
 ├── Chamber A ✓
 ├── Chamber B ✓
 └── Chamber C ✗
```

The backend must enforce this.

A user assigned to Chamber A must not be able to access Chamber C simply by modifying an API request.

---

# 42. Patient Data Isolation

Patient access should follow the chamber/practice relationship.

Example:

```text
Patient P
   ↓
Practice X
   ↓
Chamber A
```

A user belonging to:

```text
Practice Y
```

must receive:

```text
403 Forbidden
```

even if they know the patient ID.

---

# 43. API-Level Authorization

Authorization must be enforced server-side.

Frontend checks are not security controls.

Every protected API request should validate:

```text
Authenticated User
        ↓
Role
        ↓
Permission
        ↓
Practice
        ↓
Chamber
        ↓
Resource Ownership
        ↓
Access
```

Example:

```text
GET /patients/{patientId}
```

should validate:

```text
user authenticated
AND
patient belongs to user's practice
AND
user has patient.read
AND
patient is within user's chamber scope
```

---

# 44. Example Permission Decision

Request:

```text
Assistant Doctor
GET /patients/123/clinical-history
```

Authorization engine evaluates:

```text
Role:
Assistant Doctor

Permission:
clinical.read

Chamber:
Chamber A

Patient:
Patient 123 → Chamber A

Result:
ALLOW
```

Another request:

```text
Receptionist
GET /patients/123/clinical-history
```

Result:

```text
DENY
```

Reason:

```text
clinical.read permission missing
```

---

# 45. Authorization Failure Responses

The API should use appropriate HTTP status codes.

### Unauthenticated

```http
401 Unauthorized
```

### Authenticated but unauthorized

```http
403 Forbidden
```

### Resource outside user's practice

Prefer:

```http
404 Not Found
```

when revealing the resource's existence would create a security concern.

---

# 46. Audit Requirements

The following actions must be audited:

- Login
- Logout
- Permission changes
- Staff invitation
- Staff removal
- Patient creation
- Patient merge
- Clinical record creation
- Clinical record modification
- Clinical record reopening
- Prescription creation
- Prescription finalization
- Prescription amendment
- AI request
- AI-generated prescription draft
- Report upload
- Payment creation
- Payment modification
- Refund
- Data export
- Account suspension
- Administrative access

Example audit record:

```json
{
  "actor_id": "user_123",
  "actor_role": "DOCTOR",
  "action": "PRESCRIPTION_FINALIZED",
  "resource_type": "PRESCRIPTION",
  "resource_id": "rx_456",
  "chamber_id": "chamber_1",
  "patient_id": "patient_789",
  "timestamp": "2026-09-03T10:30:00Z"
}
```

---

# 47. Recommended Permission Database Model

A flexible RBAC implementation should use:

```text
User
Role
Permission
RolePermission
UserRole
ChamberMembership
PermissionOverride
```

Conceptually:

```text
User
  │
  ├── UserRole
  │       │
  │       └── Role
  │              │
  │              └── RolePermission
  │                       │
  │                       └── Permission
  │
  └── ChamberMembership
```

Optional:

```text
PermissionOverride
```

for doctor-configured exceptions.

---

# 48. Recommended Permission Resolution Order

The authorization engine should evaluate permissions in this order:

```text
1. Is user authenticated?
          ↓
2. Is account active?
          ↓
3. Is user a member of the practice?
          ↓
4. Is user assigned to the requested chamber?
          ↓
5. Does role contain required permission?
          ↓
6. Is there a permission override?
          ↓
7. Is resource within scope?
          ↓
8. Is workflow state allowing the action?
          ↓
9. ALLOW / DENY
```

---

# 49. Workflow-Level Authorization

Permissions should also consider record state.

Example:

```text
Prescription = FINALIZED
```

Even if a user has:

```text
prescription.edit
```

they should not directly modify the finalized prescription.

Instead:

```text
Amend Prescription
      ↓
Create New Version
      ↓
Audit
```

Similarly:

```text
Encounter = COMPLETED
```

should prevent ordinary edits.

---

# 50. Security Principle

The system follows:

> **Least Privilege + Need to Know + Explicit Scope**

A user receives only the minimum access required to perform their job.

This is particularly important because the application handles:

- Personal information
- Medical information
- Prescriptions
- Diagnostic reports
- Financial information
- AI-generated clinical content

---

# 51. Recommended MVP RBAC

For MVP, implement these six roles:

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
PLATFORM_ADMIN
```

MVP must support:

- Role assignment
- Chamber assignment
- Permission checks
- Clinical vs operational separation
- Doctor-configurable assistant/staff permissions
- Prescription finalization protection
- Financial access control
- Audit logging
- Practice-level data isolation

Advanced custom roles can be introduced later.

---

# 52. MVP Permission Priority

## P0 — Mandatory

```text
Authentication
Practice isolation
Chamber isolation
Doctor permissions
Assistant permissions
Receptionist permissions
Patient access
Clinical access
Prescription access
Payment access
AI access
Audit logging
```

## P1 — Recommended

```text
Permission overrides
Custom staff permissions
Advanced reporting permissions
Data export permissions
Temporary privileged access
```

## P2 — Advanced

```text
Custom roles
Fine-grained resource scopes
Temporary access policies
Attribute-based access control
Advanced policy engine
```

---

# 53. Final Authorization Architecture

The final model should look like:

```text
                    ┌──────────────────┐
                    │      User        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │       Role       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Permissions    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Chamber Scope    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Resource Scope   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Workflow State   │
                    └────────┬─────────┘
                             │
                       ┌─────┴─────┐
                       ▼           ▼
                    ALLOW        DENY
```

---

# 54. Key Product Rules

The following rules are considered **non-negotiable**:

### Rule 1
**Doctor owns the practice.**

### Rule 2
**Staff does not automatically receive clinical access.**

### Rule 3
**Assistant Doctor clinical access is configurable.**

### Rule 4
**Prescription finalization is a privileged clinical action.**

### Rule 5
**AI can generate drafts but cannot finalize clinical decisions.**

### Rule 6
**Clinical records are versioned and audited.**

### Rule 7
**Financial permissions are independent from clinical permissions.**

### Rule 8
**Chamber access must be enforced at the backend.**

### Rule 9
**Practice-level data isolation is mandatory.**

### Rule 10
**Platform administrators are separate from practice users.**

### Rule 11
**Sensitive administrative access must be audited.**

### Rule 12
**Hard deletion of clinical and financial records should generally be prohibited.**

---

# 55. Next Document

The next design document should define the application's complete **domain model and database architecture**.

## Document 6 — Domain Model & Database Design

It should cover:

### Core Identity

- User
- DoctorProfile
- Role
- Permission
- UserRole
- ChamberMembership

### Practice

- Practice
- Chamber
- ChamberSchedule
- WorkingDay
- Holiday

### Staff

- StaffProfile
- AssistantDoctor
- StaffInvitation

### Patient

- Patient
- PatientContact
- PatientAddress
- PatientEmergencyContact
- PatientFamily
- PatientTag

### Clinical

- Encounter
- ClinicalNote
- Vital
- Diagnosis
- Investigation
- DiagnosticReport
- Allergy
- MedicalHistory

### Prescription

- Prescription
- PrescriptionItem
- Medicine
- PrescriptionTemplate
- PrescriptionVersion

### Operations

- Appointment
- QueueEntry
- FollowUp

### Finance

- Payment
- Receipt
- Refund
- FeeConfiguration

### AI

- AIConversation
- AIMessage
- AIRequest
- AIResponse
- AIPrescriptionDraft
- AIUsage

### Platform

- Notification
- AuditLog
- FileAsset
- Subscription
- Invoice
- DataExportJob

The database design should also establish **relationships, cardinality, indexes, unique constraints, soft-delete strategy, audit strategy, multi-tenant isolation, and PostgreSQL schema design**.