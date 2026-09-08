import { Injectable, Logger } from '@nestjs/common';

import { NotificationsService } from '@modules/notifications/notifications.service';

/**
 * Queue domain event boundary. Events are currently emitted to the log; a
 * durable event bus (Redis Streams / BullMQ) is introduced in a later sprint.
 */
@Injectable()
export class QueueEventsService {
  private readonly logger = new Logger(QueueEventsService.name);

  constructor(private readonly notifications: NotificationsService) {}

  checkedIn(entry: {
    id: string;
    chamberId: string;
    patientId: string;
    queueNumber: number;
  }): void {
    this.logger.log({ event: 'queue.patient_checked_in', ...entry });
  }

  called(queueEntryId: string): void {
    this.logger.log({ event: 'queue.patient_called', queueEntryId });
    void this.notifications.queueCalled(queueEntryId).catch((error: unknown) => {
      this.logger.error({ event: 'queue.notification_enqueue_failed', queueEntryId, error });
    });
  }

  consultationStarted(queueEntryId: string): void {
    this.logger.log({ event: 'queue.consultation_started', queueEntryId });
  }

  completed(queueEntryId: string): void {
    this.logger.log({ event: 'queue.entry_completed', queueEntryId });
  }
}
