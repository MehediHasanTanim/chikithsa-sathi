import { BadRequestException, ConflictException } from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { VerificationService } from './verification.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const doctorProfile = { id: 'doctor-1', userId: 'user-1', fullName: 'Dr. Rahman' };

const pendingVerification = {
  id: 'verification-1',
  doctorId: 'doctor-1',
  status: VerificationStatus.NOT_SUBMITTED,
  submittedAt: null,
  reviewedAt: null,
  rejectionReason: null,
  notes: null,
};

describe('VerificationService', () => {
  const tx = {
    doctorProfile: { update: jest.fn() },
    verificationDocument: { deleteMany: jest.fn(), createMany: jest.fn() },
    professionalVerification: { update: jest.fn() },
  };
  const prisma = {
    professionalVerification: { findUnique: jest.fn(), create: jest.fn() },
    fileObject: { findMany: jest.fn() },
    transaction: jest.fn(),
  };
  const doctors = { getOrCreateProfile: jest.fn().mockResolvedValue(doctorProfile) };
  const service = new VerificationService(prisma as never, doctors as never);

  beforeEach(() => {
    jest.resetAllMocks();
    doctors.getOrCreateProfile.mockResolvedValue(doctorProfile);
    prisma.fileObject.findMany.mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000001' }]);
  });

  it('returns a default NOT_SUBMITTED status for a new doctor', async () => {
    prisma.professionalVerification.findUnique.mockResolvedValue(null);
    prisma.professionalVerification.create.mockResolvedValue(pendingVerification);

    await expect(service.status(user)).resolves.toMatchObject({
      status: VerificationStatus.NOT_SUBMITTED,
    });
  });

  it('submits documents and transitions to SUBMITTED', async () => {
    prisma.professionalVerification.findUnique.mockResolvedValue(pendingVerification);
    prisma.transaction.mockImplementation((callback: (client: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    );

    await expect(
      service.submit(user, {
        bmdcNumber: 'A-12345',
        documents: [{ fileId: '00000000-0000-4000-8000-000000000001', type: 'BMDC_CERTIFICATE' }],
      }),
    ).resolves.toEqual({ status: VerificationStatus.SUBMITTED });

    expect(tx.verificationDocument.createMany).toHaveBeenCalledTimes(1);
    const updateArgs = (
      tx.professionalVerification.update.mock.calls as Array<
        [{ data: { status: VerificationStatus } }]
      >
    )[0]![0];
    expect(updateArgs.data).toMatchObject({ status: VerificationStatus.SUBMITTED });
  });

  it('rejects resubmission while under review', async () => {
    prisma.professionalVerification.findUnique.mockResolvedValue({
      ...pendingVerification,
      status: VerificationStatus.UNDER_REVIEW,
    });

    await expect(
      service.submit(user, {
        documents: [{ fileId: '00000000-0000-4000-8000-000000000001', type: 'BMDC_CERTIFICATE' }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a verification document not uploaded by the doctor', async () => {
    prisma.professionalVerification.findUnique.mockResolvedValue(pendingVerification);
    prisma.fileObject.findMany.mockResolvedValue([]);

    await expect(
      service.submit(user, {
        documents: [{ fileId: '00000000-0000-4000-8000-000000000001', type: 'BMDC_CERTIFICATE' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.transaction).not.toHaveBeenCalled();
  });
});
