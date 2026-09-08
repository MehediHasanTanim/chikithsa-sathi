import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Encounter, EncounterStatus, MembershipStatus, UserRole } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';

/**
 * Shared authorization for clinical records. All clinical data is scoped to an
 * encounter; write access additionally requires the encounter to be editable.
 */
@Injectable()
export class ClinicalAccessService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly permissions: PermissionsService,
  ) {}

  async assertRead(user: AuthenticatedUser, encounterId: string): Promise<Encounter> {
    const encounter = await this.findEncounter(encounterId);
    await this.permissions.requirePermissions(user.id, encounter.chamberId, ['encounters.read']);
    return encounter;
  }

  async assertWrite(user: AuthenticatedUser, encounterId: string): Promise<Encounter> {
    const encounter = await this.findEncounter(encounterId);
    await this.permissions.requirePermissions(user.id, encounter.chamberId, ['encounters.update']);
    if (
      encounter.status === EncounterStatus.COMPLETED ||
      encounter.status === EncounterStatus.LOCKED
    ) {
      throw new ConflictException({
        code: ErrorCode.EncounterLocked,
        message: 'Clinical records cannot be modified once the encounter is completed or locked',
        details: [],
      });
    }
    return encounter;
  }

  async findEncounter(encounterId: string): Promise<Encounter> {
    const encounter = await this.repository.encounter.findUnique({ where: { id: encounterId } });
    if (!encounter) {
      throw new NotFoundException({
        code: ErrorCode.EncounterNotFound,
        message: 'Encounter was not found',
        details: [],
      });
    }
    return encounter;
  }

  /** Patient-level clinical read (used by patient-scoped endpoints). */
  async assertPatientRead(user: AuthenticatedUser, patientId: string): Promise<void> {
    const links = await this.repository.patientChamber.findMany({
      where: { patientId },
      select: { chamberId: true },
    });
    const memberships = await this.repository.chamberMembership.findMany({
      where: { userId: user.id, status: MembershipStatus.ACTIVE },
      select: { chamberId: true },
    });
    const accessible = new Set(memberships.map((membership) => membership.chamberId));
    const link = links.find((l) => accessible.has(l.chamberId));
    if (!link) {
      throw new ForbiddenException({
        code: ErrorCode.PatientForbidden,
        message: 'You do not have access to this patient',
        details: [],
      });
    }
    await this.permissions.requirePermissions(user.id, link.chamberId, ['encounters.read']);
  }

  /** Require the user to hold a clinical role in at least one chamber. */
  async assertClinicalUser(user: AuthenticatedUser): Promise<void> {
    const membership = await this.repository.chamberMembership.findFirst({
      where: {
        userId: user.id,
        status: MembershipStatus.ACTIVE,
        role: { in: [UserRole.DOCTOR, UserRole.ASSISTANT_DOCTOR] },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: ErrorCode.PermissionDenied,
        message: 'Clinical access is required',
        details: [],
      });
    }
  }
}
