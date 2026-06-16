import '../models/break_model.dart';

/// Break repository — handles break start/end and history.
class BreakRepository {
  /// Start a break.
  Future<BreakRecord> startBreak({
    required String attendanceId,
    required BreakType breakType,
    required double faceScore,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    return BreakRecord(
      id: 'brk-${DateTime.now().millisecondsSinceEpoch}',
      attendanceId: attendanceId,
      breakType: breakType,
      startTime: DateTime.now(),
    );
  }

  /// End a break.
  Future<BreakRecord> endBreak({
    required String breakId,
    required double faceScore,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    final now = DateTime.now();
    final start = now.subtract(const Duration(minutes: 35));
    return BreakRecord(
      id: breakId,
      attendanceId: 'att-today',
      breakType: BreakType.lunch,
      startTime: start,
      endTime: now,
      durationMin: 35,
      isViolation: false,
    );
  }

  /// Get today's breaks.
  Future<List<BreakRecord>> getTodayBreaks(String attendanceId) async {
    await Future.delayed(const Duration(seconds: 1));
    return []; // No breaks by default
  }
}
