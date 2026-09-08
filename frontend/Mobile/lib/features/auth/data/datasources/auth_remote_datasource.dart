import 'package:chamber_management/core/network/api_client.dart';

class AuthRemoteDataSource {
  AuthRemoteDataSource(this._api);
  final ApiClient _api;
  Future<Map<String, dynamic>> login(
    String phone,
    String password, {
    String? deviceId,
    String? platform,
    String? appVersion,
  }) async {
    final data = <String, dynamic>{'phone': phone, 'password': password};
    final device = <String, dynamic>{};
    if (deviceId != null) {
      device['deviceId'] = deviceId;
    }
    if (platform != null) {
      device['platform'] = platform;
    }
    if (appVersion != null) {
      device['appVersion'] = appVersion;
    }
    if (device.isNotEmpty) {
      data['device'] = device;
    }
    return _api.post<Map<String, dynamic>>('/auth/login', data: data);
  }

  Future<void> register(Map<String, dynamic> data) async {
    await _api.post<dynamic>('/auth/register', data: data);
  }

  Future<void> verifyOtp(String phone, String otp) async {
    await _api.post<dynamic>(
      '/auth/verify-otp',
      data: {'phone': phone, 'otp': otp},
    );
  }

  Future<void> logout(String refreshToken) async {
    await _api.post<dynamic>(
      '/auth/logout',
      data: {'refreshToken': refreshToken},
    );
  }

  Future<Map<String, dynamic>> refresh(String refreshToken) =>
      _api.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
  Future<void> resendOtp(String phone, String channel) async =>
      _api.post<dynamic>(
        '/auth/resend-otp',
        data: {'phone': phone, 'otpChannel': channel},
      );
  Future<void> requestPasswordReset(String phone, String channel) async =>
      _api.post<dynamic>(
        '/auth/password-reset/request',
        data: {'phone': phone, 'otpChannel': channel},
      );
  Future<void> confirmPasswordReset(
    String phone,
    String otp,
    String password,
  ) async => _api.post<dynamic>(
    '/auth/password-reset/confirm',
    data: {'phone': phone, 'otp': otp, 'password': password},
  );
}
