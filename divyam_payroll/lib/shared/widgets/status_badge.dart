import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/attendance_model.dart';

/// Status badge for attendance states (Present, Late, Absent, etc.).
class StatusBadge extends StatelessWidget {
  final AttendanceStatus status;
  final String? customLabel;
  final bool compact;

  const StatusBadge({
    super.key,
    required this.status,
    this.customLabel,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final config = _getConfig(isDark);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 10,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: config.bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        customLabel ?? config.label,
        style: TextStyle(
          fontFamily: 'DM Mono',
          fontSize: compact ? 9 : 11,
          fontWeight: FontWeight.w500,
          color: config.fg,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  _BadgeConfig _getConfig(bool isDark) {
    switch (status) {
      case AttendanceStatus.present:
        return _BadgeConfig(
          label: 'Present',
          bg: isDark ? AppColors.presentBgDark : AppColors.presentBg,
          fg: isDark ? AppColors.accent3Dark : AppColors.accent3,
        );
      case AttendanceStatus.late:
        return _BadgeConfig(
          label: 'Late',
          bg: isDark ? AppColors.lateBgDark : AppColors.lateBg,
          fg: isDark ? AppColors.accentDark : AppColors.accent,
        );
      case AttendanceStatus.absent:
        return _BadgeConfig(
          label: 'Absent',
          bg: isDark ? AppColors.absentBgDark : AppColors.absentBg,
          fg: isDark ? AppColors.ink3Dark : AppColors.ink3,
        );
      case AttendanceStatus.halfDay:
        return _BadgeConfig(
          label: 'Half Day',
          bg: isDark ? AppColors.overtimeBgDark : AppColors.overtimeBg,
          fg: isDark ? AppColors.warningDark : AppColors.warning,
        );
      case AttendanceStatus.onLeave:
        return _BadgeConfig(
          label: 'On Leave',
          bg: isDark ? AppColors.onBreakBgDark : AppColors.onBreakBg,
          fg: isDark ? AppColors.accent2Dark : AppColors.accent2,
        );
      case AttendanceStatus.weeklyOff:
        return _BadgeConfig(
          label: 'Week Off',
          bg: isDark ? AppColors.absentBgDark : AppColors.absentBg,
          fg: isDark ? AppColors.ink3Dark : AppColors.ink3,
        );
      case AttendanceStatus.holiday:
        return _BadgeConfig(
          label: 'Holiday',
          bg: isDark ? AppColors.presentBgDark : AppColors.presentBg,
          fg: isDark ? AppColors.accent3Dark : AppColors.accent3,
        );
    }
  }
}

class _BadgeConfig {
  final String label;
  final Color bg;
  final Color fg;

  const _BadgeConfig({
    required this.label,
    required this.bg,
    required this.fg,
  });
}
