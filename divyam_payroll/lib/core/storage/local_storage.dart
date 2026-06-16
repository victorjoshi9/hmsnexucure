import 'package:hive_flutter/hive_flutter.dart';

/// Hive local storage initialization and box management.
class LocalStorage {
  LocalStorage._();

  // ── Box Names ───────────────────────────────────────────
  static const String authBox = 'auth';
  static const String attendanceQueueBox = 'attendance_queue';
  static const String cacheBox = 'cache';
  static const String settingsBox = 'settings';

  // ── Keys ────────────────────────────────────────────────
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyEmployeeId = 'employee_id';
  static const String keyEmployeeData = 'employee_data';
  static const String keyDeviceId = 'device_id';
  static const String keyThemeMode = 'theme_mode';
  static const String keyLastSync = 'last_sync';

  /// Initialize Hive and open required boxes.
  static Future<void> init() async {
    await Hive.initFlutter();

    // Open all required boxes
    await Future.wait([
      Hive.openBox(authBox),
      Hive.openBox(attendanceQueueBox),
      Hive.openBox(cacheBox),
      Hive.openBox(settingsBox),
    ]);
  }

  // ── Auth Helpers ────────────────────────────────────────
  static Box get _auth => Hive.box(authBox);
  static Box get _settings => Hive.box(settingsBox);

  static Box get _queue => Hive.box(attendanceQueueBox);

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _auth.put(keyAccessToken, accessToken);
    await _auth.put(keyRefreshToken, refreshToken);
  }

  static String? get accessToken => _auth.get(keyAccessToken);
  static String? get refreshToken => _auth.get(keyRefreshToken);

  static Future<void> saveEmployee(Map<String, dynamic> employeeJson) async {
    await _auth.put(keyEmployeeData, employeeJson);
  }

  static Map<String, dynamic>? get employeeJson => _auth.get(keyEmployeeData) != null
      ? Map<String, dynamic>.from(_auth.get(keyEmployeeData))
      : null;

  static Future<void> clearAuth() async {
    await _auth.clear();
  }

  static bool get isLoggedIn => accessToken != null;

  // ── Settings Helpers ────────────────────────────────────
  static String get themeMode => _settings.get(keyThemeMode, defaultValue: 'system');

  static Future<void> setThemeMode(String mode) async {
    await _settings.put(keyThemeMode, mode);
  }

  // ── Offline Queue ───────────────────────────────────────
  static Future<void> queueAttendancePunch(Map<String, dynamic> punch) async {
    await _queue.add(punch);
  }

  static List<Map<String, dynamic>> get pendingPunches {
    return _queue.values.cast<Map<String, dynamic>>().toList();
  }

  static Future<void> clearPunchQueue() async {
    await _queue.clear();
  }

  /// Close all boxes.
  static Future<void> close() async {
    await Hive.close();
  }
}
