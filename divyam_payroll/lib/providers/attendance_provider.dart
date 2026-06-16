import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/attendance_model.dart';
import '../data/repositories/attendance_repository.dart';

/// Attendance state.
class AttendanceState {
  final bool isLoading;
  final Attendance? todayAttendance;
  final List<Attendance> history;
  final String? error;
  final bool isCheckingIn;

  const AttendanceState({
    this.isLoading = false,
    this.todayAttendance,
    this.history = const [],
    this.error,
    this.isCheckingIn = false,
  });

  AttendanceState copyWith({
    bool? isLoading,
    Attendance? todayAttendance,
    List<Attendance>? history,
    String? error,
    bool? isCheckingIn,
  }) {
    return AttendanceState(
      isLoading: isLoading ?? this.isLoading,
      todayAttendance: todayAttendance ?? this.todayAttendance,
      history: history ?? this.history,
      error: error,
      isCheckingIn: isCheckingIn ?? this.isCheckingIn,
    );
  }
}

/// Attendance notifier.
class AttendanceNotifier extends StateNotifier<AttendanceState> {
  final AttendanceRepository _repo;

  AttendanceNotifier(this._repo) : super(const AttendanceState());

  Future<void> loadTodayStatus(String employeeId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final attendance = await _repo.getTodayStatus(employeeId);
      state = state.copyWith(isLoading: false, todayAttendance: attendance);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> checkIn({
    required String employeeId,
    required double lat,
    required double lng,
    required double faceScore,
    required String deviceId,
  }) async {
    state = state.copyWith(isCheckingIn: true, error: null);
    try {
      final attendance = await _repo.checkIn(
        employeeId: employeeId,
        lat: lat,
        lng: lng,
        faceScore: faceScore,
        deviceId: deviceId,
      );
      state = state.copyWith(
        isCheckingIn: false,
        todayAttendance: attendance,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isCheckingIn: false, error: e.toString());
      return false;
    }
  }

  Future<bool> checkOut({
    required double lat,
    required double lng,
    required double faceScore,
  }) async {
    state = state.copyWith(isCheckingIn: true, error: null);
    try {
      final attendance = await _repo.checkOut(
        attendanceId: state.todayAttendance!.id,
        lat: lat,
        lng: lng,
        faceScore: faceScore,
      );
      state = state.copyWith(
        isCheckingIn: false,
        todayAttendance: attendance,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isCheckingIn: false, error: e.toString());
      return false;
    }
  }

  Future<void> loadHistory({
    required String employeeId,
    required DateTime from,
    required DateTime to,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final history = await _repo.getHistory(
        employeeId: employeeId,
        from: from,
        to: to,
      );
      state = state.copyWith(isLoading: false, history: history);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

// ── Providers ─────────────────────────────────────────────
final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository();
});

final attendanceProvider =
    StateNotifierProvider<AttendanceNotifier, AttendanceState>((ref) {
  return AttendanceNotifier(ref.read(attendanceRepositoryProvider));
});
