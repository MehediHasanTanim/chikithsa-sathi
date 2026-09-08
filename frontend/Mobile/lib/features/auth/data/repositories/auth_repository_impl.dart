import 'package:chamber_management/core/security/token_storage.dart';

import '../../domain/entities/session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote, this._tokens);
  final AuthRemoteDataSource _remote;
  final TokenStorage _tokens;
  @override
  Future<Session> login({
    required String phone,
    required String password,
  }) async {
    final data = await _remote.login(phone, password);
    final session = Session(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
      userId: (data['user'] as Map<String, dynamic>)['id'] as String,
    );
    await _tokens.save(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    return session;
  }

  @override
  Future<void> register({
    required String phone,
    required String password,
    required String fullName,
    String? email,
    String otpChannel = 'sms',
  }) => _remote.register({
    'phone': phone,
    'password': password,
    'fullName': fullName,
    ...?(email == null ? null : {'email': email}),
    'otpChannel': otpChannel,
  });
  @override
  Future<void> verifyOtp({required String phone, required String otp}) =>
      _remote.verifyOtp(phone, otp);
  @override
  Future<void> logout() async {
    final refresh = await _tokens.refreshToken();
    if (refresh != null) await _remote.logout(refresh);
    await _tokens.clear();
  }
}
