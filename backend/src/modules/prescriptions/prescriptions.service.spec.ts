import { BadRequestException, ConflictException } from '@nestjs/common';
import { EncounterStatus, PrescriptionStatus } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PrescriptionsService } from './prescriptions.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const prescriptionRecord = {
  id: 'prescription-1',
  prescriptionNumber: 'PR-ABC23456',
  chamberId: 'chamber-1',
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  encounterId: 'encounter-1',
  status: PrescriptionStatus.DRAFT,
  language: 'bn',
  clinicalSummary: null,
  advice: null,
  followUpDate: null,
  aiGenerated: false,
  version: 1,
  reviewedAt: null,
  reviewedById: null,
  finalizedAt: null,
  finalizedById: null,
  deliveredAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
};

describe('PrescriptionsService', () => {
  const tx = {
    prescriptionAmendment: { create: jest.fn() },
    prescription: { update: jest.fn() },
  };
  const prisma = {
    encounter: { findUnique: jest.fn() },
    prescription: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    prescriptionAmendment: { findMany: jest.fn() },
    transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const permissions = { requirePermissions: jest.fn() };
  const events = {
    finalized: jest.fn(),
    amended: jest.fn(),
    delivered: jest.fn(),
    pdfRequested: jest.fn(),
  };
  const service = new PrescriptionsService(prisma as never, permissions as never, events as never);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
  });

  it('creates a draft prescription with items for an encounter', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      patientId: 'patient-1',
      chamberId: 'chamber-1',
      status: EncounterStatus.IN_PROGRESS,
      chamber: { ownerDoctorId: 'doctor-1' },
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.prescription.create.mockResolvedValue(prescriptionRecord);

    const result = await service.create(user, 'encounter-1', {
      items: [{ medicineId: 'medicine-1', dosage: '1+0+1' }],
    });

    expect(prisma.prescription.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 'prescription-1', status: PrescriptionStatus.DRAFT });
  });

  it('rejects editing a finalized prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.FINALIZED,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(service.update(user, 'prescription-1', { advice: 'Rest' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('moves a draft prescription to review and stamps the reviewer', async () => {
    prisma.prescription.findUnique.mockResolvedValue(prescriptionRecord);
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.prescription.update.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.REVIEW_REQUIRED,
      reviewedAt: new Date(),
      reviewedById: user.id,
    });

    const result = await service.review(user, 'prescription-1', { reviewed: true });

    expect(permissions.requirePermissions).toHaveBeenCalledWith(user.id, 'chamber-1', [
      'prescriptions.finalize',
    ]);
    expect(result.status).toBe(PrescriptionStatus.REVIEW_REQUIRED);
    expect(result.reviewedById).toBe(user.id);
  });

  it('finalizes a reviewed prescription', async () => {
    prisma.prescription.findUnique
      .mockResolvedValueOnce({
        ...prescriptionRecord,
        status: PrescriptionStatus.REVIEW_REQUIRED,
        items: [{ id: 'item-1', medicine: null }],
      })
      .mockResolvedValueOnce({
        ...prescriptionRecord,
        status: PrescriptionStatus.FINALIZED,
        finalizedAt: new Date(),
        finalizedById: user.id,
      });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.prescription.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.finalize(user, 'prescription-1', { confirmation: true });

    expect(result.status).toBe(PrescriptionStatus.FINALIZED);
    expect(events.finalized).toHaveBeenCalledWith('prescription-1');
  });

  it('rejects finalization without confirmation', async () => {
    await expect(
      service.finalize(user, 'prescription-1', { confirmation: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects finalization when review is still required', async () => {
    prisma.prescription.findUnique.mockResolvedValue(prescriptionRecord);
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(
      service.finalize(user, 'prescription-1', { confirmation: true }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects finalizing an already finalized prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.FINALIZED,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(
      service.finalize(user, 'prescription-1', { confirmation: true }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a concurrent finalization attempt', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.REVIEW_REQUIRED,
      items: [{ id: 'item-1', medicine: null }],
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.prescription.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.finalize(user, 'prescription-1', { confirmation: true }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects finalizing a prescription without items', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.REVIEW_REQUIRED,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(
      service.finalize(user, 'prescription-1', { confirmation: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delivers a finalized prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.FINALIZED,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.prescription.update.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.DELIVERED,
      deliveredAt: new Date(),
    });

    const result = await service.deliver(user, 'prescription-1');

    expect(result.status).toBe(PrescriptionStatus.DELIVERED);
    expect(events.delivered).toHaveBeenCalledWith('prescription-1');
  });

  it('rejects delivering a draft prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue(prescriptionRecord);
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(service.deliver(user, 'prescription-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('amends a finalized prescription and bumps its version', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.FINALIZED,
      version: 2,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    tx.prescriptionAmendment.create.mockResolvedValue({
      id: 'amendment-1',
      reason: 'Dose changed',
    });

    const result = await service.amend(user, 'prescription-1', { reason: 'Dose changed' });

    expect(result).toMatchObject({
      amendmentId: 'amendment-1',
      previousVersion: 2,
      newVersion: 3,
      reason: 'Dose changed',
    });
    expect(events.amended).toHaveBeenCalledWith('prescription-1');
  });

  it('rejects amending a draft prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue(prescriptionRecord);
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(
      service.amend(user, 'prescription-1', { reason: 'Dose changed' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns the amendment history', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.FINALIZED,
      version: 3,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.prescriptionAmendment.findMany.mockResolvedValue([
      {
        id: 'amendment-1',
        amendedById: user.id,
        previousVersion: 2,
        newVersion: 3,
        reason: 'Dose changed',
        changes: { items: [] },
        createdAt: new Date(),
      },
    ]);

    const result = await service.history(user, 'prescription-1');

    expect(result.currentVersion).toBe(3);
    expect(result.amendments).toHaveLength(1);
    expect(result.amendments[0]).toMatchObject({ id: 'amendment-1', reason: 'Dose changed' });
  });

  it('requests a PDF for a finalized prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.FINALIZED,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    const result = await service.pdf(user, 'prescription-1');

    expect(result.status).toBe('PROCESSING');
    expect(events.pdfRequested).toHaveBeenCalledWith('prescription-1');
  });

  it('rejects a PDF request for a draft prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue(prescriptionRecord);
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(service.pdf(user, 'prescription-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
