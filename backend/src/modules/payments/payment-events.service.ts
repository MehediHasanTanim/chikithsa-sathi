import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

import { AuditService } from '@modules/auth/services/audit.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

/**
 * Payment domain event boundary. Events are logged now; a durable bus and
 * receipt PDF generation are introduced in a later sprint.
 */
@Injectable()
export class PaymentEventsService {
  private readonly logger = new Logger(PaymentEventsService.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly audit?: AuditService,
  ) {}

  created(paymentId: string): void {
    this.logger.log({ event: 'payment.created', paymentId });
    this.record(AuditAction.PAYMENT_CREATED, paymentId);
    void this.notifications.paymentReceipt(paymentId).catch((error: unknown) => {
      this.logger.error({ event: 'payment.notification_enqueue_failed', paymentId, error });
    });
  }

  refunded(paymentId: string): void {
    this.logger.log({ event: 'payment.refunded', paymentId });
    this.record(AuditAction.PAYMENT_REFUNDED, paymentId);
  }

  private record(action: AuditAction, paymentId: string): void {
    void this.audit
      ?.recordDomain(action, undefined, 'Payment', paymentId)
      .catch((error: unknown) => {
        this.logger.error({ event: 'payment.audit_failed', paymentId, error });
      });
  }
}
