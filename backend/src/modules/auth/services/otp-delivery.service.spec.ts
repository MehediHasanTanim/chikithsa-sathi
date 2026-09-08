import { Logger, ServiceUnavailableException } from '@nestjs/common';

import { createOtpEmailTransport, OtpDeliveryService } from './otp-delivery.service';

describe('OtpDeliveryService', () => {
  const configValues: Record<string, string | number | boolean | undefined> = {
    'email.enabled': true,
    'email.from': 'no-reply@example.test',
    'email.smtpHost': 'smtp.example.test',
    'email.smtpPort': 587,
    'email.smtpUser': 'smtp-user',
    'email.smtpPassword': 'smtp-password',
    'email.smtpSecure': false,
    'app.name': 'Chamber Management API',
    'jwt.otpExpirySeconds': 600,
  };
  const config = {
    getOrThrow: jest.fn((key: string) => configValues[key]),
  };
  const transport = {
    verify: jest.fn(),
    sendMail: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    config.getOrThrow.mockImplementation((key: string) => configValues[key]);
  });

  it('validates the configured SMTP connection during startup', async () => {
    transport.verify.mockResolvedValue(true);
    const service = new OtpDeliveryService(config as never, transport as never);

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(transport.verify).toHaveBeenCalledTimes(1);
  });

  it('sends a plain-text OTP email without logging recipient or code', async () => {
    transport.sendMail.mockResolvedValue({ messageId: 'message-1' });
    const service = new OtpDeliveryService(config as never, transport as never);

    await service.sendRegistrationOtp('otp-1', 'doctor@example.test', '012345');

    expect(transport.sendMail).toHaveBeenCalledWith({
      from: 'no-reply@example.test',
      to: 'doctor@example.test',
      subject: 'Chamber Management API verification code',
      text: 'Your verification code is 012345.\n\nIt expires in 10 minutes.\nIf you did not request this, you can safely ignore this email.',
    });
  });

  it('returns a safe service-unavailable error when SMTP delivery fails', async () => {
    transport.sendMail.mockRejectedValue(new Error('relay rejected request'));
    const service = new OtpDeliveryService(config as never, transport as never);
    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(
      service.sendRegistrationOtp('otp-1', 'doctor@example.test', '012345'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(errorLog).toHaveBeenCalledWith({
      event: 'auth.otp_email_delivery_failed',
      otpId: 'otp-1',
      errorType: 'Error',
    });
    errorLog.mockRestore();
  });

  it('does not create a transport while email delivery is disabled', () => {
    config.getOrThrow.mockImplementation((key: string) =>
      key === 'email.enabled' ? false : configValues[key],
    );

    expect(createOtpEmailTransport(config as never)).toBeNull();
  });
});
