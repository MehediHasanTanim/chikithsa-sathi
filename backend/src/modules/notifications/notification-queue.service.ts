import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export const NOTIFICATION_QUEUE = 'notifications';
export const PDF_QUEUE = 'pdf';
export const AI_QUEUE = 'ai';

type QueueJob = { notificationId: string };

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
  readonly connection: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
    maxRetriesPerRequest: null;
  };
  readonly prefix: string;
  private readonly notifications: Queue<QueueJob>;
  private readonly pdf: Queue;
  private readonly ai: Queue;

  constructor(config: ConfigService) {
    const redisUrl = new URL(config.getOrThrow<string>('redis.url'));
    this.connection = {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      ...(redisUrl.username ? { username: decodeURIComponent(redisUrl.username) } : {}),
      ...(redisUrl.password ? { password: decodeURIComponent(redisUrl.password) } : {}),
      ...(redisUrl.pathname.length > 1 ? { db: Number(redisUrl.pathname.slice(1)) } : {}),
      maxRetriesPerRequest: null,
    };
    this.prefix = `${config.getOrThrow<string>('redis.keyPrefix')}jobs`;
    const options = { connection: this.connection, prefix: this.prefix };
    this.notifications = new Queue<QueueJob>(NOTIFICATION_QUEUE, options);
    this.pdf = new Queue(PDF_QUEUE, options);
    this.ai = new Queue(AI_QUEUE, options);
  }

  async enqueue(notificationId: string, scheduledAt: Date): Promise<void> {
    await this.notifications.add(
      'deliver',
      { notificationId },
      {
        jobId: notificationId,
        delay: Math.max(0, scheduledAt.getTime() - Date.now()),
        attempts: 3,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: { age: 86_400, count: 1_000 },
        removeOnFail: { age: 604_800, count: 5_000 },
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.notifications.close(), this.pdf.close(), this.ai.close()]);
  }
}
