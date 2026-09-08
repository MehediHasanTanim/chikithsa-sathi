import '../entities/session.dart';

abstract interface class AuthRepository {
  Future<Session> login({
    required String phone,
    required String password,
    String? deviceId,
    String platform = 'mobile',
    String? appVersion,
  });
  Future<void> register({
    required String phone,
    required String password,
    required String fullName,
    required String preferredLanguage,
    String? email,
    String otpChannel = 'sms',
  });
  Future<void> verifyOtp({required String phone, required String otp});
  Future<void> resendOtp({required String phone, required String otpChannel});
  Future<void> requestPasswordReset({
    required String phone,
    required String otpChannel,
  });
  Future<void> confirmPasswordReset({
    required String phone,
    required String otp,
    required String password,
  });
  Future<Session?> restoreSession();
  Future<void> logout();
}
