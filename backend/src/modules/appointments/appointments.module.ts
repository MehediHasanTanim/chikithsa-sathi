import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
