import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentEventsService } from './appointment-events.service';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AuthModule, PermissionsModule, NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentEventsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
