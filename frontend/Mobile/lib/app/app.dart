import 'package:chamber_management/app/router/app_router.dart';
import 'package:chamber_management/app/theme/app_theme.dart';
import 'package:flutter/material.dart';

class ChamberManagementApp extends StatelessWidget {
  const ChamberManagementApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp.router(
    title: 'Chamber Management',
    debugShowCheckedModeBanner: false,
    theme: AppTheme.light(),
    routerConfig: appRouter,
    supportedLocales: const [Locale('bn'), Locale('en')],
  );
}
