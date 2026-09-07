import { Injectable, Logger } from '@nestjs/common';

/**
 * Encounter domain event boundary. Events are currently emitted to the log; a
 * durable event/audit bus (Redis Streams / BullMQ) is introduced in a later
 * sprint, at which point these can be mirrored into the AuditLog table.
 */
@Injectable()
export class EncounterEventsService {
  private readonly logger = new Logger(EncounterEventsService.name);

  created(encounterId: string): void {
    this.logger.log({ event: 'encounter.created', encounterId });
  }

  started(encounterId: string): void {
    this.logger.log({ event: 'encounter.started', encounterId });
  }

  completed(encounterId: string): void {
    this.logger.log({ event: 'encounter.completed', encounterId });
  }

  locked(encounterId: string): void {
    this.logger.log({ event: 'encounter.locked', encounterId });
  }
}
