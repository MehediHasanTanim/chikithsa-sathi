import { ForbiddenException } from '@nestjs/common';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ReportsService } from './reports.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const reportRecord = {
  id: 'report-1',
  patientId: 'patient-1',
  encounterId: 'encounter-1',
  investigationId: null,
  title: 'CBC Report',
  reportDate: null,
  status: 'AVAILABLE',
  summary: null,
  findings: null,
  interpretation: null,
  aiSummary: null,
  aiAnalysis: null,
  reviewedById: null,
  reviewedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  files: [],
};

describe('ReportsService', () => {
  const prisma = {
    encounter: { findUnique: jest.fn() },
    investigation: { findUnique: jest.fn() },
    fileObject: { findUnique: jest.fn() },
    diagnosticReport: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  };
  const permissions = { requirePermissions: jest.fn() };
  const service = new ReportsService(prisma as never, permissions as never);

  beforeEach(() => jest.resetAllMocks());

  it('creates a report attached to an encounter', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      patientId: 'patient-1',
      chamberId: 'chamber-1',
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.diagnosticReport.create.mockResolvedValue(reportRecord);

    const result = await service.create(user, 'encounter-1', { title: 'CBC Report' });

    expect(prisma.diagnosticReport.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 'report-1', title: 'CBC Report' });
  });

  it('lists reports for an encounter', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      patientId: 'patient-1',
      chamberId: 'chamber-1',
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.diagnosticReport.findMany.mockResolvedValue([reportRecord]);

    const result = await service.list(user, 'encounter-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'report-1' });
  });

  it('rejects attaching a file uploaded by another user', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      patientId: 'patient-1',
      chamberId: 'chamber-1',
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.fileObject.findUnique.mockResolvedValue({
      id: 'file-1',
      status: 'AVAILABLE',
      uploadedById: 'user-2',
    });

    await expect(
      service.create(user, 'encounter-1', { title: 'CBC Report', fileId: 'file-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.diagnosticReport.create).not.toHaveBeenCalled();
  });
});
