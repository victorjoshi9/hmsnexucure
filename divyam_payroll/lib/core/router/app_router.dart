import 'package:go_router/go_router.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/check_in_out/screens/check_in_screen.dart';
import '../../features/check_in_out/screens/confirmation_screen.dart';
import '../../features/breaks/screens/break_screen.dart';
import '../../features/attendance_history/screens/attendance_history_screen.dart';
import '../../features/attendance_history/screens/daily_detail_screen.dart';
import '../../features/leave/screens/leave_request_screen.dart';
import '../../features/leave/screens/leave_history_screen.dart';
import '../../features/correction/screens/correction_request_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/attendance/screens/face_scanner_screen.dart';
import '../../shared/widgets/app_scaffold.dart';

/// HAMS App Router — GoRouter with shell route for bottom navigation.
final appRouter = GoRouter(
  initialLocation: '/splash',
  debugLogDiagnostics: true,
  routes: [
    // ── Auth Routes ─────────────────────────────────────
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),

    // ── Main Shell (Bottom Nav) ─────────────────────────
    ShellRoute(
      builder: (context, state, child) => AppScaffold(child: child),
      routes: [
        GoRoute(
          path: '/dashboard',
          name: 'dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/history',
          name: 'history',
          builder: (context, state) => const AttendanceHistoryScreen(),
          routes: [
            GoRoute(
              path: ':date',
              name: 'daily-detail',
              builder: (context, state) => DailyDetailScreen(
                date: state.pathParameters['date'] ?? '',
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/notifications',
          name: 'notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),

    // ── Full-screen Routes (no bottom nav) ──────────────
    GoRoute(
      path: '/check-in',
      name: 'check-in',
      builder: (context, state) => const CheckInScreen(isCheckIn: true),
    ),
    GoRoute(
      path: '/check-out',
      name: 'check-out',
      builder: (context, state) => const CheckInScreen(isCheckIn: false),
    ),
    GoRoute(
      path: '/confirmation',
      name: 'confirmation',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return ConfirmationScreen(
          isSuccess: extra['isSuccess'] ?? true,
          isCheckIn: extra['isCheckIn'] ?? true,
          timestamp: extra['timestamp'] ?? DateTime.now(),
        );
      },
    ),
    GoRoute(
      path: '/break',
      name: 'break',
      builder: (context, state) => const BreakScreen(),
    ),
    GoRoute(
      path: '/leave/request',
      name: 'leave-request',
      builder: (context, state) => const LeaveRequestScreen(),
    ),
    GoRoute(
      path: '/leave/history',
      name: 'leave-history',
      builder: (context, state) => const LeaveHistoryScreen(),
    ),
    GoRoute(
      path: '/correction',
      name: 'correction',
      builder: (context, state) => const CorrectionRequestScreen(),
    ),
    GoRoute(
      path: '/face-scan',
      name: 'face-scan',
      builder: (context, state) => const FaceScannerScreen(),
    ),
  ],
);
