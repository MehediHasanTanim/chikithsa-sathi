import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Encounter, EncounterStatus, Prisma } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import { EncounterEventsService } from './encounter-events.service';
import type { CreateEncounterDto } from './dto/create-encounter.dto';
import type { UpdateEncounterDto } from './dto/update-encounter.dto';

export type PublicEncounter = {
  id: string;
  chamberId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;
  queueEntryId: string | null;
  encounterDate: string;
  status: EncounterStatus;
  chiefComplaint: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lockedAt: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class EncountersService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly permissions: PermissionsService,
    private readonly events: EncounterEventsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateEncounterDto): Promise<PublicEncounter> {
    await this.permissions.requirePermissions(user.id, dto.chamberId, ['encounters.create']);
    const chamber = await this.findChamber(dto.chamberId);

    const link = await this.repository.patientChamber.findUnique({
      where: { patientId_chamberId: { patientId: dto.patientId, chamberId: dto.chamberId } },
      select: { id: true },
    });
    if (!link) throw this.invalid('Patient is not linked to this chamber');

    if (dto.appointmentId) {
      const appointment = await this.repository.appointment.findUnique({
        where: { id: dto.appointmentId },
      });
      if (
        !appointment ||
        appointment.chamberId !== dto.chamberId ||
        appointment.patientId !== dto.patientId
      ) {
        throw this.invalid('Appointment does not match the chamber and patient');
      }
      const existing = await this.repository.encounter.findUnique({
        where: { appointmentId: dto.appointmentId },
        select: { id: true },
      });
      if (existing) throw this.conflict('An encounter already exists for this appointment');
    }

    if (dto.queueEntryId) {
      const queueEntry = await this.repository.queueEntry.findUnique({
        where: { id: dto.queueEntryId },
      });
      if (
        !queueEntry ||
        queueEntry.chamberId !== dto.chamberId ||
        queueEntry.patientId !== dto.patientId
      ) {
        throw this.invalid('Queue entry does not match the chamber and patient');
      }
      const existing = await this.repository.encounter.findUnique({
        where: { queueEntryId: dto.queueEntryId },
        select: { id: true },
      });
      if (existing) throw this.conflict('An encounter already exists for this queue entry');
    }

    const encounter = await this.repository.encounter.create({
      data: {
        chamberId: dto.chamberId,
        patientId: dto.patientId,
        doctorId: chamber.ownerDoctorId,
        appointmentId: dto.appointmentId,
        queueEntryId: dto.queueEntryId,
        encounterDate: this.todayInChamber(chamber.timezone),
      },
    });
    this.events.created(encounter.id);
    return this.toPublic(encounter);
  }

  async getById(user: AuthenticatedUser, encounterId: string): Promise<PublicEncounter> {
    const encounter = await this.loadAndAssert(user, encounterId, 'encounters.read');
    return this.toPublic(encounter);
  }

  async update(
    user: AuthenticatedUser,
    encounterId: string,
    dto: UpdateEncounterDto,
  ): Promise<PublicEncounter> {
    const encounter = await this.loadAndAssert(user, encounterId, 'encounters.update');
    this.assertEditable(encounter);

    const updated = await this.repository.encounter.update({
      where: { id: encounter.id },
      data: { chiefComplaint: dto.chiefComplaint },
    });
    return this.toPublic(updated);
  }

  async start(user: AuthenticatedUser, encounterId: string): Promise<PublicEncounter> {
    return this.transition(user, encounterId, 'start');
  }

  async readyForReview(user: AuthenticatedUser, encounterId: string): Promise<PublicEncounter> {
    return this.transition(user, encounterId, 'readyForReview');
  }

  async complete(user: AuthenticatedUser, encounterId: string): Promise<PublicEncounter> {
    return this.transition(user, encounterId, 'complete');
  }

  async lock(user: AuthenticatedUser, encounterId: string): Promise<PublicEncounter> {
    return this.transition(user, encounterId, 'lock');
  }

  private async transition(
    user: AuthenticatedUser,
    encounterId: string,
    action: 'start' | 'readyForReview' | 'complete' | 'lock',
  ): Promise<PublicEncounter> {
    const encounter = await this.loadAndAssert(user, encounterId, 'encounters.update');

    let data: Prisma.EncounterUpdateInput;
    let event: ((id: string) => void) | undefined;
    switch (action) {
      case 'start':
        if (encounter.status !== EncounterStatus.DRAFT) throw this.invalidTransition();
        data = { status: EncounterStatus.IN_PROGRESS, startedAt: new Date() };
        event = this.events.started.bind(this.events);
        break;
      case 'readyForReview':
        if (encounter.status !== EncounterStatus.IN_PROGRESS) throw this.invalidTransition();
        data = { status: EncounterStatus.READY_FOR_REVIEW };
        break;
      case 'complete':
        if (encounter.status !== EncounterStatus.READY_FOR_REVIEW) throw this.invalidTransition();
        data = { status: EncounterStatus.COMPLETED, completedAt: new Date() };
        event = this.events.completed.bind(this.events);
        break;
      case 'lock':
        if (encounter.status !== EncounterStatus.COMPLETED) throw this.invalidTransition();
        data = { status: EncounterStatus.LOCKED, lockedAt: new Date() };
        event = this.events.locked.bind(this.events);
        break;
    }

    const updated = await this.repository.encounter.update({ where: { id: encounterId }, data });
    event?.(encounterId);
    return this.toPublic(updated);
  }

  private async loadAndAssert(
    user: AuthenticatedUser,
    encounterId: string,
    permission: string,
  ): Promise<Encounter> {
    const encounter = await this.repository.encounter.findUnique({ where: { id: encounterId } });
    if (!encounter) throw this.notFound();
    await this.permissions.requirePermissions(user.id, encounter.chamberId, [permission]);
    return encounter;
  }

  private assertEditable(encounter: Encounter): void {
    if (
      encounter.status === EncounterStatus.COMPLETED ||
      encounter.status === EncounterStatus.LOCKED
    ) {
      throw new ConflictException({
        code: ErrorCode.EncounterLocked,
        message: 'This encounter can no longer be edited',
        details: [],
      });
    }
  }

  private async findChamber(chamberId: string): Promise<{
    id: string;
    ownerDoctorId: string;
    timezone: string;
  }> {
    const chamber = await this.repository.chamber.findUnique({
      where: { id: chamberId },
      select: { id: true, ownerDoctorId: true, timezone: true },
    });
    if (!chamber) throw this.notFound();
    return chamber;
  }

  private todayInChamber(timeZone: string): Date {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const value = (type: string): string => parts.find((part) => part.type === type)?.value ?? '';
    return new Date(
      Date.UTC(Number(value('year')), Number(value('month')) - 1, Number(value('day'))),
    );
  }

  private toPublic(encounter: Encounter): PublicEncounter {
    return {
      id: encounter.id,
      chamberId: encounter.chamberId,
      patientId: encounter.patientId,
      doctorId: encounter.doctorId,
      appointmentId: encounter.appointmentId,
      queueEntryId: encounter.queueEntryId,
      encounterDate: encounter.encounterDate.toISOString().slice(0, 10),
      status: encounter.status,
      chiefComplaint: encounter.chiefComplaint,
      startedAt: encounter.startedAt?.toISOString() ?? null,
      completedAt: encounter.completedAt?.toISOString() ?? null,
      lockedAt: encounter.lockedAt?.toISOString() ?? null,
      version: encounter.version,
      createdAt: encounter.createdAt,
      updatedAt: encounter.updatedAt,
    };
  }

  private invalid(message: string): BadRequestException {
    return new BadRequestException({ code: ErrorCode.EncounterInvalid, message, details: [] });
  }

  private conflict(message: string): ConflictException {
    return new ConflictException({ code: ErrorCode.Conflict, message, details: [] });
  }

  private invalidTransition(): ConflictException {
    return new ConflictException({
      code: ErrorCode.EncounterInvalidTransition,
      message: 'Invalid encounter state transition',
      details: [],
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.EncounterNotFound,
      message: 'Encounter was not found',
      details: [],
    });
  }
}
