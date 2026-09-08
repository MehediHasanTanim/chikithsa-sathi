import 'package:chamber_management/app/router/route_paths.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('uses version-independent app route paths', () {
    expect(RoutePaths.login, '/login');
    expect(RoutePaths.dashboard, '/dashboard');
  });
}
