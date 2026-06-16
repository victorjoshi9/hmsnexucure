import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../core/constants/app_colors.dart';
import '../../core/storage/local_storage.dart';

/// Main scaffold with bottom navigation bar.
class AppScaffold extends StatelessWidget {
  final Widget child;

  const AppScaffold({super.key, required this.child});

  List<_NavItem> _getNavItems() {
    try {
      final box = Hive.box(LocalStorage.settingsBox);
      final appSettings = box.get('app_settings');
      if (appSettings != null && appSettings['bottom_navigation'] != null) {
        final List<dynamic> navData = appSettings['bottom_navigation'];
        final items = <_NavItem>[];
        for (var item in navData) {
          if (item['enabled'] == true) {
            IconData icon = Icons.info_rounded;
            switch (item['icon']) {
              case 'home':
                icon = Icons.dashboard_rounded;
                break;
              case 'history':
                icon = Icons.calendar_month_rounded;
                break;
              case 'notifications':
                icon = Icons.notifications_rounded;
                break;
              case 'profile':
                icon = Icons.person_rounded;
                break;
              case 'leave':
                icon = Icons.calendar_today_rounded;
                break;
              case 'settings':
                icon = Icons.settings_rounded;
                break;
            }
            items.add(_NavItem(
              icon: icon,
              label: item['label'],
              path: item['route'],
            ));
          }
        }
        if (items.isNotEmpty) return items;
      }
    } catch (e) {
      // ignore
    }
    return const [
      _NavItem(icon: Icons.dashboard_rounded, label: 'Home', path: '/dashboard'),
      _NavItem(icon: Icons.calendar_month_rounded, label: 'History', path: '/history'),
      _NavItem(icon: Icons.notifications_rounded, label: 'Alerts', path: '/notifications'),
      _NavItem(icon: Icons.person_rounded, label: 'Profile', path: '/profile'),
    ];
  }

  int _currentIndex(BuildContext context, List<_NavItem> items) {
    final location = GoRouterState.of(context).uri.toString();
    for (int i = 0; i < items.length; i++) {
      if (location.startsWith(items[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final navItems = _getNavItems();
    final index = _currentIndex(context, navItems);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: isDark ? AppColors.lineDark : AppColors.line,
              width: 0.5,
            ),
          ),
        ),
        child: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (i) {
            if (i != index) context.go(navItems[i].path);
          },
          backgroundColor: isDark ? AppColors.cardDark : AppColors.card,
          indicatorColor: (isDark ? AppColors.accentDark : AppColors.accent).withValues(alpha: 0.12),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          height: 64,
          destinations: navItems
              .map((item) => NavigationDestination(
                    icon: Icon(item.icon, size: 22),
                    selectedIcon: Icon(item.icon, size: 22,
                      color: isDark ? AppColors.accentDark : AppColors.accent,
                    ),
                    label: item.label,
                  ))
              .toList(),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String path;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.path,
  });
}
