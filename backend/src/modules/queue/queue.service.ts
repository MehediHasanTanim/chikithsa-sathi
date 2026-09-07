import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma, QueueEntry, QueueStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import { QueueEventsService } from './queue-events.service';
import type { CheckInDto } from './dto/check-in.dto';
import type { QueueQueryDto } from './dto/queue-query.dto';

export type PublicQueueEntry = {
  id: string;
  chamberId: string;
  patientId: string;
  appointmentId: string | null;
  doctorId: string;
  queueDate: string;
  queueNumber: number;
  status: QueueStatus;
  priority: number;
  checkedInAt: string | null;
  calledAt: string | null;
  consultationStartedAt: string | null;
  completedAt: string | null;
  skipReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: { id: string; fullName: string; phone: string | null } | null;
};

type QueueEntryWithPatient = QueueEntry & {
  patient?: { id: string; fullName: string; phone: string | null };
};

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly events: QueueEventsService,
  ) {}

  async checkIn(user: AuthenticatedUser, dto: CheckInDto) {
    await this.permissions.requirePermissions(user.id, dto.chamberId, ['queue.manage']);
    const chamber = await this.findChamber(dto.chamberId);

    const link = await this.prisma.patientChamber.findUnique({
      where: { patientId_chamberId: { patientId: dto.patientId, chamberId: dto.chamberId } },
      select: { id: true },
    });
    if (!link) throw this.invalid('Patient is not linked to this chamber');

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });
      if (
        !appointment ||
        appointment.chamberId !== dto.chamberId ||
        appointment.patientId !== dto.patientId
      ) {
        throw this.invalid('Appointment does not match the chamber and patient');
      }
      if (
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.status === AppointmentStatus.COMPLETED
      ) {
        throw this.invalid('This appointment can no longer be checked in');
      }
    }

    const queueDate = this.todayInChamber(chamber.timezone);
    const existing = await this.prisma.queueEntry.findFirst({
      where: {
        patientId: dto.patientId,
        chamberId: dto.chamberId,
        queueDate,
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.QueueDuplicateCheckIn,
        message: 'Patient is already in the queue for today',
        details: [],
      });
    }

    const queueNumber = await this.nextQueueNumber(dto.chamberId, queueDate);
    const entry = await this.prisma.queueEntry.create({
      data: {
        chamberId: dto.chamberId,
        patientId: dto.patientId,
        doctorId: chamber.ownerDoctorId,
        appointmentId: dto.appointmentId,
        queueDate,
        queueNumber,
      },
    });

    if (dto.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: AppointmentStatus.CHECKED_IN, checkedInAt: new Date() },
      });
    }

    this.events.checkedIn({
      id: entry.id,
      chamberId: entry.chamberId,
      patientId: entry.patientId,
      queueNumber: entry.queueNumber,
    });

    return { queueEntryId: entry.id, queueNumber: entry.queueNumber, status: entry.status };
  }

  async today(user: AuthenticatedUser, query: QueueQueryDto): Promise<PublicQueueEntry[]> {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['queue.read']);
    const chamber = await this.findChamber(query.chamberId);
    const queueDate = this.todayInChamber(chamber.timezone);

    const entries = await this.prisma.queueEntry.findMany({
      where: {
        chamberId: query.chamberId,
        queueDate,
        ...(query.status ? { status: query.status } : {}),
      },
      include: { patient: { select: { id: true, fullName: true, phone: true } } },
      orderBy: { queueNumber: 'asc' },
    });
    return entries.map((entry) => this.toPublic(entry));
  }

  async call(user: AuthenticatedUser, queueEntryId: string): Promise<PublicQueueEntry> {
    const entry = await this.loadAndAssert(user, queueEntryId);
    if (entry.status !== QueueStatus.WAITING) throw this.invalidTransition();
    const updated = await this.updateEntry(entry.id, {
      status: QueueStatus.CALLED,
      calledAt: new Date(),
    });
    this.events.called(entry.id);
    return this.toPublic(updated);
  }

  async recall(user: AuthenticatedUser, queueEntryId: string): Promise<PublicQueueEntry> {
    const entry = await this.loadAndAssert(user, queueEntryId);
    let updated: QueueEntry;
    if (entry.status === QueueStatus.SKIPPED) {
      updated = await this.updateEntry(entry.id, { status: QueueStatus.WAITING, skipReason: null });
    } else if (entry.status === QueueStatus.CALLED) {
      updated = await this.updateEntry(entry.id, { calledAt: new Date() });
    } else {
      throw this.invalidTransition();
    }
    return this.toPublic(updated);
  }

  async skip(
    user: AuthenticatedUser,
    queueEntryId: string,
    reason?: string,
  ): Promise<PublicQueueEntry> {
    const entry = await this.loadAndAssert(user, queueEntryId);
    if (entry.status !== QueueStatus.WAITING && entry.status !== QueueStatus.CALLED) {
      throw this.invalidTransition();
    }
    const updated = await this.updateEntry(entry.id, {
      status: QueueStatus.SKIPPED,
      skipReason: reason,
    });
    return this.toPublic(updated);
  }

  async start(user: AuthenticatedUser, queueEntryId: string): Promise<PublicQueueEntry> {
    const entry = await this.loadAndAssert(user, queueEntryId);
    if (entry.status !== QueueStatus.CALLED) throw this.invalidTransition();
    const updated = await this.updateEntry(entry.id, {
      status: QueueStatus.IN_CONSULTATION,
      consultationStartedAt: new Date(),
    });
    this.events.consultationStarted(entry.id);
    return this.toPublic(updated);
  }

  async complete(user: AuthenticatedUser, queueEntryId: string): Promise<PublicQueueEntry> {
    const entry = await this.loadAndAssert(user, queueEntryId);
    if (entry.status !== QueueStatus.IN_CONSULTATION) throw this.invalidTransition();
    const updated = await this.updateEntry(entry.id, {
      status: QueueStatus.COMPLETED,
      completedAt: new Date(),
    });
    this.events.completed(entry.id);
    return this.toPublic(updated);
  }

  private async loadAndAssert(user: AuthenticatedUser, queueEntryId: string): Promise<QueueEntry> {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id: queueEntryId } });
    if (!entry) throw this.notFound();
    await this.permissions.requirePermissions(user.id, entry.chamberId, ['queue.manage']);
    return entry;
  }

  private async updateEntry(
    queueEntryId: string,
    data: Prisma.QueueEntryUpdateInput,
  ): Promise<QueueEntry> {
    return this.prisma.queueEntry.update({ where: { id: queueEntryId }, data });
  }

  private async findChamber(chamberId: string): Promise<{
    id: string;
    ownerDoctorId: string;
    timezone: string;
  }> {
    const chamber = await this.prisma.chamber.findUnique({
      where: { id: chamberId },
      select: { id: true, ownerDoctorId: true, timezone: true },
    });
    if (!chamber) throw this.notFound();
    return chamber;
  }

  /** Atomically allocate the next queue number for a chamber and date. */
  private async nextQueueNumber(chamberId: string, queueDate: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ lastNumber: number }>>`
      INSERT INTO "DailyQueueCounter" ("id", "chamberId", "queueDate", "lastNumber", "createdAt", "updatedAt")
      VALUES (${randomUUID()}::uuid, ${chamberId}::uuid, ${queueDate}::date, 1, now(), now())
      ON CONFLICT ("chamberId", "queueDate")
      DO UPDATE SET "lastNumber" = "DailyQueueCounter"."lastNumber" + 1, "updatedAt" = now()
      RETURNING "lastNumber"
    `;
    return rows[0]?.lastNumber ?? 1;
  }

  private todayInChamber(timeZone: string): Date {
    const parts = this.chamberDateParts(new Date(), timeZone);
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  }

  private chamberDateParts(
    date: Date,
    timeZone: string,
  ): { year: number; month: number; day: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const value = (type: string): string => parts.find((part) => part.type === type)?.value ?? '';
    return {
      year: Number(value('year')),
      month: Number(value('month')),
      day: Number(value('day')),
    };
  }

  private toPublic(entry: QueueEntryWithPatient): PublicQueueEntry {
    return {
      id: entry.id,
      chamberId: entry.chamberId,
      patientId: entry.patientId,
      appointmentId: entry.appointmentId,
      doctorId: entry.doctorId,
      queueDate: entry.queueDate.toISOString().slice(0, 10),
      queueNumber: entry.queueNumber,
      status: entry.status,
      priority: entry.priority,
      checkedInAt: entry.checkedInAt?.toISOString() ?? null,
      calledAt: entry.calledAt?.toISOString() ?? null,
      consultationStartedAt: entry.consultationStartedAt?.toISOString() ?? null,
      completedAt: entry.completedAt?.toISOString() ?? null,
      skipReason: entry.skipReason,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      patient: entry.patient
        ? { id: entry.patient.id, fullName: entry.patient.fullName, phone: entry.patient.phone }
        : null,
    };
  }

  private invalid(message: string): BadRequestException {
    return new BadRequestException({ code: ErrorCode.QueueInvalid, message, details: [] });
  }

  private invalidTransition(): ConflictException {
    return new ConflictException({
      code: ErrorCode.QueueInvalidTransition,
      message: 'Invalid queue state transition',
      details: [],
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.QueueEntryNotFound,
      message: 'Queue entry was not found',
      details: [],
    });
  }
}
