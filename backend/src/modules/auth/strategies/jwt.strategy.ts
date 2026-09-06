import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser, JwtPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.type !== 'access') throw this.invalidToken();
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.sub,
        tokenVersion: payload.tokenVersion,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: UserStatus.ACTIVE },
      },
      include: { user: true },
    });
    if (!session) throw this.invalidToken();

    return {
      id: session.user.id,
      sessionId: session.id,
      fullName: session.user.fullName,
      phone: session.user.phone,
      email: session.user.email,
      preferredLanguage: session.user.preferredLanguage,
      status: 'ACTIVE',
    };
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: ErrorCode.AuthRefreshTokenInvalid,
      message: 'Access token is invalid or expired',
      details: [],
    });
  }
}
