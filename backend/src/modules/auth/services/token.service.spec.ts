import { UnauthorizedException } from '@nestjs/common';

import { TokenService } from './token.service';

describe('TokenService', () => {
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const config = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        'jwt.accessSecret': 'access-secret',
        'jwt.refreshSecret': 'refresh-secret',
        'jwt.accessTtl': '15m',
        'jwt.refreshTtl': '30d',
      };
      return values[key];
    }),
  };
  const service = new TokenService(jwt as never, config as never);

  beforeEach(() => jest.resetAllMocks());

  it('rejects an expired or malformed refresh token', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(service.verifyRefresh('expired-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an access token passed to the refresh endpoint', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      sessionId: 'session-1',
      tokenVersion: 1,
      type: 'access',
    });

    await expect(service.verifyRefresh('access-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
