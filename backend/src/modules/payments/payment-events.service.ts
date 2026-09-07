import { Injectable, Logger } from '@nestjs/common';

/**
 * Payment domain event boundary. Events are logged now; a durable bus and
 * receipt PDF generation are introduced in a later sprint.
 */
@Injectable()
export class PaymentEventsService {
  private readonly logger = new Logger(PaymentEventsService.name);

  created(paymentId: string): void {
    this.logger.log({ event: 'payment.created', paymentId });
  }

  refunded(paymentId: string): void {
    this.logger.log({ event: 'payment.refunded', paymentId });
  }
}
