# Chamber Management
## Complete NestJS Backend Project Structure, Module Skeleton & Coding Architecture

**Document:** 13  
**Project:** Chamber Management  
**Backend:** NestJS + TypeScript + Fastify  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Cache:** Redis  
**Queue:** BullMQ  
**API:** REST `/api/v1`  
**Architecture:** Modular Monolith  
**Target:** Production-ready backend

---

# 1. Purpose

This document defines the complete backend project structure and coding architecture for the Chamber Management application.

It establishes:

- NestJS project structure
- Module boundaries
- Domain ownership
- Controller/service/repository responsibilities
- DTO architecture
- Validation strategy
- Authentication architecture
- Authorization/RBAC architecture
- Prisma integration
- Redis integration
- BullMQ background processing
- Event-driven architecture
- AI integration boundaries
- File storage architecture
- Error handling
- Logging
- Configuration
- Testing structure
- API versioning
- Dependency rules
- Naming conventions
- Coding standards
- Module skeletons
- Implementation sequence

The goal is to ensure that multiple backend developers can work on the project without creating tightly coupled or inconsistent code.

---

# 2. Backend Architecture

The MVP backend will use a **Modular Monolith** architecture.

```text
                         ┌─────────────────────┐
                         │      Clients        │
                         │                     │
                         │ Flutter / Web /     │
                         │ Admin / Integrations│
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS
                                    ▼
                         ┌─────────────────────┐
                         │   Fastify Adapter   │
                         │      NestJS         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   API Controllers   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │       Application Services   │
                    │                              │
                    │ Auth                         │
                    │ Patients                     │
                    │ Appointments                 │
                    │ Queue                        │
                    │ Encounters                    │
                    │ Prescriptions                │
                    │ Payments                     │
                    │ AI                           │
                    └──────────────┬───────────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
                 ▼                 ▼                 ▼
        ┌────────────────┐ ┌───────────────┐ ┌──────────────┐
        │   Prisma ORM   │ │ Redis/BullMQ  │ │ Object Store │
        └───────┬────────┘ └───────────────┘ └──────────────┘
                │
                ▼
        ┌────────────────┐
        │  PostgreSQL    │
        └────────────────┘
```

---

# 3. Architectural Principles

The backend must follow these principles.

## 3.1 Modular by Business Domain

Each major business capability owns its module.

```text
patients
appointments
queue
encounters
prescriptions
payments
```

Avoid creating one giant `AppService`.

---

## 3.2 Controllers Stay Thin

Controllers should:

- Receive HTTP requests
- Validate DTOs
- Extract authenticated user
- Call application services
- Return responses

Controllers should NOT contain:

- Prisma queries
- Complex business rules
- Transaction orchestration
- AI prompts
- Payment calculations
- Queue allocation algorithms

Example:

```typescript
@Post()
createPatient(
  @CurrentUser() user: AuthenticatedUser,
  @Body() dto: CreatePatientDto,
) {
  return this.patientsService.create(user, dto);
}
```

---

# 4. Recommended Project Structure

```text
src/
├── main.ts
├── app.module.ts
│
├── config/
│   ├── configuration.ts
│   ├── validation.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── storage.config.ts
│   └── ai.config.ts
│
├── common/
│   ├── constants/
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   ├── pipes/
│   ├── serializers/
│   ├── types/
│   ├── utils/
│   └── common.module.ts
│
├── database/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── database-health.service.ts
│   └── database.module.ts
│
├── infrastructure/
│   ├── cache/
│   ├── queue/
│   ├── storage/
│   ├── email/
│   ├── sms/
│   ├── ai/
│   └── infrastructure.module.ts
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── doctors/
│   ├── verification/
│   ├── chambers/
│   ├── schedules/
│   ├── staff/
│   ├── permissions/
│   ├── patients/
│   ├── appointments/
│   ├── queue/
│   ├── encounters/
│   ├── vitals/
│   ├── diagnoses/
│   ├── investigations/
│   ├── reports/
│   ├── files/
│   ├── medicines/
│   ├── prescriptions/
│   ├── payments/
│   ├── notifications/
│   ├── ai/
│   ├── analytics/
│   ├── audit/
│   ├── exports/
│   ├── subscriptions/
│   └── health/
│
└── jobs/
    ├── otp/
    ├── notifications/
    ├── pdf/
    ├── ai/
    ├── exports/
    └── analytics/
```

---

# 5. Module Organization

Every business module should follow a consistent internal structure.

Example:

```text
patients/
├── patients.module.ts
├── patients.controller.ts
├── patients.service.ts
├── patients.repository.ts
├── patients.types.ts
├── patients.constants.ts
├── dto/
│   ├── create-patient.dto.ts
│   ├── update-patient.dto.ts
│   ├── patient-query.dto.ts
│   └── patient-search.dto.ts
├── guards/
│   └── patient-access.guard.ts
├── mappers/
│   └── patient.mapper.ts
└── tests/
    ├── patients.service.spec.ts
    ├── patients.controller.spec.ts
    └── patients.e2e-spec.ts
```

For larger modules:

```text
prescriptions/
├── prescriptions.module.ts
├── controllers/
├── services/
├── repositories/
├── dto/
├── domain/
├── policies/
├── mappers/
├── events/
└── tests/
```

---

# 6. Layer Responsibilities

The application uses the following logical layers.

```text
HTTP
 ↓
Controller
 ↓
Application Service
 ↓
Domain / Business Rules
 ↓
Repository
 ↓
Prisma
 ↓
PostgreSQL
```

Infrastructure dependencies are accessed through dedicated adapters.

```text
Application Service
       │
       ├── Repository
       ├── Cache
       ├── Queue
       ├── Storage
       ├── AI Provider
       └── Notification Provider
```

---

# 7. Controller Layer

Controllers represent API endpoints.

Responsibilities:

- Route handling
- DTO binding
- Authentication
- Authorization decorators
- Response mapping

Example:

```typescript
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
  ) {}

  @Post()
  @RequirePermission('patient.create')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(user, dto);
  }
}
```

Controllers must not access Prisma directly.

---

# 8. Application Service Layer

Services contain application/business workflows.

Example:

```typescript
@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly chamberAccessService: ChamberAccessService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreatePatientDto,
  ) {
    await this.chamberAccessService.assertCanAccess(
      user,
      dto.chamberId,
    );

    const patient =
      await this.patientsRepository.create(dto);

    await this.auditService.record({
      actorId: user.id,
      action: 'PATIENT_CREATED',
      resourceId: patient.id,
    });

    return patient;
  }
}
```

---

# 9. Repository Layer

Repositories encapsulate database access.

Example:

```typescript
@Injectable()
export class PatientsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findById(patientId: string) {
    return this.prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });
  }

  create(data: Prisma.PatientCreateInput) {
    return this.prisma.patient.create({
      data,
    });
  }
}
```

Repositories should not:

- Send notifications
- Generate AI responses
- Perform authorization
- Modify unrelated domains

---

# 10. When to Use Repositories

Repositories are strongly recommended for:

- Patients
- Appointments
- Queue
- Encounters
- Prescriptions
- Payments
- Audit
- AI requests

Small reference-data modules may directly use Prisma through services if abstraction provides no meaningful benefit.

However, consistency should be preferred for core clinical domains.

---

# 11. Common Module

```text
common/
├── constants/
├── decorators/
├── dto/
├── enums/
├── exceptions/
├── filters/
├── guards/
├── interceptors/
├── middleware/
├── pipes/
├── serializers/
├── types/
└── utils/
```

Common code must be genuinely reusable.

Do not put business-specific logic inside `common`.

---

# 12. Common Decorators

Recommended decorators:

```text
@CurrentUser()
@CurrentChamber()
@RequirePermission()
@Public()
@ApiPaginatedResponse()
```

Example:

```typescript
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
```

---

# 13. Authentication Module

```text
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.repository.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── refresh-token.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── refresh-token.guard.ts
├── dto/
│   ├── register.dto.ts
│   ├── verify-otp.dto.ts
│   ├── login.dto.ts
│   └── refresh-token.dto.ts
└── services/
    ├── otp.service.ts
    └── token.service.ts
```

Responsibilities:

- Registration
- OTP verification
- Login
- Access token
- Refresh token
- Logout
- Session management

---

# 14. Authentication Flow

```text
Register
   ↓
Create User
   ↓
Generate OTP
   ↓
Store hashed OTP
   ↓
Send OTP
   ↓
Verify OTP
   ↓
Activate User
   ↓
Issue Access + Refresh Token
```

Never store raw OTPs.

---

# 15. JWT Payload

Recommended payload:

```typescript
interface JwtPayload {
  sub: string;
  sessionId: string;
  tokenVersion: number;
}
```

Do not put large authorization information inside JWT.

Chamber membership and permissions should be resolved server-side.

---

# 16. Users Module

```text
users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── users.repository.ts
├── dto/
│   ├── update-user.dto.ts
│   └── update-preferences.dto.ts
└── mappers/
    └── user.mapper.ts
```

Responsibilities:

- User profile
- Preferences
- Account settings
- Basic user information

Doctor-specific information belongs in `doctors`.

---

# 17. Doctors Module

```text
doctors/
├── doctors.module.ts
├── doctors.controller.ts
├── doctors.service.ts
├── doctors.repository.ts
├── dto/
├── mappers/
└── policies/
```

Responsibilities:

- Doctor profile
- Professional information
- Specialization
- BMDC information
- Professional metadata

---

# 18. Verification Module

```text
verification/
├── verification.module.ts
├── verification.controller.ts
├── verification.service.ts
├── verification.repository.ts
├── dto/
└── policies/
```

State:

```text
NOT_SUBMITTED
      ↓
SUBMITTED
      ↓
UNDER_REVIEW
      ↓
APPROVED / REJECTED
      ↓
RESUBMITTED
```

Verification decisions must be audited.

---

# 19. Chambers Module

```text
chambers/
├── chambers.module.ts
├── chambers.controller.ts
├── chambers.service.ts
├── chambers.repository.ts
├── dto/
├── policies/
└── mappers/
```

Responsibilities:

- Chamber creation
- Chamber settings
- Chamber activation
- Chamber deactivation
- Chamber selection

Every chamber-scoped request must validate membership/access.

---

# 20. Chamber Context

The authenticated request may contain:

```typescript
interface ChamberContext {
  chamberId: string;
  membershipId: string;
  role: ChamberRole;
  permissions: string[];
}
```

However, the server must never blindly trust a client-provided chamber ID.

The server must verify:

```text
Authenticated User
        ↓
Chamber Membership
        ↓
Membership Status
        ↓
Role
        ↓
Permission
        ↓
Resource Access
```

---

# 21. Schedules Module

```text
schedules/
├── schedules.module.ts
├── schedules.controller.ts
├── schedules.service.ts
├── schedules.repository.ts
├── dto/
└── validators/
```

Responsibilities:

- Weekly schedules
- Chamber hours
- Breaks
- Doctor availability
- Appointment slot validation

All scheduling calculations should use the chamber's configured timezone.

For Bangladesh:

```text
Asia/Dhaka
```

---

# 22. Staff Module

```text
staff/
├── staff.module.ts
├── staff.controller.ts
├── staff.service.ts
├── staff.repository.ts
├── dto/
├── invitation/
└── policies/
```

Responsibilities:

- Invite staff
- Accept invitation
- Activate/deactivate membership
- Change role
- Remove membership

---

# 23. Permissions Module

```text
permissions/
├── permissions.module.ts
├── permissions.service.ts
├── permissions.repository.ts
├── guards/
├── decorators/
└── constants/
```

Permission format:

```text
patient.create
patient.read
patient.update

appointment.create
appointment.read
appointment.update

prescription.create
prescription.finalize

payment.create
payment.refund
```

---

# 24. Authorization Architecture

Authorization should operate at multiple levels.

```text
Level 1: Authentication
        ↓
Level 2: Chamber Membership
        ↓
Level 3: Permission
        ↓
Level 4: Resource Ownership/Scope
        ↓
Level 5: Clinical State
```

Example:

A receptionist may have:

```text
patient.create
patient.read
appointment.create
queue.manage
payment.create
```

But not:

```text
prescription.finalize
encounter.lock
audit.read
```

---

# 25. Patients Module

```text
patients/
├── patients.module.ts
├── patients.controller.ts
├── patients.service.ts
├── patients.repository.ts
├── dto/
│   ├── create-patient.dto.ts
│   ├── update-patient.dto.ts
│   ├── patient-query.dto.ts
│   └── patient-search.dto.ts
├── policies/
├── mappers/
└── services/
    ├── patient-search.service.ts
    └── duplicate-detection.service.ts
```

Responsibilities:

- Registration
- Search
- Duplicate detection
- Patient profile
- Chamber association
- Timeline
- Allergies
- Conditions
- Family relationship

---

# 26. Patient Duplicate Detection

Patient creation should check:

```text
Phone
+
Name
+
Date of Birth
+
Gender
```

The result may be:

```text
NO_MATCH
POSSIBLE_MATCH
HIGH_CONFIDENCE_MATCH
```

Do not automatically merge records.

---

# 27. Appointments Module

```text
appointments/
├── appointments.module.ts
├── appointments.controller.ts
├── appointments.service.ts
├── appointments.repository.ts
├── dto/
├── policies/
├── validators/
└── events/
```

Responsibilities:

- Booking
- Rescheduling
- Cancellation
- Confirmation
- Check-in
- No-show
- Appointment conflict prevention

---

# 28. Appointment State Machine

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

Alternative states:

```text
BOOKED → CANCELLED
CONFIRMED → NO_SHOW
CHECKED_IN → CANCELLED
```

State transitions must happen through service methods rather than arbitrary status updates.

Bad:

```typescript
updateAppointment({
  status: 'COMPLETED',
});
```

Preferred:

```typescript
completeAppointment(appointmentId);
```

---

# 29. Queue Module

```text
queue/
├── queue.module.ts
├── queue.controller.ts
├── queue.service.ts
├── queue.repository.ts
├── dto/
├── services/
│   ├── queue-number.service.ts
│   ├── queue-state.service.ts
│   └── queue-priority.service.ts
└── events/
```

Responsibilities:

- Daily queue
- Queue number allocation
- Call patient
- Recall
- Skip
- Start consultation
- Complete queue entry

---

# 30. Queue Number Generation

Never use:

```sql
SELECT MAX(queue_number) + 1
```

Use:

```text
DailyQueueCounter
```

inside a transaction.

This prevents duplicate queue numbers during concurrent check-ins.

---

# 31. Encounters Module

```text
encounters/
├── encounters.module.ts
├── encounters.controller.ts
├── encounters.service.ts
├── encounters.repository.ts
├── dto/
├── policies/
├── state/
└── events/
```

Encounter state:

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

The encounter is the central clinical container.

---

# 32. Clinical Submodules

The following modules operate around an encounter:

```text
encounters
   ├── vitals
   ├── clinical notes
   ├── diagnoses
   ├── investigations
   ├── reports
   └── prescriptions
```

These modules may depend on encounter services but should not duplicate encounter state logic.

---

# 33. Vitals Module

```text
vitals/
├── vitals.module.ts
├── vitals.controller.ts
├── vitals.service.ts
├── vitals.repository.ts
├── dto/
└── validators/
```

Examples:

```text
Weight
Height
BMI
Blood Pressure
Pulse
Temperature
SpO2
Respiratory Rate
Blood Sugar
```

Validation should support clinically sensible ranges while allowing manual override where appropriate.

---

# 34. Clinical Notes Module

Clinical notes may be implemented within `encounters` initially or as a dedicated module if complexity grows.

Recommended structure:

```text
encounters/
└── clinical-notes/
    ├── clinical-notes.service.ts
    ├── clinical-notes.repository.ts
    └── dto/
```

Notes should support:

```text
Chief Complaint
History
Examination
Assessment
Plan
Additional Notes
```

---

# 35. Diagnoses Module

```text
diagnoses/
├── diagnoses.module.ts
├── diagnoses.controller.ts
├── diagnoses.service.ts
├── diagnoses.repository.ts
├── dto/
└── search/
```

The diagnosis catalog is reference data.

Encounter diagnosis associations are clinical data.

These should remain separate.

---

# 36. Investigations Module

```text
investigations/
├── investigations.module.ts
├── investigations.controller.ts
├── investigations.service.ts
├── investigations.repository.ts
├── dto/
└── catalog/
```

Supports:

```text
Investigation catalog
Ordered investigations
Investigation status
Results
Reference ranges
Reports
```

---

# 37. Reports Module

```text
reports/
├── reports.module.ts
├── reports.controller.ts
├── reports.service.ts
├── reports.repository.ts
├── dto/
├── analyzers/
└── mappers/
```

Responsibilities:

- Diagnostic report metadata
- File association
- Report viewing
- AI analysis orchestration
- Report status

---

# 38. Files Module

```text
files/
├── files.module.ts
├── files.controller.ts
├── files.service.ts
├── files.repository.ts
├── dto/
├── storage/
└── validators/
```

The backend should use pre-signed upload URLs.

Flow:

```text
Client
  ↓
POST /files/upload-url
  ↓
Backend validates request
  ↓
Pre-signed URL
  ↓
Client uploads directly to object storage
  ↓
POST /files/complete
  ↓
Backend validates file
  ↓
FileObject stored
```

Never store large binary files directly in PostgreSQL.

---

# 39. Medicines Module

```text
medicines/
├── medicines.module.ts
├── medicines.controller.ts
├── medicines.service.ts
├── medicines.repository.ts
├── dto/
├── search/
└── favorites/
```

Responsibilities:

- Medicine search
- Medicine details
- Doctor favorites
- Generic/brand information
- Form
- Strength

Medicine catalog updates should be independently deployable from application code.

---

# 40. Prescriptions Module

This is one of the most important clinical modules.

```text
prescriptions/
├── prescriptions.module.ts
├── prescriptions.controller.ts
├── prescriptions.service.ts
├── prescriptions.repository.ts
├── dto/
├── state/
├── validators/
├── pdf/
├── delivery/
├── amendments/
└── policies/
```

---

# 41. Prescription Lifecycle

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

AI assistance must never bypass:

```text
AI Draft
   ↓
Doctor Review
   ↓
Doctor Edit
   ↓
Doctor Explicit Approval
   ↓
Final Prescription
```

---

# 42. Prescription Finalization

Finalization must happen inside a database transaction.

Conceptually:

```typescript
await prisma.$transaction(async (tx) => {
  // Validate prescription
  // Validate encounter
  // Validate doctor permission
  // Lock prescription
  // Create audit event
  // Generate final version
});
```

After finalization:

- Prescription cannot be freely edited.
- Prescription items cannot be silently changed.
- Corrections require amendment/versioning.
- Audit history must be preserved.

---

# 43. Payments Module

```text
payments/
├── payments.module.ts
├── payments.controller.ts
├── payments.service.ts
├── payments.repository.ts
├── dto/
├── receipts/
└── refunds/
```

Responsibilities:

- Consultation fee
- Payment recording
- Partial payment
- Receipt
- Refund
- Payment history

Money must use Prisma `Decimal`.

Never use JavaScript floating-point arithmetic for financial values.

---

# 44. Notifications Module

```text
notifications/
├── notifications.module.ts
├── notifications.controller.ts
├── notifications.service.ts
├── notifications.repository.ts
├── channels/
│   ├── in-app/
│   ├── sms/
│   └── email/
└── templates/
```

Notification delivery should normally happen asynchronously.

---

# 45. Notification Flow

```text
Business Event
      ↓
Notification Service
      ↓
BullMQ
      ↓
Notification Worker
      ↓
Provider
      ↓
Delivery Result
```

Example:

```text
AppointmentConfirmed
        ↓
Queue notification job
        ↓
SMS/Email/Push
```

---

# 46. AI Module

AI must be isolated from clinical domain logic.

```text
ai/
├── ai.module.ts
├── ai.controller.ts
├── ai.service.ts
├── ai.repository.ts
├── dto/
├── orchestrator/
│   ├── ai-orchestrator.service.ts
│   └── context-builder.service.ts
├── safety/
│   ├── ai-safety.service.ts
│   ├── input-sanitizer.service.ts
│   └── output-validator.service.ts
├── providers/
│   ├── ai-provider.interface.ts
│   └── openai.provider.ts
├── features/
│   ├── patient-summary/
│   ├── clinical-chat/
│   ├── prescription-draft/
│   ├── report-analysis/
│   └── voice-note/
└── prompts/
```

---

# 47. AI Architecture

```text
AI Controller
      ↓
AI Service
      ↓
AI Orchestrator
      ↓
Context Builder
      ↓
Safety Layer
      ↓
AI Provider
      ↓
Output Validator
      ↓
AI Response
```

AI should never directly access Prisma.

It receives controlled clinical context from application services.

---

# 48. AI Provider Interface

Use an abstraction:

```typescript
export interface AiProvider {
  generate(
    request: AiGenerationRequest,
  ): Promise<AiGenerationResponse>;
}
```

Provider implementation:

```text
AiProvider
   ├── OpenAiProvider
   ├── FutureProviderA
   └── FutureProviderB
```

This prevents provider-specific logic from leaking throughout the application.

---

# 49. AI Prescription Draft

The AI endpoint should conceptually execute:

```text
Doctor Request
      ↓
Verify doctor authorization
      ↓
Load encounter
      ↓
Build clinical context
      ↓
Apply data minimization
      ↓
Safety validation
      ↓
AI provider
      ↓
Validate structured response
      ↓
Store AI request
      ↓
Create AI draft
      ↓
Return draft
```

AI output remains a draft.

---

# 50. AI Safety Boundary

The AI module must never call:

```text
prescriptions.finalize()
```

AI may:

```text
suggest
summarize
draft
analyze
explain
extract
```

Doctor-controlled application services may:

```text
review
edit
approve
finalize
amend
```

---

# 51. Analytics Module

```text
analytics/
├── analytics.module.ts
├── analytics.controller.ts
├── analytics.service.ts
├── queries/
│   ├── revenue.query.ts
│   ├── patients.query.ts
│   └── appointments.query.ts
└── dto/
```

Analytics should avoid putting heavy aggregation queries directly on the consultation request path.

For expensive calculations:

```text
Event
 ↓
BullMQ
 ↓
Aggregation Job
 ↓
Analytics Table/Cache
```

---

# 52. Audit Module

```text
audit/
├── audit.module.ts
├── audit.service.ts
├── audit.repository.ts
├── audit.controller.ts
├── dto/
└── constants/
```

Audit events include:

```text
PATIENT_CREATED
PATIENT_UPDATED
PATIENT_VIEWED

ENCOUNTER_CREATED
ENCOUNTER_COMPLETED
ENCOUNTER_LOCKED

PRESCRIPTION_CREATED
PRESCRIPTION_FINALIZED
PRESCRIPTION_AMENDED

PAYMENT_CREATED
PAYMENT_REFUNDED

STAFF_ADDED
STAFF_REMOVED
ROLE_CHANGED

AI_REQUEST_CREATED
AI_DRAFT_CREATED
```

Audit logs are append-only.

---

# 53. Exports Module

```text
exports/
├── exports.module.ts
├── exports.controller.ts
├── exports.service.ts
├── exports.repository.ts
├── dto/
└── processors/
```

Large exports should be asynchronous.

```text
POST /exports
       ↓
Create ExportJob
       ↓
BullMQ
       ↓
Generate File
       ↓
Upload Storage
       ↓
Mark Completed
       ↓
Client downloads
```

---

# 54. Subscriptions Module

```text
subscriptions/
├── subscriptions.module.ts
├── subscriptions.controller.ts
├── subscriptions.service.ts
├── subscriptions.repository.ts
├── dto/
└── policies/
```

MVP can keep subscription logic simple.

Advanced billing can later be extracted.

---

# 55. Health Module

```text
health/
├── health.module.ts
├── health.controller.ts
├── indicators/
│   ├── database.indicator.ts
│   ├── redis.indicator.ts
│   └── storage.indicator.ts
└── health.service.ts
```

Endpoints:

```text
GET /health
GET /health/live
GET /health/ready
```

---

# 56. Database Module

```text
database/
├── database.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── database-health.service.ts
```

Prisma service:

```typescript
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

---

# 57. Prisma Access Rules

Business modules may access:

```text
PrismaService
```

but database queries should preferably be encapsulated inside repositories for core domains.

Never expose Prisma client to controllers.

---

# 58. Infrastructure Layer

Infrastructure contains external system integrations.

```text
infrastructure/
├── cache/
├── queue/
├── storage/
├── email/
├── sms/
└── ai/
```

The business modules should depend on interfaces rather than concrete providers whenever practical.

---

# 59. Redis Module

```text
infrastructure/cache/
├── cache.module.ts
├── cache.service.ts
└── redis.client.ts
```

Typical uses:

```text
OTP throttling
Rate limiting
Session data
Short-lived cache
Dashboard cache
Distributed locks
Idempotency
```

Do not use Redis as the source of truth for clinical data.

---

# 60. Queue Infrastructure

Use BullMQ.

```text
infrastructure/queue/
├── queue.module.ts
├── queue.service.ts
├── queue.constants.ts
└── processors/
```

Queues:

```text
otp
notifications
pdf
ai
exports
analytics
```

---

# 61. Background Job Architecture

```text
Application Service
       ↓
QueueService
       ↓
BullMQ
       ↓
Worker / Processor
       ↓
External Provider / Heavy Processing
       ↓
Database
```

Jobs must be:

- Idempotent
- Retryable
- Observable
- Safe to execute more than once

---

# 62. Configuration Architecture

Use environment-based configuration.

```text
config/
├── configuration.ts
├── validation.ts
├── database.config.ts
├── redis.config.ts
├── storage.config.ts
└── ai.config.ts
```

Example:

```typescript
export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    environment: process.env.NODE_ENV,
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL,
  },
});
```

---

# 63. Environment Variables

Example:

```text
NODE_ENV
PORT

DATABASE_URL

REDIS_URL

JWT_ACCESS_SECRET
JWT_REFRESH_SECRET

OTP_EXPIRY_SECONDS
OTP_MAX_ATTEMPTS

S3_ENDPOINT
S3_BUCKET
S3_REGION
S3_ACCESS_KEY
S3_SECRET_KEY

AI_PROVIDER
AI_API_KEY
AI_MODEL

SMS_PROVIDER
SMS_API_KEY

EMAIL_PROVIDER
EMAIL_API_KEY
```

Secrets must never be committed to Git.

---

# 64. DTO Architecture

DTOs should be request-specific.

Bad:

```text
PatientDto
```

used everywhere.

Preferred:

```text
CreatePatientDto
UpdatePatientDto
PatientQueryDto
PatientSearchDto
```

DTOs define:

- Types
- Required fields
- Validation
- API contract

---

# 65. Validation

Use:

```text
class-validator
class-transformer
```

Example:

```typescript
export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @Matches(/^01[3-9]\d{8}$/)
  phone?: string;
}
```

Validation should happen before business logic.

---

# 66. Global Validation Pipe

`main.ts` should configure:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

This prevents unexpected fields from entering the application.

---

# 67. Error Handling

Use a consistent API error format.

Example:

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient was not found",
    "details": null
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

---

# 68. Domain Error Codes

Examples:

```text
AUTH_INVALID_CREDENTIALS
AUTH_OTP_EXPIRED
AUTH_OTP_INVALID

CHAMBER_NOT_FOUND
CHAMBER_ACCESS_DENIED

PATIENT_NOT_FOUND
PATIENT_DUPLICATE_POSSIBLE

APPOINTMENT_SLOT_UNAVAILABLE
APPOINTMENT_INVALID_STATE

QUEUE_ALREADY_CHECKED_IN
QUEUE_INVALID_STATE

ENCOUNTER_LOCKED
ENCOUNTER_INVALID_STATE

PRESCRIPTION_NOT_FOUND
PRESCRIPTION_ALREADY_FINALIZED
PRESCRIPTION_REQUIRES_REVIEW

PAYMENT_INVALID_AMOUNT
PAYMENT_ALREADY_REFUNDED

AI_PROVIDER_UNAVAILABLE
AI_OUTPUT_INVALID
AI_REVIEW_REQUIRED
```

---

# 69. Exception Architecture

Recommended custom exceptions:

```text
AppException
 ├── ValidationException
 ├── NotFoundException
 ├── ForbiddenException
 ├── ConflictException
 ├── UnauthorizedException
 └── BusinessRuleException
```

Example:

```typescript
throw new ConflictException(
  'APPOINTMENT_SLOT_UNAVAILABLE',
  'The selected appointment slot is no longer available',
);
```

---

# 70. Global Exception Filter

Use a global filter to normalize:

```text
NestJS errors
Prisma errors
Validation errors
Business exceptions
Unknown exceptions
```

into one API format.

---

# 71. Prisma Error Mapping

Map known Prisma errors.

Examples:

```text
P2002 → Conflict
P2025 → Not Found
```

Never expose raw Prisma error messages to clients.

---

# 72. Response Architecture

Successful response:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_123"
  }
}
```

Paginated response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  }
}
```

---

# 73. Pagination DTO

```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
```

---

# 74. API Versioning

All APIs begin with:

```text
/api/v1
```

Example:

```text
/api/v1/patients
/api/v1/appointments
/api/v1/prescriptions
```

Future breaking changes use:

```text
/api/v2
```

---

# 75. Request ID

Every request should receive a request ID.

```text
Client
  ↓
Request ID
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Logs
```

This allows a single request to be traced across the system.

---

# 76. Logging Architecture

Recommended log categories:

```text
HTTP
AUTH
DATABASE
BUSINESS
AI
QUEUE
SECURITY
AUDIT
ERROR
```

Never log:

```text
Passwords
OTP
JWT tokens
API keys
Full medical records
Sensitive patient information
```

---

# 77. Structured Logging

Example:

```json
{
  "level": "info",
  "event": "appointment.created",
  "requestId": "req_123",
  "userId": "user_123",
  "chamberId": "chamber_123",
  "appointmentId": "appt_123"
}
```

---

# 78. Domain Events

Important business actions should publish events.

Examples:

```text
PatientCreated
AppointmentBooked
AppointmentCancelled
PatientCheckedIn
QueueEntryCreated
EncounterCompleted
PrescriptionFinalized
PaymentRecorded
PaymentRefunded
AIRequestCompleted
```

Events should be used for:

- Notifications
- Analytics
- Audit enrichment
- Background processing

---

# 79. Event Architecture

```text
Business Service
      ↓
Domain Event
      ↓
Event Bus
      ↓
Subscribers
      ├── Notification
      ├── Analytics
      ├── Audit
      └── Background Job
```

Avoid synchronous coupling where asynchronous processing is sufficient.

---

# 80. Transaction Strategy

Use Prisma transactions for workflows where multiple records must remain consistent.

Examples:

### Appointment + Queue

```text
Appointment
+
QueueEntry
```

### Prescription Finalization

```text
Prescription
+
Prescription Items
+
Audit
+
Encounter State
```

### Payment

```text
Payment
+
Receipt
+
Appointment/Encounter State
```

---

# 81. Transaction Example

```typescript
await this.prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create({
    data: paymentData,
  });

  const receipt = await tx.receipt.create({
    data: {
      paymentId: payment.id,
      receiptNumber,
    },
  });

  await tx.auditLog.create({
    data: {
      action: 'PAYMENT_CREATED',
      resourceId: payment.id,
      actorId,
    },
  });

  return payment;
});
```

---

# 82. Optimistic Concurrency

Clinical records should use optimistic concurrency where required.

Example:

```text
Record version = 5

Update request:
expectedVersion = 5

If current version != 5
→ Conflict
```

Response:

```text
CLINICAL_RECORD_MODIFIED
```

This prevents silent overwrites.

---

# 83. State Transition Services

Do not allow arbitrary status updates.

Bad:

```typescript
update({
  status: 'LOCKED',
});
```

Preferred:

```typescript
lockEncounter();
finalizePrescription();
cancelAppointment();
completeQueueEntry();
```

Each transition validates:

- Current state
- Actor
- Permission
- Business conditions

---

# 84. Policies

Complex authorization/business rules should live in policies.

Example:

```text
prescriptions/policies/
└── prescription-policy.service.ts
```

Methods:

```typescript
canCreate()
canEdit()
canReview()
canFinalize()
canAmend()
```

This avoids putting large authorization conditions into controllers.

---

# 85. Resource Authorization

A user may have permission but still not have access to a particular resource.

Example:

```text
Doctor A
   ↓
Permission: patient.read
   ↓
Patient belongs to Chamber B
   ↓
Doctor has no Chamber B membership
   ↓
DENIED
```

Every resource access must validate chamber scope.

---

# 86. Multi-Chamber Isolation

For every chamber-scoped operation:

```text
WHERE chamberId = currentChamberId
```

or equivalent repository/policy enforcement must be applied.

Never trust:

```text
client.patientId
client.chamberId
```

without verifying ownership/scope.

---

# 87. Soft Delete

Use soft deletion for operational entities where appropriate.

Example:

```text
deletedAt
```

Default queries exclude deleted records.

Clinical records should generally not be deleted.

Instead use:

```text
amendment
correction
voiding
versioning
```

according to business rules.

---

# 88. Module Dependency Rules

Allowed:

```text
Appointments
    ↓
Patients

Appointments
    ↓
Chambers

Queue
    ↓
Appointments

Encounters
    ↓
Patients

Prescriptions
    ↓
Encounters
Medicines

Payments
    ↓
Appointments
Encounters
```

Avoid:

```text
Patients
    ↓
Prescriptions
    ↓
Patients
```

Circular dependencies should be eliminated through events or shared application services.

---

# 89. Dependency Direction

Prefer:

```text
HTTP
 ↓
Application
 ↓
Domain
 ↓
Infrastructure
```

Infrastructure must not determine business behavior.

Example:

```text
PrescriptionService
     ↓
AiService interface
     ↓
OpenAiProvider
```

not:

```text
PrescriptionService
     ↓
OpenAI SDK directly
```

---

# 90. Shared Services

Some services are cross-cutting:

```text
ChamberAccessService
AuditService
NotificationService
FileService
CacheService
QueueService
```

These can be exposed through dedicated modules.

Avoid creating a generic:

```text
GodService
```

containing unrelated functionality.

---

# 91. AppModule

High-level structure:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule,
    CommonModule,
    InfrastructureModule,

    AuthModule,
    UsersModule,
    DoctorsModule,
    VerificationModule,
    ChambersModule,
    SchedulesModule,
    StaffModule,
    PermissionsModule,

    PatientsModule,
    AppointmentsModule,
    QueueModule,

    EncountersModule,
    VitalsModule,
    DiagnosesModule,
    InvestigationsModule,
    ReportsModule,
    FilesModule,

    MedicinesModule,
    PrescriptionsModule,
    PaymentsModule,

    NotificationsModule,
    AiModule,

    AnalyticsModule,
    AuditModule,
    ExportsModule,
    SubscriptionsModule,
    HealthModule,
  ],
})
export class AppModule {}
```

---

# 92. Main Bootstrap

`main.ts` responsibilities:

```text
Create Nest application
↓
Fastify adapter
↓
Global prefix
↓
Validation
↓
Versioning
↓
Exception filter
↓
Interceptors
↓
Swagger
↓
Security headers
↓
Start server
```

Example:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter(),
  );

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(
    process.env.PORT ?? 3000,
    '0.0.0.0',
  );
}

bootstrap();
```

---

# 93. API Controller Versioning

Example:

```typescript
@Controller({
  path: 'patients',
  version: '1',
})
export class PatientsController {}
```

Result:

```text
/api/v1/patients
```

---

# 94. API Documentation

Swagger/OpenAPI should be generated from NestJS decorators.

Every public endpoint should document:

- Summary
- Authentication
- Permissions
- Parameters
- Request DTO
- Response DTO
- Error responses
- Examples

---

# 95. API Response DTOs

Do not expose Prisma models directly.

Bad:

```typescript
return prisma.patient.findUnique(...);
```

Preferred:

```text
Prisma Entity
     ↓
Mapper
     ↓
Response DTO
     ↓
API
```

Example:

```typescript
export class PatientResponseDto {
  id!: string;
  patientNumber!: string;
  name!: string;
  phone?: string;
}
```

---

# 96. Mapper Pattern

```typescript
export class PatientMapper {
  static toResponse(
    patient: Patient,
  ): PatientResponseDto {
    return {
      id: patient.id,
      patientNumber: patient.patientNumber,
      name: patient.name,
      phone: patient.phone ?? undefined,
    };
  }
}
```

This protects the API from accidental database field exposure.

---

# 97. Sensitive Data Handling

Patient responses should be intentionally shaped.

Never automatically return:

```text
internal database metadata
audit information
AI internal prompts
security fields
internal IDs not intended for clients
```

---

# 98. Testing Architecture

Tests should exist at multiple levels.

```text
Unit Tests
Integration Tests
API Tests
E2E Tests
```

---

# 99. Unit Tests

Test:

```text
Services
Policies
Validators
State machines
Utilities
Mappers
```

Example:

```text
prescriptions.service.spec.ts
appointment-policy.service.spec.ts
queue-number.service.spec.ts
```

---

# 100. Integration Tests

Test:

```text
Repository
Prisma
PostgreSQL
Redis
BullMQ
```

Example:

```text
patients.repository.spec.ts
queue.repository.spec.ts
prescription.repository.spec.ts
```

Use an isolated test database.

---

# 101. E2E Tests

Critical workflows should be tested end-to-end.

### Doctor onboarding

```text
Register
→ OTP
→ Login
→ Doctor Profile
→ Chamber
→ Schedule
```

### Patient consultation

```text
Patient
→ Appointment
→ Check-in
→ Queue
→ Consultation
→ Vitals
→ Diagnosis
→ Prescription
→ Payment
→ Complete
```

### AI workflow

```text
Consultation
→ AI Draft
→ Doctor Review
→ Doctor Edit
→ Finalize
```

---

# 102. Critical Clinical E2E Test

The following flow is mandatory:

```text
Create Patient
      ↓
Create Appointment
      ↓
Check In
      ↓
Create Queue Entry
      ↓
Start Consultation
      ↓
Add Vitals
      ↓
Add Diagnosis
      ↓
Create Prescription
      ↓
Finalize Prescription
      ↓
Record Payment
      ↓
Complete Encounter
      ↓
Lock Encounter
```

---

# 103. Test Data Factories

Use factories rather than manually repeating fixture objects.

```text
tests/
├── factories/
│   ├── user.factory.ts
│   ├── chamber.factory.ts
│   ├── patient.factory.ts
│   ├── appointment.factory.ts
│   └── prescription.factory.ts
└── fixtures/
```

Example:

```typescript
const patient = await patientFactory.create({
  chamberId,
});
```

---

# 104. Seed vs Test Fixtures

Do not confuse:

```text
Seed data
```

with:

```text
Test fixtures
```

Seed data is for:

```text
development
staging
reference catalogs
demo
```

Fixtures are for:

```text
automated tests
```

---

# 105. Security Architecture

Backend security must include:

```text
TLS
JWT
Refresh Token Rotation
RBAC
Resource Authorization
Rate Limiting
Input Validation
Secure Headers
Audit Logs
Encryption
Secret Management
File Access Control
```

---

# 106. Rate Limiting

High-risk endpoints should have stricter limits.

Examples:

```text
/login
/verify-otp
/resend-otp
/ai/*
/files/upload-url
```

AI endpoints should have both:

```text
request rate limit
usage/quota limit
```

---

# 107. Idempotency

Support idempotency for operations where duplicate requests are dangerous.

Examples:

```text
Appointment creation
Queue check-in
Payment
Refund
Prescription finalization
Export
AI requests
```

Header:

```text
Idempotency-Key: <unique-key>
```

---

# 108. Idempotency Flow

```text
Request
 ↓
Check idempotency key
 ↓
Already processed?
 ├── Yes → Return previous result
 └── No
       ↓
 Process
       ↓
 Store result
       ↓
 Return
```

---

# 109. File Security

Files must have:

```text
Private storage
Short-lived signed URLs
Content-type validation
Size limits
Extension validation
Virus/malware scanning where applicable
Access authorization
Audit trail
```

Patient reports must never be publicly accessible.

---

# 110. AI Data Privacy

AI requests should use minimum required clinical context.

Do not send unnecessary:

```text
patient phone
address
national ID
internal identifiers
```

when the model does not need them.

AI request/response metadata should be auditable.

---

# 111. Background Processor Structure

Example:

```text
jobs/
└── ai/
    ├── ai.processor.ts
    └── ai.jobs.ts
```

Processor:

```typescript
@Processor('ai')
export class AiProcessor {
  @Process('report-analysis')
  async analyze(job: Job<ReportAnalysisJob>) {
    // Execute AI processing
  }
}
```

The exact BullMQ integration should follow the selected NestJS/BullMQ package version.

---

# 112. PDF Generation

Prescription PDF generation should be asynchronous when possible.

```text
Finalize Prescription
       ↓
Queue PDF Job
       ↓
PDF Worker
       ↓
Generate PDF
       ↓
Upload Storage
       ↓
Update Prescription
```

For a user-facing immediate preview, HTML rendering can be used separately.

---

# 113. Application Startup Sequence

```text
Process Start
    ↓
Load Environment
    ↓
Validate Configuration
    ↓
Initialize NestJS
    ↓
Initialize Prisma
    ↓
Initialize Redis
    ↓
Initialize Queue
    ↓
Register Modules
    ↓
Start HTTP Server
```

Do not automatically run production migrations during application startup.

Migrations should be handled by deployment infrastructure.

---

# 114. Graceful Shutdown

The application should support:

```text
SIGTERM
SIGINT
```

Shutdown flow:

```text
Stop accepting requests
        ↓
Finish active requests
        ↓
Stop workers
        ↓
Close Redis
        ↓
Disconnect Prisma
        ↓
Exit
```

---

# 115. Docker Structure

Recommended:

```text
docker/
├── Dockerfile
├── Dockerfile.worker
└── docker-compose.yml
```

Services:

```text
api
worker
postgres
redis
minio/local-storage
```

Production infrastructure may replace local services with managed equivalents.

---

# 116. Worker Deployment

The API and worker should be independently scalable.

```text
                 ┌─────────────┐
                 │ Load Balancer│
                 └──────┬──────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        API Instance 1        API Instance 2
             │                     │
             └──────────┬──────────┘
                        ▼
                       Redis
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        Worker Instance 1     Worker Instance 2
```

---

# 117. CI/CD Structure

Pipeline:

```text
Push
 ↓
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Build
 ↓
Migration Validation
 ↓
Integration Tests
 ↓
Docker Build
 ↓
Security Scan
 ↓
Deploy Staging
 ↓
Smoke Tests
 ↓
Production Approval
 ↓
Migration Deploy
 ↓
Application Deploy
```

---

# 118. Coding Standards

Use:

```text
TypeScript strict mode
ESLint
Prettier
Husky
lint-staged
```

Recommended:

```text
noImplicitAny
strictNullChecks
noUnusedLocals
noUnusedParameters
```

---

# 119. Naming Conventions

Files:

```text
kebab-case
```

Examples:

```text
patients.service.ts
create-patient.dto.ts
patient-policy.service.ts
```

Classes:

```text
PascalCase
```

Examples:

```text
PatientsService
CreatePatientDto
PatientPolicyService
```

Methods:

```text
camelCase
```

---

# 120. Naming Business Methods

Prefer explicit business actions.

Good:

```text
finalizePrescription()
cancelAppointment()
checkInPatient()
completeEncounter()
lockEncounter()
refundPayment()
```

Avoid vague methods:

```text
updateStatus()
process()
handle()
manage()
```

for important state transitions.

---

# 121. Constants

Business constants belong near their module.

Example:

```text
appointments/
└── appointments.constants.ts
```

Global constants belong in:

```text
common/constants/
```

Do not create a giant global constants file.

---

# 122. Enums

Shared technical enums may be in:

```text
common/enums
```

Domain-specific enums should remain inside the relevant module or Prisma schema.

Examples:

```text
AppointmentStatus
PrescriptionStatus
EncounterStatus
PaymentStatus
```

---

# 123. Service Size Rule

Avoid services becoming thousands of lines.

If a service becomes too large, extract focused services.

Example:

```text
PrescriptionsService
PrescriptionValidationService
PrescriptionFinalizationService
PrescriptionPdfService
PrescriptionDeliveryService
PrescriptionAmendmentService
```

---

# 124. Repository Size Rule

Repositories should focus on data access.

If complex querying becomes large:

```text
patients.repository.ts
patient-search.repository.ts
patient-timeline.repository.ts
```

can be separated.

---

# 125. Domain Policies

Policies should answer questions like:

```text
Can this user finalize this prescription?
Can this user view this patient?
Can this appointment be cancelled?
Can this encounter be locked?
```

They should not perform HTTP operations.

---

# 126. Avoid Circular Module Dependencies

Avoid:

```text
PatientsModule
 ↕
AppointmentsModule
```

Instead:

```text
AppointmentsModule
 ↓
PatientsModule
```

or use:

```text
Domain Events
```

when direct dependency is unnecessary.

---

# 127. Event-Driven Decoupling Example

Instead of:

```typescript
await appointmentService.create();
await notificationService.send();
await analyticsService.update();
```

Prefer:

```typescript
await appointmentService.create();

eventBus.publish(
  new AppointmentBookedEvent(...),
);
```

Subscribers handle:

```text
Notification
Analytics
Audit
```

---

# 128. Module Skeleton Example

Generic module:

```typescript
@Module({
  controllers: [
    PatientsController,
  ],
  providers: [
    PatientsService,
    PatientsRepository,
  ],
  exports: [
    PatientsService,
  ],
})
export class PatientsModule {}
```

Only export what other modules actually need.

---

# 129. Module Export Rules

Avoid:

```typescript
exports: [
  PrismaService,
  PatientsService,
  PatientsRepository,
  PatientPolicy,
  PatientSearchService,
  ...
]
```

Prefer:

```typescript
exports: [
  PatientsService,
]
```

Keep implementation details private.

---

# 130. API Contract Ownership

Each module owns its API contract.

For example:

```text
patients/
 ├── controller
 ├── request DTOs
 └── response DTOs
```

The frontend should not need to know the internal Prisma schema.

---

# 131. DTO Naming

Use:

```text
CreateXDto
UpdateXDto
XQueryDto
XResponseDto
XListResponseDto
```

Examples:

```text
CreateAppointmentDto
RescheduleAppointmentDto
AppointmentQueryDto
AppointmentResponseDto
```

---

# 132. State Transition DTOs

State-changing endpoints should have dedicated DTOs when data is required.

Example:

```text
POST /appointments/:id/reschedule
```

uses:

```text
RescheduleAppointmentDto
```

rather than generic update DTO.

---

# 133. Clinical Record Immutability

Once:

```text
Encounter → LOCKED
```

the following must not be casually updated:

```text
Vitals
Diagnosis
Clinical Notes
Investigation Orders
Prescription
```

Corrections must use explicit amendment/versioning mechanisms.

---

# 134. Audit + Clinical Changes

Important clinical actions should create audit records.

Example:

```text
Doctor finalizes prescription
        ↓
Prescription FINALIZED
        ↓
AuditLog:
  action = PRESCRIPTION_FINALIZED
  actor = doctor
  resource = prescription
  timestamp = ...
```

---

# 135. Business Date vs Timestamp

The application must distinguish:

```text
UTC timestamp
```

from:

```text
Chamber business date
```

Example:

```text
createdAt:
2026-09-04T14:00:00Z

queueDate:
2026-09-04
```

Queue numbering must use chamber-local business date.

---

# 136. Bangladesh-Specific Backend Rules

The backend should support:

```text
Asia/Dhaka
BDT
Bangladesh phone numbers
Bangla names
Bangla addresses
Bangla/English prescriptions
Bangladesh-local date presentation
```

However, timestamps remain stored in UTC.

---

# 137. Search Architecture

Patient and medicine search should support:

```text
Bangla
English
Partial matching
Phone
Patient number
Medicine brand
Generic name
```

PostgreSQL `pg_trgm` can be used for efficient fuzzy/partial matching.

---

# 138. Search Service

Example:

```text
patients/
└── services/
    └── patient-search.service.ts
```

Search service may optimize:

```text
Name
Phone
Patient Number
```

without exposing database-specific search logic to controllers.

---

# 139. Caching Strategy

Good cache candidates:

```text
Medicine catalog
Diagnosis catalog
Investigation catalog
Permissions
Subscription plans
Dashboard summaries
```

Do not cache mutable clinical records aggressively unless invalidation is well-defined.

---

# 140. Cache Key Convention

Use predictable names:

```text
patient:{id}
chamber:{id}:dashboard
doctor:{id}:permissions
medicine:search:{hash}
```

Always define TTL.

---

# 141. Queue Naming Convention

Recommended:

```text
chamber:otp
chamber:notifications
chamber:pdf
chamber:ai
chamber:exports
chamber:analytics
```

Job names:

```text
send-otp
send-notification
generate-prescription-pdf
analyze-report
generate-export
```

---

# 142. AI Job Idempotency

AI jobs must have unique request IDs.

```text
AIRequest
 ↓
requestId
 ↓
Job
 ↓
Provider
```

If a worker retries, it must not accidentally create multiple official clinical records.

AI may create/update AI drafts only.

---

# 143. Observability

Production observability should include:

```text
Application logs
Request metrics
Latency
Error rate
Database performance
Redis health
Queue depth
AI latency
AI failure rate
Storage failures
```

Critical metrics:

```text
appointment creation latency
queue check-in latency
prescription finalization latency
AI response latency
API error rate
queue backlog
```

---

# 144. Health Checks

Readiness should verify:

```text
PostgreSQL
Redis
Required infrastructure
```

Liveness should only verify:

```text
Application process is alive
```

Do not make liveness dependent on PostgreSQL.

---

# 145. Database Access Performance

Avoid:

```text
N+1 queries
```

Use:

```text
select
include
batching
optimized joins
pagination
indexes
```

Do not return huge clinical timelines by default.

---

# 146. API Query Limits

Every list endpoint should have limits.

Example:

```text
limit <= 100
```

For expensive endpoints use smaller defaults.

---

# 147. Large Clinical Timeline

Do not load:

```text
Patient
 ├── All encounters
 ├── All prescriptions
 ├── All reports
 ├── All payments
 ├── All vitals
 └── All investigations
```

in one database query.

Use paginated timeline endpoints.

---

# 148. Transaction Boundaries

Transactions should be created at the application-service level.

Repository methods should generally operate within an injected transaction context where needed.

Conceptually:

```text
Application Service
       ↓
Transaction
       ├── Repository A
       ├── Repository B
       └── Audit Repository
```

---

# 149. Prisma Transaction Context

For complex transactional workflows, repositories should support a transaction client abstraction.

Example:

```typescript
type PrismaTransaction =
  Prisma.TransactionClient;
```

This avoids opening nested independent transactions.

---

# 150. Clinical Concurrency

Potential conflicts:

```text
Doctor editing encounter
Assistant editing encounter
AI draft generated
Prescription being finalized
```

Use:

```text
version
updatedAt
explicit state
transaction
authorization
```

to prevent unsafe overwrites.

---

# 151. Backend Directory — Complete View

```text
src/
│
├── main.ts
├── app.module.ts
│
├── config/
│   ├── configuration.ts
│   ├── validation.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── storage.config.ts
│   └── ai.config.ts
│
├── common/
│   ├── constants/
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   ├── pipes/
│   ├── serializers/
│   ├── types/
│   ├── utils/
│   └── common.module.ts
│
├── database/
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── database-health.service.ts
│   └── database.module.ts
│
├── infrastructure/
│   ├── cache/
│   ├── queue/
│   ├── storage/
│   ├── email/
│   ├── sms/
│   ├── ai/
│   └── infrastructure.module.ts
│
├── modules/
│   │
│   ├── auth/
│   ├── users/
│   ├── doctors/
│   ├── verification/
│   ├── chambers/
│   ├── schedules/
│   ├── staff/
│   ├── permissions/
│   │
│   ├── patients/
│   ├── appointments/
│   ├── queue/
│   │
│   ├── encounters/
│   ├── vitals/
│   ├── diagnoses/
│   ├── investigations/
│   ├── reports/
│   ├── files/
│   │
│   ├── medicines/
│   ├── prescriptions/
│   ├── payments/
│   │
│   ├── notifications/
│   ├── ai/
│   ├── analytics/
│   ├── audit/
│   ├── exports/
│   ├── subscriptions/
│   └── health/
│
└── jobs/
    ├── otp/
    ├── notifications/
    ├── pdf/
    ├── ai/
    ├── exports/
    └── analytics/
```

---

# 152. Recommended Module Ownership

| Module | Primary Responsibility |
|---|---|
| Auth | Authentication/session |
| Users | User account |
| Doctors | Doctor profile |
| Verification | Professional verification |
| Chambers | Chamber |
| Schedules | Availability |
| Staff | Chamber membership |
| Permissions | RBAC |
| Patients | Patient identity |
| Appointments | Booking |
| Queue | Daily queue |
| Encounters | Clinical visit |
| Vitals | Clinical vitals |
| Diagnoses | Diagnosis catalog/association |
| Investigations | Investigation |
| Reports | Diagnostic reports |
| Files | File storage |
| Medicines | Medicine catalog |
| Prescriptions | Prescription lifecycle |
| Payments | Financial transactions |
| Notifications | Communication |
| AI | AI assistance |
| Analytics | Reporting |
| Audit | Audit trail |
| Exports | Data exports |
| Subscriptions | Plans/billing |
| Health | Health checks |

---

# 153. Core Dependency Map

```text
Auth
 └── Users

Doctors
 └── Users

Chambers
 ├── Doctors
 └── Staff

Schedules
 └── Chambers

Patients
 └── Chambers

Appointments
 ├── Patients
 ├── Chambers
 └── Schedules

Queue
 ├── Appointments
 ├── Patients
 └── Chambers

Encounters
 ├── Patients
 ├── Queue
 └── Appointments

Vitals
 └── Encounters

Diagnoses
 └── Encounters

Investigations
 └── Encounters

Reports
 ├── Encounters
 └── Files

Prescriptions
 ├── Encounters
 └── Medicines

Payments
 ├── Appointments
 └── Encounters

AI
 ├── Patients
 ├── Encounters
 ├── Reports
 └── Prescriptions
```

---

# 154. Implementation Order

Backend development should follow this order.

## Phase 1 — Foundation

```text
Project setup
Configuration
Database
Prisma
Common
Error handling
Logging
Health
Swagger
Testing
```

---

## Phase 2 — Authentication

```text
Users
Auth
OTP
Sessions
JWT
```

---

## Phase 3 — Doctor & Chamber

```text
Doctors
Verification
Chambers
Schedules
Staff
Permissions
```

---

## Phase 4 — Patient Operations

```text
Patients
Appointments
Queue
```

---

## Phase 5 — Clinical

```text
Encounters
Vitals
Diagnoses
Investigations
Reports
Files
```

---

## Phase 6 — Prescription

```text
Medicines
Prescriptions
PDF
Delivery
Amendments
```

---

## Phase 7 — Finance

```text
Payments
Receipts
Refunds
```

---

## Phase 8 — AI

```text
AI infrastructure
AI orchestrator
Patient summary
Clinical chat
Prescription draft
Report analysis
```

---

## Phase 9 — Platform

```text
Notifications
Analytics
Audit
Exports
Subscriptions
```

---

# 155. Suggested Sprint Structure

Assuming two-week sprints:

## Sprint 1 — Backend Foundation

Tasks:

```text
NestJS project
Fastify
TypeScript strict mode
ESLint
Prettier
Configuration
Environment validation
Docker
Prisma
PostgreSQL
Redis
Health checks
Swagger
Global validation
Global exception handling
Logging
```

Deliverable:

```text
Production-ready backend skeleton
```

---

## Sprint 2 — Authentication

Tasks:

```text
User model integration
Registration
OTP
OTP expiration
OTP rate limiting
Login
JWT
Refresh tokens
Logout
Session management
Auth guards
Auth tests
```

Deliverable:

```text
Complete authentication system
```

---

## Sprint 3 — Doctor & Chamber

Tasks:

```text
Doctor profile
Professional information
Verification
Chamber CRUD
Chamber activation
Schedules
Schedule breaks
Staff invitation
Membership
RBAC foundation
```

Deliverable:

```text
Doctor can configure chamber
```

---

## Sprint 4 — Patient Management

Tasks:

```text
Patient creation
Patient update
Search
Duplicate detection
Patient chamber association
Allergies
Conditions
Patient timeline
Authorization
Audit
```

Deliverable:

```text
Complete patient management
```

---

## Sprint 5 — Appointment & Queue

Tasks:

```text
Appointment CRUD
Availability validation
Conflict prevention
Reschedule
Cancel
Check-in
Daily queue
Queue number counter
Call
Recall
Skip
Start consultation
Complete queue
```

Deliverable:

```text
Complete chamber operational workflow
```

---

## Sprint 6 — Clinical Encounter

Tasks:

```text
Encounter
Clinical notes
Vitals
Diagnosis
Investigations
Diagnostic reports
File upload
Encounter state machine
Clinical authorization
Audit
```

Deliverable:

```text
Doctor can complete clinical documentation
```

---

## Sprint 7 — Prescription

Tasks:

```text
Medicine catalog
Medicine search
Favorites
Prescription builder
Prescription items
Review
Finalize
Amendment
Prescription history
PDF
```

Deliverable:

```text
Production-ready prescription workflow
```

---

## Sprint 8 — Payments

Tasks:

```text
Payment
Receipt
Payment history
Partial payments
Refund
Financial audit
Idempotency
```

Deliverable:

```text
Complete chamber payment workflow
```

---

## Sprint 9 — AI Foundation

Tasks:

```text
AI provider abstraction
AI request model
AI orchestrator
Context builder
Safety layer
Output validator
Prompt management
AI audit
AI rate limits
```

Deliverable:

```text
Production-safe AI foundation
```

---

## Sprint 10 — AI Features

Tasks:

```text
Patient summary
Clinical chat
Prescription draft
Report analysis
AI request history
AI usage tracking
Failure handling
```

Deliverable:

```text
AI-assisted consultation
```

---

## Sprint 11 — Notifications & Reporting

Tasks:

```text
Notification module
BullMQ
SMS abstraction
Email abstraction
In-app notifications
Analytics dashboard
Revenue reporting
Appointment reporting
Patient reporting
```

Deliverable:

```text
Operational reporting and notifications
```

---

## Sprint 12 — Production Hardening

Tasks:

```text
Security review
Performance testing
Database optimization
Load testing
E2E testing
Backup validation
Migration validation
Observability
CI/CD
Deployment
Disaster recovery
Production readiness
```

Deliverable:

```text
MVP production release
```

---

# 156. Definition of Done

A backend feature is considered complete only when:

```text
Requirement implemented
        ↓
DTO created
        ↓
Validation implemented
        ↓
Authorization implemented
        ↓
Service implemented
        ↓
Repository implemented
        ↓
Error handling implemented
        ↓
Audit implemented if required
        ↓
Unit tests
        ↓
Integration tests
        ↓
API documentation
        ↓
Logging/metrics
        ↓
Code review
        ↓
Migration completed
        ↓
E2E test where applicable
```

---

# 157. Pull Request Rules

Every PR should contain:

```text
What changed
Why it changed
API changes
DB changes
Migration
Tests
Security considerations
Breaking changes
Deployment considerations
```

Large unrelated changes should not be combined.

---

# 158. Backend Code Review Checklist

Reviewers should verify:

### Architecture

```text
Correct module?
Correct dependency?
No circular dependency?
```

### Security

```text
Authentication?
Authorization?
Chamber isolation?
Input validation?
Sensitive data exposure?
```

### Database

```text
Indexes?
Transaction?
Concurrency?
N+1?
Migration safety?
```

### Clinical

```text
State transition?
Immutability?
Audit?
Amendment?
```

### AI

```text
Human review?
No autonomous finalization?
Prompt/data minimization?
Output validation?
```

---

# 159. MVP Modules

The following modules are mandatory for MVP:

```text
Auth
Users
Doctors
Chambers
Schedules
Staff
Permissions
Patients
Appointments
Queue
Encounters
Vitals
Diagnoses
Investigations
Reports
Files
Medicines
Prescriptions
Payments
Notifications
AI
Analytics
Audit
Health
```

---

# 160. Advanced Modules

Later releases can expand:

```text
Patient Portal
Telemedicine
Advanced Voice
Offline Sync
WhatsApp/SMS Automation
Lab Integration
Pharmacy Integration
Insurance
Referral Network
Marketplace
Advanced Predictive Analytics
Advanced AI Agents
```

These should not compromise the core architecture.

---

# 161. Future Microservice Extraction

The MVP should remain a modular monolith.

Potential future extraction candidates:

```text
AI Service
Notification Service
File Processing Service
Reporting Service
Payment Service
Search Service
```

Extraction should happen only when justified by:

```text
scale
deployment independence
team ownership
resource requirements
failure isolation
```

Not simply because microservices are fashionable.

---

# 162. Recommended Backend Repository Structure

At Git repository level:

```text
chamber-management-backend/
│
├── src/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
│   ├── db-health.ts
│   ├── db-verify.ts
│   └── db-seed.ts
│
├── docker/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── development/
│
├── .env.example
├── .eslintrc
├── .prettierrc
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

# 163. Recommended Documentation Structure

```text
docs/
├── architecture/
│   ├── system-architecture.md
│   ├── module-architecture.md
│   ├── database-architecture.md
│   ├── security-architecture.md
│   └── ai-architecture.md
│
├── api/
│   ├── authentication.md
│   ├── patients.md
│   ├── appointments.md
│   ├── clinical.md
│   ├── prescriptions.md
│   └── payments.md
│
└── development/
    ├── local-setup.md
    ├── coding-standards.md
    ├── testing.md
    ├── migrations.md
    └── deployment.md
```

---

# 164. Final Architecture

The complete backend architecture is:

```text
                           CLIENTS
                              │
                              ▼
                     ┌─────────────────┐
                     │ Fastify / NestJS│
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ API Controllers │
                     └────────┬────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Application Layer │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
     Domain Rules        Repositories        Policies
          │                   │
          │                   ▼
          │              Prisma ORM
          │                   │
          │                   ▼
          │              PostgreSQL
          │
          ├──────────────► Redis
          │
          ├──────────────► BullMQ
          │
          ├──────────────► Object Storage
          │
          ├──────────────► Notification Providers
          │
          └──────────────► AI Providers
```

---

# 165. Final Coding Architecture Principles

The Chamber Management backend must follow these rules:

1. **Modular monolith first.**
2. **Business domains own their modules.**
3. **Controllers remain thin.**
4. **Business workflows live in services.**
5. **Database access is encapsulated.**
6. **DTOs define API boundaries.**
7. **Prisma models are never exposed directly as API contracts.**
8. **Authorization is enforced server-side.**
9. **Every chamber-scoped resource requires chamber authorization.**
10. **Clinical records are treated as high-integrity data.**
11. **Finalized prescriptions are immutable.**
12. **Clinical corrections use amendments/versioning.**
13. **Critical workflows use database transactions.**
14. **State transitions use explicit business methods.**
15. **Financial operations use Decimal.**
16. **Redis is not the source of truth.**
17. **Background jobs are idempotent and retryable.**
18. **AI is isolated behind an abstraction.**
19. **AI can draft/suggest but never finalize clinical records.**
20. **All important clinical and financial actions are auditable.**
21. **Sensitive data must not appear in logs.**
22. **API responses use explicit DTOs.**
23. **Production migrations are deployed separately from application startup.**
24. **Automated tests are required for critical clinical workflows.**
25. **Performance and concurrency must be considered from the beginning.**
26. **Bangladesh-specific localization is supported without compromising UTC storage.**
27. **Infrastructure dependencies should be replaceable.**
28. **Future microservice extraction must remain possible without prematurely introducing distributed complexity.**

---

# 166. Backend Development Completion Criteria

The backend architecture is considered ready for MVP implementation when the team has:

```text
✓ NestJS project initialized
✓ Fastify configured
✓ TypeScript strict mode enabled
✓ Configuration system implemented
✓ Prisma configured
✓ PostgreSQL configured
✓ Redis configured
✓ BullMQ configured
✓ Global validation implemented
✓ Global exception handling implemented
✓ Structured logging implemented
✓ Request IDs implemented
✓ Swagger/OpenAPI configured
✓ Authentication architecture implemented
✓ RBAC architecture implemented
✓ Chamber isolation implemented
✓ Module boundaries established
✓ Database migrations implemented
✓ Seed strategy implemented
✓ Test infrastructure implemented
✓ CI/CD pipeline implemented
✓ Health checks implemented
✓ Security baseline implemented
✓ Core clinical state machines implemented
✓ Audit architecture implemented
✓ AI safety architecture implemented
```

---

# 167. Next Recommended Document

The next logical document after Document 13 is:

## Document 14 — Complete NestJS Implementation Skeleton

It should move from architecture into **actual starter code**, including:

```text
package.json
main.ts
app.module.ts

PrismaService
ConfigModule

Global Exception Filter
Validation
Request ID
Logging

JwtAuthGuard
PermissionsGuard
@CurrentUser()
@RequirePermission()

ChamberAccessGuard

UsersModule
AuthModule
ChambersModule
PatientsModule
AppointmentsModule
QueueModule
EncountersModule
PrescriptionsModule
PaymentsModule
AI Module

BullMQ setup
Redis setup

Base DTOs
Response DTOs
Error classes

Repository examples
Service examples
Controller examples

Unit test examples
Integration test setup
E2E test setup

Docker
docker-compose
.env.example

package scripts
```

The objective of Document 14 should be to give the development team a **runnable NestJS backend skeleton**, rather than another conceptual architecture document.