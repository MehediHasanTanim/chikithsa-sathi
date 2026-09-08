import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';

import { NotificationDeliveryService } from './notification-delivery.service';
import { NOTIFICATION_QUEUE, NotificationQueueService } from './notification-queue.service';

@Injectable()
export class NotificationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationWorkerService.name);
  private worker: Worker<{ notificationId: string }> | undefined;

  constructor(
    private readonly queues: NotificationQueueService,
    private readonly delivery: NotificationDeliveryService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      NOTIFICATION_QUEUE,
      async (job) => this.delivery.deliver(job.data.notificationId),
      { connection: this.queues.connection, prefix: this.queues.prefix, concurrency: 5 },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error({ event: 'notification.job_failed', jobId: job?.id, error: error.message });
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
