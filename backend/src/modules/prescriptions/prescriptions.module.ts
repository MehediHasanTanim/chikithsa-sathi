import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { AppointmentsModule } from '@modules/appointments/appointments.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionEventsService } from './prescription-events.service';
import { PrescriptionTemplatesService } from './prescription-templates.service';
import { PrescriptionTemplatesController } from './prescription-templates.controller';

@Module({
  imports: [AuthModule, PermissionsModule, NotificationsModule, AppointmentsModule],
  controllers: [PrescriptionsController, PrescriptionTemplatesController],
  providers: [PrescriptionsService, PrescriptionEventsService, PrescriptionTemplatesService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
