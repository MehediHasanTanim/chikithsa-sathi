import { Injectable, Logger } from '@nestjs/common';

/**
 * Prescription domain event boundary. Events are logged now; a durable bus
 * (Redis Streams / BullMQ) and PDF job queue are introduced in a later sprint.
 */
@Injectable()
export class PrescriptionEventsService {
  private readonly logger = new Logger(PrescriptionEventsService.name);

  finalized(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.finalized', prescriptionId });
  }

  amended(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.amended', prescriptionId });
  }

  delivered(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.delivered', prescriptionId });
  }

  pdfRequested(prescriptionId: string): void {
    this.logger.log({ event: 'prescription.pdf_requested', prescriptionId });
  }
}
