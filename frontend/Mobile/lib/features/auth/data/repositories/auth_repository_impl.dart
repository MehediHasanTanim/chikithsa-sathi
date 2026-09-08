import '../../domain/entities/session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/auth_tokens_model.dart';
import '../models/login_response_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote, this._local);
  final AuthRemoteDataSource _remote;
  final AuthLocalDataSource _local;

  @override
  Future<Session> login({
    required String phone,
    required String password,
    String? deviceId,
    String platform = 'mobile',
    String? appVersion,
  }) async {
    final data = await _remote.login(
      phone,
      password,
      deviceId: deviceId,
      platform: platform,
      appVersion: appVersion,
    );
    final response = LoginResponseModel.fromJson(data);
    final session = Session(
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
      userId: response.user.id,
    );
    await _local.saveTokens(
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
    required String preferredLanguage,
    String? email,
    String otpChannel = 'sms',
  }) => _remote.register({
    'phone': phone,
    'password': password,
    'fullName': fullName,
    'preferredLanguage': preferredLanguage,
    if (email != null && email.isNotEmpty) 'email': email,
    'otpChannel': otpChannel,
  });

  @override
  Future<void> verifyOtp({required String phone, required String otp}) =>
      _remote.verifyOtp(phone, otp);

  @override
  Future<void> resendOtp({required String phone, required String otpChannel}) =>
      _remote.resendOtp(phone, otpChannel);

  @override
  Future<void> requestPasswordReset({
    required String phone,
    required String otpChannel,
  }) => _remote.requestPasswordReset(phone, otpChannel);

  @override
  Future<void> confirmPasswordReset({
    required String phone,
    required String otp,
    required String password,
  }) => _remote.confirmPasswordReset(phone, otp, password);

  @override
  Future<Session?> restoreSession() async {
    final refreshToken = await _local.refreshToken();
    if (refreshToken == null) return null;
    try {
      final data = await _remote.refresh(refreshToken);
      final tokens = AuthTokensModel.fromJson(data);
      await _local.saveTokens(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      );
      return Session(
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      );
    } catch (_) {
      await _local.clear();
      return null;
    }
  }

  @override
  Future<void> logout() async {
    final refresh = await _local.refreshToken();
    if (refresh != null) await _remote.logout(refresh);
    await _local.clear();
  }
}
