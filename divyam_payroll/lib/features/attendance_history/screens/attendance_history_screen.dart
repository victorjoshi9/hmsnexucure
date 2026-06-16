import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../data/models/attendance_model.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/status_badge.dart';

/// Attendance history screen — monthly calendar view with status breakdown.
class AttendanceHistoryScreen extends ConsumerStatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  ConsumerState<AttendanceHistoryScreen> createState() =>
      _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState
    extends ConsumerState<AttendanceHistoryScreen> {
  DateTime _selectedMonth = DateTime.now();
  late List<Attendance> _records;

  @override
  void initState() {
    super.initState();
    _records = Attendance.mockMonthly;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calculate stats
    final present = _records.where((a) =>
        a.status == AttendanceStatus.present ||
        a.status == AttendanceStatus.late).length;
    final late = _records.where((a) => a.status == AttendanceStatus.late).length;
    final absent = _records.where((a) => a.status == AttendanceStatus.absent).length;
    final totalHours = _records.fold<int>(0, (s, a) => s + a.netWorkingMinutes);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance History'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Month Selector
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () {
                    setState(() {
                      _selectedMonth = DateTime(
                        _selectedMonth.year,
                        _selectedMonth.month - 1,
                      );
                    });
                  },
                ),
                Text(
                  AppDateUtils.formatMonthYear(_selectedMonth),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppColors.inkDark : AppColors.ink,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () {
                    setState(() {
                      _selectedMonth = DateTime(
                        _selectedMonth.year,
                        _selectedMonth.month + 1,
                      );
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Summary Cards
            Row(
              children: [
                _StatTile(label: 'Present', value: '$present', color: isDark ? AppColors.accent3Dark : AppColors.accent3, isDark: isDark),
                const SizedBox(width: 8),
                _StatTile(label: 'Late', value: '$late', color: isDark ? AppColors.accentDark : AppColors.accent, isDark: isDark),
                const SizedBox(width: 8),
                _StatTile(label: 'Absent', value: '$absent', color: isDark ? AppColors.ink3Dark : AppColors.ink3, isDark: isDark),
                const SizedBox(width: 8),
                _StatTile(label: 'Hours', value: AppDateUtils.formatDuration(totalHours), color: isDark ? AppColors.accent2Dark : AppColors.accent2, isDark: isDark),
              ],
            ),
            const SizedBox(height: 20),

            // Daily Records List
            Text(
              'DAILY RECORDS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                letterSpacing: 1.2,
                color: isDark ? AppColors.ink3Dark : AppColors.ink3,
              ),
            ),
            const SizedBox(height: 12),
            ..._records.map((record) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: AppCard(
                    onTap: () => context.push('/history/${AppDateUtils.formatIsoDate(record.date)}'),
                    child: Row(
                      children: [
                        // Date
                        SizedBox(
                          width: 44,
                          child: Column(
                            children: [
                              Text(
                                record.date.day.toString(),
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? AppColors.inkDark : AppColors.ink,
                                ),
                              ),
                              Text(
                                AppDateUtils.formatDay(record.date).substring(0, 3),
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 1,
                          height: 36,
                          color: isDark ? AppColors.lineDark : AppColors.line,
                          margin: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        // Times
                        Expanded(
                          child: Row(
                            children: [
                              Text(
                                record.checkInTime != null
                                    ? AppDateUtils.formatTime24(record.checkInTime!)
                                    : '--:--',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? AppColors.inkDark : AppColors.ink,
                                ),
                              ),
                              Text(
                                ' → ',
                                style: TextStyle(
                                  color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                                ),
                              ),
                              Text(
                                record.checkOutTime != null
                                    ? AppDateUtils.formatTime24(record.checkOutTime!)
                                    : '--:--',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? AppColors.inkDark : AppColors.ink,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Working hours
                        Text(
                          record.formattedWorkingHours,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.ink2Dark : AppColors.ink2,
                          ),
                        ),
                        const SizedBox(width: 8),
                        StatusBadge(status: record.status, compact: true),
                      ],
                    ),
                  ),
                )),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isDark;

  const _StatTile({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : AppColors.card,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isDark ? AppColors.lineDark : AppColors.line,
            width: 0.5,
          ),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 9,
                color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
