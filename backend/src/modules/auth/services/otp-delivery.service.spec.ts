import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { OtpDeliveryService } from './otp-delivery.service';
import { OtpDeliveryChannel } from '@prisma/client';

describe('OtpDeliveryService', () => {
  const values: Record<string, string | number | boolean> = {
    'sms.enabled': true, 'sms.twilioAccountSid': 'AC123', 'sms.twilioAuthToken': 'secret', 'sms.twilioFrom': '+15005550006', 'app.name': 'Chamber API', 'app.environment': 'test', 'jwt.otpExpirySeconds': 600,
  };
  const config = { getOrThrow: jest.fn((key: string) => values[key]) };
  beforeEach(() => { jest.resetAllMocks(); config.getOrThrow.mockImplementation((key: string) => values[key]); });

  it('sends an OTP through the configured mobile provider without logging its value', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 201 }));
    await new OtpDeliveryService(config as never).sendOtp('otp-1', { phone: '+8801712345678' }, '012345', 'verification', OtpDeliveryChannel.SMS);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/AC123/Messages.json'), expect.objectContaining({ method: 'POST' }));
    fetchMock.mockRestore();
  });

  it('returns a safe unavailable error when SMS delivery fails', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('provider failure'));
    const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    await expect(new OtpDeliveryService(config as never).sendOtp('otp-1', { phone: '+8801712345678' }, '012345', 'verification', OtpDeliveryChannel.SMS)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(errorLog).toHaveBeenCalledWith(expect.objectContaining({ event: 'auth.otp_sms_delivery_failed', otpId: 'otp-1' }));
    errorLog.mockRestore(); fetchMock.mockRestore();
  });
});
