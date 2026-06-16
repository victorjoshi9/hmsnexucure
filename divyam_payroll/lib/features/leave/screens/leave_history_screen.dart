import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/leave_request_model.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/empty_state.dart';

/// Leave history screen — past requests with status.
class LeaveHistoryScreen extends StatelessWidget {
  const LeaveHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final leaves = LeaveRequest.mockHistory;

    return Scaffold(
      appBar: AppBar(title: const Text('Leave History')),
      body: leaves.isEmpty
          ? const EmptyState(
              icon: Icons.event_busy_rounded,
              title: 'No leave requests',
              subtitle: 'Your leave history will appear here.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: leaves.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final leave = leaves[index];
                return AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            leave.leaveTypeName,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppColors.inkDark : AppColors.ink,
                            ),
                          ),
                          _StatusChip(status: leave.status, isDark: isDark),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${leave.fromDate.day}/${leave.fromDate.month} → ${leave.toDate.day}/${leave.toDate.month} · ${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.ink2Dark : AppColors.ink2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        leave.reason,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (leave.approverName != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          'Approved by ${leave.approverName}',
                          style: TextStyle(
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                            color: isDark ? AppColors.accent3Dark : AppColors.accent3,
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final LeaveStatus status;
  final bool isDark;

  const _StatusChip({required this.status, required this.isDark});

  @override
  Widget build(BuildContext context) {
    Color bg, fg;
    String label;

    switch (status) {
      case LeaveStatus.pending:
        bg = isDark ? AppColors.overtimeBgDark : AppColors.overtimeBg;
        fg = isDark ? AppColors.warningDark : AppColors.warning;
        label = 'Pending';
        break;
      case LeaveStatus.approved:
        bg = isDark ? AppColors.presentBgDark : AppColors.presentBg;
        fg = isDark ? AppColors.accent3Dark : AppColors.accent3;
        label = 'Approved';
        break;
      case LeaveStatus.rejected:
        bg = isDark ? AppColors.lateBgDark : AppColors.lateBg;
        fg = isDark ? AppColors.accentDark : AppColors.accent;
        label = 'Rejected';
        break;
      case LeaveStatus.cancelled:
        bg = isDark ? AppColors.absentBgDark : AppColors.absentBg;
        fg = isDark ? AppColors.ink3Dark : AppColors.ink3;
        label = 'Cancelled';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }
}
