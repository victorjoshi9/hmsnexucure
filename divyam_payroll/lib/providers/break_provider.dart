import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/break_model.dart';
import '../data/repositories/break_repository.dart';

/// Break state.
class BreakState {
  final bool isLoading;
  final BreakRecord? activeBreak;
  final List<BreakRecord> todayBreaks;
  final String? error;

  const BreakState({
    this.isLoading = false,
    this.activeBreak,
    this.todayBreaks = const [],
    this.error,
  });

  BreakState copyWith({
    bool? isLoading,
    BreakRecord? activeBreak,
    List<BreakRecord>? todayBreaks,
    String? error,
    bool clearActiveBreak = false,
  }) {
    return BreakState(
      isLoading: isLoading ?? this.isLoading,
      activeBreak: clearActiveBreak ? null : (activeBreak ?? this.activeBreak),
      todayBreaks: todayBreaks ?? this.todayBreaks,
      error: error,
    );
  }
}

/// Break notifier.
class BreakNotifier extends StateNotifier<BreakState> {
  final BreakRepository _repo;

  BreakNotifier(this._repo) : super(const BreakState());

  Future<bool> startBreak({
    required String attendanceId,
    required BreakType breakType,
    required double faceScore,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final breakRecord = await _repo.startBreak(
        attendanceId: attendanceId,
        breakType: breakType,
        faceScore: faceScore,
      );
      state = state.copyWith(
        isLoading: false,
        activeBreak: breakRecord,
        todayBreaks: [...state.todayBreaks, breakRecord],
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> endBreak({required double faceScore}) async {
    if (state.activeBreak == null) return false;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final completed = await _repo.endBreak(
        breakId: state.activeBreak!.id,
        faceScore: faceScore,
      );
      final updatedBreaks = state.todayBreaks.map((b) {
        return b.id == completed.id ? completed : b;
      }).toList();
      state = state.copyWith(
        isLoading: false,
        todayBreaks: updatedBreaks,
        clearActiveBreak: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> loadTodayBreaks(String attendanceId) async {
    state = state.copyWith(isLoading: true);
    try {
      final breaks = await _repo.getTodayBreaks(attendanceId);
      final active = breaks.where((b) => b.isActive).firstOrNull;
      state = state.copyWith(
        isLoading: false,
        todayBreaks: breaks,
        activeBreak: active,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

// ── Providers ─────────────────────────────────────────────
final breakRepositoryProvider = Provider<BreakRepository>((ref) {
  return BreakRepository();
});

final breakProvider = StateNotifierProvider<BreakNotifier, BreakState>((ref) {
  return BreakNotifier(ref.read(breakRepositoryProvider));
});
