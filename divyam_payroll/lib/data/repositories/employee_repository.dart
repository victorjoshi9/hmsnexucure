import '../models/employee_model.dart';

/// Employee repository — handles employee profile and management.
class EmployeeRepository {
  /// Get current employee profile.
  Future<Employee> getProfile(String employeeId) async {
    await Future.delayed(const Duration(seconds: 1));
    return Employee.mock;
  }

  /// Update device binding.
  Future<void> updateDevice({
    required String employeeId,
    required String deviceId,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
  }

  /// Register face template.
  Future<void> registerFace({
    required String employeeId,
    required String faceTemplateData,
  }) async {
    await Future.delayed(const Duration(seconds: 2));
  }
}
