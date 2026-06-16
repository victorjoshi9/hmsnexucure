import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/leave_request_model.dart';
import '../data/repositories/leave_repository.dart';

/// Leave state.
class LeaveState {
  final bool isLoading;
  final List<LeaveRequest> history;
  final Map<LeaveType, int> balance;
  final String? error;
  final bool isSubmitting;

  const LeaveState({
    this.isLoading = false,
    this.history = const [],
    this.balance = const {},
    this.error,
    this.isSubmitting = false,
  });

  LeaveState copyWith({
    bool? isLoading,
    List<LeaveRequest>? history,
    Map<LeaveType, int>? balance,
    String? error,
    bool? isSubmitting,
  }) {
    return LeaveState(
      isLoading: isLoading ?? this.isLoading,
      history: history ?? this.history,
      balance: balance ?? this.balance,
      error: error,
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }
}

/// Leave notifier.
class LeaveNotifier extends StateNotifier<LeaveState> {
  final LeaveRepository _repo;

  LeaveNotifier(this._repo) : super(const LeaveState());

  Future<void> loadHistory(String employeeId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final history = await _repo.getHistory(employeeId);
      state = state.copyWith(isLoading: false, history: history);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadBalance(String employeeId) async {
    try {
      final balance = await _repo.getBalance(employeeId);
      state = state.copyWith(balance: balance);
    } catch (e) {
      // Silent fail for balance
    }
  }

  Future<bool> applyLeave({
    required String employeeId,
    required LeaveType leaveType,
    required DateTime fromDate,
    required DateTime toDate,
    required String reason,
  }) async {
    state = state.copyWith(isSubmitting: true, error: null);
    try {
      final request = await _repo.applyLeave(
        employeeId: employeeId,
        leaveType: leaveType,
        fromDate: fromDate,
        toDate: toDate,
        reason: reason,
      );
      state = state.copyWith(
        isSubmitting: false,
        history: [request, ...state.history],
      );
      return true;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return false;
    }
  }

  Future<void> cancelLeave(String leaveId) async {
    try {
      await _repo.cancelLeave(leaveId);
      state = state.copyWith(
        history: state.history.where((l) => l.id != leaveId).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

// ── Providers ─────────────────────────────────────────────
final leaveRepositoryProvider = Provider<LeaveRepository>((ref) {
  return LeaveRepository();
});

final leaveProvider = StateNotifierProvider<LeaveNotifier, LeaveState>((ref) {
  return LeaveNotifier(ref.read(leaveRepositoryProvider));
});
