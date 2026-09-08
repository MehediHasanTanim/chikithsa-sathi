import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionEventsService } from './prescription-events.service';

@Module({
  imports: [AuthModule, PermissionsModule, NotificationsModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionEventsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
