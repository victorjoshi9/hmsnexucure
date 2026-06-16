import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import 'dart:convert';
import 'package:camera/camera.dart';
import '../../../core/constants/app_colors.dart';
import '../../../providers/attendance_provider.dart';
import '../../../providers/auth_provider.dart';

class FaceScannerScreen extends ConsumerStatefulWidget {
  const FaceScannerScreen({super.key});

  @override
  ConsumerState<FaceScannerScreen> createState() => _FaceScannerScreenState();
}

class _FaceScannerScreenState extends ConsumerState<FaceScannerScreen> with SingleTickerProviderStateMixin {
  late AnimationController _scanController;
  CameraController? _cameraController;
  bool _isSuccess = false;
  bool _isProcessing = false;
  bool _isLate = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) throw Exception('No cameras found');

      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _cameraController!.initialize();
      if (mounted) setState(() {});

      // Auto-capture after 2 seconds of camera ready
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted && !_isSuccess) {
          _handleFaceMatch();
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = e.toString());
      }
    }
  }

  @override
  void dispose() {
    _scanController.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _handleFaceMatch() async {
    if (!mounted || _cameraController == null || !_cameraController!.value.isInitialized) return;
    
    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      // 1. Capture Image
      final XFile photo = await _cameraController!.takePicture();
      final bytes = await photo.readAsBytes();
      final base64Image = base64Encode(bytes);

      // 2. Verify with Backend
      final employee = ref.read(authProvider).employee;
      if (employee == null) throw Exception('User not logged in');

      // We use the same face-login endpoint for verification during attendance
      // It returns employee data if match, or error if not
      await ref.read(authProvider.notifier).loginWithFace(
        mobile: employee.mobile ?? '',
        imageBase64: base64Image,
      );
      
      // If we are here, it means loginWithFace (verification) succeeded
      
      // 3. Record Attendance
      final attendanceState = ref.read(attendanceProvider);
      final isCheckedIn = attendanceState.todayAttendance?.isCheckedIn ?? false;
      
      if (isCheckedIn) {
        await ref.read(attendanceProvider.notifier).checkOut(
          lat: 0.0, 
          lng: 0.0, 
          faceScore: 0.99
        );
        setState(() {
          _isLate = false;
        });
      } else {
        await ref.read(attendanceProvider.notifier).checkIn(
          employeeId: employee.id,
          lat: 0.0, 
          lng: 0.0, 
          faceScore: 0.99,
          deviceId: 'mobile_app'
        );
        
        final now = DateTime.now();
        final shiftStart = DateTime(now.year, now.month, now.day, 9, 0); 
        final gracePeriod = shiftStart.add(const Duration(minutes: 15)); 
        
        setState(() {
          _isLate = now.isAfter(gracePeriod);
        });
      }

      setState(() {
        _isProcessing = false;
        _isSuccess = true;
      });

      // Auto-close after 3.5 seconds
      Future.delayed(const Duration(milliseconds: 3500), () {
        if (mounted) {
          context.go('/dashboard');
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
        // Retry after 3 seconds if failed
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted && !_isSuccess) _handleFaceMatch();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final timeString = "${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}";
    final dateString = "${now.day}/${now.month}/${now.year}";
    
    final attendanceState = ref.watch(attendanceProvider);
    final isCheckedIn = attendanceState.todayAttendance?.isCheckedIn ?? false;
    final actionText = isCheckedIn ? 'Checking Out...' : 'Checking In...';
    final successText = isCheckedIn ? 'Check Out Successful' : 'Check In Successful';

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── Simulated Camera View ────────────────────────
          Center(
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey[900],
                border: Border.all(color: _isSuccess ? AppColors.accent3 : AppColors.accent, width: 4),
              ),
              child: ClipOval(
                child: Stack(
                  children: [
                    // Camera preview
                    if (_cameraController != null && _cameraController!.value.isInitialized)
                      Transform.scale(
                        scale: 1.5,
                        child: Center(
                          child: CameraPreview(_cameraController!),
                        ),
                      )
                    else
                      Center(
                        child: Icon(
                          Icons.person_outline,
                          size: 150,
                          color: Colors.white.withValues(alpha: 0.2),
                        ),
                      ),
                    
                    // Scanning line animation
                    if (!_isSuccess && !_isProcessing && _errorMessage == null)
                      AnimatedBuilder(
                        animation: _scanController,
                        builder: (context, child) {
                          return Positioned(
                            top: _scanController.value * 300,
                            left: 0,
                            right: 0,
                            child: Container(
                              height: 4,
                              decoration: BoxDecoration(
                                color: AppColors.accent,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.accent.withValues(alpha: 0.8),
                                    blurRadius: 10,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
          ),

          // ── Header ──────────────────────────────────────
          Positioned(
            top: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Text(
                  'Face Recognition',
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _isSuccess ? 'Matched!' : (_isProcessing ? 'Verifying...' : 'Please look at the camera'),
                  style: TextStyle(color: _errorMessage != null ? Colors.redAccent : Colors.white.withValues(alpha: 0.7), fontSize: 16),
                ),
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 8),
                    child: Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
          ),

          // ── Success Popup ───────────────────────────────
          if (_isSuccess)
            Positioned(
              bottom: 100,
              left: 20,
              right: 20,
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.0, end: 1.0),
                duration: const Duration(milliseconds: 500),
                curve: Curves.elasticOut,
                builder: (context, value, child) {
                  final isLateStatus = !isCheckedIn && _isLate;
                  final popupColor = isLateStatus ? const Color(0xFFFFF4F2) : const Color(0xFFF0FDF4);
                  final iconColor = isLateStatus ? const Color(0xFFE11D48) : const Color(0xFF16A34A);
                  final shadowColor = isLateStatus ? const Color(0xFFE11D48) : const Color(0xFF16A34A);
                  final message = isCheckedIn 
                      ? 'Check Out Successful' 
                      : (isLateStatus 
                          ? 'Oops, bad luck! You are late today. Check in successfully recorded.' 
                          : 'Congratulations! You are on time. Check in successfully recorded.');

                  return Transform.scale(
                    scale: value,
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: popupColor,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.8), width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: shadowColor.withValues(alpha: 0.2),
                            blurRadius: 30,
                            spreadRadius: 5,
                          ),
                          BoxShadow(
                            color: Colors.white.withValues(alpha: 0.5),
                            blurRadius: 10,
                            spreadRadius: -5,
                            offset: const Offset(-5, -5),
                          )
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isLateStatus ? Icons.error_outline_rounded : Icons.check_circle_rounded, 
                            color: iconColor, 
                            size: 64
                          ),
                          const SizedBox(height: 16),
                          Text(
                            message,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87, height: 1.3),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.access_time_rounded, size: 18, color: iconColor),
                                const SizedBox(width: 8),
                                Text(
                                  '$dateString  •  $timeString',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: iconColor),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

          // ── Back Button ─────────────────────────────────
          Positioned(
            top: 50,
            left: 20,
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
              onPressed: () => context.pop(),
            ),
          ),
        ],
      ),
    );
  }
}
