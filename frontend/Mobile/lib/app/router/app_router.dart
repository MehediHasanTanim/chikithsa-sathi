import 'package:chamber_management/app/router/route_paths.dart';
import 'package:chamber_management/features/auth/presentation/pages/splash_page.dart';
import 'package:chamber_management/features/auth/presentation/pages/login_page.dart';
import 'package:chamber_management/features/auth/presentation/pages/register_page.dart';
import 'package:chamber_management/features/auth/presentation/pages/otp_verification_page.dart';
import 'package:chamber_management/features/auth/presentation/pages/forgot_password_page.dart';
import 'package:chamber_management/features/auth/presentation/providers/auth_providers.dart';
import 'package:chamber_management/features/dashboard_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  const publicPaths = {
    RoutePaths.splash,
    RoutePaths.login,
    RoutePaths.register,
    RoutePaths.otp,
    RoutePaths.forgotPassword,
  };

  late final GoRouter router;
  router = GoRouter(
    initialLocation: RoutePaths.splash,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final path = state.matchedLocation;
      if (auth.status == AuthStatus.checking) {
        return path == RoutePaths.splash ? null : RoutePaths.splash;
      }
      if (auth.status == AuthStatus.authenticated &&
          publicPaths.contains(path)) {
        return RoutePaths.dashboard;
      }
      if (auth.status != AuthStatus.authenticated &&
          !publicPaths.contains(path)) {
        return RoutePaths.login;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: RoutePaths.splash,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: RoutePaths.login,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: RoutePaths.register,
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: RoutePaths.otp,
        builder: (context, state) => OtpVerificationPage(
          phone: state.uri.queryParameters['phone'],
          channel: state.uri.queryParameters['channel'] == 'email'
              ? 'email'
              : 'sms',
        ),
      ),
      GoRoute(
        path: RoutePaths.forgotPassword,
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: RoutePaths.dashboard,
        builder: (context, state) => const DashboardPage(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.uri.path}')),
    ),
  );
  ref.listen(authControllerProvider, (_, _) => router.refresh());
  ref.onDispose(router.dispose);
  return router;
});
