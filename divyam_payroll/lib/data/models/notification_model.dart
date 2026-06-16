/// Notification type for HAMS.
enum NotificationType {
  attendanceAlert,
  leaveApproval,
  leaveRejection,
  shiftChange,
  breakViolation,
  correctionApproval,
  correctionRejection,
  general,
}

/// In-app notification model.
class AppNotification {
  final String id;
  final String title;
  final String body;
  final NotificationType type;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? data;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    this.isRead = false,
    required this.createdAt,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      type: NotificationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => NotificationType.general,
      ),
      isRead: json['is_read'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      data: json['data'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'type': type.name,
        'is_read': isRead,
        'created_at': createdAt.toIso8601String(),
        'data': data,
      };

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
      data: data,
    );
  }

  /// Mock notifications.
  static List<AppNotification> get mockNotifications => [
        AppNotification(
          id: 'notif-1',
          title: 'Check-In Successful',
          body: 'You checked in at 08:55 AM. Have a great shift!',
          type: NotificationType.attendanceAlert,
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
        ),
        AppNotification(
          id: 'notif-2',
          title: 'Leave Approved',
          body: 'Your casual leave for Jun 20 has been approved by Dr. Priya Mehta.',
          type: NotificationType.leaveApproval,
          isRead: true,
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
        ),
        AppNotification(
          id: 'notif-3',
          title: 'Break Violation',
          body: 'Your lunch break exceeded by 15 min. Manager has been notified.',
          type: NotificationType.breakViolation,
          createdAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
        AppNotification(
          id: 'notif-4',
          title: 'Shift Change',
          body: 'Your shift has been changed to Morning Shift effective Jul 1.',
          type: NotificationType.shiftChange,
          isRead: true,
          createdAt: DateTime.now().subtract(const Duration(days: 3)),
        ),
      ];
}
