import { Injectable } from '@nestjs/common';
import { AppointmentStatus, EncounterStatus, PaymentStatus, RefundStatus } from '@prisma/client';

import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { AnalyticsDashboardQueryDto } from './dto/analytics-dashboard-query.dto';
import type { AnalyticsRangeQueryDto } from './dto/analytics-range-query.dto';

type DateRange = { start: Date; end: Date };

@Injectable()
export class AnalyticsService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly permissions: PermissionsService,
  ) {}

  async dashboard(user: AuthenticatedUser, query: AnalyticsDashboardQueryDto) {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['staff.read']);
    const range = this.dayRange(query.date);
    const appointmentWhere = {
      chamberId: query.chamberId,
      scheduledDate: { gte: range.start, lt: range.end },
    };
    const encounterWhere = {
      chamberId: query.chamberId,
      encounterDate: { gte: range.start, lt: range.end },
    };
    const paymentWhere = {
      chamberId: query.chamberId,
      receivedAt: { gte: range.start, lt: range.end },
      status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
    };
    const [
      patientRows,
      appointments,
      completedConsultations,
      noShows,
      gross,
      refunded,
      encounters,
    ] = await Promise.all([
      this.repository.queueEntry.findMany({
        where: { chamberId: query.chamberId, queueDate: { gte: range.start, lt: range.end } },
        distinct: ['patientId'],
        select: { patientId: true },
      }),
      this.repository.appointment.count({ where: appointmentWhere }),
      this.repository.encounter.count({
        where: {
          ...encounterWhere,
          status: { in: [EncounterStatus.COMPLETED, EncounterStatus.LOCKED] },
        },
      }),
      this.repository.appointment.count({
        where: { ...appointmentWhere, status: AppointmentStatus.NO_SHOW },
      }),
      this.repository.payment.aggregate({ where: paymentWhere, _sum: { amount: true } }),
      this.repository.paymentRefund.aggregate({
        where: {
          status: RefundStatus.PROCESSED,
          processedAt: { gte: range.start, lt: range.end },
          payment: { chamberId: query.chamberId },
        },
        _sum: { amount: true },
      }),
      this.repository.encounter.findMany({
        where: {
          ...encounterWhere,
          status: { in: [EncounterStatus.COMPLETED, EncounterStatus.LOCKED] },
          startedAt: { not: null },
          completedAt: { not: null },
        },
        select: { startedAt: true, completedAt: true },
      }),
    ]);
    const averageConsultationMinutes =
      encounters.length === 0
        ? null
        : Math.round(
            encounters.reduce(
              (total, encounter) =>
                total +
                (encounter.completedAt!.getTime() - encounter.startedAt!.getTime()) / 60_000,
              0,
            ) / encounters.length,
          );

    return {
      date: range.start.toISOString().slice(0, 10),
      todayPatients: patientRows.length,
      appointments,
      completedConsultations,
      revenue: Number(gross._sum.amount ?? 0) - Number(refunded._sum.amount ?? 0),
      noShows,
      averageConsultationMinutes,
    };
  }

  async revenue(user: AuthenticatedUser, query: AnalyticsRangeQueryDto) {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['payments.read']);
    const range = this.range(query);
    const [gross, refunded, paymentCount] = await Promise.all([
      this.repository.payment.aggregate({
        where: {
          chamberId: query.chamberId,
          receivedAt: { gte: range.start, lt: range.end },
          status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED] },
        },
        _sum: { amount: true },
      }),
      this.repository.paymentRefund.aggregate({
        where: {
          status: RefundStatus.PROCESSED,
          processedAt: { gte: range.start, lt: range.end },
          payment: { chamberId: query.chamberId },
        },
        _sum: { amount: true },
      }),
      this.repository.payment.count({
        where: { chamberId: query.chamberId, receivedAt: { gte: range.start, lt: range.end } },
      }),
    ]);
    const grossAmount = Number(gross._sum.amount ?? 0);
    const refundedAmount = Number(refunded._sum.amount ?? 0);
    return {
      dateFrom: range.start.toISOString(),
      dateTo: new Date(range.end.getTime() - 1).toISOString(),
      paymentCount,
      grossAmount,
      refundedAmount,
      netAmount: grossAmount - refundedAmount,
    };
  }

  async patients(user: AuthenticatedUser, query: AnalyticsRangeQueryDto) {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['patients.read']);
    const range = this.range(query);
    const [totalLinked, newlyLinked, visits] = await Promise.all([
      this.repository.patientChamber.count({ where: { chamberId: query.chamberId } }),
      this.repository.patientChamber.count({
        where: { chamberId: query.chamberId, createdAt: { gte: range.start, lt: range.end } },
      }),
      this.repository.queueEntry.findMany({
        where: { chamberId: query.chamberId, queueDate: { gte: range.start, lt: range.end } },
        distinct: ['patientId'],
        select: { patientId: true },
      }),
    ]);
    return {
      dateFrom: range.start.toISOString(),
      dateTo: new Date(range.end.getTime() - 1).toISOString(),
      totalLinked,
      newlyLinked,
      uniquePatientsSeen: visits.length,
    };
  }

  async exportCsv(user: AuthenticatedUser, query: AnalyticsRangeQueryDto): Promise<string> {
    const [revenue, patients] = await Promise.all([this.revenue(user, query), this.patients(user, query)]);
    const rows = [
      ['metric', 'value'],
      ['date_from', revenue.dateFrom], ['date_to', revenue.dateTo],
      ['payment_count', String(revenue.paymentCount)], ['gross_amount', String(revenue.grossAmount)],
      ['refunded_amount', String(revenue.refundedAmount)], ['net_amount', String(revenue.netAmount)],
      ['total_linked_patients', String(patients.totalLinked)], ['newly_linked_patients', String(patients.newlyLinked)],
      ['unique_patients_seen', String(patients.uniquePatientsSeen)],
    ];
    return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
  }

  private dayRange(date?: string): DateRange {
    return this.range({ dateFrom: date, dateTo: date });
  }

  private range(query: Pick<AnalyticsRangeQueryDto, 'dateFrom' | 'dateTo'>): DateRange {
    const start = query.dateFrom ? new Date(`${query.dateFrom}T00:00:00.000Z`) : this.today();
    const endBase = query.dateTo ? new Date(`${query.dateTo}T00:00:00.000Z`) : start;
    const end = new Date(endBase);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private today(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}
