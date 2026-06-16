import '../models/attendance_model.dart';

/// Attendance repository — handles check-in, check-out, and history.
/// Phase 1: Mock. Phase 2: Connect to ASP.NET Core API.
class AttendanceRepository {
  /// Record check-in with face + GPS data.
  Future<Attendance> checkIn({
    required String employeeId,
    required double lat,
    required double lng,
    required double faceScore,
    required String deviceId,
  }) async {
    await Future.delayed(const Duration(seconds: 2));

    final now = DateTime.now();
    return Attendance(
      id: 'att-${now.millisecondsSinceEpoch}',
      employeeId: employeeId,
      date: DateTime(now.year, now.month, now.day),
      checkInTime: now,
      checkInLat: lat,
      checkInLng: lng,
      faceScoreIn: faceScore,
      status: AttendanceStatus.present,
      deviceId: deviceId,
    );
  }

  /// Record check-out.
  Future<Attendance> checkOut({
    required String attendanceId,
    required double lat,
    required double lng,
    required double faceScore,
  }) async {
    await Future.delayed(const Duration(seconds: 2));

    final now = DateTime.now();
    return Attendance(
      id: attendanceId,
      employeeId: 'emp-001',
      date: DateTime(now.year, now.month, now.day),
      checkInTime: now.subtract(const Duration(hours: 8)),
      checkOutTime: now,
      checkOutLat: lat,
      checkOutLng: lng,
      faceScoreOut: faceScore,
      status: AttendanceStatus.present,
      netWorkingMinutes: 420,
      totalBreakMinutes: 60,
    );
  }

  /// Get today's attendance status.
  Future<Attendance?> getTodayStatus(String employeeId) async {
    await Future.delayed(const Duration(seconds: 1));

    // Mock: return a checked-in attendance
    final now = DateTime.now();
    final checkInTime = DateTime(now.year, now.month, now.day, 8, 55);

    if (now.hour < 7) return null; // Not checked in yet

    return Attendance(
      id: 'att-today',
      employeeId: employeeId,
      date: DateTime(now.year, now.month, now.day),
      checkInTime: checkInTime,
      checkInLat: 26.8467,
      checkInLng: 80.9462,
      faceScoreIn: 0.97,
      status: AttendanceStatus.present,
      netWorkingMinutes: now.difference(checkInTime).inMinutes - 60,
      totalBreakMinutes: 60,
    );
  }

  /// Get attendance history for a date range.
  Future<List<Attendance>> getHistory({
    required String employeeId,
    required DateTime from,
    required DateTime to,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    return Attendance.mockMonthly;
  }

  /// Get monthly report.
  Future<Map<String, dynamic>> getMonthlyReport({
    required String employeeId,
    required int year,
    required int month,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    final records = Attendance.mockMonthly;
    final present = records.where((a) => a.status == AttendanceStatus.present).length;
    final late = records.where((a) => a.status == AttendanceStatus.late).length;
    final absent = records.where((a) => a.status == AttendanceStatus.absent).length;
    final totalWorkingMinutes = records.fold<int>(0, (sum, a) => sum + a.netWorkingMinutes);

    return {
      'records': records,
      'present': present,
      'late': late,
      'absent': absent,
      'total_working_minutes': totalWorkingMinutes,
      'total_overtime_minutes': records.fold<int>(0, (sum, a) => sum + a.overtimeMinutes),
    };
  }
}
