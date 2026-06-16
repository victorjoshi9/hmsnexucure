/// Generic API response wrapper for consistent error handling.
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? statusCode;
  final Map<String, dynamic>? errors;

  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.statusCode,
    this.errors,
  });

  factory ApiResponse.success(T data, {String? message}) {
    return ApiResponse(
      success: true,
      data: data,
      message: message,
    );
  }

  factory ApiResponse.error(String message, {int? statusCode, Map<String, dynamic>? errors}) {
    return ApiResponse(
      success: false,
      message: message,
      statusCode: statusCode,
      errors: errors,
    );
  }

  /// Is this a validation error (422)?
  bool get isValidationError => statusCode == 422;

  /// Is this an auth error (401)?
  bool get isAuthError => statusCode == 401;

  /// Is this a forbidden error (403)?
  bool get isForbiddenError => statusCode == 403;
}
