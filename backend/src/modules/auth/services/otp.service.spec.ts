import { UnauthorizedException } from '@nestjs/common';
import { OtpPurpose, UserStatus } from '@prisma/client';

import { OtpService } from './otp.service';

describe('OtpService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    otpVerification: { update: jest.fn(), upsert: jest.fn() },
    transaction: jest.fn(),
  };
  const password = { hash: jest.fn(), verify: jest.fn() };
  const delivery = { queueRegistrationOtp: jest.fn() };
  const audit = { record: jest.fn() };
  const config = { getOrThrow: jest.fn().mockReturnValue(5) };
  const service = new OtpService(
    prisma as never,
    password,
    delivery as never,
    audit as never,
    config as never,
  );

  beforeEach(() => jest.resetAllMocks());

  it('increments invalid OTP attempts without persisting the raw code', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      otpVerifications: [
        {
          id: 'otp-1',
          purpose: OtpPurpose.REGISTRATION,
          codeHash: 'argon-hash',
          attempts: 0,
          maxAttempts: 5,
          consumedAt: null,
          expiresAt: new Date('2026-10-06T10:00:00.000Z'),
        },
      ],
    });
    password.verify.mockResolvedValue(false);
    prisma.otpVerification.update.mockResolvedValue({ attempts: 1, maxAttempts: 5 });

    await expect(
      service.verifyRegistrationOtp('+8801712345678', '123456', { requestId: 'request-1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.otpVerification.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { increment: 1 } } }),
    );
    expect(password.verify).toHaveBeenCalledWith('argon-hash', '123456');
  });

  it('activates an account only after a valid unexpired OTP', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.PENDING_VERIFICATION,
      otpVerifications: [
        {
          id: 'otp-1',
          codeHash: 'argon-hash',
          attempts: 0,
          maxAttempts: 5,
          consumedAt: null,
          expiresAt: new Date('2026-10-06T10:00:00.000Z'),
        },
      ],
    });
    password.verify.mockResolvedValue(true);
    prisma.transaction.mockImplementation((callback: (client: typeof prisma) => unknown) =>
      Promise.resolve(callback(prisma)),
    );

    await expect(
      service.verifyRegistrationOtp('+8801712345678', '123456', {}),
    ).resolves.toBeUndefined();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('rejects an expired OTP without checking its code', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      otpVerifications: [
        {
          id: 'otp-1',
          codeHash: 'argon-hash',
          attempts: 0,
          maxAttempts: 5,
          consumedAt: null,
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        },
      ],
    });

    await expect(
      service.verifyRegistrationOtp('+8801712345678', '123456', {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(password.verify).not.toHaveBeenCalled();
  });
});
