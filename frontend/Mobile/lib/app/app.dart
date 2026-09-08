import 'package:chamber_management/app/router/app_router.dart';
import 'package:chamber_management/app/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChamberManagementApp extends ConsumerWidget {
  const ChamberManagementApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp.router(
    title: 'Chamber Management',
    debugShowCheckedModeBanner: false,
    theme: AppTheme.light(),
    routerConfig: ref.watch(appRouterProvider),
    supportedLocales: const [Locale('bn'), Locale('en')],
  );
}
