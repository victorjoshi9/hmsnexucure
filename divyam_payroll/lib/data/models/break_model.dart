/// Break type enum from PRD Section 7.
enum BreakType {
  lunch,
  tea,
  personal,
  emergency,
}

/// Break record model matching PRD database schema.
class BreakRecord {
  final String id;
  final String attendanceId;
  final BreakType breakType;
  final DateTime startTime;
  final DateTime? endTime;
  final int? durationMin;
  final bool isViolation;
  final int? excessMinutes;

  const BreakRecord({
    required this.id,
    required this.attendanceId,
    required this.breakType,
    required this.startTime,
    this.endTime,
    this.durationMin,
    this.isViolation = false,
    this.excessMinutes,
  });

  factory BreakRecord.fromJson(Map<String, dynamic> json) {
    return BreakRecord(
      id: json['id'] as String,
      attendanceId: json['attendance_id'] as String,
      breakType: BreakType.values.firstWhere(
        (e) => e.name == json['break_type'],
        orElse: () => BreakType.personal,
      ),
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: json['end_time'] != null
          ? DateTime.parse(json['end_time'] as String)
          : null,
      durationMin: json['duration_min'] as int?,
      isViolation: json['is_violation'] as bool? ?? false,
      excessMinutes: json['excess_minutes'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'attendance_id': attendanceId,
        'break_type': breakType.name,
        'start_time': startTime.toIso8601String(),
        'end_time': endTime?.toIso8601String(),
        'duration_min': durationMin,
        'is_violation': isViolation,
        'excess_minutes': excessMinutes,
      };

  /// Is break currently active (no end time)?
  bool get isActive => endTime == null;

  /// Elapsed duration of active break.
  Duration get elapsed => endTime != null
      ? endTime!.difference(startTime)
      : DateTime.now().difference(startTime);

  /// Allowed duration per PRD break rules.
  int get allowedMinutes {
    switch (breakType) {
      case BreakType.lunch:
        return 60;
      case BreakType.tea:
        return 15;
      case BreakType.personal:
        return 30;
      case BreakType.emergency:
        return 999; // Admin-approved, no auto limit
    }
  }

  /// Display name of break type.
  String get displayName {
    switch (breakType) {
      case BreakType.lunch:
        return 'Lunch Break';
      case BreakType.tea:
        return 'Tea Break';
      case BreakType.personal:
        return 'Personal Break';
      case BreakType.emergency:
        return 'Emergency Break';
    }
  }

  /// Icon character for break type.
  String get icon {
    switch (breakType) {
      case BreakType.lunch:
        return '🍽️';
      case BreakType.tea:
        return '☕';
      case BreakType.personal:
        return '👤';
      case BreakType.emergency:
        return '🚨';
    }
  }
}
