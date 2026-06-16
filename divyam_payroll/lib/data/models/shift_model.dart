import 'package:flutter/material.dart';

/// Shift model matching PRD database schema and Section 6 shift config.
class Shift {
  final String id;
  final String name;
  final TimeOfDay startTime;
  final TimeOfDay endTime;
  final int graceMinutes;
  final int breakLimitMin;
  final int otThresholdMin;
  final int halfDayThresholdMin;
  final List<String>? departmentIds;
  final bool isActive;

  const Shift({
    required this.id,
    required this.name,
    required this.startTime,
    required this.endTime,
    required this.graceMinutes,
    this.breakLimitMin = 90,
    this.otThresholdMin = 30,
    this.halfDayThresholdMin = 120,
    this.departmentIds,
    this.isActive = true,
  });

  factory Shift.fromJson(Map<String, dynamic> json) {
    return Shift(
      id: json['id'] as String,
      name: json['name'] as String,
      startTime: _parseTime(json['start_time'] as String),
      endTime: _parseTime(json['end_time'] as String),
      graceMinutes: json['grace_minutes'] as int,
      breakLimitMin: json['break_limit_min'] as int? ?? 90,
      otThresholdMin: json['ot_threshold_min'] as int? ?? 30,
      halfDayThresholdMin: json['half_day_threshold_min'] as int? ?? 120,
      departmentIds: (json['department_ids'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'start_time': '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')}',
        'end_time': '${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}',
        'grace_minutes': graceMinutes,
        'break_limit_min': breakLimitMin,
        'ot_threshold_min': otThresholdMin,
        'half_day_threshold_min': halfDayThresholdMin,
        'department_ids': departmentIds,
        'is_active': isActive,
      };

  /// Formatted shift time range (e.g., "08:00 AM – 04:00 PM").
  String get formattedTimeRange {
    return '${_formatTimeOfDay(startTime)} – ${_formatTimeOfDay(endTime)}';
  }

  /// Total shift duration in hours.
  double get totalHours {
    final startMinutes = startTime.hour * 60 + startTime.minute;
    var endMinutes = endTime.hour * 60 + endTime.minute;
    if (endMinutes < startMinutes) endMinutes += 24 * 60; // overnight shift
    return (endMinutes - startMinutes) / 60.0;
  }

  static TimeOfDay _parseTime(String timeStr) {
    final parts = timeStr.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  static String _formatTimeOfDay(TimeOfDay tod) {
    final hour = tod.hourOfPeriod == 0 ? 12 : tod.hourOfPeriod;
    final minute = tod.minute.toString().padLeft(2, '0');
    final period = tod.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  // ── Mock Shifts from PRD Section 6 ─────────────────────
  static Shift get morning => const Shift(
        id: 'shift-morning',
        name: 'Morning',
        startTime: TimeOfDay(hour: 7, minute: 0),
        endTime: TimeOfDay(hour: 15, minute: 0),
        graceMinutes: 10,
      );

  static Shift get general => const Shift(
        id: 'shift-general',
        name: 'General',
        startTime: TimeOfDay(hour: 9, minute: 0),
        endTime: TimeOfDay(hour: 17, minute: 0),
        graceMinutes: 15,
      );

  static Shift get afternoon => const Shift(
        id: 'shift-afternoon',
        name: 'Afternoon',
        startTime: TimeOfDay(hour: 14, minute: 0),
        endTime: TimeOfDay(hour: 22, minute: 0),
        graceMinutes: 10,
      );

  static Shift get night => const Shift(
        id: 'shift-night',
        name: 'Night',
        startTime: TimeOfDay(hour: 22, minute: 0),
        endTime: TimeOfDay(hour: 6, minute: 0),
        graceMinutes: 15,
      );

  static Shift get doctorOpd => const Shift(
        id: 'shift-doctor-opd',
        name: 'Doctor OPD',
        startTime: TimeOfDay(hour: 10, minute: 0),
        endTime: TimeOfDay(hour: 18, minute: 0),
        graceMinutes: 20,
      );

  static List<Shift> get allMock => [morning, general, afternoon, night, doctorOpd];
}
