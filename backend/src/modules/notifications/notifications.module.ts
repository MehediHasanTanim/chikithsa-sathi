import { Module } from '@nestjs/common';

import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationWorkerService } from './notification-worker.service';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [
    NotificationsService,
    NotificationQueueService,
    NotificationDeliveryService,
    NotificationWorkerService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
