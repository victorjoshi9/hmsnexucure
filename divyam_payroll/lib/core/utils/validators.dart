/// Input validators for HAMS forms.
class Validators {
  Validators._();

  /// Validate employee ID (e.g., "EMP001" — alphanumeric, 3-20 chars).
  static String? employeeId(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Employee ID is required';
    }
    if (value.trim().length < 3) {
      return 'Employee ID must be at least 3 characters';
    }
    if (value.trim().length > 20) {
      return 'Employee ID must be at most 20 characters';
    }
    return null;
  }

  /// Validate password (min 6 chars).
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  /// Validate OTP (6 digits).
  static String? otp(String? value) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }
    if (!RegExp(r'^\d{6}$').hasMatch(value)) {
      return 'OTP must be 6 digits';
    }
    return null;
  }

  /// Validate phone number.
  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    if (!RegExp(r'^\+?\d{10,13}$').hasMatch(value.replaceAll(' ', ''))) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  /// Generic required field.
  static String? required(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  /// Validate leave reason (min 10 chars).
  static String? leaveReason(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please provide a reason';
    }
    if (value.trim().length < 10) {
      return 'Reason must be at least 10 characters';
    }
    return null;
  }
}
