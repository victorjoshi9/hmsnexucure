import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../shared/widgets/primary_button.dart';

/// Check-in/out screen — face capture → GPS verify → device check → confirm.
/// Phase 1: Simulates face + GPS flow with UI mockup.
class CheckInScreen extends ConsumerStatefulWidget {
  final bool isCheckIn;

  const CheckInScreen({super.key, required this.isCheckIn});

  @override
  ConsumerState<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends ConsumerState<CheckInScreen>
    with SingleTickerProviderStateMixin {
  int _step = 0; // 0=start, 1=face, 2=gps, 3=device, 4=done
  bool _isProcessing = false;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _startVerification() async {
    setState(() => _isProcessing = true);

    // Step 1: Face Recognition
    setState(() => _step = 1);
    await Future.delayed(const Duration(seconds: 2));

    // Step 2: GPS Validation
    setState(() => _step = 2);
    await Future.delayed(const Duration(seconds: 1));

    // Step 3: Device Verification
    setState(() => _step = 3);
    await Future.delayed(const Duration(seconds: 1));

    // Step 4: Done
    setState(() {
      _step = 4;
      _isProcessing = false;
    });

    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    context.pushReplacement('/confirmation', extra: {
      'isSuccess': true,
      'isCheckIn': widget.isCheckIn,
      'timestamp': DateTime.now(),
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final action = widget.isCheckIn ? 'Check In' : 'Check Out';

    return Scaffold(
      appBar: AppBar(
        title: Text(action),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),

              // Camera Preview Placeholder
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final scale = 1.0 + (_pulseController.value * 0.03);
                  return Transform.scale(
                    scale: _step == 1 ? scale : 1.0,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _getStepColor(isDark),
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _getStepColor(isDark).withValues(alpha: 0.2),
                            blurRadius: 24,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Container(
                          color: isDark
                              ? AppColors.surfaceDark
                              : AppColors.surface,
                          child: Icon(
                            _getStepIcon(),
                            size: 64,
                            color: _getStepColor(isDark),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 32),

              // Step Title
              Text(
                _getStepTitle(),
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.inkDark : AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _getStepDescription(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppColors.ink2Dark : AppColors.ink2,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),

              // Verification Steps
              _buildStepIndicators(isDark),

              const Spacer(),

              // Start Button
              if (_step == 0)
                PrimaryButton(
                  label: 'Start $action',
                  onPressed: _startVerification,
                  icon: Icons.fingerprint_rounded,
                ),
              if (_isProcessing)
                const Center(
                  child: CircularProgressIndicator(),
                ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepIndicators(bool isDark) {
    final steps = [
      'Face Recognition',
      'GPS Validation',
      'Device Check',
      'Complete',
    ];

    return Column(
      children: List.generate(steps.length, (i) {
        final stepNum = i + 1;
        final isCompleted = _step > stepNum;
        final isCurrent = _step == stepNum;

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              // Step indicator
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted
                      ? (isDark ? AppColors.accent3Dark : AppColors.accent3)
                      : isCurrent
                          ? (isDark ? AppColors.accentDark : AppColors.accent)
                          : (isDark ? AppColors.surfaceDark : AppColors.surface),
                  border: Border.all(
                    color: isCompleted || isCurrent
                        ? Colors.transparent
                        : (isDark ? AppColors.lineDark : AppColors.line),
                  ),
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : isCurrent
                          ? const SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              '$stepNum',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                              ),
                            ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                steps[i],
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w400,
                  color: isCompleted || isCurrent
                      ? (isDark ? AppColors.inkDark : AppColors.ink)
                      : (isDark ? AppColors.ink3Dark : AppColors.ink3),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Color _getStepColor(bool isDark) {
    if (_step == 4) return isDark ? AppColors.accent3Dark : AppColors.accent3;
    if (_step > 0) return isDark ? AppColors.accentDark : AppColors.accent;
    return isDark ? AppColors.lineDark : AppColors.line;
  }

  IconData _getStepIcon() {
    switch (_step) {
      case 0:
        return Icons.face_rounded;
      case 1:
        return Icons.face_retouching_natural;
      case 2:
        return Icons.gps_fixed_rounded;
      case 3:
        return Icons.phone_android_rounded;
      case 4:
        return Icons.check_circle_rounded;
      default:
        return Icons.face_rounded;
    }
  }

  String _getStepTitle() {
    switch (_step) {
      case 0:
        return 'Ready to ${widget.isCheckIn ? "Check In" : "Check Out"}';
      case 1:
        return 'Verifying Face...';
      case 2:
        return 'Checking Location...';
      case 3:
        return 'Verifying Device...';
      case 4:
        return 'Verification Complete!';
      default:
        return '';
    }
  }

  String _getStepDescription() {
    switch (_step) {
      case 0:
        return 'We\'ll verify your identity with face recognition, check your GPS location, and confirm your device.';
      case 1:
        return 'Look at the camera and follow the prompts.\nBlink and turn your head slightly.';
      case 2:
        return 'Confirming you\'re within the hospital geo-fence.';
      case 3:
        return 'Matching your registered device.';
      case 4:
        return 'All checks passed. Redirecting...';
      default:
        return '';
    }
  }
}
