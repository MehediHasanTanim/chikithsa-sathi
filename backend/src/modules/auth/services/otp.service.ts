import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditAction, OtpDeliveryChannel, OtpPurpose, UserStatus } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { RequestContext } from '../auth.types';
import { AuditService } from './audit.service';
import { OtpDeliveryService } from './otp-delivery.service';
import { PasswordService } from './password.service';

@Injectable()
export class OtpService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly password: PasswordService,
    private readonly delivery: OtpDeliveryService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async createRegistrationOtp(userId: string, phone: string, email?: string, channel: OtpDeliveryChannel = OtpDeliveryChannel.SMS): Promise<Date> {
    return this.createOtp(userId, phone, email, channel, OtpPurpose.REGISTRATION, 'verification');
  }

  async createPasswordResetOtp(userId: string, phone: string, email?: string, channel: OtpDeliveryChannel = OtpDeliveryChannel.SMS): Promise<Date> {
    return this.createOtp(userId, phone, email, channel, OtpPurpose.PASSWORD_RESET, 'password reset');
  }

  private async createOtp(
    userId: string,
    phone: string,
    email: string | undefined,
    channel: OtpDeliveryChannel,
    purpose: OtpPurpose,
    deliveryPurpose: 'verification' | 'password reset',
  ): Promise<Date> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + this.expirySeconds() * 1000);
    const otp = await this.repository.otpVerification.upsert({
      where: { userId_purpose: { userId, purpose } },
      create: {
        userId,
        purpose,
        channel,
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
        channel,
      },
    });

    await this.delivery.sendOtp(otp.id, { phone, email }, code, deliveryPurpose, channel);
    return expiresAt;
  }

  async verifyRegistrationOtp(phone: string, code: string, context: RequestContext): Promise<void> {
    const user = await this.repository.user.findUnique({
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
      const updated = await this.repository.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      if (updated.attempts >= updated.maxAttempts) throw this.maxAttemptsExceeded();
      throw this.invalidOtp();
    }

    await this.repository.transaction(async (tx) => {
      await tx.otpVerification.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
      await tx.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockedUntil: null },
      });
    });
    await this.audit.record(AuditAction.AUTH_OTP_VERIFIED, user.id, context);
  }

  async resendRegistrationOtp(phone: string, context: RequestContext, selectedChannel?: 'sms' | 'email'): Promise<Date> {
    const user = await this.repository.user.findUnique({
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

    const channel = selectedChannel === 'email' ? OtpDeliveryChannel.EMAIL : selectedChannel === 'sms' ? OtpDeliveryChannel.SMS : existing?.channel ?? OtpDeliveryChannel.SMS;
    const expiresAt = await this.createRegistrationOtp(user.id, user.phone, user.email ?? undefined, channel);
    await this.audit.record(AuditAction.AUTH_OTP_RESENT, user.id, context);
    return expiresAt;
  }

  async consumePasswordResetOtp(phone: string, code: string): Promise<string> {
    const user = await this.repository.user.findUnique({
      where: { phone },
      include: { otpVerifications: { where: { purpose: OtpPurpose.PASSWORD_RESET } } },
    });
    if (!user) throw this.accountNotFound();
    const otp = user.otpVerifications[0];
    if (!otp || otp.consumedAt) throw this.invalidOtp();
    if (otp.attempts >= otp.maxAttempts) throw this.maxAttemptsExceeded();
    if (otp.expiresAt <= new Date()) {
      throw new UnauthorizedException({ code: ErrorCode.AuthOtpExpired, message: 'OTP has expired', details: [] });
    }
    if (!(await this.password.verify(otp.codeHash, code))) {
      const updated = await this.repository.otpVerification.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      if (updated.attempts >= updated.maxAttempts) throw this.maxAttemptsExceeded();
      throw this.invalidOtp();
    }
    const consumed = await this.repository.otpVerification.updateMany({
      where: { id: otp.id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: otp.maxAttempts } },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) throw this.invalidOtp();
    return user.id;
  }

  async requestPasswordReset(phone: string, context: RequestContext, selectedChannel: 'sms' | 'email' = 'sms'): Promise<Date> {
    const user = await this.repository.user.findUnique({ where: { phone } });
    // Avoid account enumeration: the controller always returns an accepted response.
    if (!user || user.status !== UserStatus.ACTIVE) return new Date(Date.now() + this.expirySeconds() * 1000);
    const expiresAt = await this.createPasswordResetOtp(user.id, user.phone, user.email ?? undefined, selectedChannel === 'email' ? OtpDeliveryChannel.EMAIL : OtpDeliveryChannel.SMS);
    await this.audit.record(AuditAction.AUTH_PASSWORD_RESET_REQUESTED, user.id, context);
    return expiresAt;
  }

  private accountNotFound(): NotFoundException {
    return new NotFoundException({ code: ErrorCode.AuthAccountNotFound, message: 'Account was not found', details: [] });
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
