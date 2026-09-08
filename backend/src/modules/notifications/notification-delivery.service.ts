import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

import { DatabaseRepository, Repository } from '@database/database.repository';

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(@Repository() private readonly repository: DatabaseRepository) {}

  async deliver(notificationId: string): Promise<void> {
    const notification = await this.repository.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.status === NotificationStatus.SENT) return;

    try {
      this.send(notification.channel, notification.type, notification.id);
      await this.repository.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          attemptCount: { increment: 1 },
          lastError: null,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message.slice(0, 4_000) : 'Unknown delivery error';
      await this.repository.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          attemptCount: { increment: 1 },
          lastError: message,
        },
      });
      throw error;
    }
  }

  private send(channel: NotificationChannel, type: string, notificationId: string): void {
    // Channel providers are intentionally abstracted here. A configured push,
    // email, or SMS adapter can replace this implementation without changing
    // domain event producers or queue semantics.
    this.logger.log({ event: 'notification.delivered', channel, type, notificationId });
  }
}
