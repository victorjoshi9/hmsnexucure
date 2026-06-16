import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Date / time formatting helpers for HAMS.
class AppDateUtils {
  AppDateUtils._();

  // ── Formatters ──────────────────────────────────────────
  static final DateFormat _timeFormat = DateFormat('hh:mm a');
  static final DateFormat _time24Format = DateFormat('HH:mm');
  static final DateFormat _dateFormat = DateFormat('dd MMM yyyy');
  static final DateFormat _dateShortFormat = DateFormat('dd MMM');
  static final DateFormat _dayFormat = DateFormat('EEEE');
  static final DateFormat _monthYearFormat = DateFormat('MMMM yyyy');
  static final DateFormat _isoDateFormat = DateFormat('yyyy-MM-dd');
  static final DateFormat _fullFormat = DateFormat('dd MMM yyyy, hh:mm a');

  // ── Format Methods ──────────────────────────────────────
  static String formatTime(DateTime dt) => _timeFormat.format(dt);
  static String formatTime24(DateTime dt) => _time24Format.format(dt);
  static String formatDate(DateTime dt) => _dateFormat.format(dt);
  static String formatDateShort(DateTime dt) => _dateShortFormat.format(dt);
  static String formatDay(DateTime dt) => _dayFormat.format(dt);
  static String formatMonthYear(DateTime dt) => _monthYearFormat.format(dt);
  static String formatIsoDate(DateTime dt) => _isoDateFormat.format(dt);
  static String formatFull(DateTime dt) => _fullFormat.format(dt);

  /// Returns greeting based on time of day.
  static String getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /// Returns "Xh Ym" format from total minutes.
  static String formatDuration(int totalMinutes) {
    final hours = totalMinutes ~/ 60;
    final minutes = totalMinutes % 60;
    if (hours == 0) return '${minutes}m';
    if (minutes == 0) return '${hours}h';
    return '${hours}h ${minutes}m';
  }

  /// Returns "Xh Ym" from Duration.
  static String formatDurationObj(Duration duration) {
    return formatDuration(duration.inMinutes);
  }

  /// Elapsed duration since a given time.
  static Duration elapsedSince(DateTime start) {
    return DateTime.now().difference(start);
  }

  /// Remaining duration until a given time.
  static Duration remainingUntil(DateTime end) {
    final remaining = end.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }

  /// Is today the same date as [date]?
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  /// Get start of day for a given date.
  static DateTime startOfDay(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }

  /// Parse time string "HH:mm" to TimeOfDay.
  static TimeOfDay parseTimeOfDay(String timeStr) {
    final parts = timeStr.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  /// Convert TimeOfDay to DateTime on today.
  static DateTime timeOfDayToDateTime(TimeOfDay tod) {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day, tod.hour, tod.minute);
  }
}
