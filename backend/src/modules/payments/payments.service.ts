import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Payment, PaymentStatus, Prisma, RefundStatus } from '@prisma/client';
import { randomInt } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { offsetPaginationMeta, toOffsetPagination } from '@common/utils/pagination.util';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import type { ListPaymentsQueryDto } from './dto/list-payments.query.dto';
import type { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentEventsService } from './payment-events.service';

type PaymentRecord = Payment & {
  refunds: Array<{ amount: Prisma.Decimal }>;
  receipts: Array<{ receiptNumber: string }>;
};

export type PublicPayment = {
  id: string;
  paymentNumber: string;
  chamberId: string;
  patientId: string;
  encounterId: string | null;
  appointmentId: string | null;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  transactionReference: string | null;
  notes: string | null;
  receivedById: string;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  refundedAmount: number;
  refundableAmount: number;
  receiptNumber: string | null;
};

const NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly events: PaymentEventsService,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
  ): Promise<PublicPayment> {
    await this.permissions.requirePermissions(user.id, dto.chamberId, ['payments.create']);
    this.assertValidAmount(dto.amount);

    if (idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { chamberId_idempotencyKey: { chamberId: dto.chamberId, idempotencyKey } },
        include: this.paymentInclude(),
      });
      if (existing) {
        return this.toPublic(existing);
      }
    }

    await this.assertPatientLinked(dto.patientId, dto.chamberId);
    if (dto.encounterId) {
      await this.assertEncounterBelongs(dto.encounterId, dto.chamberId, dto.patientId);
    }

    const payment = await this.createWithRetry(user.id, dto, idempotencyKey);
    this.events.created(payment.id);
    return this.toPublic(payment);
  }

  async list(
    user: AuthenticatedUser,
    query: ListPaymentsQueryDto,
  ): Promise<{ items: PublicPayment[]; pagination: ReturnType<typeof offsetPaginationMeta> }> {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['payments.read']);

    const { page, limit, skip, take } = toOffsetPagination(query.page, query.limit);
    const where: Prisma.PaymentWhereInput = {
      chamberId: query.chamberId,
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.encounterId ? { encounterId: query.encounterId } : {}),
      ...(query.method ? { method: query.method } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            receivedAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { receivedAt: 'desc' },
        include: this.paymentInclude(),
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map((payment) => this.toPublic(payment)),
      pagination: offsetPaginationMeta(page, limit, total),
    };
  }

  async getById(user: AuthenticatedUser, paymentId: string): Promise<PublicPayment> {
    const payment = await this.findPayment(paymentId);
    await this.permissions.requirePermissions(user.id, payment.chamberId, ['payments.read']);
    return this.toPublic(payment);
  }

  async receipt(
    user: AuthenticatedUser,
    paymentId: string,
  ): Promise<{
    receiptNumber: string;
    paymentNumber: string;
    issuedAt: Date;
    amount: number;
    currency: string;
    method: string;
    patientName: string;
    chamberName: string;
  }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        chamberId: true,
        paymentNumber: true,
        amount: true,
        currency: true,
        method: true,
        receivedAt: true,
        chamber: { select: { name: true } },
        patient: { select: { fullName: true } },
      },
    });
    if (!payment) {
      throw this.notFound();
    }
    await this.permissions.requirePermissions(user.id, payment.chamberId, ['payments.read']);

    const receipt = await this.prisma.receipt.findFirst({
      where: { paymentId: payment.id },
      orderBy: { createdAt: 'desc' },
      select: { receiptNumber: true, issuedAt: true },
    });

    return {
      receiptNumber: receipt?.receiptNumber ?? payment.paymentNumber,
      paymentNumber: payment.paymentNumber,
      issuedAt: receipt?.issuedAt ?? payment.receivedAt,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      patientName: payment.patient.fullName,
      chamberName: payment.chamber.name,
    };
  }

  async refund(
    user: AuthenticatedUser,
    paymentId: string,
    dto: RefundPaymentDto,
  ): Promise<PublicPayment> {
    const payment = await this.findPayment(paymentId);
    await this.permissions.requirePermissions(user.id, payment.chamberId, ['payments.refund']);
    this.assertValidAmount(dto.amount);

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new ConflictException({
        code: ErrorCode.PaymentAlreadyRefunded,
        message: 'Payment is already fully refunded',
        details: [],
      });
    }

    const refundedAmount = this.totalRefunded(payment);
    const refundable = payment.amount.minus(refundedAmount);
    const requested = new Prisma.Decimal(dto.amount);
    if (requested.greaterThan(refundable)) {
      throw new BadRequestException({
        code: ErrorCode.PaymentRefundExceedsBalance,
        message: 'Refund amount exceeds the refundable balance',
        details: [],
      });
    }

    const remaining = refundable.minus(requested);
    const status = remaining.equals(0) ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

    const result = await this.prisma.transaction(async (tx) => {
      await tx.paymentRefund.create({
        data: {
          paymentId: payment.id,
          amount: requested,
          reason: dto.reason,
          status: RefundStatus.PROCESSED,
          requestedById: user.id,
          approvedById: user.id,
          processedAt: new Date(),
        },
      });
      return tx.payment.update({
        where: { id: payment.id },
        data: { status },
        include: this.paymentInclude(),
      });
    });

    this.events.refunded(paymentId);
    return this.toPublic(result);
  }

  private async createWithRetry(
    userId: string,
    dto: CreatePaymentDto,
    idempotencyKey?: string,
  ): Promise<PaymentRecord> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const paymentNumber = this.generateNumber('PAY');
        const receiptNumber = this.generateNumber('RCPT');
        return await this.prisma.payment.create({
          data: {
            paymentNumber,
            chamberId: dto.chamberId,
            patientId: dto.patientId,
            encounterId: dto.encounterId,
            appointmentId: dto.appointmentId,
            amount: new Prisma.Decimal(dto.amount),
            currency: dto.currency ?? 'BDT',
            method: dto.method,
            transactionReference: dto.transactionReference,
            idempotencyKey,
            notes: dto.notes,
            receivedById: userId,
            receipts: { create: { receiptNumber, issuedById: userId } },
          },
          include: this.paymentInclude(),
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // Collision on payment/receipt number, or a concurrent idempotent create.
          if (idempotencyKey) {
            const existing = await this.prisma.payment.findUnique({
              where: {
                chamberId_idempotencyKey: { chamberId: dto.chamberId, idempotencyKey },
              },
              include: this.paymentInclude(),
            });
            if (existing) {
              return existing;
            }
          }
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException({
      code: ErrorCode.PaymentInvalidAmount,
      message: 'Could not allocate unique payment and receipt numbers',
      details: [],
    });
  }

  private async assertPatientLinked(patientId: string, chamberId: string): Promise<void> {
    const link = await this.prisma.patientChamber.findUnique({
      where: { patientId_chamberId: { patientId, chamberId } },
      select: { patientId: true },
    });
    if (!link) {
      throw new NotFoundException({
        code: ErrorCode.PatientNotFound,
        message: 'Patient is not linked to this chamber',
        details: [],
      });
    }
  }

  private async assertEncounterBelongs(
    encounterId: string,
    chamberId: string,
    patientId: string,
  ): Promise<void> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      select: { chamberId: true, patientId: true },
    });
    if (!encounter || encounter.chamberId !== chamberId || encounter.patientId !== patientId) {
      throw new NotFoundException({
        code: ErrorCode.EncounterNotFound,
        message: 'Encounter was not found',
        details: [],
      });
    }
  }

  private async findPayment(paymentId: string): Promise<PaymentRecord> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: this.paymentInclude(),
    });
    if (!payment) {
      throw this.notFound();
    }
    return payment;
  }

  private paymentInclude() {
    return {
      refunds: { select: { amount: true } },
      receipts: { select: { receiptNumber: true }, orderBy: { createdAt: 'desc' as const } },
    };
  }

  private totalRefunded(payment: PaymentRecord): Prisma.Decimal {
    return payment.refunds.reduce((sum, refund) => sum.plus(refund.amount), new Prisma.Decimal(0));
  }

  private assertValidAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw this.invalidAmount();
    }
    if (Math.round(amount * 100) !== amount * 100) {
      throw this.invalidAmount();
    }
  }

  private invalidAmount(): BadRequestException {
    return new BadRequestException({
      code: ErrorCode.PaymentInvalidAmount,
      message: 'Amount must be a positive number with at most two decimal places',
      details: [],
    });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.PaymentNotFound,
      message: 'Payment was not found',
      details: [],
    });
  }

  private generateNumber(prefix: string): string {
    let code = '';
    for (let i = 0; i < 8; i += 1) {
      code += NUMBER_ALPHABET[randomInt(0, NUMBER_ALPHABET.length)];
    }
    return `${prefix}-${code}`;
  }

  private toPublic(payment: PaymentRecord): PublicPayment {
    const refundedAmount = this.totalRefunded(payment);
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      chamberId: payment.chamberId,
      patientId: payment.patientId,
      encounterId: payment.encounterId,
      appointmentId: payment.appointmentId,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      transactionReference: payment.transactionReference,
      notes: payment.notes,
      receivedById: payment.receivedById,
      receivedAt: payment.receivedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      refundedAmount: Number(refundedAmount),
      refundableAmount: Number(payment.amount.minus(refundedAmount)),
      receiptNumber: payment.receipts[0]?.receiptNumber ?? null,
    };
  }
}
