# Chamber Management
## Document 12 — Complete Database Migration, Seed Data & Initialization Strategy

**Version:** 1.0  
**Status:** Implementation Ready  
**Backend:** NestJS + TypeScript + Fastify  
**ORM:** Prisma  
**Database:** PostgreSQL  
**Cache/Jobs:** Redis + BullMQ  
**Primary Time Zone:** `Asia/Dhaka`  
**API Version:** `/api/v1`

---

# 1. Purpose

This document defines the complete database initialization and migration strategy for the Chamber Management platform.

It covers:

- PostgreSQL database creation
- Prisma initialization
- Environment configuration
- Migration strategy
- Development migrations
- Production migrations
- Seed data
- System roles
- Permissions
- Medicine/catalog initialization
- Reference data
- Development demo data
- Test data
- Migration validation
- CI/CD integration
- Deployment ordering
- Rollback strategy
- Backup and restore
- Disaster recovery
- Migration safety rules
- Database health verification

The objective is to ensure that any developer or deployment environment can reliably reproduce the same database structure and required system data.

---

# 2. Database Lifecycle

The database lifecycle is:

```text
Developer
   ↓
Prisma Schema
   ↓
Migration
   ↓
Seed
   ↓
Local Database

Git Repository
   ↓
Migration Files
   ↓
CI Validation
   ↓
Staging
   ↓
Production
```

Production must never depend on manually executed SQL or developer-specific database state.

---

# 3. Database Environments

The platform should maintain separate databases for:

```text
Development
Testing
Staging
Production
```

Recommended structure:

```text
chamber_management_dev
chamber_management_test
chamber_management_staging
chamber_management_prod
```

Never use the production database for:

- local development
- automated tests
- experiments
- manual SQL testing
- seed testing

---

# 4. Environment Variables

Minimum database configuration:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/chamber_management"
```

Recommended additional variables:

```env
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

DATABASE_CONNECT_TIMEOUT=5000

DATABASE_LOG_QUERIES=false

DATABASE_SSL=true
```

Environment-specific values must be stored outside source control.

---

# 5. Recommended Project Structure

```text
project-root/
│
├── prisma/
│   ├── schema.prisma
│   │
│   ├── migrations/
│   │   ├── 20260904000000_init/
│   │   │   └── migration.sql
│   │   │
│   │   ├── 20260905000000_add_indexes/
│   │   │   └── migration.sql
│   │   │
│   │   └── migration_lock.toml
│   │
│   ├── seed.ts
│   │
│   └── seeds/
│       ├── roles.seed.ts
│       ├── permissions.seed.ts
│       ├── role-permissions.seed.ts
│       ├── diagnoses.seed.ts
│       ├── investigations.seed.ts
│       ├── medicines.seed.ts
│       ├── plans.seed.ts
│       └── demo.seed.ts
│
├── src/
│   ├── database/
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   └── database-health.service.ts
│   │
│   └── ...
│
├── scripts/
│   ├── db-reset.ts
│   ├── db-seed.ts
│   ├── db-health.ts
│   └── db-verify.ts
│
└── package.json
```

---

# 6. Prisma Initialization

Install Prisma:

```bash
npm install prisma @prisma/client
```

Initialize:

```bash
npx prisma init
```

This creates:

```text
prisma/schema.prisma
.env
```

The schema from **Document 11** becomes the source of truth.

---

# 7. Initial PostgreSQL Setup

Create the database:

```sql
CREATE DATABASE chamber_management;
```

Create a dedicated application user:

```sql
CREATE USER chamber_app WITH PASSWORD 'REPLACE_WITH_SECRET';
```

Grant only required permissions.

Example development configuration:

```sql
GRANT ALL PRIVILEGES ON DATABASE chamber_management
TO chamber_app;
```

Production privileges should be more restrictive and managed according to the deployment platform.

---

# 8. PostgreSQL Extensions

The platform recommends:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

Purpose:

| Extension | Purpose |
|---|---|
| pgcrypto | UUID/cryptographic functions |
| pg_trgm | Partial/fuzzy text search |

These extensions should be created through a Prisma migration so every environment receives the same configuration.

---

# 9. Initial Migration

After the Prisma schema is complete:

```bash
npx prisma format
```

Validate:

```bash
npx prisma validate
```

Generate client:

```bash
npx prisma generate
```

Create the initial migration:

```bash
npx prisma migrate dev --name init
```

This produces:

```text
prisma/
└── migrations/
    └── YYYYMMDDHHMMSS_init/
        └── migration.sql
```

The generated migration must be committed to Git.

---

# 10. Migration Files Are Source Code

Migration files must be treated like application source code.

They must be:

```text
Committed
Reviewed
Tested
Versioned
Immutable after deployment
```

Never:

```text
Edit old migration
Delete old migration
Rename old migration
Recreate migration history
```

after it has been deployed to shared/staging/production environments.

---

# 11. Development Migration Workflow

During active development:

```text
Modify schema.prisma
        ↓
prisma format
        ↓
prisma validate
        ↓
prisma migrate dev
        ↓
Review migration
        ↓
Run tests
        ↓
Commit schema + migration
```

Command:

```bash
npx prisma migrate dev --name descriptive_change
```

Examples:

```bash
npx prisma migrate dev --name add_patient_family
npx prisma migrate dev --name add_prescription_amendments
npx prisma migrate dev --name add_queue_counter
```

Migration names should describe the actual change.

---

# 12. Migration Naming Convention

Use:

```text
<timestamp>_<short_description>
```

Examples:

```text
20260904000000_init
20260905103000_add_patient_family
20260906110000_add_prescription_amendment
20260907143000_add_ai_usage
```

Avoid:

```text
change
update
fix
new
test
migration1
```

---

# 13. Migration Review Process

Every migration should be reviewed before merging.

Checklist:

```text
[ ] Does the migration create the expected tables?
[ ] Are all foreign keys correct?
[ ] Are indexes present?
[ ] Are unique constraints correct?
[ ] Are nullable fields intentional?
[ ] Are defaults safe?
[ ] Does existing data remain valid?
[ ] Could the migration lock a large table?
[ ] Could it cause downtime?
[ ] Does it require a backfill?
[ ] Does it require expand-and-contract?
```

---

# 14. Migration Categories

Migrations should be classified as:

### Type A — Safe

Examples:

```text
Add nullable column
Create new table
Create non-critical index
```

### Type B — Requires Backfill

Examples:

```text
Add required column
Populate existing records
Convert data format
```

### Type C — Potentially Breaking

Examples:

```text
Rename column
Remove column
Change data type
Change required/optional state
```

### Type D — High Risk

Examples:

```text
Large table rewrite
Large index creation
Data transformation
Large-scale clinical data migration
```

Type C and D migrations require explicit deployment planning.

---

# 15. Expand-and-Contract Strategy

For breaking changes:

```text
Phase 1
Add new structure
        ↓
Phase 2
Deploy backward-compatible code
        ↓
Phase 3
Backfill
        ↓
Phase 4
Switch application
        ↓
Phase 5
Remove old structure
```

Example:

Old:

```text
Patient.name
```

New:

```text
Patient.fullName
```

Do not immediately remove `name`.

Instead:

```text
Add fullName
    ↓
Backfill fullName
    ↓
Deploy application using fullName
    ↓
Verify
    ↓
Remove name in later migration
```

---

# 16. Production Migration Command

Production must use:

```bash
npx prisma migrate deploy
```

Never use:

```bash
npx prisma migrate dev
```

against production.

`migrate deploy` applies already-created migrations without modifying migration history.

---

# 17. Prisma Client Generation

After installing a new version of the schema:

```bash
npx prisma generate
```

CI should run:

```bash
npm ci
npx prisma generate
npm run build
```

The generated Prisma Client should match the committed schema.

---

# 18. Production Deployment Sequence

Recommended deployment:

```text
1. Build application
2. Run unit tests
3. Run integration tests
4. Build Docker image
5. Deploy migration-compatible application
6. Run prisma migrate deploy
7. Run database verification
8. Start application
9. Run health checks
10. Enable traffic
```

For zero-downtime deployments, use the expand-and-contract strategy.

---

# 19. Recommended Deployment Pipeline

```text
Git Push
   ↓
GitHub Actions
   ↓
Lint
   ↓
Unit Tests
   ↓
Prisma Validate
   ↓
Prisma Generate
   ↓
Build
   ↓
Integration Tests
   ↓
Docker Build
   ↓
Staging Deploy
   ↓
Migration
   ↓
Smoke Tests
   ↓
Production Approval
   ↓
Production Migration
   ↓
Production Deploy
```

---

# 20. Database Migration Lock

Prisma maintains migration history using:

```text
_prisma_migrations
```

This table tracks:

- migration name
- applied timestamp
- checksum
- success/failure
- execution duration

Do not manually modify `_prisma_migrations`.

If a migration fails, investigate the actual database state rather than deleting migration history.

---

# 21. Migration Verification

After deployment:

```bash
npx prisma migrate status
```

Expected:

```text
Database schema is up to date.
```

The deployment system should also run application-level verification.

---

# 22. Database Verification Script

Recommended:

```bash
npm run db:verify
```

The verification process should check:

```text
Database connection
        ↓
Expected tables
        ↓
Expected enums
        ↓
Expected indexes
        ↓
Expected system roles
        ↓
Expected permissions
        ↓
Expected seed records
```

Failure should stop deployment.

---

# 23. Seed Architecture

Seed data must be divided into categories.

```text
System Seed
    ↓
Reference Seed
    ↓
Configuration Seed
    ↓
Development Seed
    ↓
Demo Seed
```

These must not be treated equally.

---

# 24. Seed Categories

## 24.1 System Seed

Required in every environment:

```text
Roles
Permissions
Role permissions
System configuration
Subscription plans
```

## 24.2 Reference Seed

Required depending on product functionality:

```text
Diagnosis catalog
Investigation catalog
Medicine catalog
Frequency definitions
Reference values
```

## 24.3 Development Seed

Development only:

```text
Demo doctor
Demo chamber
Demo staff
Demo patients
Demo appointments
Demo consultations
```

## 24.4 Test Seed

Automated test fixtures:

```text
Test users
Test chamber
Test patients
Test appointments
```

These should normally be generated dynamically by tests instead of relying on shared seed data.

---

# 25. Seed Idempotency

Seed scripts must be safe to execute repeatedly.

Bad:

```typescript
await prisma.role.create(...)
```

Good:

```typescript
await prisma.role.upsert({
  where: {
    name: "DOCTOR",
  },
  update: {},
  create: {
    name: "DOCTOR",
  },
});
```

The same seed should produce the same database state when run multiple times.

---

# 26. Master Seed Script

Recommended:

```typescript
async function main() {
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();

  await seedSubscriptionPlans();

  await seedDiagnoses();
  await seedInvestigations();
  await seedMedicines();

  if (process.env.SEED_DEMO_DATA === "true") {
    await seedDemoData();
  }
}
```

---

# 27. Package.json Commands

Recommended scripts:

```json
{
  "scripts": {
    "db:format": "prisma format",
    "db:validate": "prisma validate",
    "db:generate": "prisma generate",

    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:status": "prisma migrate status",

    "db:seed": "tsx prisma/seed.ts",

    "db:reset": "prisma migrate reset",

    "db:studio": "prisma studio",

    "db:verify": "tsx scripts/db-verify.ts",
    "db:health": "tsx scripts/db-health.ts"
  }
}
```

---

# 28. System Roles

The following roles must be seeded:

```text
DOCTOR
ASSISTANT_DOCTOR
RECEPTIONIST
CHAMBER_MANAGER
BILLING_STAFF
PLATFORM_ADMIN
```

Recommended role records:

| Role | System |
|---|---:|
| DOCTOR | Yes |
| ASSISTANT_DOCTOR | Yes |
| RECEPTIONIST | Yes |
| CHAMBER_MANAGER | Yes |
| BILLING_STAFF | Yes |
| PLATFORM_ADMIN | Yes |

---

# 29. Permission Naming Convention

Use:

```text
<resource>.<action>
```

Examples:

```text
patient.read
patient.create
patient.update

appointment.read
appointment.create
appointment.update
appointment.cancel

queue.read
queue.manage

encounter.read
encounter.create
encounter.update
encounter.complete
encounter.lock

prescription.read
prescription.create
prescription.update
prescription.finalize
prescription.amend

payment.read
payment.create
payment.refund

report.read
report.upload
report.analyze

staff.read
staff.invite
staff.update
staff.remove

ai.use
ai.clinical_chat
ai.prescription
ai.report_analysis

analytics.read
audit.read
export.create
```

---

# 30. Permission Seed

Permissions should be defined centrally.

Example:

```typescript
const permissions = [
  "patient.read",
  "patient.create",
  "patient.update",

  "appointment.read",
  "appointment.create",
  "appointment.update",
  "appointment.cancel",

  "queue.read",
  "queue.manage",

  "encounter.read",
  "encounter.create",
  "encounter.update",
  "encounter.complete",
  "encounter.lock",

  "prescription.read",
  "prescription.create",
  "prescription.update",
  "prescription.finalize",
  "prescription.amend",

  "payment.read",
  "payment.create",
  "payment.refund",

  "report.read",
  "report.upload",
  "report.analyze",

  "staff.read",
  "staff.invite",
  "staff.update",
  "staff.remove",

  "ai.use",
  "ai.clinical_chat",
  "ai.prescription",
  "ai.report_analysis",

  "analytics.read",
  "audit.read",
  "export.create",
];
```

---

# 31. Role-Permission Matrix

Recommended baseline:

| Permission | Doctor | Assistant | Reception | Manager | Billing |
|---|---:|---:|---:|---:|---:|
| patient.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| patient.create | ✓ | ✓ | ✓ | ✓ | - |
| patient.update | ✓ | ✓ | ✓ | ✓ | - |
| appointment.read | ✓ | ✓ | ✓ | ✓ | - |
| appointment.create | ✓ | ✓ | ✓ | ✓ | - |
| appointment.cancel | ✓ | ✓ | ✓ | ✓ | - |
| queue.read | ✓ | ✓ | ✓ | ✓ | - |
| queue.manage | ✓ | ✓ | ✓ | ✓ | - |
| encounter.read | ✓ | ✓ | - | ✓ | - |
| encounter.create | ✓ | ✓ | - | - | - |
| encounter.update | ✓ | ✓ | - | - | - |
| prescription.create | ✓ | ✓ | - | - | - |
| prescription.finalize | ✓ | ✓* | - | - | - |
| prescription.amend | ✓ | ✓* | - | - | - |
| payment.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| payment.create | ✓ | - | ✓ | ✓ | ✓ |
| payment.refund | ✓ | - | - | ✓ | ✓ |
| staff.manage | ✓ | - | - | ✓ | - |
| AI.use | ✓ | ✓ | - | - | - |
| analytics.read | ✓ | - | - | ✓ | ✓ |
| audit.read | ✓ | - | - | ✓ | - |

`*` Assistant doctor permissions should be configurable by the chamber owner.

---

# 32. Doctor Ownership Rules

The seed must not create arbitrary doctor-to-chamber relationships.

For demo environments:

```text
Demo Doctor
    ↓
Demo Chamber
    ↓
Membership
```

The owner should receive:

```text
DOCTOR
```

membership.

---

# 33. Subscription Plan Seed

Recommended initial plans:

```text
FREE_TRIAL
BASIC
PRO
CLINIC
```

Example:

| Plan | Purpose |
|---|---|
| FREE_TRIAL | New doctor onboarding |
| BASIC | Individual doctor |
| PRO | Growing chamber |
| CLINIC | Multi-doctor operation |

Exact pricing should be configuration, not hard-coded into application logic.

---

# 34. Subscription Seed Example

Example configuration:

```typescript
const plans = [
  {
    code: "FREE_TRIAL",
    name: "Free Trial",
  },
  {
    code: "BASIC",
    name: "Basic",
  },
  {
    code: "PRO",
    name: "Professional",
  },
  {
    code: "CLINIC",
    name: "Clinic",
  },
];
```

Actual prices should be configured separately.

---

# 35. Diagnosis Catalog

The diagnosis table should support a searchable diagnosis catalog.

Initial seed may contain common entries such as:

```text
Fever
Common Cold
Cough
Hypertension
Diabetes Mellitus
Gastritis
Migraine
Asthma
Allergic Rhinitis
Urinary Tract Infection
```

For production, a medically validated diagnosis dataset should be used.

The seed should not attempt to become a comprehensive medical ontology.

---

# 36. Investigation Catalog

Initial examples:

```text
CBC
Blood Glucose
HbA1c
Lipid Profile
Liver Function Test
Kidney Function Test
Urine R/E
Urine C/S
Chest X-Ray
ECG
Ultrasound
```

The catalog should remain configurable.

---

# 37. Medicine Catalog

The medicine catalog is operationally important.

The production medicine dataset should be:

```text
Validated
Versioned
Searchable
Auditable
Updated independently
```

Recommended fields:

```text
genericName
genericNameBangla
brandName
manufacturer
strength
dosageForm
route
isActive
```

Do not rely on a small demo seed as the production medicine database.

---

# 38. Medicine Data Import

Production medicine catalogs should preferably be imported through:

```text
CSV
JSON
Admin import
Controlled migration
```

Recommended flow:

```text
Medicine Dataset
      ↓
Validation
      ↓
Duplicate Detection
      ↓
Normalization
      ↓
Import
      ↓
Audit
      ↓
Activation
```

---

# 39. Reference Data Versioning

Reference catalogs should have a version.

Example:

```text
Medicine Catalog v1.0
Medicine Catalog v1.1
Diagnosis Catalog v1.0
```

This allows controlled updates.

Future enhancement:

```prisma
model ReferenceDataVersion {
  id          String   @id @default(uuid()) @db.Uuid
  type        String
  version     String
  importedAt  DateTime @default(now())
}
```

This is optional for MVP.

---

# 40. Demo User Seed

Development-only demo doctor:

```text
Name:
Demo Doctor

Phone:
environment-configured

Role:
DOCTOR
```

Never commit real credentials.

Recommended:

```env
DEMO_DOCTOR_PHONE=
DEMO_DOCTOR_PASSWORD=
```

---

# 41. Demo Chamber Seed

Example:

```text
Name:
Demo Chamber

City:
Dhaka

District:
Dhaka

Division:
Dhaka

Currency:
BDT

Timezone:
Asia/Dhaka
```

---

# 42. Demo Staff

Development only:

```text
Demo Receptionist
Demo Assistant Doctor
Demo Billing Staff
```

Each receives a chamber membership.

---

# 43. Demo Patient Data

Development environment can contain:

```text
Patient A
Patient B
Patient C
Patient D
Patient E
```

Demo records must be clearly synthetic.

Never use:

- real patient information
- real phone numbers belonging to people
- real national IDs
- real medical reports

---

# 44. Demo Workflow Data

A development seed may create:

```text
Doctor
 ↓
Chamber
 ↓
Staff
 ↓
Patients
 ↓
Appointments
 ↓
Queue
 ↓
Encounters
 ↓
Vitals
 ↓
Diagnoses
 ↓
Investigations
 ↓
Prescription
 ↓
Payment
```

This enables developers to immediately test the full chamber workflow.

---

# 45. Seed Environment Rules

Recommended:

```env
SEED_SYSTEM_DATA=true
SEED_REFERENCE_DATA=true
SEED_DEMO_DATA=false
```

Development:

```env
SEED_SYSTEM_DATA=true
SEED_REFERENCE_DATA=true
SEED_DEMO_DATA=true
```

Test:

```env
SEED_SYSTEM_DATA=true
SEED_REFERENCE_DATA=true
SEED_DEMO_DATA=false
```

Production:

```env
SEED_SYSTEM_DATA=true
SEED_REFERENCE_DATA=true
SEED_DEMO_DATA=false
```

---

# 46. Production Seed Restrictions

Production seed must never create:

```text
Demo doctors
Demo patients
Demo appointments
Demo payments
Fake prescriptions
Test accounts
```

Production seed should only create required system/reference configuration.

---

# 47. Seed Transaction Strategy

Related system data should be seeded inside transactions.

Example:

```typescript
await prisma.$transaction(async (tx) => {
  await seedRoles(tx);
  await seedPermissions(tx);
  await seedRolePermissions(tx);
});
```

If one required system seed fails, the transaction should roll back.

---

# 48. Seed Ordering

Recommended:

```text
1. Roles
2. Permissions
3. Role Permissions

4. Subscription Plans

5. Diagnosis Catalog
6. Investigation Catalog
7. Medicine Catalog

8. Demo Users
9. Demo Doctor Profiles
10. Demo Chambers
11. Demo Memberships
12. Demo Patients
13. Demo Appointments
14. Demo Queue
15. Demo Encounters
16. Demo Clinical Records
17. Demo Prescriptions
18. Demo Payments
```

---

# 49. Database Reset — Development Only

For local development:

```bash
npx prisma migrate reset
```

This:

```text
Drops database
 ↓
Recreates database
 ↓
Runs migrations
 ↓
Runs seed
```

Never run against production.

---

# 50. Test Database Strategy

Automated tests should use a dedicated database.

Recommended:

```text
chamber_management_test_<run-id>
```

or a disposable PostgreSQL container.

Test lifecycle:

```text
Create DB
 ↓
Migrate
 ↓
Seed minimal system data
 ↓
Run tests
 ↓
Destroy DB
```

---

# 51. Integration Test Initialization

Before integration tests:

```bash
npx prisma migrate deploy
```

Then:

```bash
npm run db:seed:test
```

The test environment should not depend on a developer's local Prisma state.

---

# 52. Test Data Isolation

Each test should ideally use:

```text
transaction rollback
```

or isolated fixtures.

Avoid tests that depend on:

```text
Patient ID = 1
Appointment ID = 1
```

because IDs are UUIDs and test ordering should not matter.

---

# 53. Migration CI Validation

Every pull request affecting Prisma should run:

```bash
npx prisma format --check
npx prisma validate
npx prisma generate
```

Then:

```bash
npx prisma migrate deploy
```

against a clean PostgreSQL instance.

---

# 54. Migration CI Pipeline

Recommended:

```text
Checkout
 ↓
Install
 ↓
Start PostgreSQL
 ↓
Prisma Validate
 ↓
Prisma Generate
 ↓
Prisma Migrate Deploy
 ↓
Seed
 ↓
Run Integration Tests
 ↓
Run Application Tests
```

This catches:

- invalid migrations
- missing relations
- invalid foreign keys
- broken seed logic
- schema inconsistencies

---

# 55. Schema Drift Detection

Production should not be manually modified.

Periodically check:

```bash
npx prisma migrate status
```

The deployment pipeline should fail if migration history is inconsistent.

Schema changes must go through:

```text
schema.prisma
+
migration
```

---

# 56. Manual SQL Policy

Manual SQL is permitted only for:

```text
Emergency repair
Performance optimization
PostgreSQL extensions
Advanced indexes
Data migration
DBA operations
```

Any manual SQL affecting schema must be converted into a migration whenever possible.

---

# 57. Advanced PostgreSQL Indexes

Some indexes may need raw SQL.

Example:

```sql
CREATE INDEX IF NOT EXISTS idx_patient_full_name_trgm
ON "Patient"
USING gin ("fullName" gin_trgm_ops);
```

These should be stored inside Prisma migration files.

Example:

```text
migration.sql
```

This ensures staging and production receive the same index.

---

# 58. Concurrent Index Creation

For very large production tables, consider:

```sql
CREATE INDEX CONCURRENTLY ...
```

However, Prisma migration transaction behavior must be considered before using it.

Large indexes should be planned separately to avoid production locking.

---

# 59. Data Backfill Strategy

For large datasets:

```text
Migration 1
Add nullable field

Migration 2
Deploy compatible code

Background Job
Backfill records

Migration 3
Make field required

Migration 4
Remove legacy field
```

Do not perform massive data transformations inside a single blocking migration unless the dataset is known to be small.

---

# 60. Clinical Data Migration

If importing existing clinical records:

```text
Source
 ↓
Validation
 ↓
Normalization
 ↓
Patient matching
 ↓
Chamber mapping
 ↓
Clinical record import
 ↓
Prescription import
 ↓
Audit
 ↓
Verification
```

Imported clinical records should retain provenance where possible.

Recommended metadata:

```text
sourceSystem
sourceRecordId
importBatchId
importedAt
```

These fields can be introduced later if legacy migration is required.

---

# 61. Migration Rollback Philosophy

Prisma does not provide a simple universal "undo last production migration" workflow.

Therefore production rollback should normally mean:

```text
Deploy previous application version
+
Apply a forward database migration if necessary
```

not:

```text
Delete migration
+
Reverse database manually
```

---

# 62. Safe Rollback Example

Suppose version 2 adds:

```text
Patient.preferredName
```

Application V2 supports:

```text
preferredName
```

If V2 application fails:

```text
Rollback application to V1
```

Because the new column is nullable, V1 continues functioning.

Later:

```text
Migration V3
Remove preferredName
```

if the feature is permanently abandoned.

---

# 63. Dangerous Rollback

Avoid:

```text
Application V2
 ↓
Drop existing column
 ↓
Deploy
 ↓
Rollback application
```

The previous application may require the dropped column.

Therefore destructive database migrations require extra deployment coordination.

---

# 64. Backup Before High-Risk Migration

Before high-risk migrations:

```text
Verify backup
        ↓
Verify backup timestamp
        ↓
Verify restore capability
        ↓
Run migration
        ↓
Verify application
```

For very high-risk changes, perform a rehearsal against a production-sized staging copy.

---

# 65. Production Backup

Recommended:

```text
Daily full backup
+
Continuous WAL/PITR
+
Off-site copy
+
Encrypted storage
```

Target:

```text
RPO ≤ 15 minutes
RTO ≤ 1 hour
```

Actual targets must be validated against the chosen infrastructure.

---

# 66. Restore Procedure

High-level:

```text
Incident
 ↓
Identify recovery point
 ↓
Restore PostgreSQL
 ↓
Validate migrations
 ↓
Validate critical tables
 ↓
Validate application connectivity
 ↓
Run smoke tests
 ↓
Resume traffic
```

Restore procedures must be tested periodically.

---

# 67. Database Health Check

NestJS should expose:

```text
GET /health
GET /health/live
GET /health/ready
```

Database readiness should verify:

```text
PostgreSQL reachable
+
simple query successful
+
migration state acceptable
```

Example:

```sql
SELECT 1;
```

---

# 68. Startup Database Validation

Application startup should optionally verify:

```text
Database connection
Prisma client
Migration state
Required system configuration
```

Production should fail fast if the database is unavailable.

---

# 69. Do Not Automatically Run Migrations on Application Startup

Avoid:

```typescript
app startup
   ↓
prisma migrate deploy
```

for production application containers.

Prefer:

```text
Deployment pipeline
    ↓
Migration job
    ↓
Application deployment
```

This prevents multiple application replicas from racing to perform migrations.

---

# 70. Dedicated Migration Job

Recommended production deployment:

```text
Docker Image
     │
     ├── migration-job
     │      ↓
     │   prisma migrate deploy
     │
     └── application
            ↓
         NestJS
```

The migration job must succeed before the application is marked ready.

---

# 71. Migration Failure Handling

If:

```bash
npx prisma migrate deploy
```

fails:

```text
Stop deployment
        ↓
Do not route traffic
        ↓
Inspect database
        ↓
Inspect migration
        ↓
Determine whether safe retry is possible
        ↓
Repair using controlled migration
```

Never blindly rerun destructive SQL.

---

# 72. Database Initialization Flow

A fresh environment should execute:

```text
1. Create PostgreSQL database
2. Configure credentials
3. Enable extensions
4. Configure DATABASE_URL
5. Install dependencies
6. Prisma generate
7. Prisma migrate deploy
8. Seed system data
9. Seed reference data
10. Verify database
11. Start application
12. Run health checks
```

---

# 73. Local Developer Initialization

Recommended command:

```bash
npm install
```

Then:

```bash
cp .env.example .env
```

Configure:

```env
DATABASE_URL=...
```

Then:

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run db:verify
```

Finally:

```bash
npm run start:dev
```

---

# 74. Docker Development

Recommended architecture:

```text
Docker Compose

PostgreSQL
Redis
Application
```

Example:

```text
docker compose up -d postgres redis
```

Then:

```bash
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

---

# 75. Docker Production

Production should separate:

```text
Application container
Migration job
PostgreSQL
Redis
Object storage
```

PostgreSQL should preferably be a managed service rather than a database container.

---

# 76. Migration Compatibility Matrix

| Database Change | Old App Compatible? | New App Compatible? |
|---|---:|---:|
| Add nullable field | Yes | Yes |
| Add table | Yes | Yes |
| Add index | Yes | Yes |
| Add required field with default | Usually | Yes |
| Rename field | No | Yes |
| Remove field | No | Yes |
| Change type | Risky | Yes |
| Remove enum value | Risky | Risky |
| Add enum value | Usually | Yes |

The safest migrations preserve backward compatibility during rolling deployments.

---

# 77. Enum Migration Rules

Adding an enum value:

```text
Usually safe
```

Removing/renaming an enum value:

```text
High risk
```

Recommended:

```text
Add new enum value
 ↓
Update application
 ↓
Migrate records
 ↓
Stop using old value
 ↓
Remove old value later if necessary
```

---

# 78. Critical Migration Rules for Clinical Data

Never automatically:

```text
Delete encounter
Delete prescription
Delete clinical note
Delete diagnostic report
Delete payment
```

through a schema migration unless there is an explicitly approved data-retention procedure.

Database migrations must preserve clinical integrity.

---

# 79. Critical Migration Rules for Financial Data

Never silently alter historical:

```text
Payment.amount
Receipt.amount
Refund.amount
```

If financial logic changes:

```text
Create new structure
+
preserve historical records
```

Do not rewrite historical financial facts without an audited migration.

---

# 80. Migration Audit

Each production migration should have:

```text
Migration name
Version
Git commit
Deployment timestamp
Operator
Environment
Duration
Success/failure
Rollback/recovery plan
```

This can be maintained through the CI/CD system.

---

# 81. Database Change Request

For significant database changes, the developer should provide:

```text
Change description
Reason
Affected tables
Expected data volume
Index impact
Locking impact
Backward compatibility
Migration strategy
Rollback strategy
Testing evidence
Deployment plan
```

---

# 82. Migration Definition of Done

A database migration is complete only when:

```text
[ ] schema.prisma updated
[ ] prisma format completed
[ ] prisma validate passes
[ ] migration generated
[ ] migration reviewed
[ ] migration applied locally
[ ] seed succeeds
[ ] integration tests pass
[ ] migration applied to clean DB
[ ] application compiles
[ ] API tests pass
[ ] staging migration succeeds
[ ] production impact assessed
[ ] rollback/recovery strategy documented
```

---

# 83. Seed Definition of Done

A seed is complete when:

```text
[ ] Seed is deterministic
[ ] Seed is idempotent
[ ] Required relations exist
[ ] Duplicate execution is safe
[ ] Production/demo data is separated
[ ] Sensitive credentials are not committed
[ ] Seed transaction strategy is defined
[ ] Seed runs on a clean DB
[ ] Seed runs twice successfully
[ ] Verification passes
```

---

# 84. Recommended Seed Test

CI should execute:

```bash
npm run db:seed
npm run db:seed
```

The second execution must not produce duplicate:

```text
roles
permissions
role permissions
plans
reference data
```

---

# 85. Database Verification Checklist

The verification script should check:

```text
[ ] PostgreSQL connection
[ ] Prisma connection
[ ] Migration status
[ ] User table
[ ] Chamber table
[ ] Patient table
[ ] Appointment table
[ ] Queue table
[ ] Encounter table
[ ] Prescription table
[ ] Payment table
[ ] AIRequest table
[ ] AuditLog table

[ ] Roles exist
[ ] Permissions exist
[ ] Role permissions exist
[ ] Subscription plans exist

[ ] pg_trgm enabled
[ ] pgcrypto enabled
```

---

# 86. Initial Database Verification Queries

Example:

```sql
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Chamber";
SELECT COUNT(*) FROM "Patient";
SELECT COUNT(*) FROM "Appointment";
SELECT COUNT(*) FROM "Encounter";
SELECT COUNT(*) FROM "Prescription";
SELECT COUNT(*) FROM "Payment";
```

System verification:

```sql
SELECT COUNT(*) FROM "Role";
SELECT COUNT(*) FROM "Permission";
```

---

# 87. Migration Monitoring

Production migrations should record:

```text
Start time
End time
Duration
Migration count
Database CPU
Database memory
Locks
Active connections
```

Large migrations should be scheduled during low-traffic periods when appropriate.

---

# 88. Connection Management

NestJS should use a singleton Prisma client.

Recommended:

```text
Application
     ↓
PrismaService
     ↓
PrismaClient
     ↓
PostgreSQL
```

Do not create a new PrismaClient per request.

---

# 89. Prisma Service Lifecycle

Recommended:

```typescript
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

The exact implementation may be extended with logging and graceful shutdown.

---

# 90. Database Logging

Development:

```text
query
info
warn
error
```

Production:

```text
error
warn
selected slow queries
```

Avoid logging:

```text
passwords
OTP
access tokens
refresh tokens
patient-sensitive content
AI prompts containing unnecessary PHI
```

---

# 91. Slow Query Monitoring

Monitor queries exceeding a configurable threshold.

Example:

```env
DATABASE_SLOW_QUERY_MS=500
```

Potential optimization flow:

```text
Slow Query
 ↓
Prisma log
 ↓
SQL analysis
 ↓
EXPLAIN ANALYZE
 ↓
Index/query optimization
 ↓
Regression test
```

---

# 92. Database Performance Baseline

Initial performance targets:

```text
Simple read:
< 100ms target

Typical API database operation:
< 200ms target

Search:
< 300ms target

Complex report:
background processing where appropriate
```

These are engineering targets, not guarantees.

---

# 93. Large Data Tables

Expected high-growth tables:

```text
AuditLog
Appointment
QueueEntry
Encounter
ClinicalNote
Vital
DiagnosticReport
Prescription
Payment
AIRequest
Notification
```

These should be monitored from the beginning.

Future partitioning may be considered for:

```text
AuditLog
AIRequest
Notification
```

if volume becomes large.

---

# 94. Data Archiving

Future archival strategy:

```text
Hot Data
    ↓
Older Data
    ↓
Archive Storage
    ↓
Long-Term Retention
```

Clinical data must remain retrievable according to the application's retention policy.

---

# 95. Disaster Recovery Architecture

Recommended:

```text
Primary PostgreSQL
       │
       ├── Continuous WAL
       │
       ├── Automated Backups
       │
       └── Off-site Backup
```

Recovery:

```text
Incident
 ↓
Select recovery point
 ↓
Restore database
 ↓
Validate schema
 ↓
Validate data
 ↓
Run application
 ↓
Smoke tests
 ↓
Traffic restoration
```

---

# 96. Migration Runbook

Production migration runbook:

```text
1. Confirm deployment version
2. Confirm database backup
3. Confirm migration files
4. Review migration SQL
5. Confirm staging success
6. Confirm application compatibility
7. Announce maintenance if required
8. Execute migration job
9. Monitor database
10. Verify migration status
11. Run DB verification
12. Deploy application
13. Run smoke tests
14. Monitor errors
15. Confirm success
```

---

# 97. Emergency Database Incident Runbook

```text
Detect incident
      ↓
Stop further deployments
      ↓
Assess database state
      ↓
Protect current backup/WAL
      ↓
Determine affected migration
      ↓
Assess data integrity
      ↓
Rollback application if safe
      ↓
Apply forward fix or restore
      ↓
Verify clinical data
      ↓
Verify financial data
      ↓
Verify audit data
      ↓
Resume traffic
```

---

# 98. Database Initialization Architecture

Final initialization architecture:

```text
                    Git Repository
                         │
                         ▼
                  schema.prisma
                         │
                         ▼
                   Prisma CLI
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        Migration Files          Seed Scripts
              │                     │
              ▼                     ▼
          PostgreSQL          System/Reference Data
              │                     │
              └──────────┬──────────┘
                         ▼
                  Verified Database
                         │
                         ▼
                   NestJS Backend
```

---

# 99. Environment Strategy Summary

| Environment | Migration | System Seed | Reference Seed | Demo Seed |
|---|---|---:|---:|---:|
| Local | `migrate dev` | Yes | Yes | Yes |
| CI | `migrate deploy` | Yes | Minimal | No |
| Test | `migrate deploy` | Yes | Yes | No |
| Staging | `migrate deploy` | Yes | Yes | Optional |
| Production | `migrate deploy` | Yes | Controlled | No |

---

# 100. Complete Database Lifecycle

The complete lifecycle is:

```text
Developer changes schema
        ↓
Prisma validation
        ↓
Migration generated
        ↓
Migration reviewed
        ↓
Unit/integration tests
        ↓
CI clean database test
        ↓
Staging migration
        ↓
Staging verification
        ↓
Production backup
        ↓
Production migration
        ↓
Database verification
        ↓
Application deployment
        ↓
Health check
        ↓
Production monitoring
```

---

# 101. Recommended Initial Migration Set

The project should initially create:

```text
001_init
```

containing the complete MVP schema from Document 11.

After that, migrations should be incremental.

Example future history:

```text
001_init
002_add_patient_family
003_add_prescription_amendment
004_add_advanced_audit_metadata
005_add_clinical_note_versioning
006_add_ai_context_reference
007_add_notification_delivery
008_add_offline_sync
```

Actual migration names will be generated by Prisma timestamps.

---

# 102. Recommended Initial Seed Set

Initial system seed:

```text
roles.seed.ts
permissions.seed.ts
role-permissions.seed.ts
subscription-plans.seed.ts
```

Reference seed:

```text
diagnoses.seed.ts
investigations.seed.ts
medicines.seed.ts
```

Development:

```text
demo.seed.ts
```

---

# 103. Recommended npm Workflow

## First setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run db:verify
```

## Daily development

```bash
npx prisma migrate dev --name <change>
npx prisma generate
npm test
```

## CI

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm test
```

## Production

```bash
npx prisma migrate deploy
npm run db:verify
```

---

# 104. Final Database Governance Rules

The team must follow these rules:

### Rule 1
`schema.prisma` is the database structure source of truth.

### Rule 2
Every schema change requires a migration.

### Rule 3
Committed migrations must never be rewritten after deployment.

### Rule 4
Production uses `prisma migrate deploy`.

### Rule 5
Production must not use `prisma migrate dev`.

### Rule 6
Seeds must be idempotent.

### Rule 7
Demo data must never enter production.

### Rule 8
Production credentials must never be committed.

### Rule 9
Destructive migrations require explicit review.

### Rule 10
Clinical data must never be casually deleted or rewritten.

### Rule 11
Financial history must remain auditable.

### Rule 12
High-risk migrations require backup and recovery planning.

### Rule 13
Application startup must not independently execute migrations.

### Rule 14
Migration status must be verified after deployment.

### Rule 15
Database restore procedures must be tested periodically.

---

# 105. Final Definition of a Production-Ready Database

The Chamber Management database is considered production-ready only when:

```text
[✓] Prisma schema validated
[✓] Initial migration tested
[✓] Production migration tested
[✓] System seeds implemented
[✓] Reference seeds implemented
[✓] Seed idempotency verified
[✓] Database verification implemented
[✓] CI migration testing implemented
[✓] Staging migration verified
[✓] Backup configured
[✓] PITR configured
[✓] Restore procedure tested
[✓] Database monitoring configured
[✓] Slow query monitoring configured
[✓] Clinical integrity verified
[✓] Financial integrity verified
[✓] Audit logging verified
[✓] Chamber isolation verified
[✓] Production migration runbook documented
[✓] Disaster recovery runbook documented
```

---

# 106. Document 12 Completion

Document 12 establishes the operational foundation required to take the **Document 11 Prisma schema** from source code to a reproducible production database.

The resulting database lifecycle is:

```text
                 DOCUMENT 11
             Prisma Schema
                    │
                    ▼
          ┌───────────────────┐
          │ Prisma Migration  │
          └─────────┬─────────┘
                    │
                    ▼
             PostgreSQL DB
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   System Seed          Reference Seed
          │                   │
          └─────────┬─────────┘
                    ▼
            Verified Database
                    │
                    ▼
              NestJS Backend
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      API        Workers      AI
        │           │           │
        └───────────┼───────────┘
                    ▼
             Chamber Platform
```

The database layer is now defined from **schema → migration → seed → deployment → verification → backup/recovery**.

The next logical implementation document is:

**Document 13 — Complete NestJS Backend Project Structure, Module Skeleton & Coding Architecture**

This will translate Documents 9–12 into the actual NestJS repository structure, module boundaries, folders, controllers, services, repositories, DTOs, guards, Prisma integration, BullMQ workers, configuration, testing structure, and the initial implementation skeleton.