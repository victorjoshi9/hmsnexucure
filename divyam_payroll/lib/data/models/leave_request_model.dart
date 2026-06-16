/// Leave type enum from PRD.
enum LeaveType {
  casual,
  earned,
  sick,
  maternity,
  unpaid,
  compensatory,
}

/// Leave request status.
enum LeaveStatus {
  pending,
  approved,
  rejected,
  cancelled,
}

/// Leave request model matching PRD database schema.
class LeaveRequest {
  final String id;
  final String employeeId;
  final LeaveType leaveType;
  final DateTime fromDate;
  final DateTime toDate;
  final String reason;
  final LeaveStatus status;
  final String? approvedBy;
  final String? approverName;
  final String? rejectionReason;
  final String? documentUrl;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const LeaveRequest({
    required this.id,
    required this.employeeId,
    required this.leaveType,
    required this.fromDate,
    required this.toDate,
    required this.reason,
    required this.status,
    this.approvedBy,
    this.approverName,
    this.rejectionReason,
    this.documentUrl,
    required this.createdAt,
    this.updatedAt,
  });

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      id: json['id'] as String,
      employeeId: json['employee_id'] as String,
      leaveType: LeaveType.values.firstWhere(
        (e) => e.name == json['leave_type'],
        orElse: () => LeaveType.casual,
      ),
      fromDate: DateTime.parse(json['from_date'] as String),
      toDate: DateTime.parse(json['to_date'] as String),
      reason: json['reason'] as String,
      status: LeaveStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => LeaveStatus.pending,
      ),
      approvedBy: json['approved_by'] as String?,
      approverName: json['approver_name'] as String?,
      rejectionReason: json['rejection_reason'] as String?,
      documentUrl: json['document_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'employee_id': employeeId,
        'leave_type': leaveType.name,
        'from_date': fromDate.toIso8601String(),
        'to_date': toDate.toIso8601String(),
        'reason': reason,
        'status': status.name,
        'approved_by': approvedBy,
        'document_url': documentUrl,
        'created_at': createdAt.toIso8601String(),
      };

  /// Number of days.
  int get totalDays => toDate.difference(fromDate).inDays + 1;

  /// Display name for leave type.
  String get leaveTypeName {
    switch (leaveType) {
      case LeaveType.casual:
        return 'Casual Leave';
      case LeaveType.earned:
        return 'Earned Leave';
      case LeaveType.sick:
        return 'Sick Leave';
      case LeaveType.maternity:
        return 'Maternity Leave';
      case LeaveType.unpaid:
        return 'Unpaid Leave';
      case LeaveType.compensatory:
        return 'Compensatory Off';
    }
  }

  /// Mock data.
  static List<LeaveRequest> get mockHistory => [
        LeaveRequest(
          id: 'lv-1',
          employeeId: 'emp-001',
          leaveType: LeaveType.casual,
          fromDate: DateTime(2026, 6, 5),
          toDate: DateTime(2026, 6, 5),
          reason: 'Personal work — need to visit bank for document verification',
          status: LeaveStatus.approved,
          approverName: 'Dr. Priya Mehta',
          createdAt: DateTime(2026, 6, 3),
        ),
        LeaveRequest(
          id: 'lv-2',
          employeeId: 'emp-001',
          leaveType: LeaveType.sick,
          fromDate: DateTime(2026, 5, 20),
          toDate: DateTime(2026, 5, 21),
          reason: 'Fever and body ache, doctor advised rest for 2 days',
          status: LeaveStatus.approved,
          approverName: 'Dr. Priya Mehta',
          createdAt: DateTime(2026, 5, 19),
        ),
        LeaveRequest(
          id: 'lv-3',
          employeeId: 'emp-001',
          leaveType: LeaveType.earned,
          fromDate: DateTime(2026, 7, 10),
          toDate: DateTime(2026, 7, 14),
          reason: 'Family vacation planned — already informed team lead',
          status: LeaveStatus.pending,
          createdAt: DateTime(2026, 6, 10),
        ),
      ];
}
