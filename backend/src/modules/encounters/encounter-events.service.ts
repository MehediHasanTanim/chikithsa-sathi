import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

import { AuditService } from '@modules/auth/services/audit.service';

/**
 * Encounter domain event boundary. Events are currently emitted to the log; a
 * durable event/audit bus (Redis Streams / BullMQ) is introduced in a later
 * sprint, at which point these can be mirrored into the AuditLog table.
 */
@Injectable()
export class EncounterEventsService {
  private readonly logger = new Logger(EncounterEventsService.name);

  constructor(private readonly audit?: AuditService) {}

  created(encounterId: string): void {
    this.logger.log({ event: 'encounter.created', encounterId });
    this.record(AuditAction.ENCOUNTER_CREATED, encounterId);
  }

  started(encounterId: string): void {
    this.logger.log({ event: 'encounter.started', encounterId });
    this.record(AuditAction.ENCOUNTER_UPDATED, encounterId);
  }

  completed(encounterId: string): void {
    this.logger.log({ event: 'encounter.completed', encounterId });
    this.record(AuditAction.ENCOUNTER_UPDATED, encounterId);
  }

  locked(encounterId: string): void {
    this.logger.log({ event: 'encounter.locked', encounterId });
    this.record(AuditAction.ENCOUNTER_UPDATED, encounterId);
  }

  private record(action: AuditAction, encounterId: string): void {
    void this.audit
      ?.recordDomain(action, undefined, 'Encounter', encounterId)
      .catch((error: unknown) => {
        this.logger.error({ event: 'encounter.audit_failed', encounterId, error });
      });
  }
}
