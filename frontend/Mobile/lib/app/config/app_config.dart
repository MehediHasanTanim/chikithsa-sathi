import 'environment.dart';

class AppConfig {
  const AppConfig({required this.environment, required this.apiBaseUrl});
  final Environment environment;
  final String apiBaseUrl;
  factory AppConfig.fromDartDefines() {
    const environment = String.fromEnvironment(
      'ENVIRONMENT',
      defaultValue: 'development',
    );
    const apiBaseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://10.0.2.2:3000/api/v1',
    );
    return AppConfig(
      environment: Environment.values.byName(environment),
      apiBaseUrl: apiBaseUrl,
    );
  }
}
