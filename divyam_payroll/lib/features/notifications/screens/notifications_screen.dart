import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/notification_model.dart';
import '../../../core/utils/date_utils.dart';
import '../../../shared/widgets/empty_state.dart';

/// Notifications screen — FCM-driven notification list.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late List<AppNotification> _notifications;

  @override
  void initState() {
    super.initState();
    _notifications = AppNotification.mockNotifications;
  }

  IconData _getIcon(NotificationType type) {
    switch (type) {
      case NotificationType.attendanceAlert:
        return Icons.fingerprint_rounded;
      case NotificationType.leaveApproval:
        return Icons.check_circle_rounded;
      case NotificationType.leaveRejection:
        return Icons.cancel_rounded;
      case NotificationType.shiftChange:
        return Icons.schedule_rounded;
      case NotificationType.breakViolation:
        return Icons.warning_rounded;
      case NotificationType.correctionApproval:
        return Icons.edit_note_rounded;
      case NotificationType.correctionRejection:
        return Icons.block_rounded;
      case NotificationType.general:
        return Icons.notifications_rounded;
    }
  }

  Color _getColor(NotificationType type, bool isDark) {
    switch (type) {
      case NotificationType.attendanceAlert:
        return isDark ? AppColors.accent3Dark : AppColors.accent3;
      case NotificationType.leaveApproval:
      case NotificationType.correctionApproval:
        return isDark ? AppColors.accent3Dark : AppColors.accent3;
      case NotificationType.leaveRejection:
      case NotificationType.correctionRejection:
      case NotificationType.breakViolation:
        return isDark ? AppColors.accentDark : AppColors.accent;
      case NotificationType.shiftChange:
        return isDark ? AppColors.accent2Dark : AppColors.accent2;
      case NotificationType.general:
        return isDark ? AppColors.ink2Dark : AppColors.ink2;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _notifications = _notifications
                    .map((n) => n.copyWith(isRead: true))
                    .toList();
              });
            },
            child: const Text('Mark all read', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
      body: _notifications.isEmpty
          ? const EmptyState(
              icon: Icons.notifications_off_rounded,
              title: 'No notifications',
              subtitle: 'You\'re all caught up!',
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: _notifications.length,
              separatorBuilder: (_, _) => Divider(
                height: 1,
                color: isDark ? AppColors.lineDark : AppColors.line,
              ),
              itemBuilder: (context, index) {
                final notif = _notifications[index];
                final color = _getColor(notif.type, isDark);

                return Container(
                  color: notif.isRead
                      ? Colors.transparent
                      : (isDark ? AppColors.surfaceDark : AppColors.surface),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: color.withValues(alpha: 0.1),
                      ),
                      child: Icon(_getIcon(notif.type), size: 20, color: color),
                    ),
                    title: Text(
                      notif.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: notif.isRead ? FontWeight.w400 : FontWeight.w600,
                        color: isDark ? AppColors.inkDark : AppColors.ink,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          notif.body,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.ink2Dark : AppColors.ink2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatTime(notif.createdAt),
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                          ),
                        ),
                      ],
                    ),
                    onTap: () {
                      setState(() {
                        _notifications[index] = notif.copyWith(isRead: true);
                      });
                    },
                  ),
                );
              },
            ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return AppDateUtils.formatDate(dt);
  }
}
