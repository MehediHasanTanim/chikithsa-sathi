import '../entities/session.dart';

abstract interface class AuthRepository {
  Future<Session> login({required String phone, required String password});
  Future<void> register({
    required String phone,
    required String password,
    required String fullName,
    String? email,
    String otpChannel = 'sms',
  });
  Future<void> verifyOtp({required String phone, required String otp});
  Future<void> logout();
}
