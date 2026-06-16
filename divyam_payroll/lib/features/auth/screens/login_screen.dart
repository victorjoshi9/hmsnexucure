import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:ui';
import 'dart:convert';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import '../../../providers/auth_provider.dart';

/// Neumorphic Face Scan Login Screen
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phoneController = TextEditingController();
  
  bool _isScanningFace = false;
  bool _isEnteringOtp = false;
  bool _isLoading = false;
  final _otpController = TextEditingController();
  CameraController? _cameraController;
  List<CameraDescription>? _availableCameras;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _handleOtpLogin(String phone) async {
    String otp = _otpController.text.trim();
    if (otp.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).verifyOtp(
        phone: phone,
        otp: otp,
      );
      if (mounted) {
        context.go('/dashboard');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  Future<void> _startOtpFlow() async {
    String rawPhone = _phoneController.text.trim();
    if (rawPhone.isEmpty) return;

    String phone = rawPhone.replaceAll(RegExp(r'[^\d+]'), '');
    if (!phone.startsWith('+91')) {
      if (phone.startsWith('0')) phone = phone.substring(1);
      phone = '+91$phone';
    }

    if (phone.length < 13) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit mobile number')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).sendOtp(phone);
      setState(() {
        _isEnteringOtp = true;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send OTP: ${e.toString()}')),
      );
    }
  }

  Future<void> _startFaceScan() async {
    String rawPhone = _phoneController.text.trim();
    if (rawPhone.isEmpty) return;

    // Sanitize: strip non-digits except '+'
    String phone = rawPhone.replaceAll(RegExp(r'[^\d+]'), '');
    if (phone.startsWith('+91')) {
      // Already has country code +91
    } else if (phone.startsWith('91') && phone.length == 12) {
      phone = '+$phone';
    } else {
      if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      phone = '+91$phone';
    }

    if (phone.length < 13) { // +91 (3 chars) + 10 digits = 13 chars
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit mobile number')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      _availableCameras = await availableCameras();
      if (_availableCameras == null || _availableCameras!.isEmpty) {
        throw Exception('No camera devices found.');
      }

      // Find front camera
      CameraDescription frontCamera = _availableCameras!.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => _availableCameras!.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _cameraController!.initialize();

      setState(() {
        _isScanningFace = true;
        _isLoading = false;
      });

      // Wait 3 seconds to let user align face, then auto-capture
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _isScanningFace) {
          _captureAndVerify(phone);
        }
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start camera: ${e.toString().replaceFirst('Exception: ', '')}')),
      );
    }
  }

  Future<void> _captureAndVerify(String normalizedPhone) async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) return;

    setState(() => _isLoading = true);

    try {
      final XFile photo = await _cameraController!.takePicture();
      final bytes = await photo.readAsBytes();
      final base64Image = base64Encode(bytes);

      await ref.read(authProvider.notifier).loginWithFace(
        mobile: normalizedPhone,
        imageBase64: base64Image,
      );

      // Clean up camera and transition
      await _cameraController?.dispose();
      _cameraController = null;

      if (mounted) {
        context.go('/dashboard');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Retry Scan',
              onPressed: () => _captureAndVerify(normalizedPhone),
            ),
          ),
        );
      }
    }
  }

  void _cancelFaceScan() async {
    setState(() => _isLoading = true);
    await _cameraController?.dispose();
    _cameraController = null;
    setState(() {
      _isScanningFace = false;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    const bgColor = Color(0xFFEBE6E4); // Soft beige from reference

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),

              // Camera Preview or Fingerprint Icon
              Center(
                child: Container(
                  width: 240,
                  height: 240,
                  decoration: const BoxDecoration(
                    color: bgColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.white, blurRadius: 20, offset: Offset(-10, -10)),
                      BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(10, 10)),
                    ],
                  ),
                  child: ClipOval(
                    child: Padding(
                      padding: _isScanningFace ? EdgeInsets.zero : const EdgeInsets.all(20.0),
                      child: _isScanningFace && _cameraController != null && _cameraController!.value.isInitialized
                          ? Stack(
                              children: [
                                CameraPreview(_cameraController!),
                                // Scanning guide ring
                                Container(
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.orange.withValues(alpha: 0.6), width: 4),
                                  ),
                                ),
                                // Scanning line overlay
                                const Positioned.fill(
                                  child: Center(
                                    child: CircularProgressIndicator(
                                      color: Colors.orange,
                                      strokeWidth: 2,
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : Image.network(
                              'https://cdn3d.iconscout.com/3d/premium/thumb/fingerprint-scan-6831518-5602796.png', // Fallback 3D graphic
                              fit: BoxFit.contain,
                              errorBuilder: (c, e, s) => const Icon(Icons.fingerprint, size: 80, color: Colors.orange),
                            ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),

              // Title
              Center(
                child: Text(
                  _isScanningFace ? 'Face Scan' : 'Sign-In',
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFD62828), // Reddish text from reference
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              const SizedBox(height: 40),

              if (!_isScanningFace && !_isEnteringOtp) ...[
                const Text('Mobile Number', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF555555))),
                const SizedBox(height: 8),
                _NeumorphicTextField(
                  controller: _phoneController,
                  hintText: 'Enter Mobile Number',
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 24),
              ] else if (_isEnteringOtp) ...[
                const Text('OTP Verification', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF555555))),
                const SizedBox(height: 8),
                _NeumorphicTextField(
                  controller: _otpController,
                  hintText: 'Enter 6-digit OTP',
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => setState(() => _isEnteringOtp = false),
                    child: const Text('Change Number', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  ),
                ),
                const SizedBox(height: 12),
              ] else ...[
                const Center(
                  child: Text(
                    'Position your face in the circle.\nWe are scanning and verifying your face.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF666666), height: 1.4),
                  ),
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.center,
                  child: TextButton(
                    onPressed: _isLoading ? null : _cancelFaceScan,
                    child: const Text('Cancel & Edit Number', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Action Button
              if (!_isScanningFace)
                Center(
                  child: GestureDetector(
                    onTap: _isLoading 
                      ? null 
                      : (_isEnteringOtp 
                          ? () => _handleOtpLogin(_phoneController.text) 
                          : _startFaceScan), // Face scan is primary, but we'll add OTP option
                    child: Container(
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF79100), Color(0xFFE93100)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFE93100).withValues(alpha: 0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Center(
                        child: _isLoading 
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(
                              _isEnteringOtp ? 'Verify OTP' : 'Start Face Login',
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1),
                            ),
                      ),
                    ),
                  ),
                ),
              
              if (!_isScanningFace && !_isEnteringOtp) ...[
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: _isLoading ? null : _startOtpFlow,
                    child: const Text(
                      'Login with OTP instead',
                      style: TextStyle(color: Color(0xFFD62828), fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

class _NeumorphicTextField extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final TextInputType keyboardType;

  const _NeumorphicTextField({required this.controller, required this.hintText, required this.keyboardType});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFEBE6E4),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Colors.black12, offset: Offset(4, 4), blurRadius: 8),
          BoxShadow(color: Colors.white, offset: Offset(-4, -4), blurRadius: 8),
        ],
      ),
      // We simulate inset shadows via a stacked approach since flutter standard BoxShadow doesn't do inset easily.
      // However, for pure Flutter standard, we can use an inner shadow trick.
      child: InnerShadow(
        blur: 5,
        color: Colors.black.withValues(alpha: 0.1),
        offset: const Offset(3, 3),
        child: InnerShadow(
          blur: 5,
          color: Colors.white,
          offset: const Offset(-3, -3),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: const TextStyle(fontSize: 16, color: Colors.black87),
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: const TextStyle(color: Colors.black38),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            ),
          ),
        ),
      ),
    );
  }
}

class InnerShadow extends SingleChildRenderObjectWidget {
  const InnerShadow({
    super.key,
    this.blur = 10,
    this.color = Colors.black38,
    this.offset = const Offset(10, 10),
    Widget? child,
  }) : super(child: child);

  final double blur;
  final Color color;
  final Offset offset;

  @override
  RenderObject createRenderObject(BuildContext context) {
    final RenderInnerShadow renderObject = RenderInnerShadow();
    updateRenderObject(context, renderObject);
    return renderObject;
  }

  @override
  void updateRenderObject(BuildContext context, RenderInnerShadow renderObject) {
    renderObject
      ..color = color
      ..blur = blur
      ..dx = offset.dx
      ..dy = offset.dy;
  }
}

class RenderInnerShadow extends RenderProxyBox {
  late Color color;
  late double blur;
  late double dx;
  late double dy;

  @override
  void paint(PaintingContext context, Offset offset) {
    if (child == null) return;

    final Rect rectOuter = offset & size;
    final Rect rectInner = Rect.fromLTWH(
      offset.dx,
      offset.dy,
      size.width,
      size.height,
    );

    final Canvas canvas = context.canvas..saveLayer(rectOuter, Paint());
    context.paintChild(child!, offset);

    final Paint shadowPaint = Paint()
      ..blendMode = BlendMode.srcATop
      ..colorFilter = ColorFilter.mode(color, BlendMode.srcOut)
      ..imageFilter = ImageFilter.blur(sigmaX: blur, sigmaY: blur);

    canvas
      ..saveLayer(rectOuter, shadowPaint)
      ..translate(dx, dy);
    context.paintChild(child!, offset);
    context.canvas..restore()..restore();
  }
}
