import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

/// Daily attendance detail screen.
class DailyDetailScreen extends StatelessWidget {
  final String date;

  const DailyDetailScreen({super.key, required this.date});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: Text('Details — $date')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timeline
            _TimelineItem(time: '08:55 AM', title: 'Checked In', subtitle: 'Face: 97.2% · GPS: Within fence', icon: Icons.login, color: AppColors.accent3, isDark: isDark),
            _TimelineItem(time: '01:00 PM', title: 'Lunch Break Start', subtitle: 'Duration: 58 min', icon: Icons.coffee, color: AppColors.accent2, isDark: isDark),
            _TimelineItem(time: '01:58 PM', title: 'Lunch Break End', subtitle: 'Within limit ✓', icon: Icons.coffee, color: AppColors.accent2, isDark: isDark),
            _TimelineItem(time: '05:10 PM', title: 'Checked Out', subtitle: 'Face: 96.8% · GPS: Within fence', icon: Icons.logout, color: AppColors.accent, isDark: isDark, isLast: true),

            const SizedBox(height: 24),

            // Summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : AppColors.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _Row(label: 'Net Working Hours', value: '7h 17m', isDark: isDark),
                  _Row(label: 'Total Break', value: '58m', isDark: isDark),
                  _Row(label: 'Late Minutes', value: '0m', isDark: isDark),
                  _Row(label: 'Overtime', value: '10m', isDark: isDark),
                  _Row(label: 'Status', value: 'Present', isDark: isDark, isLast: true),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final String time;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final bool isDark;
  final bool isLast;

  const _TimelineItem({
    required this.time,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.isDark,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: 0.1),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 1.5,
                    color: isDark ? AppColors.lineDark : AppColors.line,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? AppColors.inkDark : AppColors.ink)),
                      Text(time, style: TextStyle(fontSize: 11, color: isDark ? AppColors.ink3Dark : AppColors.ink3, fontFamily: 'monospace')),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(subtitle, style: TextStyle(fontSize: 12, color: isDark ? AppColors.ink2Dark : AppColors.ink2)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  final bool isLast;

  const _Row({required this.label, required this.value, required this.isDark, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: isLast ? null : Border(bottom: BorderSide(color: isDark ? AppColors.lineDark : AppColors.line, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: isDark ? AppColors.ink2Dark : AppColors.ink2)),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? AppColors.inkDark : AppColors.ink)),
        ],
      ),
    );
  }
}
