import 'package:chamber_management/app/router/route_paths.dart';
import 'package:chamber_management/features/auth/presentation/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(
      () => ref.read(authControllerProvider.notifier).restoreSession(),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authControllerProvider, (_, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go(RoutePaths.dashboard);
      } else if (next.status == AuthStatus.unauthenticated ||
          next.status == AuthStatus.error) {
        context.go(RoutePaths.login);
      }
    });

    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.local_hospital_outlined,
              size: 64,
              color: Color(0xFF009688),
            ),
            SizedBox(height: 16),
            Text('চেম্বার ম্যানেজমেন্ট'),
            SizedBox(height: 24),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
