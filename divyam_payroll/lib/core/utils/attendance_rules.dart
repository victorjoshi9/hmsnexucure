import 'package:flutter/material.dart';

/// Attendance rules engine — implements all PRD business logic.
/// Grace period, late marks, half-day, overtime, break violations.
class AttendanceRules {
  AttendanceRules._();

  // ══════════════════════════════════════════════════════════
  //  LATE / ON-TIME
  // ══════════════════════════════════════════════════════════

  /// Determine if the check-in is late.
  /// Late = arrived after (shiftStart + graceMinutes).
  static bool isLate({
    required DateTime checkInTime,
    required TimeOfDay shiftStart,
    required int graceMinutes,
  }) {
    final shiftStartDt = _timeOfDayToDateTime(shiftStart, checkInTime);
    final graceCutoff = shiftStartDt.add(Duration(minutes: graceMinutes));
    return checkInTime.isAfter(graceCutoff);
  }

  /// Calculate late minutes (0 if on time).
  static int lateMinutes({
    required DateTime checkInTime,
    required TimeOfDay shiftStart,
    required int graceMinutes,
  }) {
    final shiftStartDt = _timeOfDayToDateTime(shiftStart, checkInTime);
    final graceCutoff = shiftStartDt.add(Duration(minutes: graceMinutes));
    if (checkInTime.isAfter(graceCutoff)) {
      return checkInTime.difference(graceCutoff).inMinutes;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════
  //  HALF DAY
  // ══════════════════════════════════════════════════════════

  /// Check if arrival is late enough to mark as half day.
  /// halfDayThresholdMinutes = minutes after shift start to trigger half day.
  static bool isHalfDay({
    required DateTime checkInTime,
    required TimeOfDay shiftStart,
    required int halfDayThresholdMinutes,
  }) {
    final shiftStartDt = _timeOfDayToDateTime(shiftStart, checkInTime);
    final halfDayCutoff =
        shiftStartDt.add(Duration(minutes: halfDayThresholdMinutes));
    return checkInTime.isAfter(halfDayCutoff);
  }

  // ══════════════════════════════════════════════════════════
  //  EARLY LEAVE
  // ══════════════════════════════════════════════════════════

  /// Check if checkout is before shift end (early leave).
  static bool isEarlyLeave({
    required DateTime checkOutTime,
    required TimeOfDay shiftEnd,
    int earlyLeaveThresholdMinutes = 15,
  }) {
    final shiftEndDt = _timeOfDayToDateTime(shiftEnd, checkOutTime);
    final earlyCutoff =
        shiftEndDt.subtract(Duration(minutes: earlyLeaveThresholdMinutes));
    return checkOutTime.isBefore(earlyCutoff);
  }

  // ══════════════════════════════════════════════════════════
  //  OVERTIME
  // ══════════════════════════════════════════════════════════

  /// Calculate overtime minutes.
  /// Only counts if worked > otThresholdMinutes past shift end.
  static int overtimeMinutes({
    required DateTime checkOutTime,
    required TimeOfDay shiftEnd,
    required int otThresholdMinutes,
  }) {
    final shiftEndDt = _timeOfDayToDateTime(shiftEnd, checkOutTime);
    final diff = checkOutTime.difference(shiftEndDt).inMinutes;
    if (diff > otThresholdMinutes) {
      return diff;
    }
    return 0;
  }

  // ══════════════════════════════════════════════════════════
  //  WORKING HOURS
  // ══════════════════════════════════════════════════════════

  /// Net Working Hours = (CheckOut - CheckIn) - Total Break Duration.
  static int netWorkingMinutes({
    required DateTime checkInTime,
    required DateTime checkOutTime,
    required int totalBreakMinutes,
  }) {
    final totalMinutes = checkOutTime.difference(checkInTime).inMinutes;
    return totalMinutes - totalBreakMinutes;
  }

  // ══════════════════════════════════════════════════════════
  //  BREAK VIOLATION
  // ══════════════════════════════════════════════════════════

  /// Check if a break duration exceeds the allowed limit.
  static bool isBreakViolation({
    required int actualMinutes,
    required int allowedMinutes,
  }) {
    return actualMinutes > allowedMinutes;
  }

  /// Excess break minutes (0 if within limit).
  static int excessBreakMinutes({
    required int actualMinutes,
    required int allowedMinutes,
  }) {
    final excess = actualMinutes - allowedMinutes;
    return excess > 0 ? excess : 0;
  }

  // ══════════════════════════════════════════════════════════
  //  STATUS DETERMINATION
  // ══════════════════════════════════════════════════════════

  /// Determine attendance status string based on all factors.
  static String determineStatus({
    required DateTime? checkInTime,
    required DateTime? checkOutTime,
    required TimeOfDay shiftStart,
    required TimeOfDay shiftEnd,
    required int graceMinutes,
    required int halfDayThresholdMinutes,
    bool isOnLeave = false,
  }) {
    if (isOnLeave) return 'On Leave';
    if (checkInTime == null) return 'Absent';

    if (isHalfDay(
      checkInTime: checkInTime,
      shiftStart: shiftStart,
      halfDayThresholdMinutes: halfDayThresholdMinutes,
    )) {
      return 'Half Day';
    }

    if (isLate(
      checkInTime: checkInTime,
      shiftStart: shiftStart,
      graceMinutes: graceMinutes,
    )) {
      final mins = lateMinutes(
        checkInTime: checkInTime,
        shiftStart: shiftStart,
        graceMinutes: graceMinutes,
      );
      return 'Late (${mins}m)';
    }

    return 'Present';
  }

  // ── Helper ──────────────────────────────────────────────
  static DateTime _timeOfDayToDateTime(TimeOfDay tod, DateTime reference) {
    return DateTime(
      reference.year,
      reference.month,
      reference.day,
      tod.hour,
      tod.minute,
    );
  }
}
