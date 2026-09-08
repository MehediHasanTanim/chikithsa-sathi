import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { OtpDeliveryChannel } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';

/** Delivers OTPs only through the registered channel selected for the challenge. */
@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(
    otpId: string,
    destination: { phone: string; email?: string },
    code: string,
    purpose: 'verification' | 'password reset',
    channel: OtpDeliveryChannel,
  ): Promise<void> {
    if (channel === OtpDeliveryChannel.EMAIL) return this.sendEmail(otpId, destination.email, code, purpose);
    return this.sendSms(otpId, destination.phone, code, purpose);
  }

  private async sendSms(otpId: string, phone: string, code: string, purpose: 'verification' | 'password reset'): Promise<void> {
    if (!this.config.getOrThrow<boolean>('sms.enabled')) {
      this.logger.warn({ event: 'auth.otp_sms_delivery_disabled', otpId });
      if (this.config.getOrThrow<string>('app.environment') === 'production') throw this.unavailable();
      return;
    }

    const accountSid = this.config.getOrThrow<string>('sms.twilioAccountSid');
    const authToken = this.config.getOrThrow<string>('sms.twilioAuthToken');
    const from = this.config.getOrThrow<string>('sms.twilioFrom');
    const body = `${this.config.getOrThrow<string>('app.name')}: your ${purpose} code is ${code}. It expires in ${this.config.getOrThrow<number>('jwt.otpExpirySeconds') / 60} minutes.`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: phone, From: from, Body: body }).toString(),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Twilio response ${response.status}`);
      this.logger.log({ event: 'auth.otp_sms_sent', otpId });
    } catch (error) {
      this.logger.error({ event: 'auth.otp_sms_delivery_failed', otpId, errorType: error instanceof Error ? error.name : 'UnknownSmsError' });
      throw this.unavailable();
    }
  }

  private async sendEmail(otpId: string, email: string | undefined, code: string, purpose: 'verification' | 'password reset'): Promise<void> {
    if (!email) throw this.unavailable('No email address is registered for this account');
    if (!this.config.getOrThrow<boolean>('email.enabled')) throw this.unavailable('Email OTP delivery is not configured');
    const transport = createTransport({
      host: this.config.getOrThrow<string>('email.smtpHost'), port: this.config.getOrThrow<number>('email.smtpPort'),
      secure: this.config.getOrThrow<boolean>('email.smtpSecure'), requireTLS: !this.config.getOrThrow<boolean>('email.smtpSecure'),
      auth: { user: this.config.getOrThrow<string>('email.smtpUser'), pass: this.config.getOrThrow<string>('email.smtpPassword') }, tls: { minVersion: 'TLSv1.2' },
    });
    try {
      await transport.sendMail({
        from: this.config.getOrThrow<string>('email.from'), to: email,
        subject: `${this.config.getOrThrow<string>('app.name')} ${purpose} code`,
        text: `Your ${purpose} code is ${code}. It expires in ${this.config.getOrThrow<number>('jwt.otpExpirySeconds') / 60} minutes.`,
      });
      this.logger.log({ event: 'auth.otp_email_sent', otpId });
    } catch (error) {
      this.logger.error({ event: 'auth.otp_email_delivery_failed', otpId, errorType: error instanceof Error ? error.name : 'UnknownSmtpError' });
      throw this.unavailable();
    }
  }

  private unavailable(message = 'OTP delivery is temporarily unavailable'): ServiceUnavailableException {
    return new ServiceUnavailableException({ code: ErrorCode.ServiceUnavailable, message, details: [] });
  }
}
