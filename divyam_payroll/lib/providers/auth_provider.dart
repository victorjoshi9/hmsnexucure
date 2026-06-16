import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/employee_model.dart';
import '../data/repositories/auth_repository.dart';

/// Auth state — tracks login status and current employee.
class AuthState {
  final bool isLoading;
  final bool isLoggedIn;
  final Employee? employee;
  final String? error;

  const AuthState({
    this.isLoading = false,
    this.isLoggedIn = false,
    this.employee,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isLoggedIn,
    Employee? employee,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      employee: employee ?? this.employee,
      error: error,
    );
  }
}

/// Auth notifier — manages authentication state.
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;

  AuthNotifier(this._repo) : super(const AuthState());

  Future<void> login({
    required String employeeId,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final employee = await _repo.login(
        employeeId: employeeId,
        password: password,
      );
      state = state.copyWith(
        isLoading: false,
        isLoggedIn: true,
        employee: employee,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> loginWithFace({
    required String mobile,
    required String imageBase64,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final employee = await _repo.loginWithFace(
        mobile: mobile,
        imageBase64: imageBase64,
      );
      state = state.copyWith(
        isLoading: false,
        isLoggedIn: true,
        employee: employee,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      rethrow;
    }
  }

  Future<void> sendOtp(String phone) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _repo.sendOtp(phone: phone);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final employee = await _repo.verifyOtp(phone: phone, otp: otp);
      state = state.copyWith(
        isLoading: false,
        isLoggedIn: true,
        employee: employee,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState();
  }

  Future<void> checkSession() async {
    final loggedIn = await _repo.isLoggedIn();
    if (loggedIn) {
      final employee = await _repo.getProfile();
      state = state.copyWith(isLoggedIn: true, employee: employee);
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ── Providers ─────────────────────────────────────────────
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});
