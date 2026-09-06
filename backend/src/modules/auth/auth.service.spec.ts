import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    userSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: jest.fn(),
  };
  const password = { hash: jest.fn(), verify: jest.fn() };
  const otp = {
    createRegistrationOtp: jest.fn(),
    verifyRegistrationOtp: jest.fn(),
    resendRegistrationOtp: jest.fn(),
  };
  const tokens = { issue: jest.fn(), verifyRefresh: jest.fn(), refreshExpiry: jest.fn() };
  const rateLimit = { enforce: jest.fn() };
  const audit = { record: jest.fn() };
  const config = { getOrThrow: jest.fn() };
  const service = new AuthService(
    prisma as never,
    password,
    otp as never,
    tokens as never,
    rateLimit as never,
    audit as never,
    config as never,
  );
  const context = { requestId: 'request-1', ipAddress: '127.0.0.1' };

  beforeEach(() => {
    jest.resetAllMocks();
    config.getOrThrow.mockImplementation((key: string) =>
      key === 'jwt.maxLoginAttempts' ? 5 : 900,
    );
    prisma.transaction.mockImplementation((callback: (client: typeof prisma) => unknown) =>
      Promise.resolve(callback(prisma)),
    );
  });

  it('creates a pending account and an OTP challenge', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValue({ id: 'user-1', phone: '+8801712345678' });
    password.hash.mockResolvedValue('argon-hash');
    otp.createRegistrationOtp.mockResolvedValue(new Date('2026-09-06T10:00:00.000Z'));

    await expect(
      service.register(
        {
          phone: '+8801712345678',
          password: 'StrongPassword123!',
          fullName: 'Dr Rahman',
          preferredLanguage: 'bn',
        },
        context,
      ),
    ).resolves.toMatchObject({ userId: 'user-1', verificationRequired: true });
    expect(password.hash).toHaveBeenCalledWith('StrongPassword123!');
    expect(otp.createRegistrationOtp).toHaveBeenCalledWith('user-1', '+8801712345678');
  });

  it('rejects invalid credentials and increments brute-force state', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });
    password.verify.mockResolvedValue(false);

    await expect(
      service.login({ phone: '+8801712345678', password: 'wrong' }, context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { failedLoginAttempts: 1 } }),
    );
  });

  it('locks an account when the maximum failed-login threshold is reached', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      lockedUntil: null,
      failedLoginAttempts: 4,
    });
    password.verify.mockResolvedValue(false);

    await expect(
      service.login({ phone: '+8801712345678', password: 'wrong' }, context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it('stores only a hash of a newly issued refresh token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      phone: '+8801712345678',
      email: null,
      fullName: 'Dr Rahman',
      preferredLanguage: 'bn',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });
    password.verify.mockResolvedValue(true);
    tokens.refreshExpiry.mockReturnValue(new Date('2026-10-06T10:00:00.000Z'));
    prisma.userSession.create.mockResolvedValue({ id: 'session-1', tokenVersion: 1 });
    tokens.issue.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
    });
    password.hash.mockResolvedValue('refresh-argon-hash');

    const result = await service.login(
      { phone: '+8801712345678', password: 'StrongPassword123!' },
      context,
    );

    expect(result).toMatchObject({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'user-1' },
    });
    expect(prisma.userSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { refreshTokenHash: 'refresh-argon-hash' } }),
    );
  });

  it('rotates a valid refresh token and invalidates its previous token version', async () => {
    tokens.verifyRefresh.mockResolvedValue({
      sub: 'user-1',
      sessionId: 'session-1',
      tokenVersion: 1,
      type: 'refresh',
    });
    prisma.userSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      tokenVersion: 1,
      refreshTokenHash: 'hash',
      revokedAt: null,
      expiresAt: new Date('2026-10-06T10:00:00.000Z'),
      user: { status: UserStatus.ACTIVE },
    });
    password.verify.mockResolvedValue(true);
    prisma.userSession.updateMany.mockResolvedValue({ count: 1 });
    tokens.issue.mockResolvedValue({
      accessToken: 'next-access',
      refreshToken: 'next-refresh',
      expiresIn: 900,
    });
    tokens.refreshExpiry.mockReturnValue(new Date('2026-10-06T10:00:00.000Z'));
    password.hash.mockResolvedValue('next-hash');

    await expect(service.refresh('refresh', context)).resolves.toMatchObject({
      accessToken: 'next-access',
    });
    expect(prisma.userSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { tokenVersion: 2 } }),
    );
  });

  it('revokes the current session at logout', async () => {
    tokens.verifyRefresh.mockResolvedValue({
      sub: 'user-1',
      sessionId: 'session-1',
      tokenVersion: 1,
      type: 'refresh',
    });
    prisma.userSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.logout(
        {
          id: 'user-1',
          sessionId: 'session-1',
          fullName: 'Dr Rahman',
          phone: '+8801712345678',
          email: null,
          preferredLanguage: 'bn',
          status: 'ACTIVE',
        },
        'refresh',
        context,
      ),
    ).resolves.toEqual({ message: 'Logged out successfully' });
    expect(prisma.userSession.updateMany).toHaveBeenCalledTimes(1);
  });
});
