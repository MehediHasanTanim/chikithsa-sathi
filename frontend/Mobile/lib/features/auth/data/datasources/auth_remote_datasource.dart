import 'package:chamber_management/core/network/api_client.dart';

class AuthRemoteDataSource {
  AuthRemoteDataSource(this._api);
  final ApiClient _api;
  Future<Map<String, dynamic>> login(String phone, String password) =>
      _api.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'phone': phone, 'password': password},
      );
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
}
