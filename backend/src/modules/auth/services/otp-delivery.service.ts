import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

import { ErrorCode } from '@common/constants/error-codes';

export const OTP_EMAIL_TRANSPORT = Symbol('OTP_EMAIL_TRANSPORT');

export function createOtpEmailTransport(config: ConfigService): Transporter | null {
  if (!config.getOrThrow<boolean>('email.enabled')) return null;

  return createTransport({
    host: config.getOrThrow<string>('email.smtpHost'),
    port: config.getOrThrow<number>('email.smtpPort'),
    secure: config.getOrThrow<boolean>('email.smtpSecure'),
    requireTLS: !config.getOrThrow<boolean>('email.smtpSecure'),
    auth: {
      user: config.getOrThrow<string>('email.smtpUser'),
      pass: config.getOrThrow<string>('email.smtpPassword'),
    },
    tls: { minVersion: 'TLSv1.2' },
  });
}

/** SMTP-backed registration OTP delivery. OTP values exist only in memory and are never logged. */
@Injectable()
export class OtpDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(OtpDeliveryService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(OTP_EMAIL_TRANSPORT) private readonly transport: Transporter | null,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.transport) {
      this.logger.warn({ event: 'auth.otp_email_delivery_disabled' });
      return;
    }

    try {
      await this.transport.verify();
      this.logger.log({ event: 'auth.otp_email_transport_verified' });
    } catch (error) {
      this.logFailure('auth.otp_email_transport_unavailable', undefined, error);
      throw this.unavailable();
    }
  }

  async sendRegistrationOtp(otpId: string, email: string, code: string): Promise<void> {
    if (!this.transport) {
      this.logger.warn({ event: 'auth.otp_email_delivery_disabled', otpId });
      return;
    }

    try {
      await this.transport.sendMail({
        from: this.config.getOrThrow<string>('email.from'),
        to: email,
        subject: `${this.config.getOrThrow<string>('app.name')} verification code`,
        text: [
          `Your verification code is ${code}.`,
          '',
          `It expires in ${this.config.getOrThrow<number>('jwt.otpExpirySeconds') / 60} minutes.`,
          'If you did not request this, you can safely ignore this email.',
        ].join('\n'),
      });
      this.logger.log({ event: 'auth.otp_email_sent', otpId });
    } catch (error) {
      this.logFailure('auth.otp_email_delivery_failed', otpId, error);
      throw this.unavailable();
    }
  }

  private logFailure(event: string, otpId: string | undefined, error: unknown): void {
    this.logger.error({
      event,
      ...(otpId ? { otpId } : {}),
      // SMTP errors may echo recipient addresses or message content. Keep logs metadata-only.
      errorType: error instanceof Error ? error.name : 'UnknownSmtpError',
    });
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException({
      code: ErrorCode.ServiceUnavailable,
      message: 'Verification email delivery is temporarily unavailable',
      details: [],
    });
  }
}
