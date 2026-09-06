import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction, OtpPurpose, UserStatus } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { RequestContext } from '../auth.types';
import { AuditService } from './audit.service';
import { OtpDeliveryService } from './otp-delivery.service';
import { PasswordService } from './password.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly delivery: OtpDeliveryService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async createRegistrationOtp(userId: string, phone: string): Promise<Date> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + this.expirySeconds() * 1000);
    const otp = await this.prisma.otpVerification.upsert({
      where: { userId_purpose: { userId, purpose: OtpPurpose.REGISTRATION } },
      create: {
        userId,
        purpose: OtpPurpose.REGISTRATION,
        codeHash: await this.password.hash(code),
        expiresAt,
        maxAttempts: this.maxAttempts(),
      },
      update: {
        codeHash: await this.password.hash(code),
        expiresAt,
        attempts: 0,
        maxAttempts: this.maxAttempts(),
        consumedAt: null,
        lastSentAt: new Date(),
      },
    });

    await this.delivery.queueRegistrationOtp(otp.id, phone, code);
    return expiresAt;
  }

  async verifyRegistrationOtp(phone: string, code: string, context: RequestContext): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { otpVerifications: { where: { purpose: OtpPurpose.REGISTRATION } } },
    });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.AuthAccountNotFound,
        message: 'Account was not found',
        details: [],
      });
    }

    const otp = user.otpVerifications[0];
    if (!otp || otp.consumedAt) throw this.invalidOtp();
    if (otp.attempts >= otp.maxAttempts) throw this.maxAttemptsExceeded();
    if (otp.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: ErrorCode.AuthOtpExpired,
        message: 'OTP has expired',
        details: [],
      });
    }

    if (!(await this.password.verify(otp.codeHash, code))) {
      const updated = await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      if (updated.attempts >= updated.maxAttempts) throw this.maxAttemptsExceeded();
      throw this.invalidOtp();
    }

    await this.prisma.transaction(async (tx) => {
      await tx.otpVerification.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
      await tx.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockedUntil: null },
      });
    });
    await this.audit.record(AuditAction.AUTH_OTP_VERIFIED, user.id, context);
  }

  async resendRegistrationOtp(phone: string, context: RequestContext): Promise<Date> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { otpVerifications: { where: { purpose: OtpPurpose.REGISTRATION } } },
    });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.AuthAccountNotFound,
        message: 'Account was not found',
        details: [],
      });
    }
    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException({
        code: ErrorCode.AuthAccountNotVerified,
        message: 'Account is already verified',
        details: [],
      });
    }

    const existing = user.otpVerifications[0];
    const cooldownEndsAt = existing
      ? new Date(existing.lastSentAt.getTime() + this.resendCooldownSeconds() * 1000)
      : null;
    if (cooldownEndsAt && cooldownEndsAt > new Date()) {
      throw new ConflictException({
        code: ErrorCode.AuthRateLimited,
        message: 'Please wait before requesting another OTP',
        details: [],
      });
    }

    const expiresAt = await this.createRegistrationOtp(user.id, user.phone);
    await this.audit.record(AuditAction.AUTH_OTP_RESENT, user.id, context);
    return expiresAt;
  }

  private expirySeconds(): number {
    return this.config.getOrThrow<number>('jwt.otpExpirySeconds');
  }

  private maxAttempts(): number {
    return this.config.getOrThrow<number>('jwt.otpMaxAttempts');
  }

  private resendCooldownSeconds(): number {
    return this.config.getOrThrow<number>('jwt.otpResendCooldownSeconds');
  }

  private invalidOtp(): UnauthorizedException {
    return new UnauthorizedException({
      code: ErrorCode.AuthOtpInvalid,
      message: 'OTP is invalid',
      details: [],
    });
  }

  private maxAttemptsExceeded(): UnauthorizedException {
    return new UnauthorizedException({
      code: ErrorCode.AuthOtpMaxAttempts,
      message: 'Maximum OTP attempts exceeded',
      details: [],
    });
  }
}
