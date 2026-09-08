import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

import { DatabaseRepository, Repository } from '@database/database.repository';

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(@Repository() private readonly repository: DatabaseRepository, private readonly config: ConfigService) {}

  async deliver(notificationId: string): Promise<void> {
    const notification = await this.repository.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.status === NotificationStatus.SENT) return;

    try {
      await this.send(notification);
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

  private async send(notification: { id: string; channel: NotificationChannel; type: string; recipientPhone: string | null; recipientEmail: string | null; recipientUserId: string | null; payload: unknown }): Promise<void> {
    const message = `${this.config.getOrThrow<string>('app.name')}: ${notification.type.replaceAll('_', ' ')}`;
    if (notification.channel === NotificationChannel.SMS) {
      if (!notification.recipientPhone || !this.config.get<boolean>('sms.enabled')) throw new Error('SMS notification delivery is unavailable');
      const sid = this.config.getOrThrow<string>('sms.twilioAccountSid');
      const token = this.config.getOrThrow<string>('sms.twilioAuthToken');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ To: notification.recipientPhone, From: this.config.getOrThrow<string>('sms.twilioFrom'), Body: message }).toString() });
      if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
    } else if (notification.channel === NotificationChannel.EMAIL) {
      if (!notification.recipientEmail || !this.config.get<boolean>('email.enabled')) throw new Error('Email notification delivery is unavailable');
      const transport = createTransport({ host: this.config.getOrThrow<string>('email.smtpHost'), port: this.config.getOrThrow<number>('email.smtpPort'), secure: this.config.getOrThrow<boolean>('email.smtpSecure'), auth: { user: this.config.getOrThrow<string>('email.smtpUser'), pass: this.config.getOrThrow<string>('email.smtpPassword') } });
      await transport.sendMail({ from: this.config.getOrThrow<string>('email.from'), to: notification.recipientEmail, subject: `${this.config.getOrThrow<string>('app.name')} notification`, text: `${message}\n\n${JSON.stringify(notification.payload)}` });
    } else {
      const url = this.config.get<string>('notifications.pushWebhookUrl');
      if (!this.config.get<boolean>('notifications.pushEnabled') || !url || !notification.recipientUserId) throw new Error('Push notification delivery is unavailable');
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientUserId: notification.recipientUserId, type: notification.type, payload: notification.payload }) });
      if (!response.ok) throw new Error(`Push adapter returned ${response.status}`);
    }
    this.logger.log({ event: 'notification.delivered', channel: notification.channel, type: notification.type, notificationId: notification.id });
  }
}
