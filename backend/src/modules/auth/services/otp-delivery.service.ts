import { Injectable, Logger } from '@nestjs/common';

/**
 * Provider boundary for the SMS worker introduced in a later sprint. OTPs only
 * exist in memory here; raw codes are never logged or persisted.
 */
@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);

  queueRegistrationOtp(otpId: string, phone: string, code: string): Promise<void> {
    void phone;
    void code;
    this.logger.log({ event: 'auth.otp_delivery_queued', otpId });
    return Promise.resolve();
  }
}
