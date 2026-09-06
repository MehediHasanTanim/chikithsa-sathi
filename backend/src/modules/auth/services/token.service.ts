import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ErrorCode } from '@common/constants/error-codes';
import type { JwtPayload } from '../auth.types';

type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(userId: string, sessionId: string, tokenVersion: number): Promise<IssuedTokens> {
    const accessPayload: JwtPayload = { sub: userId, sessionId, tokenVersion, type: 'access' };
    const refreshPayload: JwtPayload = { sub: userId, sessionId, tokenVersion, type: 'refresh' };
    const accessTtl = this.config.getOrThrow<string>('jwt.accessTtl');
    const refreshTtl = this.config.getOrThrow<string>('jwt.refreshTtl');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: accessTtl as never,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: refreshTtl as never,
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: this.durationInSeconds(accessTtl) };
  }

  async verifyRefresh(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
      if (payload.type !== 'refresh') throw new Error('Not a refresh token');
      return payload;
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.AuthRefreshTokenInvalid,
        message: 'Refresh token is invalid or expired',
        details: [],
      });
    }
  }

  refreshExpiry(): Date {
    return new Date(
      Date.now() + this.durationInSeconds(this.config.getOrThrow<string>('jwt.refreshTtl')) * 1000,
    );
  }

  private durationInSeconds(value: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value);
    if (!match) throw new Error('JWT TTL must use s, m, h, or d units');
    const amount = Number(match[1]);
    const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]!]!;
    return amount * multiplier;
  }
}
