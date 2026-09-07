import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
