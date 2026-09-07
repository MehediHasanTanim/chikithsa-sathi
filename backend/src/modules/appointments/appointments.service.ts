import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Appointment, AppointmentStatus, Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { offsetPaginationMeta, toOffsetPagination } from '@common/utils/pagination.util';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { AppointmentQueryDto } from './dto/appointment-query.dto';
import type { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import type { UpdateAppointmentDto } from './dto/update-appointment.dto';

export type PublicAppointment = {
  id: string;
  appointmentCode: string;
  chamberId: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  scheduledDate: string;
  type: string;
  status: string;
  tokenNumber: number | null;
  reason: string | null;
  notes: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ChamberContext = { id: string; ownerDoctorId: string; timezone: string };

const APPOINTMENT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateAppointmentDto): Promise<PublicAppointment> {
    await this.permissions.requirePermissions(user.id, dto.chamberId, ['appointments.create']);
    const chamber = await this.findChamber(dto.chamberId);
    await this.assertPatientLinked(dto.patientId, dto.chamberId);

    const scheduledAt = this.toUtcMinute(dto.scheduledAt);
    await this.validateSlot(chamber, scheduledAt);

    const appointment = await this.createWithRetry(user.id, chamber, dto, scheduledAt);
    return this.toPublic(appointment);
  }

  async list(
    user: AuthenticatedUser,
    query: AppointmentQueryDto,
  ): Promise<{ items: PublicAppointment[]; pagination: ReturnType<typeof offsetPaginationMeta> }> {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['appointments.read']);

    const { page, limit, skip, take } = toOffsetPagination(query.page, query.limit);
    const where: Prisma.AppointmentWhereInput = {
      chamberId: query.chamberId,
      ...(query.date ? { scheduledDate: new Date(query.date) } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({ where, skip, take, orderBy: { scheduledAt: 'asc' } }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: items.map((appointment) => this.toPublic(appointment)),
      pagination: offsetPaginationMeta(page, limit, total),
    };
  }

  async getById(user: AuthenticatedUser, appointmentId: string): Promise<PublicAppointment> {
    const appointment = await this.findAppointment(appointmentId);
    await this.permissions.requirePermissions(user.id, appointment.chamberId, [
      'appointments.read',
    ]);
    return this.toPublic(appointment);
  }

  async update(
    user: AuthenticatedUser,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ): Promise<PublicAppointment> {
    const appointment = await this.findAppointment(appointmentId);
    await this.permissions.requirePermissions(user.id, appointment.chamberId, [
      'appointments.update',
    ]);

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
    return this.toPublic(updated);
  }

  async reschedule(
    user: AuthenticatedUser,
    appointmentId: string,
    dto: RescheduleAppointmentDto,
  ): Promise<PublicAppointment> {
    const appointment = await this.findAppointment(appointmentId);
    await this.permissions.requirePermissions(user.id, appointment.chamberId, [
      'appointments.update',
    ]);
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw this.invalid('This appointment can no longer be rescheduled');
    }

    const chamber = await this.findChamber(appointment.chamberId);
    const scheduledAt = this.toUtcMinute(dto.scheduledAt);
    await this.validateSlot(chamber, scheduledAt, appointment.id);

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt,
        scheduledDate: this.toScheduledDate(chamber, scheduledAt),
      },
    });
    return this.toPublic(updated);
  }

  async cancel(
    user: AuthenticatedUser,
    appointmentId: string,
    dto: CancelAppointmentDto,
  ): Promise<PublicAppointment> {
    const appointment = await this.findAppointment(appointmentId);
    await this.permissions.requirePermissions(user.id, appointment.chamberId, [
      'appointments.update',
    ]);
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw this.invalid('Appointment is already cancelled');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw this.invalid('A completed appointment cannot be cancelled');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
    });
    return this.toPublic(updated);
  }

  async confirm(user: AuthenticatedUser, appointmentId: string): Promise<PublicAppointment> {
    const appointment = await this.findAppointment(appointmentId);
    await this.permissions.requirePermissions(user.id, appointment.chamberId, [
      'appointments.update',
    ]);
    if (appointment.status !== AppointmentStatus.BOOKED) {
      throw this.invalid('Only booked appointments can be confirmed');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CONFIRMED },
    });
    return this.toPublic(updated);
  }

  private async findChamber(chamberId: string): Promise<ChamberContext> {
    const chamber = await this.prisma.chamber.findUnique({
      where: { id: chamberId },
      select: { id: true, ownerDoctorId: true, timezone: true },
    });
    if (!chamber) throw this.notFound(ErrorCode.AppointmentNotFound, 'Chamber was not found');
    return chamber;
  }

  private async assertPatientLinked(patientId: string, chamberId: string): Promise<void> {
    const link = await this.prisma.patientChamber.findUnique({
      where: { patientId_chamberId: { patientId, chamberId } },
      select: { id: true },
    });
    if (!link) throw this.invalid('Patient is not linked to this chamber');
  }

  private async findAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment)
      throw this.notFound(ErrorCode.AppointmentNotFound, 'Appointment was not found');
    return appointment;
  }

  private async validateSlot(
    chamber: ChamberContext,
    scheduledAt: Date,
    excludeAppointmentId?: string,
  ): Promise<void> {
    const parts = this.chamberTimeParts(scheduledAt, chamber.timezone);
    const hhmm = `${this.pad(parts.hours)}:${this.pad(parts.minutes)}`;

    const schedule = await this.prisma.schedule.findFirst({
      where: {
        chamberId: chamber.id,
        doctorId: chamber.ownerDoctorId,
        dayOfWeek: parts.dayOfWeek,
        isActive: true,
      },
      include: { breaks: true },
    });
    if (!schedule) throw this.invalid('No active schedule exists for this day');
    if (hhmm < schedule.startTime || hhmm >= schedule.endTime) {
      throw this.invalid('Appointment time is outside the schedule window');
    }
    if (
      schedule.breaks.some((breakSlot) => hhmm >= breakSlot.startTime && hhmm < breakSlot.endTime)
    ) {
      throw this.invalid('Appointment time falls within a scheduled break');
    }
    const startMinutes = this.toMinutes(schedule.startTime);
    const slotMinutes = this.toMinutes(hhmm);
    if ((slotMinutes - startMinutes) % schedule.slotDurationMinutes !== 0) {
      throw this.invalid('Appointment time does not align with the schedule slot duration');
    }

    const scheduledDate = this.toScheduledDate(chamber, scheduledAt);
    if (schedule.maxPatients) {
      const booked = await this.prisma.appointment.count({
        where: {
          chamberId: chamber.id,
          doctorId: chamber.ownerDoctorId,
          scheduledDate,
          status: { not: AppointmentStatus.CANCELLED },
        },
      });
      if (booked >= schedule.maxPatients) {
        throw this.invalid('Daily capacity for this schedule has been reached');
      }
    }

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        chamberId: chamber.id,
        doctorId: chamber.ownerDoctorId,
        scheduledAt,
        status: { not: AppointmentStatus.CANCELLED },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException({
        code: ErrorCode.AppointmentConflict,
        message: 'This time slot is already booked',
        details: [],
      });
    }
  }

  private async createWithRetry(
    userId: string,
    chamber: ChamberContext,
    dto: CreateAppointmentDto,
    scheduledAt: Date,
  ): Promise<Appointment> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const appointmentCode = this.generateAppointmentCode();
        return await this.prisma.appointment.create({
          data: {
            appointmentCode,
            chamberId: chamber.id,
            patientId: dto.patientId,
            doctorId: chamber.ownerDoctorId,
            scheduledAt,
            scheduledDate: this.toScheduledDate(chamber, scheduledAt),
            type: dto.type,
            reason: dto.reason,
            notes: dto.notes,
            bookedByUserId: userId,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException({
      code: ErrorCode.AppointmentCodeExists,
      message: 'Could not allocate a unique appointment code',
      details: [],
    });
  }

  private toUtcMinute(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw this.invalid('scheduledAt must be a valid date');
    }
    return new Date(Math.floor(date.getTime() / 60_000) * 60_000);
  }

  private toScheduledDate(chamber: ChamberContext, scheduledAt: Date): Date {
    const parts = this.chamberTimeParts(scheduledAt, chamber.timezone);
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  }

  private chamberTimeParts(
    date: Date,
    timeZone: string,
  ): {
    year: number;
    month: number;
    day: number;
    dayOfWeek: number;
    hours: number;
    minutes: number;
  } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    const value = (type: string): string => parts.find((part) => part.type === type)?.value ?? '';
    return {
      year: Number(value('year')),
      month: Number(value('month')),
      day: Number(value('day')),
      dayOfWeek: WEEKDAYS.indexOf(value('weekday')),
      hours: Number(value('hour')) % 24,
      minutes: Number(value('minute')),
    };
  }

  private toMinutes(hhmm: string): number {
    const [hours, minutes] = hhmm.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  private generateAppointmentCode(): string {
    let code = '';
    for (let i = 0; i < 8; i += 1) {
      code += APPOINTMENT_CODE_ALPHABET[randomInt(0, APPOINTMENT_CODE_ALPHABET.length)];
    }
    return `A-${code}`;
  }

  private toPublic(appointment: Appointment): PublicAppointment {
    return {
      id: appointment.id,
      appointmentCode: appointment.appointmentCode,
      chamberId: appointment.chamberId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      scheduledAt: appointment.scheduledAt.toISOString(),
      scheduledDate: appointment.scheduledDate.toISOString().slice(0, 10),
      type: appointment.type,
      status: appointment.status,
      tokenNumber: appointment.tokenNumber,
      reason: appointment.reason,
      notes: appointment.notes,
      checkedInAt: appointment.checkedInAt?.toISOString() ?? null,
      completedAt: appointment.completedAt?.toISOString() ?? null,
      cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
      cancellationReason: appointment.cancellationReason,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  private invalid(message: string): BadRequestException {
    return new BadRequestException({ code: ErrorCode.AppointmentInvalid, message, details: [] });
  }

  private notFound(code: string, message: string): NotFoundException {
    return new NotFoundException({ code, message, details: [] });
  }
}
