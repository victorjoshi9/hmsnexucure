import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../shared/widgets/primary_button.dart';

/// Confirmation screen — shows success/failure after check-in/out.
class ConfirmationScreen extends StatelessWidget {
  final bool isSuccess;
  final bool isCheckIn;
  final DateTime timestamp;

  const ConfirmationScreen({
    super.key,
    required this.isSuccess,
    required this.isCheckIn,
    required this.timestamp,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final action = isCheckIn ? 'Check In' : 'Check Out';

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),

              // Icon
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSuccess
                      ? (isDark ? AppColors.accent3Dark : AppColors.accent3).withValues(alpha: 0.1)
                      : (isDark ? AppColors.accentDark : AppColors.accent).withValues(alpha: 0.1),
                ),
                child: Icon(
                  isSuccess ? Icons.check_circle_rounded : Icons.error_rounded,
                  size: 56,
                  color: isSuccess
                      ? (isDark ? AppColors.accent3Dark : AppColors.accent3)
                      : (isDark ? AppColors.accentDark : AppColors.accent),
                ),
              ),
              const SizedBox(height: 24),

              Text(
                isSuccess ? '$action Successful!' : '$action Failed',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppColors.inkDark : AppColors.ink,
                ),
              ),
              const SizedBox(height: 12),

              Text(
                isSuccess
                    ? '$action recorded at ${AppDateUtils.formatTime(timestamp)}'
                    : 'Please try again. Contact HR if the issue persists.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? AppColors.ink2Dark : AppColors.ink2,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),

              // Details Card
              if (isSuccess)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDark : AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? AppColors.lineDark : AppColors.line,
                      width: 0.5,
                    ),
                  ),
                  child: Column(
                    children: [
                      _DetailRow(label: 'Time', value: AppDateUtils.formatTime(timestamp), isDark: isDark),
                      _DetailRow(label: 'Date', value: AppDateUtils.formatDate(timestamp), isDark: isDark),
                      _DetailRow(label: 'Face Score', value: '97.2%', isDark: isDark),
                      _DetailRow(label: 'GPS', value: 'Within geo-fence ✓', isDark: isDark),
                      _DetailRow(label: 'Device', value: 'Verified ✓', isDark: isDark, isLast: true),
                    ],
                  ),
                ),

              const Spacer(),

              PrimaryButton(
                label: 'Back to Dashboard',
                onPressed: () => context.go('/dashboard'),
                icon: Icons.dashboard_rounded,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  final bool isLast;

  const _DetailRow({
    required this.label,
    required this.value,
    required this.isDark,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(
                bottom: BorderSide(
                  color: isDark ? AppColors.lineDark : AppColors.line,
                  width: 0.5,
                ),
              ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? AppColors.ink3Dark : AppColors.ink3,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: isDark ? AppColors.inkDark : AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}
