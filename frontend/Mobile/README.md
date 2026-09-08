# Chamber Management Flutter App

Clean Architecture Flutter client for the NestJS API.

## Run

```bash
flutter pub get
flutter run --dart-define=ENVIRONMENT=development --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

Use Android emulator host address `10.0.2.2`; use your LAN address for physical devices. Authentication tokens are stored only in `flutter_secure_storage`. Hive is reserved for non-secret, explicitly approved caches.

## Architecture

`presentation → application/provider → domain → data → core infrastructure`.

The auth feature is the reference implementation. New features must keep widgets free of raw JSON/Dio calls and expose domain contracts/use cases before repository implementations.
