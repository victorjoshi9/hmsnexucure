/// API endpoint constants for the HAMS backend.
/// Phase 1: Points to localhost. Will be updated when backend is deployed.
class ApiEndpoints {
  ApiEndpoints._();

  // ── Base URL ────────────────────────────────────────────
  static const String baseUrl = 'https://divyamhospital.me/api/v1';
  static const String wsUrl = 'ws://localhost:5000/hubs';

  // ── Auth ────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String sendOtp = '/auth/otp/send';
  static const String verifyOtp = '/auth/otp/verify';

  // ── Employee ────────────────────────────────────────────
  static const String profile = '/employees/me';
  static const String updateDevice = '/employees/me/device';
  static const String registerFace = '/employees/me/face';

  // ── Attendance ──────────────────────────────────────────
  static const String checkIn = '/attendance/check-in';
  static const String checkOut = '/attendance/check-out';
  static const String todayStatus = '/attendance/today';
  static const String history = '/attendance/history';
  static const String monthlyReport = '/attendance/monthly';

  // ── Breaks ──────────────────────────────────────────────
  static const String startBreak = '/breaks/start';
  static const String endBreak = '/breaks/end';
  static const String breakHistory = '/breaks/today';

  // ── Leave ───────────────────────────────────────────────
  static const String applyLeave = '/leave/apply';
  static const String leaveHistory = '/leave/history';
  static const String leaveBalance = '/leave/balance';
  static const String cancelLeave = '/leave/cancel';

  // ── Corrections ─────────────────────────────────────────
  static const String requestCorrection = '/corrections/request';
  static const String correctionHistory = '/corrections/history';

  // ── Shifts ──────────────────────────────────────────────
  static const String myShift = '/shifts/me';
  static const String allShifts = '/shifts';

  // ── Departments ─────────────────────────────────────────
  static const String departments = '/departments';

  // ── Notifications ───────────────────────────────────────
  static const String notifications = '/notifications';
  static const String markRead = '/notifications/read';
  static const String fcmToken = '/notifications/fcm-token';

  // ── Geo-fence ───────────────────────────────────────────
  static const String geoFenceConfig = '/config/geo-fence';

  // ── Timeouts ────────────────────────────────────────────
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}
