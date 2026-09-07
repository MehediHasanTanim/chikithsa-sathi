import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PaymentsService } from './payments.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const paymentRecord = {
  id: 'payment-1',
  paymentNumber: 'PAY-ABC23456',
  chamberId: 'chamber-1',
  patientId: 'patient-1',
  encounterId: null,
  appointmentId: null,
  amount: new Prisma.Decimal(1000),
  currency: 'BDT',
  method: 'CASH',
  status: PaymentStatus.PAID,
  transactionReference: null,
  idempotencyKey: null,
  notes: null,
  receivedById: 'user-1',
  receivedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  refunds: [],
  receipts: [{ receiptNumber: 'RCPT-ABC23456' }],
};

describe('PaymentsService', () => {
  const tx = {
    paymentRefund: { create: jest.fn() },
    payment: { update: jest.fn() },
  };
  const prisma = {
    payment: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    patientChamber: { findUnique: jest.fn() },
    encounter: { findUnique: jest.fn() },
    receipt: { findFirst: jest.fn() },
    transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const permissions = { requirePermissions: jest.fn() };
  const events = { created: jest.fn(), refunded: jest.fn() };
  const service = new PaymentsService(prisma as never, permissions as never, events as never);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
  });

  it('records a payment and issues a receipt', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.patientChamber.findUnique.mockResolvedValue({ patientId: 'patient-1' });
    prisma.payment.create.mockResolvedValue(paymentRecord);

    const result = await service.create(user, {
      chamberId: 'chamber-1',
      patientId: 'patient-1',
      amount: 1000,
      method: 'CASH',
    });

    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      id: 'payment-1',
      amount: 1000,
      status: PaymentStatus.PAID,
      receiptNumber: 'RCPT-ABC23456',
      refundableAmount: 1000,
    });
    expect(events.created).toHaveBeenCalledWith('payment-1');
  });

  it('returns the original payment for a repeated idempotency key', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.payment.findUnique.mockResolvedValue(paymentRecord);

    const result = await service.create(
      user,
      { chamberId: 'chamber-1', patientId: 'patient-1', amount: 1000, method: 'CASH' },
      'idem-1',
    );

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(result.id).toBe('payment-1');
  });

  it('rejects an amount with more than two decimal places', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        amount: 10.999,
        method: 'CASH',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a zero or negative amount', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        amount: 0,
        method: 'CASH',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a payment for a patient not linked to the chamber', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.patientChamber.findUnique.mockResolvedValue(null);

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        amount: 1000,
        method: 'CASH',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires payments.create permission before recording a payment', async () => {
    permissions.requirePermissions.mockRejectedValue(new ForbiddenException());

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        amount: 1000,
        method: 'CASH',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists payments for a chamber', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.payment.findMany.mockResolvedValue([paymentRecord]);
    prisma.payment.count.mockResolvedValue(1);

    const result = await service.list(user, { chamberId: 'chamber-1' });

    expect(prisma.payment.findMany).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('returns a receipt for a payment', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      chamberId: 'chamber-1',
      paymentNumber: 'PAY-ABC23456',
      amount: new Prisma.Decimal(1000),
      currency: 'BDT',
      method: 'CASH',
      receivedAt: new Date(),
      chamber: { name: 'Test Chamber' },
      patient: { fullName: 'Rahim Uddin' },
    });
    prisma.receipt.findFirst.mockResolvedValue({
      receiptNumber: 'RCPT-ABC23456',
      issuedAt: new Date(),
    });

    const result = await service.receipt(user, 'payment-1');

    expect(result).toMatchObject({
      receiptNumber: 'RCPT-ABC23456',
      paymentNumber: 'PAY-ABC23456',
      amount: 1000,
      patientName: 'Rahim Uddin',
      chamberName: 'Test Chamber',
    });
  });

  it('refunds part of a payment', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.payment.findUnique.mockResolvedValue(paymentRecord);
    tx.paymentRefund.create.mockResolvedValue({ id: 'refund-1' });
    tx.payment.update.mockResolvedValue({
      ...paymentRecord,
      status: PaymentStatus.PARTIALLY_REFUNDED,
    });

    const result = await service.refund(user, 'payment-1', { amount: 400, reason: 'Partial' });

    expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    expect(tx.paymentRefund.create).toHaveBeenCalledTimes(1);
    expect(events.refunded).toHaveBeenCalledWith('payment-1');
  });

  it('fully refunds a payment', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.payment.findUnique.mockResolvedValue(paymentRecord);
    tx.paymentRefund.create.mockResolvedValue({ id: 'refund-1' });
    tx.payment.update.mockResolvedValue({
      ...paymentRecord,
      status: PaymentStatus.REFUNDED,
    });

    const result = await service.refund(user, 'payment-1', { amount: 1000, reason: 'Full' });

    expect(result.status).toBe(PaymentStatus.REFUNDED);
  });

  it('rejects a refund exceeding the refundable balance', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.payment.findUnique.mockResolvedValue({
      ...paymentRecord,
      refunds: [{ amount: new Prisma.Decimal(600) }],
    });

    await expect(
      service.refund(user, 'payment-1', { amount: 500, reason: 'Too much' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a refund on an already fully refunded payment', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.payment.findUnique.mockResolvedValue({
      ...paymentRecord,
      status: PaymentStatus.REFUNDED,
      refunds: [{ amount: new Prisma.Decimal(1000) }],
    });

    await expect(
      service.refund(user, 'payment-1', { amount: 100, reason: 'Again' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires payments.refund permission before refunding', async () => {
    permissions.requirePermissions.mockRejectedValue(new ForbiddenException());
    prisma.payment.findUnique.mockResolvedValue(paymentRecord);

    await expect(
      service.refund(user, 'payment-1', { amount: 100, reason: 'Nope' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when a payment is not found', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);

    await expect(service.getById(user, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
