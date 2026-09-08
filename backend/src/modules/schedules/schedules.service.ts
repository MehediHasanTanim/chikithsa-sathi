import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Schedule, ScheduleBreak } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ChamberAccessService } from '@modules/chambers/services/chamber-access.service';
import type { CreateScheduleDto } from './dto/create-schedule.dto';
import type { UpdateScheduleDto } from './dto/update-schedule.dto';

export type PublicSchedule = {
  id: string;
  chamberId: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxPatients: number | null;
  isActive: boolean;
  breaks: { id: string; startTime: string; endTime: string; reason: string | null }[];
  createdAt: Date;
  updatedAt: Date;
};

const scheduleInclude = { breaks: { orderBy: { startTime: 'asc' as const } } };

@Injectable()
export class SchedulesService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly chamberAccess: ChamberAccessService,
  ) {}

  async list(user: AuthenticatedUser, chamberId: string): Promise<PublicSchedule[]> {
    await this.chamberAccess.assertMember(user.id, chamberId);
    const schedules = await this.repository.schedule.findMany({
      where: { chamberId },
      include: scheduleInclude,
      orderBy: { dayOfWeek: 'asc' },
    });
    return schedules.map((schedule) => this.toPublic(schedule));
  }

  async create(
    user: AuthenticatedUser,
    chamberId: string,
    dto: CreateScheduleDto,
  ): Promise<PublicSchedule> {
    const membership = await this.chamberAccess.assertOwner(user.id, chamberId);
    this.assertValidWindow(dto.startTime, dto.endTime);
    this.assertValidBreaks(dto.startTime, dto.endTime, dto.breaks ?? []);

    await this.assertNoOverlap(
      chamberId,
      membership.chamber.ownerDoctorId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

    const schedule = await this.repository.schedule.create({
      data: {
        chamberId,
        doctorId: membership.chamber.ownerDoctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDurationMinutes: dto.slotDurationMinutes,
        maxPatients: dto.maxPatients,
        breaks: dto.breaks?.length
          ? {
              create: dto.breaks.map((b) => ({
                startTime: b.startTime,
                endTime: b.endTime,
                reason: b.reason,
              })),
            }
          : undefined,
      },
      include: scheduleInclude,
    });
    return this.toPublic(schedule);
  }

  async update(
    user: AuthenticatedUser,
    scheduleId: string,
    dto: UpdateScheduleDto,
  ): Promise<PublicSchedule> {
    const schedule = await this.findSchedule(scheduleId);
    await this.chamberAccess.assertOwner(user.id, schedule.chamberId);

    const startTime = dto.startTime ?? schedule.startTime;
    const endTime = dto.endTime ?? schedule.endTime;
    const dayOfWeek = dto.dayOfWeek ?? schedule.dayOfWeek;
    this.assertValidWindow(startTime, endTime);

    if (dto.breaks) this.assertValidBreaks(startTime, endTime, dto.breaks);

    await this.assertNoOverlap(
      schedule.chamberId,
      schedule.doctorId,
      dayOfWeek,
      startTime,
      endTime,
      schedule.id,
    );

    const updated = await this.repository.transaction(async (tx) => {
      if (dto.breaks) {
        await tx.scheduleBreak.deleteMany({ where: { scheduleId: schedule.id } });
      }
      return tx.schedule.update({
        where: { id: schedule.id },
        data: {
          ...(dto.dayOfWeek !== undefined ? { dayOfWeek: dto.dayOfWeek } : {}),
          ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
          ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
          ...(dto.slotDurationMinutes !== undefined
            ? { slotDurationMinutes: dto.slotDurationMinutes }
            : {}),
          ...(dto.maxPatients !== undefined ? { maxPatients: dto.maxPatients } : {}),
          ...(dto.breaks
            ? {
                breaks: {
                  create: dto.breaks.map((b) => ({
                    startTime: b.startTime,
                    endTime: b.endTime,
                    reason: b.reason,
                  })),
                },
              }
            : {}),
        },
        include: scheduleInclude,
      });
    });
    return this.toPublic(updated);
  }

  async remove(user: AuthenticatedUser, scheduleId: string): Promise<{ message: string }> {
    const schedule = await this.findSchedule(scheduleId);
    await this.chamberAccess.assertOwner(user.id, schedule.chamberId);
    await this.repository.schedule.delete({ where: { id: schedule.id } });
    return { message: 'Schedule deleted' };
  }

  private async findSchedule(scheduleId: string): Promise<Schedule> {
    const schedule = await this.repository.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw this.notFound();
    return schedule;
  }

  private async assertNoOverlap(
    chamberId: string,
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<void> {
    const overlapping = await this.repository.schedule.findFirst({
      where: {
        chamberId,
        doctorId,
        dayOfWeek,
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });
    if (overlapping) {
      throw new ConflictException({
        code: ErrorCode.ScheduleOverlap,
        message: 'Schedule overlaps with an existing slot for this chamber and day',
        details: [],
      });
    }
  }

  private assertValidWindow(startTime: string, endTime: string): void {
    if (startTime >= endTime) {
      throw this.invalid('startTime must be before endTime');
    }
  }

  private assertValidBreaks(
    windowStart: string,
    windowEnd: string,
    breaks: { startTime: string; endTime: string }[],
  ): void {
    for (const breakSlot of breaks) {
      if (breakSlot.startTime >= breakSlot.endTime) {
        throw this.invalid('Each break startTime must be before its endTime');
      }
      if (breakSlot.startTime < windowStart || breakSlot.endTime > windowEnd) {
        throw this.invalid('Breaks must fall within the schedule window');
      }
    }
  }

  private toPublic(schedule: Schedule & { breaks: ScheduleBreak[] }): PublicSchedule {
    return {
      id: schedule.id,
      chamberId: schedule.chamberId,
      doctorId: schedule.doctorId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDurationMinutes: schedule.slotDurationMinutes,
      maxPatients: schedule.maxPatients,
      isActive: schedule.isActive,
      breaks: schedule.breaks.map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
      })),
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  private invalid(message: string): BadRequestException {
    return new BadRequestException({
      code: ErrorCode.ScheduleInvalid,
      message,
      details: [],
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.ScheduleNotFound,
      message: 'Schedule was not found',
      details: [],
    });
  }
}
