import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/employee_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../shared/widgets/app_card.dart';

/// Profile screen — employee info, device info, settings.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final employee = ref.watch(authProvider).employee ?? Employee.mock;
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar + Name
            CircleAvatar(
              radius: 40,
              backgroundColor: isDark ? AppColors.accentDark : AppColors.accent,
              child: Text(
                employee.fullName.isNotEmpty ? employee.fullName[0] : 'U',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              employee.fullName,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.inkDark : AppColors.ink,
              ),
            ),
            Text(
              employee.designation ?? 'Staff',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.ink2Dark : AppColors.ink2,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: (isDark ? AppColors.accentDark : AppColors.accent).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                employee.employeeCode,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.accentDark : AppColors.accent,
                  letterSpacing: 0.5,
                  fontFamily: 'monospace',
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Info Cards
            AppCard(
              child: Column(
                children: [
                  _InfoRow(icon: Icons.apartment_rounded, label: 'Department', value: employee.departmentName ?? '-', isDark: isDark),
                  _InfoRow(icon: Icons.schedule_rounded, label: 'Shift', value: employee.shiftName ?? '-', isDark: isDark),
                  _InfoRow(icon: Icons.email_outlined, label: 'Email', value: employee.email ?? '-', isDark: isDark),
                  _InfoRow(icon: Icons.phone_outlined, label: 'Phone', value: employee.phone ?? '-', isDark: isDark),
                  _InfoRow(icon: Icons.phone_android, label: 'Device ID', value: employee.deviceId?.substring(0, 12) ?? '-', isDark: isDark, isLast: true),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Settings
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SETTINGS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 1.2,
                      color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Theme Mode
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.dark_mode_outlined, size: 20,
                            color: isDark ? AppColors.ink2Dark : AppColors.ink2),
                          const SizedBox(width: 12),
                          Text('Dark Mode', style: TextStyle(
                            fontSize: 14,
                            color: isDark ? AppColors.inkDark : AppColors.ink,
                          )),
                        ],
                      ),
                      Switch.adaptive(
                        value: themeMode == ThemeMode.dark,
                        activeColor: isDark ? AppColors.accentDark : AppColors.accent,
                        onChanged: (v) {
                          ref.read(themeModeProvider.notifier).state =
                              v ? ThemeMode.dark : ThemeMode.light;
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick Actions
            AppCard(
              child: Column(
                children: [
                  _ActionTile(
                    icon: Icons.history_rounded,
                    label: 'Leave History',
                    onTap: () => context.push('/leave/history'),
                    isDark: isDark,
                  ),
                  _ActionTile(
                    icon: Icons.edit_note_rounded,
                    label: 'Correction Request',
                    onTap: () => context.push('/correction'),
                    isDark: isDark,
                  ),
                  _ActionTile(
                    icon: Icons.help_outline_rounded,
                    label: 'Help & Support',
                    onTap: () {},
                    isDark: isDark,
                    isLast: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  ref.read(authProvider.notifier).logout();
                  context.go('/login');
                },
                icon: Icon(Icons.logout_rounded, size: 18,
                  color: isDark ? AppColors.accentDark : AppColors.accent),
                label: Text('Sign Out', style: TextStyle(
                  color: isDark ? AppColors.accentDark : AppColors.accent,
                )),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: (isDark ? AppColors.accentDark : AppColors.accent).withValues(alpha: 0.3),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Version
            Text(
              'HAMS v1.0.0 · Divyam Hospital',
              style: TextStyle(
                fontSize: 10,
                color: isDark ? AppColors.ink3Dark : AppColors.ink3,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isDark;
  final bool isLast;

  const _InfoRow({
    required this.icon,
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
        border: isLast ? null : Border(
          bottom: BorderSide(
            color: isDark ? AppColors.lineDark : AppColors.line,
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: isDark ? AppColors.ink3Dark : AppColors.ink3),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label, style: TextStyle(
              fontSize: 13,
              color: isDark ? AppColors.ink2Dark : AppColors.ink2,
            )),
          ),
          Text(value, style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isDark ? AppColors.inkDark : AppColors.ink,
          )),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDark;
  final bool isLast;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.isDark,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: isLast ? null : Border(
            bottom: BorderSide(
              color: isDark ? AppColors.lineDark : AppColors.line,
              width: 0.5,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: isDark ? AppColors.ink2Dark : AppColors.ink2),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: TextStyle(
                fontSize: 14,
                color: isDark ? AppColors.inkDark : AppColors.ink,
              )),
            ),
            Icon(Icons.chevron_right, size: 18,
              color: isDark ? AppColors.ink3Dark : AppColors.ink3),
          ],
        ),
      ),
    );
  }
}
