/// Attendance status enum matching PRD rules engine.
enum AttendanceStatus {
  present,
  absent,
  late,
  halfDay,
  onLeave,
  weeklyOff,
  holiday,
}

/// Attendance record model matching PRD database schema.
class Attendance {
  final String id;
  final String employeeId;
  final DateTime date;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final double? checkInLat;
  final double? checkInLng;
  final double? checkOutLat;
  final double? checkOutLng;
  final double? faceScoreIn;
  final double? faceScoreOut;
  final AttendanceStatus status;
  final int netWorkingMinutes;
  final int lateMinutes;
  final int overtimeMinutes;
  final int totalBreakMinutes;
  final String? deviceId;
  final String? remarks;
  final bool isCorrected;

  const Attendance({
    required this.id,
    required this.employeeId,
    required this.date,
    this.checkInTime,
    this.checkOutTime,
    this.checkInLat,
    this.checkInLng,
    this.checkOutLat,
    this.checkOutLng,
    this.faceScoreIn,
    this.faceScoreOut,
    required this.status,
    this.netWorkingMinutes = 0,
    this.lateMinutes = 0,
    this.overtimeMinutes = 0,
    this.totalBreakMinutes = 0,
    this.deviceId,
    this.remarks,
    this.isCorrected = false,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'] as String,
      employeeId: json['employee_id'] as String,
      date: DateTime.parse(json['date'] as String),
      checkInTime: json['check_in_time'] != null
          ? DateTime.parse(json['check_in_time'] as String)
          : null,
      checkOutTime: json['check_out_time'] != null
          ? DateTime.parse(json['check_out_time'] as String)
          : null,
      checkInLat: (json['check_in_lat'] as num?)?.toDouble(),
      checkInLng: (json['check_in_lng'] as num?)?.toDouble(),
      checkOutLat: (json['check_out_lat'] as num?)?.toDouble(),
      checkOutLng: (json['check_out_lng'] as num?)?.toDouble(),
      faceScoreIn: (json['face_score_in'] as num?)?.toDouble(),
      faceScoreOut: (json['face_score_out'] as num?)?.toDouble(),
      status: AttendanceStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => AttendanceStatus.absent,
      ),
      netWorkingMinutes: json['net_working_minutes'] as int? ?? 0,
      lateMinutes: json['late_minutes'] as int? ?? 0,
      overtimeMinutes: json['overtime_minutes'] as int? ?? 0,
      totalBreakMinutes: json['total_break_minutes'] as int? ?? 0,
      deviceId: json['device_id'] as String?,
      remarks: json['remarks'] as String?,
      isCorrected: json['is_corrected'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'employee_id': employeeId,
        'date': date.toIso8601String(),
        'check_in_time': checkInTime?.toIso8601String(),
        'check_out_time': checkOutTime?.toIso8601String(),
        'check_in_lat': checkInLat,
        'check_in_lng': checkInLng,
        'check_out_lat': checkOutLat,
        'check_out_lng': checkOutLng,
        'face_score_in': faceScoreIn,
        'face_score_out': faceScoreOut,
        'status': status.name,
        'net_working_minutes': netWorkingMinutes,
        'late_minutes': lateMinutes,
        'overtime_minutes': overtimeMinutes,
        'total_break_minutes': totalBreakMinutes,
        'device_id': deviceId,
        'remarks': remarks,
        'is_corrected': isCorrected,
      };

  /// Is the employee currently checked in (no checkout yet)?
  bool get isCheckedIn => checkInTime != null && checkOutTime == null;

  /// Is the shift completed (both in and out)?
  bool get isCompleted => checkInTime != null && checkOutTime != null;

  /// Format working hours as "Xh Ym".
  String get formattedWorkingHours {
    final h = netWorkingMinutes ~/ 60;
    final m = netWorkingMinutes % 60;
    if (h == 0) return '${m}m';
    return '${h}h ${m}m';
  }

  /// Mock data for demo.
  static List<Attendance> get mockMonthly {
    final now = DateTime.now();
    return List.generate(30, (i) {
      final date = DateTime(now.year, now.month, i + 1);
      final isWeekend = date.weekday == DateTime.sunday;
      if (isWeekend) {
        return Attendance(
          id: 'att-$i',
          employeeId: 'emp-001',
          date: date,
          status: AttendanceStatus.weeklyOff,
        );
      }
      final isLate = i % 7 == 2;
      final isAbsent = i % 11 == 0 && i > 0;
      return Attendance(
        id: 'att-$i',
        employeeId: 'emp-001',
        date: date,
        checkInTime: isAbsent ? null : date.add(Duration(hours: isLate ? 9 : 8, minutes: isLate ? 18 : 55)),
        checkOutTime: isAbsent ? null : date.add(const Duration(hours: 17, minutes: 10)),
        faceScoreIn: isAbsent ? null : 0.97,
        status: isAbsent
            ? AttendanceStatus.absent
            : isLate
                ? AttendanceStatus.late
                : AttendanceStatus.present,
        netWorkingMinutes: isAbsent ? 0 : (isLate ? 410 : 435),
        lateMinutes: isLate ? 18 : 0,
        totalBreakMinutes: isAbsent ? 0 : 60,
      );
    });
  }
}
