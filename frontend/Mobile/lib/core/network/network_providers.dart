import 'package:chamber_management/app/config/app_config.dart';
import 'package:chamber_management/core/network/api_client.dart';
import 'package:chamber_management/core/security/token_storage.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final appConfigProvider = Provider<AppConfig>(
  (_) => AppConfig.fromDartDefines(),
);
final tokenStorageProvider = Provider<TokenStorage>(
  (_) => TokenStorage(const FlutterSecureStorage()),
);
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ref.watch(appConfigProvider).apiBaseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
    ),
  );
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await ref.read(tokenStorageProvider).accessToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        options.headers['X-Request-ID'] = DateTime.now().microsecondsSinceEpoch
            .toString();
        handler.next(options);
      },
    ),
  );
  return dio;
});
final apiClientProvider = Provider<ApiClient>(
  (ref) => DioApiClient(ref.watch(dioProvider)),
);
