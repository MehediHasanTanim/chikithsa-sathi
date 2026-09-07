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
  ],
})
export class AppModule {}
