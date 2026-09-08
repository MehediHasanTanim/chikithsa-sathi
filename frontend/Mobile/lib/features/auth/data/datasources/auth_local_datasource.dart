import 'package:chamber_management/core/security/token_storage.dart';

import '../models/auth_tokens_model.dart';

class AuthLocalDataSource {
  AuthLocalDataSource(this._storage);
  final TokenStorage _storage;
  Future<void> save(AuthTokensModel tokens) => _storage.save(
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  );

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) => save(
    AuthTokensModel(accessToken: accessToken, refreshToken: refreshToken),
  );

  Future<String?> refreshToken() => _storage.refreshToken();
  Future<AuthTokensModel?> read() async {
    final access = await _storage.accessToken();
    final refresh = await _storage.refreshToken();
    return access == null || refresh == null
        ? null
        : AuthTokensModel(accessToken: access, refreshToken: refresh);
  }

  Future<void> clear() => _storage.clear();
}
