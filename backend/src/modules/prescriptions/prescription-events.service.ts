import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

import { AuditService } from '@modules/auth/services/audit.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

/**
 * Prescription domain event boundary. Events are logged now; a durable bus
 * (Redis Streams / BullMQ) and PDF job queue are introduced in a later sprint.
 */
@Injectable()
export class PrescriptionEventsService {
  private readonly logger = new Logger(PrescriptionEventsService.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly audit?: AuditService,
  ) {}

  finalized(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.finalized', prescriptionId });
    this.record(AuditAction.PRESCRIPTION_FINALIZED, prescriptionId);
    void this.notifications.prescriptionReady(prescriptionId).catch((error: unknown) => {
      this.logger.error({
        event: 'prescription.notification_enqueue_failed',
        prescriptionId,
        error,
      });
    });
  }

  amended(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.amended', prescriptionId });
  }

  delivered(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.delivered', prescriptionId });
    this.record(AuditAction.PRESCRIPTION_DELIVERED, prescriptionId);
  }

  pdfRequested(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.pdf_requested', prescriptionId });
  }

  private record(action: AuditAction, prescriptionId: string): void {
    void this.audit
      ?.recordDomain(action, undefined, 'Prescription', prescriptionId)
      .catch((error: unknown) => {
        this.logger.error({ event: 'prescription.audit_failed', prescriptionId, error });
      });
  }
}
