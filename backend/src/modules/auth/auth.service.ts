import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction, Prisma, UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser, RequestContext } from './auth.types';
import { AuditService } from './services/audit.service';
import { AuthRateLimitService } from './services/auth-rate-limit.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly password: PasswordService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, context: RequestContext) {
    await this.rateLimit.enforce('otp', this.rateLimitKey(dto.phone, context.ipAddress));
    const email = dto.email.toLowerCase();
    const [phoneOwner, emailOwner] = await Promise.all([
      this.repository.user.findUnique({ where: { phone: dto.phone }, select: { id: true } }),
      this.repository.user.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (phoneOwner)
      throw this.conflict(ErrorCode.AuthPhoneAlreadyExists, 'Phone number is already registered');
    if (emailOwner)
      throw this.conflict(ErrorCode.AuthEmailAlreadyExists, 'Email address is already registered');

    let user;
    try {
      user = await this.repository.user.create({
        data: {
          phone: dto.phone,
          email,
          fullName: dto.fullName,
          passwordHash: await this.password.hash(dto.password),
          preferredLanguage: dto.preferredLanguage,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw this.conflict(
          ErrorCode.AuthPhoneAlreadyExists,
          'Phone number or email address is already registered',
        );
      }
      throw error;
    }

    const expiresAt = await this.otp.createRegistrationOtp(user.id, email);
    await this.audit.record(AuditAction.AUTH_REGISTERED, user.id, context);
    return { userId: user.id, verificationRequired: true, otpExpiresAt: expiresAt.toISOString() };
  }

  async verifyOtp(phone: string, otp: string, context: RequestContext) {
    await this.rateLimit.enforce('otp', this.rateLimitKey(phone, context.ipAddress));
    await this.otp.verifyRegistrationOtp(phone, otp, context);
    return { verified: true };
  }

  async resendOtp(phone: string, context: RequestContext) {
    await this.rateLimit.enforce('otp', this.rateLimitKey(phone, context.ipAddress));
    const expiresAt = await this.otp.resendRegistrationOtp(phone, context);
    return { otpExpiresAt: expiresAt.toISOString() };
  }

  async login(dto: LoginDto, context: RequestContext) {
    await this.rateLimit.enforce('login', this.rateLimitKey(dto.phone, context.ipAddress));
    const user = await this.repository.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw this.invalidCredentials();
    this.ensureAccountCanLogIn(user.status, user.lockedUntil);

    if (!(await this.password.verify(user.passwordHash, dto.password))) {
      await this.recordFailedLogin(user.id, user.failedLoginAttempts);
      throw this.invalidCredentials();
    }

    const expiresAt = this.tokens.refreshExpiry();
    const session = await this.repository.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: 'pending',
        expiresAt,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceId: dto.device?.deviceId,
        platform: dto.device?.platform,
        appVersion: dto.device?.appVersion,
      },
    });
    const issued = await this.tokens.issue(user.id, session.id, session.tokenVersion);
    await this.repository.transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      });
      await tx.userSession.update({
        where: { id: session.id },
        data: { refreshTokenHash: await this.password.hash(issued.refreshToken) },
      });
    });
    await this.audit.record(AuditAction.AUTH_LOGIN, user.id, context, session.id);

    return {
      ...issued,
      user: this.publicUser({ ...user, status: UserStatus.ACTIVE }),
    };
  }

  async refresh(refreshToken: string, context: RequestContext) {
    const payload = await this.tokens.verifyRefresh(refreshToken);
    const session = await this.repository.userSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw this.invalidRefresh();
    }
    if (
      session.user.status !== UserStatus.ACTIVE ||
      session.tokenVersion !== payload.tokenVersion
    ) {
      throw this.invalidRefresh();
    }
    if (!(await this.password.verify(session.refreshTokenHash, refreshToken)))
      throw this.invalidRefresh();

    const nextVersion = session.tokenVersion + 1;
    const rotated = await this.repository.userSession.updateMany({
      where: {
        id: session.id,
        tokenVersion: session.tokenVersion,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { tokenVersion: nextVersion },
    });
    if (rotated.count !== 1) throw this.invalidRefresh();

    const issued = await this.tokens.issue(session.userId, session.id, nextVersion);
    await this.repository.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await this.password.hash(issued.refreshToken),
        expiresAt: this.tokens.refreshExpiry(),
      },
    });
    await this.audit.record(AuditAction.AUTH_REFRESHED, session.userId, context, session.id);
    return issued;
  }

  async logout(user: AuthenticatedUser, refreshToken: string, context: RequestContext) {
    const payload = await this.tokens.verifyRefresh(refreshToken);
    if (payload.sub !== user.id || payload.sessionId !== user.sessionId)
      throw this.invalidRefresh();

    const revoked = await this.repository.userSession.updateMany({
      where: { id: payload.sessionId, userId: user.id, revokedAt: null },
      data: { revokedAt: new Date(), tokenVersion: { increment: 1 } },
    });
    if (revoked.count !== 1) {
      throw new UnauthorizedException({
        code: ErrorCode.AuthSessionRevoked,
        message: 'Session has already been revoked',
        details: [],
      });
    }
    await this.audit.record(AuditAction.AUTH_LOGOUT, user.id, context, user.sessionId);
    return { message: 'Logged out successfully' };
  }

  private async recordFailedLogin(userId: string, currentAttempts: number): Promise<void> {
    const nextAttempts = currentAttempts + 1;
    const maxAttempts = this.config.getOrThrow<number>('jwt.maxLoginAttempts');
    const lockoutSeconds = this.config.getOrThrow<number>('jwt.lockoutSeconds');
    await this.repository.user.update({
      where: { id: userId },
      data:
        nextAttempts >= maxAttempts
          ? {
              failedLoginAttempts: nextAttempts,
              status: UserStatus.LOCKED,
              lockedUntil: new Date(Date.now() + lockoutSeconds * 1000),
            }
          : { failedLoginAttempts: nextAttempts },
    });
  }

  private ensureAccountCanLogIn(status: UserStatus, lockedUntil: Date | null): void {
    if (status === UserStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException({
        code: ErrorCode.AuthAccountNotVerified,
        message: 'Account is not verified',
        details: [],
      });
    }
    if (status === UserStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: ErrorCode.AuthAccountSuspended,
        message: 'Account is suspended',
        details: [],
      });
    }
    if (status === UserStatus.LOCKED && lockedUntil && lockedUntil > new Date()) {
      throw new ForbiddenException({
        code: ErrorCode.AuthAccountLocked,
        message: 'Account is locked',
        details: [],
      });
    }
    if (status !== UserStatus.ACTIVE && status !== UserStatus.LOCKED)
      throw this.invalidCredentials();
  }

  private publicUser(user: {
    id: string;
    phone: string;
    email: string | null;
    fullName: string;
    preferredLanguage: string;
    status: UserStatus;
  }) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
    };
  }

  private rateLimitKey(phone: string, ipAddress?: string): string {
    return `${phone}:${ipAddress ?? 'unknown'}`;
  }

  private conflict(code: string, message: string): ConflictException {
    return new ConflictException({ code, message, details: [] });
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: ErrorCode.AuthInvalidCredentials,
      message: 'Invalid credentials',
      details: [],
    });
  }

  private invalidRefresh(): UnauthorizedException {
    return new UnauthorizedException({
      code: ErrorCode.AuthRefreshTokenInvalid,
      message: 'Refresh token is invalid or expired',
      details: [],
    });
  }
}
