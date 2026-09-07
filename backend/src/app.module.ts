import { Module } from '@nestjs/common';

import { CommonModule } from '@common/common.module';
import { ApplicationConfigModule } from '@config/config.module';
import { DatabaseModule } from '@database/database.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { DoctorsModule } from '@modules/doctors/doctors.module';
import { ChambersModule } from '@modules/chambers/chambers.module';
import { SchedulesModule } from '@modules/schedules/schedules.module';
import { VerificationModule } from '@modules/verification/verification.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { StaffModule } from '@modules/staff/staff.module';
import { PatientsModule } from '@modules/patients/patients.module';
import { AppointmentsModule } from '@modules/appointments/appointments.module';
import { QueueModule } from '@modules/queue/queue.module';
import { EncountersModule } from '@modules/encounters/encounters.module';
import { ClinicalModule } from '@modules/clinical/clinical.module';
import { FilesModule } from '@modules/files/files.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { MedicinesModule } from '@modules/medicines/medicines.module';
import { PrescriptionsModule } from '@modules/prescriptions/prescriptions.module';
import { PaymentsModule } from '@modules/payments/payments.module';

@Module({
  imports: [
    ApplicationConfigModule,
    CommonModule,
    DatabaseModule,
    InfrastructureModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    ChambersModule,
    SchedulesModule,
    VerificationModule,
    PermissionsModule,
    StaffModule,
    PatientsModule,
    AppointmentsModule,
    QueueModule,
    EncountersModule,
    ClinicalModule,
    FilesModule,
    ReportsModule,
    MedicinesModule,
    PrescriptionsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
