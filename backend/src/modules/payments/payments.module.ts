import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentEventsService } from './payment-events.service';

@Module({
  imports: [AuthModule, PermissionsModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentEventsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
