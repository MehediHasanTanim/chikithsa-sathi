import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';

import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationWorkerService } from './notification-worker.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationQueueService,
    NotificationDeliveryService,
    NotificationWorkerService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
