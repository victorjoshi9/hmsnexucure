/// Correction request status.
enum CorrectionStatus {
  pending,
  approved,
  rejected,
}

/// Attendance correction request model.
class CorrectionRequest {
  final String id;
  final String employeeId;
  final DateTime date;
  final String reason;
  final CorrectionStatus status;
  final String? approvedBy;
  final String? approverName;
  final DateTime? originalCheckIn;
  final DateTime? requestedCheckIn;
  final DateTime? originalCheckOut;
  final DateTime? requestedCheckOut;
  final DateTime createdAt;

  const CorrectionRequest({
    required this.id,
    required this.employeeId,
    required this.date,
    required this.reason,
    required this.status,
    this.approvedBy,
    this.approverName,
    this.originalCheckIn,
    this.requestedCheckIn,
    this.originalCheckOut,
    this.requestedCheckOut,
    required this.createdAt,
  });

  factory CorrectionRequest.fromJson(Map<String, dynamic> json) {
    return CorrectionRequest(
      id: json['id'] as String,
      employeeId: json['employee_id'] as String,
      date: DateTime.parse(json['date'] as String),
      reason: json['reason'] as String,
      status: CorrectionStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => CorrectionStatus.pending,
      ),
      approvedBy: json['approved_by'] as String?,
      approverName: json['approver_name'] as String?,
      originalCheckIn: json['original_check_in'] != null
          ? DateTime.parse(json['original_check_in'] as String)
          : null,
      requestedCheckIn: json['requested_check_in'] != null
          ? DateTime.parse(json['requested_check_in'] as String)
          : null,
      originalCheckOut: json['original_check_out'] != null
          ? DateTime.parse(json['original_check_out'] as String)
          : null,
      requestedCheckOut: json['requested_check_out'] != null
          ? DateTime.parse(json['requested_check_out'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'employee_id': employeeId,
        'date': date.toIso8601String(),
        'reason': reason,
        'status': status.name,
        'original_check_in': originalCheckIn?.toIso8601String(),
        'requested_check_in': requestedCheckIn?.toIso8601String(),
        'original_check_out': originalCheckOut?.toIso8601String(),
        'requested_check_out': requestedCheckOut?.toIso8601String(),
        'created_at': createdAt.toIso8601String(),
      };
}
