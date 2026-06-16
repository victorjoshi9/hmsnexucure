import '../models/leave_request_model.dart';

/// Leave repository — handles leave applications and history.
class LeaveRepository {
  /// Apply for leave.
  Future<LeaveRequest> applyLeave({
    required String employeeId,
    required LeaveType leaveType,
    required DateTime fromDate,
    required DateTime toDate,
    required String reason,
    String? documentUrl,
  }) async {
    await Future.delayed(const Duration(seconds: 2));
    return LeaveRequest(
      id: 'lv-${DateTime.now().millisecondsSinceEpoch}',
      employeeId: employeeId,
      leaveType: leaveType,
      fromDate: fromDate,
      toDate: toDate,
      reason: reason,
      status: LeaveStatus.pending,
      documentUrl: documentUrl,
      createdAt: DateTime.now(),
    );
  }

  /// Get leave history.
  Future<List<LeaveRequest>> getHistory(String employeeId) async {
    await Future.delayed(const Duration(seconds: 1));
    return LeaveRequest.mockHistory;
  }

  /// Get leave balance.
  Future<Map<LeaveType, int>> getBalance(String employeeId) async {
    await Future.delayed(const Duration(seconds: 1));
    return {
      LeaveType.casual: 8,
      LeaveType.earned: 15,
      LeaveType.sick: 10,
      LeaveType.compensatory: 2,
    };
  }

  /// Cancel a pending leave.
  Future<void> cancelLeave(String leaveId) async {
    await Future.delayed(const Duration(seconds: 1));
  }
}
