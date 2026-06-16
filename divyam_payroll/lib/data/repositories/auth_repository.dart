import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:async';
import '../../core/network/dio_client.dart';
import '../../core/storage/local_storage.dart';
import '../models/employee_model.dart';

/// Auth repository — handles login, token management, and session.
class AuthRepository {
  final Dio _dio = DioClient.instance;

  /// Login with employee ID and password.
  Future<Employee> login({
    required String employeeId,
    required String password,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': employeeId,
        'password': password,
      });

      final data = response.data;
      final accessToken = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String;
      final empJson = data['employee'] as Map<String, dynamic>;

      await LocalStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
      await LocalStorage.saveEmployee(empJson);

      return Employee.fromJson(empJson);
    } on DioException catch (dioErr) {
      final message = dioErr.response?.data?['error']?['message'] ?? dioErr.message;
      throw Exception(message);
    } catch (e) {
      throw Exception('Login failed: ${e.toString()}');
    }
  }

  /// Login with face verification.
  Future<Employee> loginWithFace({
    required String mobile,
    required String imageBase64,
  }) async {
    try {
      final response = await _dio.post('/auth/face-login', data: {
        'mobile': mobile,
        'image': imageBase64,
      });

      final data = response.data;
      final accessToken = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String;
      final empJson = data['employee'] as Map<String, dynamic>;

      await LocalStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
      await LocalStorage.saveEmployee(empJson);

      return Employee.fromJson(empJson);
    } on DioException catch (dioErr) {
      final message = dioErr.response?.data?['error']?['message'] ?? dioErr.message;
      throw Exception(message);
    } catch (e) {
      throw Exception('Face verification login failed: ${e.toString()}');
    }
  }

  /// Login with OTP - Send SMS.
  String? _verificationId;

  Future<void> sendOtp({required String phone}) async {
    try {
      final Completer<void> completer = Completer<void>();
      
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (PhoneAuthCredential credential) async {
          // Auto-resolution or instant verification
          await FirebaseAuth.instance.signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          throw Exception(e.message ?? 'Phone verification failed');
        },
        codeSent: (String verificationId, int? resendToken) {
          _verificationId = verificationId;
          completer.complete();
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
      );

      return completer.future;
    } catch (e) {
      throw Exception('Failed to send OTP: ${e.toString()}');
    }
  }

  Future<Employee> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    try {
      if (_verificationId == null) {
        throw Exception('Verification ID is missing. Please send OTP first.');
      }

      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: otp,
      );

      final authResult = await FirebaseAuth.instance.signInWithCredential(credential);
      final user = authResult.user;

      if (user == null) {
        throw Exception('Firebase authentication failed');
      }

      // Now we have the Firebase User, we link/login to our backend
      // We expect the backend to verify the Firebase ID Token or simply use the phone number
      final idToken = await user.getIdToken();

      final response = await _dio.post('/auth/otp-login', data: {
        'phone': phone,
        'firebase_token': idToken,
      });

      final data = response.data;
      final accessToken = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String;
      final empJson = data['employee'] as Map<String, dynamic>;

      await LocalStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
      await LocalStorage.saveEmployee(empJson);

      return Employee.fromJson(empJson);
    } on FirebaseAuthException catch (e) {
      throw Exception('OTP Verification failed: ${e.message}');
    } on DioException catch (dioErr) {
      final message = dioErr.response?.data?['error']?['message'] ?? dioErr.message;
      throw Exception(message);
    } catch (e) {
      throw Exception('Login failed: ${e.toString()}');
    }
  }

  /// Logout — clear tokens and session.
  Future<void> logout() async {
    await LocalStorage.clearAuth();
    DioClient.reset();
  }

  /// Check if user is logged in.
  Future<bool> isLoggedIn() async {
    return LocalStorage.isLoggedIn;
  }

  /// Get current employee profile.
  Future<Employee> getProfile() async {
    final empJson = LocalStorage.employeeJson;
    if (empJson != null) {
      return Employee.fromJson(empJson);
    }
    
    // Fetch fresh profile from API
    try {
      final response = await _dio.get('/employees/me');
      final empData = response.data;
      await LocalStorage.saveEmployee(empData);
      return Employee.fromJson(empData);
    } catch (e) {
      throw Exception('Failed to fetch profile: ${e.toString()}');
    }
  }
}
