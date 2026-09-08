import 'package:chamber_management/core/network/network_providers.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/datasources/auth_local_datasource.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/session.dart';
import '../../domain/repositories/auth_repository.dart';

final authRemoteDataSourceProvider = Provider(
  (ref) => AuthRemoteDataSource(ref.watch(apiClientProvider)),
);
final authLocalDataSourceProvider = Provider(
  (ref) => AuthLocalDataSource(ref.watch(tokenStorageProvider)),
);
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(
    ref.watch(authRemoteDataSourceProvider),
    ref.watch(authLocalDataSourceProvider),
  ),
);

enum AuthStatus { checking, authenticated, unauthenticated, error }

class AuthState {
  const AuthState({
    this.status = AuthStatus.checking,
    this.session,
    this.pendingPhone,
    this.errorMessage,
    this.isSubmitting = false,
  });

  final AuthStatus status;
  final Session? session;
  final String? pendingPhone;
  final String? errorMessage;
  final bool isSubmitting;

  AuthState copyWith({
    AuthStatus? status,
    Session? session,
    String? pendingPhone,
    String? errorMessage,
    bool? isSubmitting,
    bool clearError = false,
  }) => AuthState(
    status: status ?? this.status,
    session: session ?? this.session,
    pendingPhone: pendingPhone ?? this.pendingPhone,
    errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    isSubmitting: isSubmitting ?? this.isSubmitting,
  );
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  AuthRepository get _repository => ref.read(authRepositoryProvider);

  Future<void> restoreSession() async {
    state = state.copyWith(status: AuthStatus.checking, clearError: true);
    final session = await _repository.restoreSession();
    state = AuthState(
      status: session == null
          ? AuthStatus.unauthenticated
          : AuthStatus.authenticated,
      session: session,
    );
  }

  Future<bool> login({required String phone, required String password}) async {
    return _run(() async {
      final session = await _repository.login(phone: phone, password: password);
      state = AuthState(status: AuthStatus.authenticated, session: session);
    });
  }

  Future<bool> register({
    required String phone,
    required String password,
    required String fullName,
    required String preferredLanguage,
    String? email,
    required String otpChannel,
  }) => _run(() async {
    await _repository.register(
      phone: phone,
      password: password,
      fullName: fullName,
      preferredLanguage: preferredLanguage,
      email: email,
      otpChannel: otpChannel,
    );
    state = AuthState(status: AuthStatus.unauthenticated, pendingPhone: phone);
  });

  Future<bool> verifyRegistrationOtp({
    required String phone,
    required String otp,
  }) => _run(() async {
    await _repository.verifyOtp(phone: phone, otp: otp);
    state = const AuthState(status: AuthStatus.unauthenticated);
  });

  Future<bool> resendRegistrationOtp({
    required String phone,
    required String otpChannel,
  }) => _run(() => _repository.resendOtp(phone: phone, otpChannel: otpChannel));

  Future<bool> requestPasswordReset({
    required String phone,
    required String otpChannel,
  }) => _run(
    () =>
        _repository.requestPasswordReset(phone: phone, otpChannel: otpChannel),
  );

  Future<bool> confirmPasswordReset({
    required String phone,
    required String otp,
    required String password,
  }) => _run(
    () => _repository.confirmPasswordReset(
      phone: phone,
      otp: otp,
      password: password,
    ),
  );

  Future<void> logout() async {
    try {
      await _repository.logout();
    } finally {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> _run(Future<void> Function() action) async {
    state = state.copyWith(
      status: state.status == AuthStatus.error
          ? AuthStatus.unauthenticated
          : state.status,
      isSubmitting: true,
      clearError: true,
    );
    try {
      await action();
      return true;
    } catch (error) {
      state = state.copyWith(
        status: AuthStatus.error,
        isSubmitting: false,
        errorMessage: _messageFor(error),
      );
      return false;
    } finally {
      if (state.status != AuthStatus.error) {
        state = state.copyWith(isSubmitting: false);
      }
    }
  }

  String _messageFor(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is List) return message.join('\n');
        if (message is String && message.isNotEmpty) return message;
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।';
      }
    }
    return 'অনুরোধটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।';
  }
}
