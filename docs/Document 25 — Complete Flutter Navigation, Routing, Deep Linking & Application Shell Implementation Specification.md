# Document 25 — Complete Flutter Navigation, Routing, Deep Linking & Application Shell Implementation Specification

**Project:** Chamber Management  
**Platform:** Flutter  
**Architecture:** Clean Architecture + Feature-First  
**State Management:** Riverpod  
**Routing:** GoRouter  
**Networking:** Dio  
**Local Storage:** Hive + flutter_secure_storage  
**Target:** Doctor, Assistant Doctor, Chamber Staff, Chamber Manager, Billing Staff  
**Document Type:** Implementation Specification  
**Status:** Implementation Ready

---

# 1. Purpose

This document defines the complete Flutter navigation, routing, deep-linking, application-shell, route-guard, navigation-state, and cross-feature navigation architecture for the Chamber Management application.

The objective is to provide a predictable and secure navigation system that supports:

- Authentication
- Doctor onboarding
- Multiple chambers
- Role-based navigation
- Patient management
- Appointments
- Queue
- Consultation
- Prescription
- Payments
- AI features
- Reports
- Notifications
- Settings
- Deep links
- External links
- Push-notification navigation
- Session expiration
- Account switching
- Chamber switching
- Offline behavior
- Tablet and desktop layouts
- Future web support

The navigation architecture must ensure that users never access screens or resources they are not authorized to access.

---

# 2. Navigation Architecture Principles

The navigation architecture follows these principles:

1. **GoRouter is the single routing authority.**
2. **Riverpod owns navigation-related application state, not route definitions.**
3. **Authentication is enforced centrally.**
4. **Authorization is enforced by the backend and reinforced in the UI.**
5. **Every chamber-scoped route must operate within the active chamber context.**
6. **Deep links must be authorization-aware.**
7. **Sensitive clinical screens must not be exposed through unauthorized deep links.**
8. **Navigation must survive normal app lifecycle events.**
9. **Session expiration must redirect safely to login.**
10. **Account switching must clear the previous user's navigation context.**
11. **Chamber switching must invalidate chamber-scoped navigation state.**
12. **Navigation should preserve user context wherever safe.**
13. **Browser back/forward behavior must be predictable when web support is enabled.**
14. **Critical clinical workflows should avoid accidental navigation loss.**
15. **Navigation must work consistently on mobile, tablet, and desktop.**

---

# 3. Technology Stack

| Area | Technology |
|---|---|
| UI | Flutter |
| Navigation | GoRouter |
| State | Riverpod |
| Architecture | Clean Architecture |
| HTTP | Dio |
| Serialization | Freezed + json_serializable |
| Secure Storage | flutter_secure_storage |
| Local Storage | Hive |
| Localization | Flutter intl / localization |
| Deep Links | GoRouter + platform configuration |
| Push Navigation | Notification payload → Navigation Coordinator |
| Analytics | Application navigation observer |
| Testing | flutter_test + integration_test |

---

# 4. Application Navigation Model

The application is divided into five navigation zones.

```text
Application
│
├── Public
│   ├── Splash
│   ├── Login
│   ├── Registration
│   ├── OTP
│   ├── Forgot Password
│   └── Password Reset
│
├── Onboarding
│   ├── Profile
│   ├── Professional Information
│   ├── Verification
│   ├── Chamber
│   ├── Schedule
│   ├── Staff
│   ├── AI Setup
│   └── Completion
│
└── Authenticated Application
    │
    ├── Main Shell
    │   ├── Dashboard
    │   ├── Patients
    │   ├── Appointments
    │   ├── Queue
    │   ├── Reports
    │   └── More
    │
    └── Feature Detail Routes
        ├── Patient
        ├── Consultation
        ├── Prescription
        ├── Payment
        ├── AI
        ├── Notifications
        └── Settings
```

---

# 5. Root Application Shell

The application shell is responsible for the authenticated portion of the application.

It provides:

- Global navigation
- Active chamber context
- User identity
- Notification access
- Global search
- Responsive navigation
- Navigation rail/sidebar
- Bottom navigation on mobile
- Desktop navigation
- Global error handling
- Connectivity indicators
- Session state
- Application-wide overlays

---

# 6. Application Shell Structure

Recommended structure:

```text
lib/
└── app/
    ├── app.dart
    ├── router/
    │   ├── app_router.dart
    │   ├── route_names.dart
    │   ├── route_paths.dart
    │   ├── route_guards.dart
    │   ├── redirect_handler.dart
    │   ├── navigation_service.dart
    │   ├── navigation_coordinator.dart
    │   ├── deep_link_handler.dart
    │   └── route_metadata.dart
    │
    ├── shell/
    │   ├── app_shell.dart
    │   ├── mobile_shell.dart
    │   ├── tablet_shell.dart
    │   ├── desktop_shell.dart
    │   ├── shell_navigation.dart
    │   ├── shell_header.dart
    │   ├── shell_sidebar.dart
    │   ├── shell_bottom_navigation.dart
    │   ├── chamber_selector.dart
    │   ├── global_search_button.dart
    │   ├── notification_button.dart
    │   └── connectivity_banner.dart
    │
    └── bootstrap/
        ├── app_bootstrap.dart
        ├── bootstrap_state.dart
        └── bootstrap_provider.dart
```

---

# 7. Route Naming Convention

All route names must be constants.

Example:

```dart
abstract final class RouteNames {
  static const splash = 'splash';

  static const login = 'login';
  static const register = 'register';
  static const verifyOtp = 'verifyOtp';

  static const dashboard = 'dashboard';
  static const patients = 'patients';
  static const patientDetails = 'patientDetails';

  static const appointments = 'appointments';
  static const queue = 'queue';

  static const consultation = 'consultation';

  static const prescription = 'prescription';
  static const prescriptionReview = 'prescriptionReview';

  static const payments = 'payments';

  static const reports = 'reports';

  static const notifications = 'notifications';

  static const settings = 'settings';
}
```

Do not scatter string literals throughout the application.

---

# 8. Route Path Convention

Paths must also be centralized.

```dart
abstract final class RoutePaths {
  static const splash = '/';

  static const login = '/auth/login';
  static const register = '/auth/register';
  static const verifyOtp = '/auth/verify-otp';

  static const dashboard = '/app/dashboard';
  static const patients = '/app/patients';
  static const appointments = '/app/appointments';
  static const queue = '/app/queue';

  static const reports = '/app/reports';
  static const notifications = '/app/notifications';
  static const settings = '/app/settings';
}
```

Parameterized paths should be generated through helper methods.

```dart
static String patient(String patientId) =>
    '/app/patients/$patientId';

static String consultation(String encounterId) =>
    '/app/consultations/$encounterId';

static String prescription(String prescriptionId) =>
    '/app/prescriptions/$prescriptionId';
```

---

# 9. Complete Route Hierarchy

Recommended route tree:

```text
/
│
├── /auth
│   ├── /login
│   ├── /register
│   ├── /verify-otp
│   ├── /forgot-password
│   └── /reset-password
│
├── /onboarding
│   ├── /profile
│   ├── /professional
│   ├── /verification
│   ├── /chamber
│   ├── /schedule
│   ├── /staff
│   ├── /ai
│   └── /complete
│
└── /app
    │
    ├── /dashboard
    ├── /patients
    │   ├── /new
    │   └── /:patientId
    │       ├── /timeline
    │       ├── /allergies
    │       └── /conditions
    │
    ├── /appointments
    │   ├── /new
    │   └── /:appointmentId
    │
    ├── /queue
    │
    ├── /consultations
    │   └── /:encounterId
    │
    ├── /prescriptions
    │   └── /:prescriptionId
    │
    ├── /payments
    │   └── /:paymentId
    │
    ├── /reports
    │
    ├── /ai
    │   ├── /patient-summary/:encounterId
    │   ├── /clinical-chat
    │   ├── /prescription-draft/:encounterId
    │   ├── /report-analysis/:reportId
    │   └── /requests/:requestId
    │
    ├── /notifications
    │
    └── /settings
        ├── /profile
        ├── /professional
        ├── /chambers
        ├── /schedule
        ├── /staff
        ├── /permissions
        └── /preferences
```

---

# 10. Public Routes

Public routes are available without authentication.

```text
/
├── /auth/login
├── /auth/register
├── /auth/verify-otp
├── /auth/forgot-password
└── /auth/reset-password
```

These routes must never expose protected application data.

---

# 11. Splash Route

Route:

```text
/
```

Responsibilities:

- Initialize application
- Restore secure session
- Load user profile
- Load permissions
- Restore selected chamber
- Load local preferences
- Determine onboarding status
- Determine initial route

Possible outcomes:

```text
Splash
│
├── Authenticated + onboarding complete
│   └── Dashboard
│
├── Authenticated + onboarding incomplete
│   └── Onboarding
│
├── Unauthenticated
│   └── Login
│
└── Bootstrap failure
    └── Recovery/Error screen
```

Splash should not contain business logic directly.

Use:

```text
SplashScreen
    ↓
BootstrapController
    ↓
AuthRepository
UserRepository
ChamberRepository
PreferencesRepository
    ↓
BootstrapState
```

---

# 12. Bootstrap State

Recommended state:

```dart
enum BootstrapStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  onboardingRequired,
  failed,
}
```

Example:

```dart
@freezed
class BootstrapState with _$BootstrapState {
  const factory BootstrapState({
    @Default(BootstrapStatus.initial)
    BootstrapStatus status,
    String? initialRoute,
    String? errorMessage,
  }) = _BootstrapState;
}
```

---

# 13. Authentication Guard

All protected routes must require authentication.

Conceptually:

```text
Route request
    ↓
Authentication Guard
    ↓
Authenticated?
 ┌──┴──┐
Yes    No
 │      │
 ↓      ↓
Route  Login
```

The guard must read the authoritative session state.

Do not determine authentication by checking only whether a token exists in storage.

---

# 14. Onboarding Guard

Authenticated users who have not completed required onboarding should not access the main application.

```text
Authenticated
      ↓
Onboarding complete?
   ┌──┴──┐
  Yes    No
   │      │
   ↓      ↓
  App  Onboarding
```

Required onboarding state may include:

- Basic profile
- Professional profile
- Verification submission
- Chamber creation
- Schedule
- Initial configuration

---

# 15. Authorization Guard

Authentication and authorization are separate.

```text
Authentication
    ↓
"Who are you?"

Authorization
    ↓
"What are you allowed to do?"
```

The UI may hide unauthorized navigation options.

However:

> Backend authorization remains the final authority.

A user must never gain access simply by manually entering a route.

---

# 16. Permission-Aware Routes

Route metadata should define required permissions.

Example:

```dart
class RouteMetadata {
  final String name;
  final Set<String> permissions;
  final bool requiresAuth;
  final bool requiresOnboarding;

  const RouteMetadata({
    required this.name,
    this.permissions = const {},
    this.requiresAuth = true,
    this.requiresOnboarding = true,
  });
}
```

Example:

```text
Queue
permission:
queue.view

Queue mutation:
queue.manage

Prescription:
prescription.view

Prescription finalization:
prescription.finalize

Payments:
payment.view
payment.create
```

---

# 17. Route Guard Order

Guards should be evaluated in this order:

```text
1. Bootstrap
      ↓
2. Authentication
      ↓
3. Session validity
      ↓
4. Onboarding
      ↓
5. Active chamber
      ↓
6. Permission
      ↓
7. Resource access
      ↓
8. Route
```

Resource authorization may still require backend validation.

---

# 18. Resource-Level Authorization

A route such as:

```text
/app/patients/abc123
```

does not automatically mean the user may access patient `abc123`.

The backend must verify:

```text
User
 ↓
Membership
 ↓
Chamber
 ↓
Patient access
```

The Flutter application should handle:

```text
403 Forbidden
      ↓
Unauthorized screen/message
      ↓
Do not expose cached protected content
```

---

# 19. Chamber Context

Chamber is a first-class navigation context.

Authenticated application state should maintain:

```text
Current User
    ↓
Selected Chamber
    ↓
Current Feature
    ↓
Current Resource
```

Example:

```text
Dr. Rahman
   ↓
Dhanmondi Chamber
   ↓
Patient
   ↓
Consultation
```

---

# 20. Chamber Switching

When switching chambers:

```text
User selects Chamber B
        ↓
Persist chamber B
        ↓
Update selectedChamberProvider
        ↓
Invalidate chamber-scoped providers
        ↓
Clear chamber-sensitive navigation state
        ↓
Refresh dashboard
        ↓
Refresh queue
        ↓
Refresh appointments
        ↓
Refresh staff
        ↓
Navigate to dashboard
```

The application must not remain inside Chamber A's queue while Chamber B becomes active.

---

# 21. Chamber Switch Safety Rule

Never allow:

```text
Chamber A consultation
        ↓
Switch chamber
        ↓
Continue Chamber A mutation
```

If there is an active consultation:

```text
Show confirmation

"You have an unsaved consultation.
Switch chamber and discard/keep draft?"
```

The exact behavior depends on offline/draft support.

---

# 22. Main Application Shell

Authenticated routes should be hosted inside:

```text
ShellRoute
    ↓
AppShell
    ↓
Feature Screen
```

Conceptual structure:

```text
┌───────────────────────────────────────┐
│ Header                                │
│ Chamber | Search | Notifications | Me│
├──────────┬────────────────────────────┤
│          │                            │
│ Sidebar  │       Active Screen        │
│          │                            │
│          │                            │
└──────────┴────────────────────────────┘
```

Mobile:

```text
┌─────────────────────────┐
│ Header                  │
├─────────────────────────┤
│                         │
│ Active Screen           │
│                         │
├─────────────────────────┤
│ Dashboard Patients Queue│
│ Appointments More       │
└─────────────────────────┘
```

---

# 23. Responsive Shell

Breakpoints:

```text
< 768
    Mobile Shell

768–1023
    Tablet Shell

>= 1024
    Desktop Shell
```

Desktop:

```text
NavigationRail / Sidebar
```

Tablet:

```text
Compact NavigationRail
```

Mobile:

```text
BottomNavigationBar / NavigationBar
```

The route hierarchy remains the same.

Only presentation of the shell changes.

---

# 24. Primary Navigation

Recommended primary navigation:

### Doctor

```text
Dashboard
Patients
Appointments
Queue
Reports
More
```

### Receptionist

```text
Dashboard
Appointments
Queue
Patients
Payments
More
```

### Assistant Doctor

```text
Dashboard
Queue
Patients
Consultations
More
```

### Billing Staff

```text
Dashboard
Payments
Appointments
Reports
More
```

The navigation model must be permission-aware.

---

# 25. Shell Navigation Provider

Use Riverpod for shell state.

Example:

```dart
final shellNavigationProvider =
    NotifierProvider<ShellNavigationController, ShellNavigationState>(
  ShellNavigationController.new,
);
```

State:

```dart
@freezed
class ShellNavigationState with _$ShellNavigationState {
  const factory ShellNavigationState({
    @Default(0) int selectedIndex,
  }) = _ShellNavigationState;
}
```

Do not use a global mutable integer outside Riverpod.

---

# 26. Bottom Navigation Rules

Bottom navigation should represent top-level destinations.

Example:

```text
Dashboard | Patients | Appointments | Queue | More
```

Do not place:

- Consultation
- Prescription
- Payment
- AI Chat

as permanent bottom tabs.

These are contextual workflows.

---

# 27. Nested Navigation

Top-level destinations may have nested navigation.

Example:

```text
Patients
   ↓
Patient Details
   ↓
Timeline
   ↓
Encounter
```

The user should be able to return naturally:

```text
Encounter
 ← Patient Timeline
 ← Patient Details
 ← Patients
```

---

# 28. Consultation Navigation

Consultation is a special workflow.

Recommended route:

```text
/app/consultations/:encounterId
```

Within consultation:

```text
Consultation
├── Overview
├── Vitals
├── Notes
├── Diagnosis
├── Investigation
├── Reports
├── Prescription
├── AI
└── Follow-up
```

These should preferably be implemented as sections/tabs inside the consultation workspace rather than separate top-level navigation destinations.

---

# 29. Consultation Navigation Safety

The user should receive a warning when leaving an active consultation with unsaved changes.

Example:

```text
Leave consultation?

You have unsaved clinical information.

[Stay] [Save & Leave]
```

If autosave is active:

```text
Saving...
```

must be resolved before navigation where practical.

---

# 30. Prescription Navigation

Prescription workflow:

```text
Consultation
    ↓
Prescription Builder
    ↓
Medicine Search
    ↓
Medicine Editor
    ↓
Review
    ↓
Finalize
    ↓
Preview
    ↓
Deliver
```

Route examples:

```text
/app/consultations/:encounterId/prescription
/app/prescriptions/:prescriptionId/review
/app/prescriptions/:prescriptionId/preview
```

---

# 31. Prescription Finalization Navigation Rule

Finalization is a critical mutation.

Never:

```text
Tap Finalize
↓
Navigate immediately
```

Instead:

```text
Tap Finalize
    ↓
Validate
    ↓
Confirm
    ↓
API request
    ↓
Server success
    ↓
Update Riverpod state
    ↓
Navigate
```

If API fails:

```text
Remain on Review screen
```

---

# 32. Payment Navigation

Payment route:

```text
/app/payments/:paymentId
```

Payment should usually be reached from:

```text
Consultation
Appointment
Patient
Dashboard
```

Payment completion must be server-confirmed before showing a successful receipt state.

---

# 33. AI Navigation

AI is contextual.

Recommended routes:

```text
/app/ai/patient-summary/:encounterId
/app/ai/clinical-chat
/app/ai/prescription-draft/:encounterId
/app/ai/report-analysis/:reportId
/app/ai/requests/:requestId
```

AI navigation must preserve patient and encounter context.

---

# 34. AI Deep Navigation Safety

An AI route must never allow unauthorized patient context.

For example:

```text
/ai/patient-summary/encounter123
```

must verify:

```text
Current user
    ↓
Chamber
    ↓
Encounter
    ↓
Patient
```

The frontend must not trust an encounter ID supplied in a deep link.

---

# 35. Patient Navigation

Patient route:

```text
/app/patients/:patientId
```

Nested sections:

```text
Patient
├── Overview
├── Timeline
├── Allergies
├── Conditions
├── Vitals
├── Investigations
└── Prescriptions
```

Use tabs or internal sections where appropriate.

---

# 36. Appointment Navigation

Routes:

```text
/app/appointments
/app/appointments/new
/app/appointments/:appointmentId
```

Supported navigation:

```text
Calendar
 ↓
Appointment Details
 ↓
Patient
 ↓
Check-in
 ↓
Queue
 ↓
Consultation
```

---

# 37. Queue Navigation

Main route:

```text
/app/queue
```

Queue entries should support contextual navigation:

```text
Queue Entry
    ↓
Patient
    ↓
Consultation
```

Critical queue mutations remain server-confirmed.

---

# 38. Notification Navigation

Notifications should contain a destination type.

Example payload:

```json
{
  "type": "appointment",
  "resourceId": "appointment-123"
}
```

Other examples:

```text
patient
appointment
queue
consultation
prescription
payment
report
ai_request
system
```

The navigation coordinator maps these to routes.

---

# 39. Notification Navigation Architecture

```text
Push Notification
      ↓
NotificationService
      ↓
NotificationPayloadParser
      ↓
NavigationCoordinator
      ↓
Authentication Check
      ↓
Permission Check
      ↓
Resource Validation
      ↓
GoRouter
```

Never navigate directly from the Firebase notification callback.

---

# 40. Deep Linking

Deep linking allows external URLs to open specific screens.

Examples:

```text
chamber://app/patients/123
chamber://app/appointments/456
chamber://app/consultations/789
```

Universal/App Links may later use:

```text
https://app.example.com/app/patients/123
```

The actual production domain must be configured separately.

---

# 41. Deep Link Processing

Deep link flow:

```text
Incoming URL
    ↓
Parse URI
    ↓
Identify route
    ↓
Check authentication
    ↓
Check onboarding
    ↓
Resolve chamber
    ↓
Check permissions
    ↓
Validate resource
    ↓
Navigate
```

---

# 42. Deep Link While Logged Out

Example:

```text
User opens:

/app/patients/123
```

while logged out.

Expected:

```text
Deep Link
   ↓
Login
   ↓
Successful authentication
   ↓
Restore pending deep link
   ↓
Patient Details
```

The pending deep link must not contain or expose sensitive data in logs.

---

# 43. Pending Deep Link

Create a dedicated model:

```dart
@freezed
class PendingDeepLink with _$PendingDeepLink {
  const factory PendingDeepLink({
    required String location,
    DateTime? createdAt,
  }) = _PendingDeepLink;
}
```

Store only what is necessary.

After successful authentication:

```text
consumePendingDeepLink()
```

must remove it.

---

# 44. Deep Link Expiration

Pending deep links should have a short lifetime.

Example:

```text
Maximum pending duration:
15 minutes
```

After expiration:

```text
Navigate to Dashboard
```

Do not retain sensitive routes indefinitely.

---

# 45. Deep Link With Invalid Resource

Example:

```text
/app/patients/does-not-exist
```

Expected:

```text
404 / Not Found state
```

Do not show stale cached information from another patient.

---

# 46. Deep Link With Forbidden Resource

If backend returns:

```text
403 Forbidden
```

show:

```text
You don't have permission to access this information.
```

Then navigate back to an authorized parent route.

---

# 47. Deep Link With Wrong Chamber

Suppose a link references a patient belonging to Chamber A while Chamber B is active.

The application should:

```text
Resolve resource
    ↓
Determine chamber
    ↓
If user has access
    ↓
Switch chamber after confirmation if necessary
    ↓
Open resource
```

Never silently mix Chamber A data into Chamber B context.

---

# 48. Navigation Coordinator

A centralized navigation coordinator should handle external navigation requests.

```dart
class NavigationCoordinator {
  final GoRouter router;

  NavigationCoordinator(this.router);

  Future<void> openNotification(
    NotificationNavigationTarget target,
  ) async {
    // Resolve auth/chamber/permission/resource.
  }
}
```

It should support:

```text
openDeepLink()
openNotification()
openExternalIntent()
openPatient()
openAppointment()
openConsultation()
openPrescription()
openPayment()
```

---

# 49. Navigation Service

A lightweight navigation abstraction can reduce direct GoRouter usage.

```dart
abstract interface class NavigationService {
  void go(String location);

  Future<T?> push<T>(String location);

  void pop<T>([T? result]);

  bool canPop();

  void replace(String location);
}
```

Implementation:

```text
NavigationService
      ↓
GoRouter
```

UI should generally use the abstraction or named route helpers rather than manually constructing URLs.

---

# 50. Route Builders

Use strongly typed helper methods.

Example:

```dart
class AppRoutes {
  static String patient(String id) =>
      '/app/patients/$id';

  static String consultation(String id) =>
      '/app/consultations/$id';

  static String prescription(String id) =>
      '/app/prescriptions/$id';
}
```

This prevents inconsistent URL construction.

---

# 51. Route Parameters

Route parameters:

```text
patientId
appointmentId
encounterId
prescriptionId
paymentId
reportId
requestId
```

Query parameters:

```text
search
date
status
tab
```

Example:

```text
/app/patients/123?tab=timeline
```

Query parameters should represent UI state, not authorization.

---

# 52. Navigation State vs Business State

Do not put business state into routes unnecessarily.

Bad:

```text
/patient/123?bloodPressure=120/80&weight=75
```

Good:

```text
/patients/123
```

Clinical data belongs in domain/application state.

---

# 53. Route Restoration

The app should restore safe navigation context after normal lifecycle events.

Examples:

```text
App backgrounded
      ↓
Resume
      ↓
Restore current route if session valid
```

However, if:

```text
Session expired
```

then:

```text
Login
```

must take precedence.

---

# 54. Sensitive Screen Restoration

Sensitive screens should be handled carefully.

For example:

```text
Consultation
Prescription
Patient Details
AI Chat
```

should not automatically restore stale sensitive state if:

- User logged out
- Account changed
- Session expired
- Chamber changed
- Permission changed

---

# 55. Session Expiration Navigation

When the API returns an unrecoverable authentication failure:

```text
API
 ↓
Auth Interceptor
 ↓
Refresh attempt
 ↓
Refresh failed
 ↓
SessionController.logout()
 ↓
Clear sensitive local state
 ↓
Navigate to Login
```

Avoid:

```text
Multiple simultaneous redirects
```

A centralized auth state must control the transition.

---

# 56. Login Redirect Loop Prevention

Never allow:

```text
Protected Route
 ↓
Login
 ↓
Protected Route
 ↓
Login
```

Use:

```text
Auth State
+
Onboarding State
+
Pending Destination
```

to determine the correct route exactly once.

---

# 57. Logout Navigation

Logout must:

1. Cancel/stop active protected operations where appropriate.
2. Clear access token.
3. Clear refresh token.
4. Clear selected chamber.
5. Clear chamber-scoped cache.
6. Clear patient-sensitive cache.
7. Clear AI context/cache.
8. Clear pending deep links.
9. Reset Riverpod session state.
10. Navigate to login.

Expected result:

```text
Logout
 ↓
Login
```

with no ability to navigate backward into protected screens.

---

# 58. Account Switching

Account switching:

```text
Current Account
      ↓
Confirm switch
      ↓
Clear account-scoped state
      ↓
Clear chamber context
      ↓
Clear sensitive caches
      ↓
Authenticate new account
      ↓
Bootstrap
      ↓
New dashboard
```

Do not preserve:

```text
old patient
old encounter
old chamber
old permissions
old AI context
```

---

# 59. Browser/Web Back Navigation

If web support is enabled:

- Browser back should follow route history.
- Browser forward should work.
- Sensitive operations should not depend on browser history.
- Authorization must be revalidated where required.
- Expired sessions must redirect to login.

Do not assume browser history implies resource authorization.

---

# 60. Back Navigation Rules

Standard:

```text
Detail → List
```

Example:

```text
Patient → Patients
```

Contextual:

```text
Consultation → Patient
```

If there is no valid parent:

```text
→ Dashboard
```

Avoid popping the application root.

---

# 61. Unsaved Changes Guard

Screens that may contain unsaved data:

- Consultation notes
- Vitals
- Diagnosis
- Investigation
- Prescription draft
- Chamber configuration
- Staff invitation forms

should implement a navigation guard.

Example:

```text
WillPopScope / PopScope
        ↓
Dirty state?
   ┌────┴────┐
  No        Yes
   │          │
  Pop     Confirm
```

Use modern `PopScope` APIs compatible with the Flutter version selected by the project.

---

# 62. Autosave Interaction

Consultation autosave reduces navigation risk but does not eliminate it.

State:

```text
Clean
Saving
Saved
Dirty
Save Failed
```

Navigation:

```text
Dirty
 ↓
Attempt navigation
 ↓
If save in progress
 ↓
Wait or confirm
```

If save failed:

```text
Do not silently discard.
```

---

# 63. Modal Navigation

Use dialogs/bottom sheets for temporary actions.

Examples:

- Confirm finalize
- Cancel appointment
- Add allergy
- Add diagnosis
- Add medicine
- Payment confirmation
- Chamber switch confirmation

Do not create a full route for every small interaction.

---

# 64. Bottom Sheets

Good use cases:

```text
Medicine editor
Queue actions
Patient quick actions
Appointment actions
Payment actions
Chamber selector
```

Bottom sheets should not contain permanent application navigation.

---

# 65. Dialog Safety

Critical dialogs must:

- Prevent accidental double submission.
- Disable action while mutation is in progress.
- Show server failure clearly.
- Preserve user-entered data.

Example:

```text
Finalize Prescription?

This action will lock the prescription.

[Cancel] [Finalize]
```

---

# 66. Global Search Navigation

Global search may return:

```text
Patient
Appointment
Prescription
Report
```

Search result:

```text
Patient: Abdul Karim
```

→

```text
/app/patients/:patientId
```

Search must respect current chamber and permissions.

---

# 67. Search Result Navigation

Search result should contain:

```dart
enum SearchResultType {
  patient,
  appointment,
  prescription,
  report,
}
```

Navigation mapping:

```text
patient       → Patient Details
appointment   → Appointment Details
prescription  → Prescription Details
report        → Report Details
```

---

# 68. Global Error Route

A general application error route may be:

```text
/app/error
```

But feature-specific errors should generally remain inside their feature.

Examples:

```text
Patient not found
Report unavailable
Prescription unavailable
```

should use contextual error states.

---

# 69. Not Found Route

Use a dedicated:

```text
/app/not-found
```

for invalid application routes or missing resources where appropriate.

Message:

```text
This page or record is no longer available.
```

Actions:

```text
Go to Dashboard
Go Back
```

---

# 70. Offline Navigation

Navigation must distinguish between:

```text
Navigation possible
```

and:

```text
Operation possible
```

Example:

A cached patient can be opened offline:

```text
Patients → Patient Details
```

But:

```text
Finalize Prescription
```

requires server confirmation.

---

# 71. Offline Route Rules

When offline:

Allowed where cached:

```text
Dashboard
Patients
Patient Details
Timeline
Draft Consultation
Prescription Draft
Settings
```

Potentially restricted:

```text
Queue mutation
Payment
Prescription Finalization
Record Locking
Staff mutation
Appointment mutation
```

These rules align with Documents 22 and 23.

---

# 72. Connectivity Banner

The shell should display a lightweight connectivity indicator.

Example:

```text
Offline — showing saved information
```

or:

```text
Back online — syncing...
```

The banner must not block navigation unnecessarily.

---

# 73. Navigation and Sync

When sync is in progress:

```text
App Shell
    ↓
Sync indicator
```

Do not navigate users away from a screen solely because synchronization starts.

Critical conflicts should be presented contextually.

---

# 74. Navigation and Sync Conflict

If a consultation conflict is detected:

```text
Consultation
 ↓
Conflict detected
 ↓
Conflict resolution screen/dialog
```

Do not silently navigate away.

---

# 75. Navigation Analytics

Track navigation events without patient-sensitive content.

Good:

```text
screen_view:
consultation
```

Bad:

```text
screen_view:
patient/AbdulKarim/diagnosis
```

Never send:

- Patient names
- Phone numbers
- Medical information
- Prescription content
- AI prompt content
- Tokens

to analytics.

---

# 76. Route Analytics Model

Example:

```dart
class NavigationAnalyticsEvent {
  final String routeName;
  final DateTime timestamp;
}
```

Optional metadata:

```text
role
deviceType
appVersion
```

Avoid patient/resource identifiers unless explicitly required and privacy-reviewed.

---

# 77. Route Observer

Navigation analytics can use a route observer.

Conceptually:

```text
GoRouter
   ↓
NavigatorObserver
   ↓
NavigationAnalytics
```

The observer must be privacy-aware.

---

# 78. App Lifecycle

Application lifecycle:

```text
Foreground
Background
Inactive
Resumed
```

On resume:

1. Validate session if necessary.
2. Restore connectivity state.
3. Resume safe sync.
4. Refresh stale data.
5. Re-evaluate permissions if necessary.
6. Protect sensitive screens.

---

# 79. Sensitive Screen Privacy

When the app enters background:

```text
Patient Details
Consultation
Prescription
AI Chat
```

should be protected from unintended exposure where platform support allows.

Use a privacy overlay or platform-specific secure-screen mechanism as defined in Document 22.

---

# 80. Navigation and Biometric Lock

If optional app lock is enabled:

```text
Resume
 ↓
App Lock
 ↓
Biometric/PIN
 ↓
Authenticated Application
```

Do not allow direct navigation into protected screens before unlock.

---

# 81. Role-Based Shell Configuration

Define navigation items as configuration.

Example:

```dart
class ShellNavItem {
  final String route;
  final String label;
  final IconData icon;
  final Set<String> permissions;

  const ShellNavItem({
    required this.route,
    required this.label,
    required this.icon,
    this.permissions = const {},
  });
}
```

Then:

```text
Permissions
    ↓
Visible Navigation Items
```

---

# 82. Example Navigation Configuration

```text
Dashboard
permission: dashboard.view

Patients
permission: patient.view

Appointments
permission: appointment.view

Queue
permission: queue.view

Reports
permission: report.view

Payments
permission: payment.view
```

---

# 83. Navigation Item Visibility

Three states may be useful:

```text
Visible
Disabled
Hidden
```

Use:

### Hidden
User has no meaningful access.

### Disabled
Feature exists but is unavailable due to temporary conditions.

Example:

```text
Reports
"Available after first consultation"
```

Do not use disabled UI as a security mechanism.

---

# 84. Route-Level Permission Error

If a user reaches a protected route without permission:

```text
403
 ↓
Unauthorized State
```

Example:

```text
Access Restricted

You don't have permission to access this section.

[Go to Dashboard]
```

---

# 85. Application Shell Header

Desktop/tablet header:

```text
[Chamber Selector]
        [Global Search]
                  [Notifications]
                         [User Menu]
```

Mobile:

```text
[Menu/Title] [Search] [Notification]
```

Header content should adapt to the active route.

---

# 86. Dynamic App Bar Titles

Examples:

```text
Dashboard
Patients
Appointments
Today's Queue
Consultation
Prescription
Reports
Settings
```

Detail routes may display contextual titles:

```text
Patient Details
Consultation
Prescription Review
Payment
```

Do not put sensitive patient names in system-level navigation analytics.

---

# 87. Contextual Header

Consultation header:

```text
Patient
Age/Sex
Patient ID
Allergy Alert
Encounter status
```

The header is part of the consultation UI rather than global navigation.

---

# 88. Navigation Drawer / More Menu

Secondary navigation:

```text
Doctor Profile
Professional Profile
Chambers
Schedule
Staff
Permissions
Notifications
AI Settings
Preferences
Help
About
Logout
```

Permission filtering applies.

---

# 89. Settings Navigation

Recommended:

```text
/app/settings
    ├── /profile
    ├── /professional
    ├── /chambers
    ├── /schedule
    ├── /staff
    ├── /permissions
    ├── /preferences
    └── /security
```

---

# 90. Onboarding Navigation

Onboarding should use a controlled flow.

```text
Profile
 ↓
Professional
 ↓
Verification
 ↓
Chamber
 ↓
Schedule
 ↓
Staff
 ↓
AI
 ↓
Complete
```

Users may navigate backward.

Forward navigation should depend on completion state.

---

# 91. Onboarding Route Guard

If user manually enters:

```text
/onboarding/complete
```

without completing required steps:

```text
Redirect to first incomplete step
```

Do not trust the URL.

---

# 92. Onboarding Resume

If app is closed during onboarding:

```text
Bootstrap
 ↓
Determine incomplete step
 ↓
Resume there
```

Example:

```text
Chamber completed
Schedule incomplete

→ /onboarding/schedule
```

---

# 93. Onboarding Completion

After completion:

```text
/onboarding/complete
       ↓
Create/refresh application state
       ↓
Navigate to Dashboard
```

Avoid leaving onboarding routes in the active back stack.

Use replacement navigation where appropriate.

---

# 94. Route Replacement vs Push

Use:

### `go`
For changing application location.

### `push`
For opening a child/detail screen.

### `replace`
For replacing the current screen where back navigation should not return.

Examples:

```text
Login → Dashboard
    use replacement-style navigation

Patients → Patient Details
    push

Patient Details → Edit
    push

OTP → Dashboard
    replace
```

---

# 95. Navigation Stack Rules

Avoid excessive stack depth.

Bad:

```text
Dashboard
 → Patients
 → Search
 → Patient
 → Appointment
 → Patient
 → Consultation
 → Patient
```

Prefer intentional contextual navigation.

---

# 96. Cross-Feature Navigation

Common flows:

```text
Appointment
   ↓
Patient
   ↓
Queue
   ↓
Consultation
   ↓
Prescription
   ↓
Payment
```

Each transition must preserve the necessary context.

---

# 97. Appointment → Queue

After check-in:

```text
Appointment Details
    ↓
Check In
    ↓
Server confirms
    ↓
Queue Entry
    ↓
Queue Screen
```

Do not navigate before check-in succeeds.

---

# 98. Queue → Consultation

When doctor starts consultation:

```text
Queue
 ↓
Start
 ↓
Server confirms
 ↓
Encounter
 ↓
Consultation Screen
```

If encounter creation fails:

```text
Remain on queue
```

---

# 99. Consultation → Prescription

```text
Consultation
 ↓
Prescription
```

The prescription screen receives:

```text
encounterId
```

and obtains the authoritative encounter/prescription state through providers.

Do not pass the complete patient object through route arguments.

---

# 100. Prescription → Payment

After completing consultation:

```text
Consultation
 ↓
Complete
 ↓
Payment
```

Payment should use its own API/domain state.

Do not assume payment is successful because navigation occurred.

---

# 101. Patient → New Appointment

```text
Patient Details
 ↓
Book Appointment
 ↓
Create Appointment
 ↓
Success
 ↓
Appointment Details
```

Pass only:

```text
patientId
```

not the entire patient object.

---

# 102. Patient → Consultation History

```text
Patient
 ↓
Timeline
 ↓
Encounter
```

Encounter authorization must be validated.

---

# 103. Global Search → Consultation

If search returns an encounter:

```text
Search
 ↓
Encounter
 ↓
Consultation
```

If encounter is locked:

```text
Read-only consultation
```

Do not open it as an editable draft.

---

# 104. Prescription History Navigation

```text
Prescription
 ↓
History
 ↓
Previous Version
```

Historical versions should be read-only.

---

# 105. Locked Clinical Record Navigation

Locked records must display:

```text
Read-only
```

Navigation controls should not expose editing actions.

Server authorization remains authoritative.

---

# 106. Route Data Loading

Route-level data should generally be loaded by Riverpod providers.

Example:

```text
Route
 ↓
patientDetailsProvider(patientId)
 ↓
Repository
 ↓
API
```

Avoid putting API calls directly inside `GoRoute.builder`.

---

# 107. Route Preloading

Safe preloading may be used for:

```text
Patient Details
Appointment Details
Dashboard
```

But avoid preloading large or sensitive datasets unnecessarily.

---

# 108. Route Refresh

A route may refresh after:

```text
Mutation
Background sync
Connectivity restored
Returning from child route
```

Prefer provider invalidation over manual route reconstruction.

---

# 109. Navigation and Provider Invalidation

Example:

```text
Prescription finalized
        ↓
invalidate prescriptionProvider
        ↓
invalidate encounterProvider
        ↓
invalidate patientTimelineProvider
        ↓
navigate/return
```

Navigation should not be responsible for domain cache invalidation.

---

# 110. Route Keys

Use stable keys where necessary.

Example:

```dart
ValueKey(patientId)
```

Useful when route state depends on:

```text
patientId
encounterId
prescriptionId
```

Avoid unnecessary global keys.

---

# 111. Query Parameter State

Use query parameters for:

```text
Calendar date
Patient search
Report filters
Selected tab
```

Example:

```text
/app/appointments?date=2026-09-05
```

This improves:

- Restoration
- Deep linking
- Browser history
- Shareability where appropriate

---

# 112. Do Not Put Sensitive State in URLs

Never put:

- Diagnosis
- Prescription text
- Patient phone
- Patient name
- AI prompt
- Clinical notes
- Tokens

into query parameters.

URLs may appear in:

- Browser history
- OS logs
- Analytics
- Crash reports
- Referral headers

---

# 113. External URL Handling

External links should be allowlisted.

Examples:

```text
Privacy Policy
Terms
Help Center
Official support
```

Do not blindly open arbitrary URLs from server content.

---

# 114. WebView Navigation

If WebView is introduced:

- Restrict domains.
- Disable unnecessary capabilities.
- Never expose authentication tokens through URLs.
- Do not load untrusted medical content into privileged WebViews.
- Apply Document 22 security rules.

---

# 115. Push Notification Types

Recommended notification routing model:

```text
AppointmentReminder
QueueUpdate
PaymentReceived
PrescriptionReady
ReportReady
AIProcessingComplete
SystemNotification
```

Each type maps to a controlled destination.

---

# 116. Notification Navigation While App Is Closed

Flow:

```text
Notification tap
 ↓
App launches
 ↓
Bootstrap
 ↓
Authenticate
 ↓
Process notification payload
 ↓
Validate permission/resource
 ↓
Navigate
```

Never assume the user session is valid.

---

# 117. Notification Navigation While App Is Open

Flow:

```text
Notification
 ↓
NavigationCoordinator
 ↓
Validate target
 ↓
Navigate
```

If the user is in an active consultation:

```text
Do not interrupt critical workflow unnecessarily.
```

Prefer an in-app notification UI.

---

# 118. Navigation Queue

Multiple external navigation requests may occur.

Use a navigation queue:

```text
Navigation Request
      ↓
Coordinator
      ↓
Queue
      ↓
Process when app is ready
```

This prevents:

```text
push A
push B
push C
```

race conditions.

---

# 119. Navigation Request Model

Example:

```dart
@freezed
class NavigationRequest with _$NavigationRequest {
  const factory NavigationRequest.route({
    required String location,
  }) = RouteNavigationRequest;

  const factory NavigationRequest.patient({
    required String patientId,
  }) = PatientNavigationRequest;

  const factory NavigationRequest.consultation({
    required String encounterId,
  }) = ConsultationNavigationRequest;
}
```

---

# 120. Navigation Readiness

External navigation must wait until:

```text
Router initialized
+
Bootstrap completed
+
Authentication known
```

before executing.

---

# 121. Router Refresh

GoRouter redirect logic may need to react to:

```text
Auth state
Onboarding state
Selected chamber
Permission state
```

Riverpod integration should avoid recreating the router excessively.

Use a stable router with controlled refresh/redirect mechanisms.

---

# 122. Router Lifecycle

Recommended:

```text
App Startup
 ↓
Create repositories
 ↓
Create providers
 ↓
Create router
 ↓
Attach shell
 ↓
Run app
```

Avoid creating a new router every widget rebuild.

---

# 123. Route Redirect Architecture

Conceptual:

```text
redirect(context, state)
        ↓
AuthState
        ↓
OnboardingState
        ↓
BootstrapState
        ↓
PermissionState
        ↓
Route Decision
```

Return:

```text
null
```

when navigation is allowed.

---

# 124. Redirect Examples

Unauthenticated:

```text
/app/dashboard
      ↓
/auth/login
```

Authenticated but onboarding incomplete:

```text
/app/dashboard
      ↓
/onboarding/chamber
```

Authenticated + onboarding complete:

```text
/auth/login
      ↓
/app/dashboard
```

---

# 125. Redirect Loop Prevention

Maintain explicit route groups:

```text
publicRoutes
onboardingRoutes
protectedRoutes
```

Then evaluate only applicable redirects.

Never redirect indiscriminately.

---

# 126. Route Metadata Registry

Maintain a registry for:

```text
Route name
Route path
Authentication
Onboarding
Permissions
Analytics name
Sensitive flag
Shell visibility
```

Example:

```dart
const RouteMetadata(
  name: RouteNames.consultation,
  permissions: {'encounter.view'},
  requiresAuth: true,
  requiresOnboarding: true,
);
```

---

# 127. Sensitive Route Metadata

Mark:

```text
Patient Details
Consultation
Prescription
Payment
AI
Diagnostic Reports
```

as sensitive.

This can help control:

- Privacy overlays
- Analytics
- Screenshot behavior
- Logging
- Background masking

---

# 128. Navigation Error Handling

Navigation errors must not crash the application.

Handle:

```text
Invalid route
Missing parameter
Unauthorized
Forbidden
Resource unavailable
Session expired
Offline
```

with controlled UI states.

---

# 129. Route Error Screen

A reusable route error screen:

```text
Something went wrong

We couldn't open this page.

[Retry]
[Go to Dashboard]
```

For authorization:

```text
Access Restricted
```

For missing resource:

```text
Record Not Found
```

---

# 130. Navigation Logging

Safe logs:

```text
Navigation: dashboard → patients
Navigation: patients → patientDetails
```

Unsafe logs:

```text
patientId=...
patientName=...
diagnosis=...
prescription=...
```

Follow Document 22 logging rules.

---

# 131. Crash Handling

If a navigation exception occurs:

```text
CrashReporter
```

may receive:

```text
routeName
appVersion
deviceType
```

but not clinical content.

---

# 132. Navigation Performance

Targets:

- Shell transition: <100 ms where practical
- Typical route rendering: <300 ms before meaningful loading UI
- No unnecessary router rebuilds
- No duplicate API calls caused by route rebuild
- No repeated provider initialization caused by navigation

---

# 133. Navigation Loading UX

Route loading should use:

```text
Skeleton
Progress indicator
Cached content
```

depending on the feature.

Avoid full-screen spinners for every nested navigation.

---

# 134. Patient Detail Loading

Preferred:

```text
Patient Details
 ↓
Cached patient data
 ↓
Display immediately
 ↓
Refresh
```

If no cache:

```text
Skeleton
 ↓
API
 ↓
Content
```

---

# 135. Consultation Loading

Consultation should load the minimum critical context first:

```text
Patient
Encounter
Vitals
Notes
Prescription
```

Then optional data:

```text
Reports
AI context
Historical analytics
```

---

# 136. Navigation Accessibility

Navigation must support:

- Screen readers
- Semantic labels
- Keyboard navigation
- Focus restoration
- Minimum touch target sizes
- Logical traversal
- Visible selected state
- High contrast

---

# 137. Keyboard Navigation

Desktop/tablet support should provide predictable shortcuts where appropriate.

Examples:

```text
Ctrl/Cmd + K → Search
Esc → Close dialog
Enter → Submit focused action
```

Shortcuts must never bypass clinical confirmation requirements.

---

# 138. Localization

Route labels must be localized.

Example:

```text
Dashboard
ড্যাশবোর্ড

Patients
রোগী

Appointments
অ্যাপয়েন্টমেন্ট

Queue
কিউ
```

Route paths should remain stable and language-neutral.

Good:

```text
/app/patients
```

Not:

```text
/app/rogis
```

---

# 139. RTL/Future Localization

Although Bangladesh primarily requires Bangla/English, the navigation architecture should not hardcode text direction assumptions.

Support future localization through Flutter's localization system.

---

# 140. Theme Interaction

The shell must support:

```text
Light
Dark
System
```

Navigation components must use semantic theme tokens rather than hardcoded colors.

---

# 141. Application Shell Components

Recommended reusable components:

```text
AppShell
AppHeader
AppSidebar
AppBottomNavigation
AppNavigationRail
ChamberSelector
GlobalSearchButton
NotificationButton
UserMenu
ConnectivityBanner
OfflineBanner
SyncIndicator
PrivacyOverlay
RouteLoading
RouteError
PermissionDeniedView
NotFoundView
```

---

# 142. Shell Component Responsibility

### AppShell
Owns responsive structure.

### AppHeader
Global actions.

### AppSidebar
Desktop navigation.

### AppBottomNavigation
Mobile primary navigation.

### ChamberSelector
Active chamber selection.

### ConnectivityBanner
Connectivity state.

### SyncIndicator
Background synchronization state.

---

# 143. Application Shell State Diagram

```text
Bootstrap
   ↓
Authentication
   ↓
Onboarding
   ↓
Selected Chamber
   ↓
Application Shell
   ↓
Feature Route
   ↓
Feature State
```

---

# 144. Application Shell Provider Graph

```text
authStateProvider
       │
       ├── onboardingStateProvider
       │
       ├── currentUserProvider
       │
       └── selectedChamberProvider
                │
                ├── permissionsProvider
                │
                ├── dashboardProvider
                ├── queueProvider
                ├── appointmentsProvider
                └── patientProviders
```

---

# 145. Route Provider Rules

Routes should consume providers indirectly through screens/controllers.

Preferred:

```text
GoRouter
 ↓
Screen
 ↓
Riverpod Controller
 ↓
UseCase
```

Avoid:

```text
GoRouter
 ↓
API
```

---

# 146. Route Arguments vs Providers

Pass identifiers through route parameters:

```text
patientId
encounterId
appointmentId
```

Then resolve data through providers.

Do not pass:

```dart
PatientEntity
EncounterEntity
PrescriptionEntity
```

through navigation arguments unless there is a very specific, justified reason.

---

# 147. Why IDs Should Be Passed

Passing IDs provides:

- Fresh data
- Deep-link support
- Restoration
- Smaller navigation state
- Reduced stale object risk
- Better separation of concerns

---

# 148. Navigation Testing Strategy

Testing must cover:

### Unit
- Route helpers
- Redirect logic
- Deep-link parsing
- Navigation target mapping

### Widget
- Shell
- Navigation items
- Guards
- Dialogs
- Back navigation

### Integration
- Authentication redirects
- Onboarding
- Chamber switching
- Deep links
- Notification navigation

### E2E
Complete user workflows.

---

# 149. Authentication Navigation Tests

Required:

```text
Unauthenticated → Login
Login success → Dashboard
Expired session → Login
Refresh failure → Login
Logout → Login
Account switch → New Dashboard
```

---

# 150. Onboarding Navigation Tests

Required:

```text
Incomplete onboarding → Correct step
Complete onboarding → Dashboard
Manual access to later step → Redirect
App restart → Resume correct step
```

---

# 151. Chamber Navigation Tests

Required:

```text
Select Chamber A
→ Dashboard A

Switch to Chamber B
→ Dashboard B

Queue A must not appear in B

Patient A must not appear in B unless authorized/shared

Active chamber persists after restart
```

---

# 152. Deep-Link Tests

Required:

```text
Deep link while logged out
Deep link while logged in
Expired deep link
Invalid deep link
Forbidden resource
Wrong chamber
Missing resource
Notification deep link
```

---

# 153. Consultation Navigation Tests

Required:

```text
Queue → Consultation
Consultation → Prescription
Consultation → Patient
Consultation → Leave with unsaved changes
Consultation → Locked state
Session expiry during consultation
Connectivity loss during consultation
```

---

# 154. Prescription Navigation Tests

Required:

```text
Builder → Review
Review → Finalize
Finalize success → Read-only
Finalize failure → Remain on Review
Locked prescription → No editing
AI draft → Review
```

---

# 155. Payment Navigation Tests

Required:

```text
Appointment → Payment
Payment success → Receipt
Payment failure → Remain on Payment
Duplicate submission → Prevented
Refund → Receipt/history updated
```

---

# 156. Notification Navigation Tests

Required:

```text
Notification → Appointment
Notification → Queue
Notification → Consultation
Notification → Prescription
Notification → Report
Notification while logged out
Notification with revoked permission
```

---

# 157. Navigation Race Conditions

Test:

```text
User taps notification
+
Session expires
+
App is restoring
```

Expected:

```text
Bootstrap/auth resolves first
Then navigation request is processed
```

---

# 158. Double Navigation Prevention

Prevent:

```text
Double tap
 ↓
push
push
```

Critical buttons should have:

```text
isSubmitting
```

or equivalent state.

---

# 159. Navigation Idempotency

Navigation requests from:

- Push notification
- Deep link
- Search
- User tap

should not create duplicate screens unnecessarily.

Example:

```text
Same patient requested twice
```

may reuse or replace the appropriate context depending on navigation semantics.

---

# 160. Deep-Link Security Checklist

Before opening a deep link:

- Is user authenticated?
- Is session valid?
- Is onboarding complete?
- Is selected chamber known?
- Does user have chamber membership?
- Does user have required permission?
- Does resource exist?
- Does resource belong to an accessible chamber?
- Is resource state compatible with the requested screen?
- Is the target sensitive?
- Is cached data safe to display?

---

# 161. Application Shell Security Checklist

The shell must:

- Never display another user's data.
- Never display another chamber's data.
- Clear sensitive state on logout.
- React to permission changes.
- Hide unauthorized navigation.
- Prevent unauthorized routes.
- Protect background screens.
- Avoid sensitive analytics.
- Avoid sensitive URLs.
- Avoid exposing tokens.

---

# 162. Navigation and Backend Security

Flutter routing is not a security boundary.

The backend remains responsible for:

```text
Authentication
Authorization
Chamber isolation
Patient access
Clinical record access
Prescription permissions
Payment permissions
AI access
```

Flutter routing improves UX and reduces accidental access.

---

# 163. Navigation and AI Safety

AI routes must preserve:

```text
Doctor
Chamber
Patient
Encounter
AI Request
```

context.

AI navigation must never:

- Auto-finalize prescription
- Bypass review
- Open unauthorized patient records
- Reuse another patient's AI context
- Display stale AI results after account/chamber switch

---

# 164. Navigation and Clinical Safety

Critical clinical state must be explicit.

Examples:

```text
Draft
Review Required
Finalized
Locked
```

Navigation must reflect these states.

Example:

```text
Finalized Prescription
        ↓
Read-only route
```

---

# 165. Navigation and Auditability

Important actions should be auditable independently of navigation.

Examples:

```text
Prescription finalized
Payment recorded
Refund issued
Clinical record locked
Staff permission changed
```

Do not treat:

```text
Navigated to screen
```

as evidence that an action occurred.

---

# 166. Recommended Route File Organization

```text
lib/app/router/
├── app_router.dart
├── route_names.dart
├── route_paths.dart
├── route_metadata.dart
├── route_guards.dart
├── redirect_handler.dart
├── navigation_service.dart
├── navigation_coordinator.dart
├── deep_link_handler.dart
└── navigation_models.dart
```

---

# 167. Feature Route Organization

Each feature may define route builders separately:

```text
features/
├── patients/
│   └── presentation/
│       └── routes/
│           └── patient_routes.dart
│
├── appointments/
│   └── presentation/routes/
│
├── queue/
│   └── presentation/routes/
│
├── consultation/
│   └── presentation/routes/
│
└── prescription/
    └── presentation/routes/
```

The application router composes them.

---

# 168. Avoid Monolithic Router Files

Do not allow:

```text
app_router.dart
```

to become thousands of lines.

Preferred:

```text
App Router
   ↓
Auth Routes
Onboarding Routes
Patient Routes
Appointment Routes
Queue Routes
Consultation Routes
Prescription Routes
AI Routes
Settings Routes
```

---

# 169. Feature Route Contract

Each feature route definition should specify:

```text
Route name
Path
Page builder
Required permission
Sensitive flag
Shell requirement
Parameters
Redirect rules
```

---

# 170. Example Feature Route Definition

Conceptually:

```dart
GoRoute(
  name: RouteNames.patientDetails,
  path: '/patients/:patientId',
  builder: (context, state) {
    final patientId = state.pathParameters['patientId']!;
    return PatientDetailsScreen(patientId: patientId);
  },
)
```

Authorization remains outside the screen itself and is also enforced by the backend.

---

# 171. Route Composition

Recommended conceptual structure:

```text
appRouterProvider
       ↓
rootRoutes
       +
authRoutes
       +
onboardingRoutes
       +
protectedRoutes
       ↓
GoRouter
```

---

# 172. Router Provider

The router may be exposed through Riverpod:

```dart
final appRouterProvider = Provider<GoRouter>((ref) {
  return createAppRouter(ref);
});
```

However, avoid rebuilding the router unnecessarily.

---

# 173. Router Dependency Rules

Router may depend on:

```text
Auth state
Onboarding state
Permission state
Selected chamber state
```

Router must not directly depend on:

```text
Patient repository
Prescription repository
Payment repository
AI repository
```

Resource-level access belongs to feature/application layers.

---

# 174. Deep Link Parser

Deep link parser responsibilities:

```text
URI
 ↓
Route
 ↓
Parameters
 ↓
NavigationTarget
```

Example:

```dart
NavigationTarget.patient(
  patientId: '123',
);
```

This keeps URI parsing separate from navigation execution.

---

# 175. Navigation Target Types

Recommended:

```dart
sealed class NavigationTarget {
  const NavigationTarget();
}

class DashboardTarget extends NavigationTarget {}

class PatientTarget extends NavigationTarget {
  final String patientId;
}

class AppointmentTarget extends NavigationTarget {
  final String appointmentId;
}

class ConsultationTarget extends NavigationTarget {
  final String encounterId;
}
```

---

# 176. Navigation Target Resolution

```text
NavigationTarget
       ↓
Auth Check
       ↓
Permission Check
       ↓
Chamber Resolution
       ↓
Resource Resolution
       ↓
Route
```

---

# 177. Route Transition Design

Use subtle transitions.

Recommended:

- Fade
- Slide
- Shared-axis style where appropriate

Avoid excessive animation in clinical workflows.

Navigation animation should not delay critical workflows.

---

# 178. Accessibility During Transitions

Animations should respect:

```text
Reduce Motion
```

where supported.

Critical content must remain understandable without animation.

---

# 179. Tablet Navigation

Tablet layout:

```text
┌─────────────┬──────────────────────────┐
│ Navigation  │                          │
│ Rail        │ Active Screen            │
│             │                          │
└─────────────┴──────────────────────────┘
```

For master-detail screens:

```text
Patients
│
├── Patient List
│
└── Patient Details
```

may appear side by side.

---

# 180. Desktop Navigation

Desktop may support:

```text
Sidebar
+
Content
+
Optional contextual panel
```

Example consultation:

```text
Patient Context | Consultation Workspace | AI Assistant
```

This is a layout concern, not a different route hierarchy.

---

# 181. Mobile Navigation

Mobile prioritizes:

```text
Dashboard
Queue
Appointments
Patients
```

with contextual navigation into:

```text
Consultation
Prescription
Payment
AI
```

---

# 182. Navigation Design for Doctors

Doctor's most common path:

```text
Dashboard
 ↓
Today's Queue
 ↓
Patient
 ↓
Consultation
 ↓
Prescription
 ↓
Complete
```

Navigation must minimize unnecessary intermediate screens.

---

# 183. Navigation Design for Receptionists

Receptionist's common path:

```text
Dashboard
 ↓
Appointment
 ↓
Patient
 ↓
Check-in
 ↓
Queue
 ↓
Payment
```

---

# 184. Navigation Design for Assistant Doctors

Assistant flow:

```text
Queue
 ↓
Patient
 ↓
Vitals
 ↓
History
 ↓
Consultation
 ↓
Doctor Review
```

---

# 185. Navigation Design for Billing Staff

Billing flow:

```text
Appointments
 ↓
Patient
 ↓
Payment
 ↓
Receipt
```

---

# 186. Navigation Design for Chamber Manager

Manager flow:

```text
Dashboard
 ↓
Chamber
 ↓
Schedule
 ↓
Staff
 ↓
Permissions
 ↓
Reports
```

---

# 187. Navigation DoR

Before implementing a route:

- Route purpose defined.
- Route name defined.
- Route path defined.
- Parameters defined.
- Required permission defined.
- Authentication requirement defined.
- Onboarding requirement defined.
- Chamber context defined.
- Deep-link requirement defined.
- Back behavior defined.
- Loading state defined.
- Error state defined.
- Offline behavior defined.
- Sensitive-data classification defined.

---

# 188. Navigation DoD

A route is complete when:

- Route registered.
- Named route exists.
- Path helper exists.
- Permission metadata exists.
- Guard behavior implemented.
- Screen implemented.
- Loading state implemented.
- Error state implemented.
- Empty state implemented where applicable.
- Back behavior tested.
- Deep-link behavior tested where applicable.
- Session-expiry behavior tested.
- Chamber isolation tested.
- Accessibility tested.
- Localization tested.
- Responsive layout tested.
- Analytics reviewed for privacy.
- No sensitive information appears in route URLs/logs.

---

# 189. Sprint Mapping

## Sprint 1 — Application Foundation

Implement:

- GoRouter
- Route constants
- App bootstrap
- Application shell
- Responsive shell
- Navigation service
- Basic guards
- Theme
- Localization

---

## Sprint 2 — Authentication & Onboarding

Implement:

- Auth routes
- Splash
- Login
- Registration
- OTP
- Password reset
- Onboarding routes
- Auth redirects
- Onboarding redirects

---

## Sprint 3 — Doctor & Chamber

Implement:

- Chamber shell
- Chamber selector
- Chamber switching
- Staff routes
- Schedule routes
- Permission-aware navigation

---

## Sprint 4 — Patients

Implement:

- Patient list
- Patient search
- Patient registration
- Patient details
- Timeline
- Patient deep links

---

## Sprint 5 — Appointments & Queue

Implement:

- Appointment routes
- Appointment details
- Create appointment
- Queue route
- Queue navigation
- Appointment → queue
- Queue → consultation

---

## Sprint 6 — Consultation

Implement:

- Consultation route
- Clinical workspace
- Unsaved changes protection
- Autosave navigation
- Patient context
- Vitals
- Diagnosis
- Investigation
- Follow-up

---

## Sprint 7 — Prescription

Implement:

- Prescription routes
- Builder
- Medicine editor
- Review
- Finalization
- Preview
- History
- Locked/read-only navigation

---

## Sprint 8 — Payments

Implement:

- Payment route
- Receipt
- Refund
- Payment navigation
- Payment error handling

---

## Sprint 9 — AI

Implement:

- Patient summary
- Clinical chat
- Prescription draft
- AI report analysis
- AI request status
- AI navigation safety

---

## Sprint 10 — Reports & Notifications

Implement:

- Reports routes
- Notification route
- Notification navigation
- Push deep links
- Global search navigation

---

## Sprint 11 — Offline & Advanced Navigation

Implement:

- Offline navigation
- Cached route content
- Sync state
- Conflict handling
- Pending deep links
- App lifecycle restoration

---

## Sprint 12 — Production Hardening

Implement:

- Navigation performance
- Deep-link security
- Route security
- Privacy
- Accessibility
- Analytics
- Crash handling
- E2E testing
- Production configuration

---

# 190. Complete Route Inventory

## Public

```text
/
 /auth/login
 /auth/register
 /auth/verify-otp
 /auth/forgot-password
 /auth/reset-password
```

## Onboarding

```text
/onboarding/profile
/onboarding/professional
/onboarding/verification
/onboarding/chamber
/onboarding/schedule
/onboarding/staff
/onboarding/ai
/onboarding/complete
```

## Main

```text
/app/dashboard
/app/patients
/app/appointments
/app/queue
/app/reports
/app/notifications
/app/settings
```

## Patient

```text
/app/patients/new
/app/patients/:patientId
/app/patients/:patientId/timeline
/app/patients/:patientId/allergies
/app/patients/:patientId/conditions
```

## Appointments

```text
/app/appointments/new
/app/appointments/:appointmentId
```

## Consultation

```text
/app/consultations/:encounterId
```

## Prescription

```text
/app/prescriptions/:prescriptionId
/app/prescriptions/:prescriptionId/review
/app/prescriptions/:prescriptionId/preview
/app/prescriptions/:prescriptionId/history
```

## Payments

```text
/app/payments/:paymentId
```

## AI

```text
/app/ai/patient-summary/:encounterId
/app/ai/clinical-chat
/app/ai/prescription-draft/:encounterId
/app/ai/report-analysis/:reportId
/app/ai/requests/:requestId
```

## Settings

```text
/app/settings/profile
/app/settings/professional
/app/settings/chambers
/app/settings/schedule
/app/settings/staff
/app/settings/permissions
/app/settings/preferences
/app/settings/security
```

---

# 191. Critical End-to-End Navigation Flow

The primary doctor journey must work as:

```text
Login
  ↓
Dashboard
  ↓
Today's Queue
  ↓
Patient
  ↓
Consultation
  ↓
Vitals
  ↓
Clinical Notes
  ↓
Diagnosis
  ↓
Investigation
  ↓
Prescription
  ↓
AI Draft (optional)
  ↓
Review
  ↓
Finalize
  ↓
Complete Consultation
  ↓
Payment
  ↓
Receipt
```

Every mutation must be server-confirmed.

---

# 192. Critical Staff Flow

```text
Login
 ↓
Dashboard
 ↓
Appointments
 ↓
Appointment Details
 ↓
Patient
 ↓
Check-in
 ↓
Queue
 ↓
Payment
```

---

# 193. Critical Deep-Link Flow

```text
Push Notification
      ↓
App Launch
      ↓
Bootstrap
      ↓
Authentication
      ↓
Permission
      ↓
Chamber
      ↓
Resource Validation
      ↓
Target Screen
```

---

# 194. Critical Session Expiry Flow

```text
Consultation
      ↓
API request
      ↓
401
      ↓
Refresh
   ┌──┴──┐
Success Failure
   │       │
Continue  Logout
           ↓
         Login
```

---

# 195. Critical Chamber Isolation Flow

```text
Chamber A
   ↓
Patient A
   ↓
Switch Chamber B
   ↓
Invalidate A state
   ↓
Load B state
   ↓
Patient A unavailable
```

This must be covered by automated E2E testing.

---

# 196. Navigation Architecture Final Diagram

```text
                         ┌─────────────────┐
                         │   Deep Link     │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │ Notification    │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │ Navigation      │
                         │ Coordinator     │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │ Authentication  │
                         │ / Authorization │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │ Chamber Context │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │    GoRouter     │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │   App Shell     │
                         └────────┬────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
     Dashboard                 Patients                Queue
          │                       │                        │
          │                 Patient Details                │
          │                       │                        │
          │                  Timeline                     │
          │                       │                        │
          └───────────────────────┼────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │  Consultation   │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                Clinical       Prescription     AI
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                         ┌────────▼────────┐
                         │     Payment     │
                         └─────────────────┘
```

---

# 197. Final Navigation Rules

The implementation team must follow these rules:

### Rule 1
GoRouter is the central routing mechanism.

### Rule 2
Riverpod owns application/navigation state; GoRouter owns route transitions.

### Rule 3
Authentication is checked before protected navigation.

### Rule 4
Authorization is enforced by the backend.

### Rule 5
Chamber is a first-class application context.

### Rule 6
Never mix state from two chambers.

### Rule 7
Pass IDs through routes, not large domain objects.

### Rule 8
Sensitive clinical information must never be placed in URLs.

### Rule 9
Deep links must be authenticated and authorization-aware.

### Rule 10
Notification navigation must go through a centralized coordinator.

### Rule 11
Session expiration must clear protected navigation state.

### Rule 12
Account switching must clear previous-user state.

### Rule 13
Critical clinical mutations must complete before navigation.

### Rule 14
Unsaved consultation data must never be silently discarded.

### Rule 15
Finalized prescriptions are read-only.

### Rule 16
Offline navigation may expose cached data, but critical server-confirmed operations remain protected.

### Rule 17
Navigation must not become a substitute for domain/business logic.

### Rule 18
Navigation analytics must not expose patient or clinical information.

### Rule 19
Responsive layouts should share the same route architecture.

### Rule 20
The primary doctor workflow must require as few navigation steps as practical.

---

# 198. Relationship With Previous Documents

This document integrates directly with:

### Document 17
**Flutter API Integration Layer**

Navigation depends on API/session behavior, error handling, refresh tokens, and resource loading.

### Document 18
**Flutter Riverpod State Management**

Riverpod manages authentication, chamber context, feature state, and navigation-related application state.

### Document 20
**Flutter Screen-by-Screen Implementation Specification**

Every screen in Document 20 maps to the route architecture defined here.

### Document 22
**Flutter Security, Privacy & Data Protection**

Navigation follows its rules for authentication, chamber isolation, sensitive screens, session management, deep links, and privacy.

### Document 23
**Flutter Offline-First, Local Storage & Synchronization**

Navigation integrates with cached data, offline states, synchronization, and conflict handling.

### Document 24
**Flutter Networking, API Error Handling & Resilience**

Navigation reacts to authentication failures, authorization errors, network failures, retry behavior, and server-confirmed mutations.

---

# 199. Recommended Next Document

The next logical implementation document is:

## Document 26 — Complete Flutter Forms, Validation, Input Handling & User Interaction Implementation Specification

It should cover:

- Form architecture
- Riverpod form state
- Freezed form models
- Text controllers
- Focus management
- Validation architecture
- Bangla/English input
- Bangladesh phone validation
- Date/time input
- Medical data input
- Blood pressure
- Weight/height/BMI
- Medicine entry
- Prescription forms
- Appointment forms
- Patient registration
- Chamber configuration
- Staff forms
- Error display
- Server validation errors
- Async validation
- Dirty state
- Autosave
- Keyboard handling
- Accessibility
- Form persistence
- Offline forms
- Draft recovery
- Testing
- Reusable form components
- Sprint implementation plan.

---

# 200. Final Architecture Statement

The Chamber Management Flutter application should treat navigation as an **application-level orchestration layer**, not merely a collection of screens.

The architecture is:

```text
External Navigation Request
        ↓
Navigation Coordinator
        ↓
Authentication
        ↓
Authorization
        ↓
Chamber Context
        ↓
GoRouter
        ↓
Application Shell
        ↓
Feature Screen
        ↓
Riverpod State
        ↓
Use Case
        ↓
Repository
        ↓
API / Local Storage
```

The resulting system should provide:

- Predictable navigation
- Secure deep linking
- Strong chamber isolation
- Role-aware navigation
- Safe clinical workflows
- Session recovery
- Notification routing
- Offline-aware navigation
- Responsive application shell
- Consistent mobile/tablet/desktop behavior
- Strong testability
- Clean Architecture boundaries

Most importantly:

> **Navigation may guide the user, but it must never be treated as the security boundary. Backend authorization, chamber isolation, and clinical data integrity remain authoritative.**