import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/utils/date_utils.dart';
import '../../../data/models/employee_model.dart';
import '../../../data/models/shift_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/attendance_provider.dart';
import '../../../providers/break_provider.dart';
import '../../../providers/shift_provider.dart';
import '../../../shared/widgets/glass_card.dart';

/// V2 Glossymorphism Dashboard with Dynamic Central Buttons
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final employee = ref.read(authProvider).employee;
      if (employee != null) {
        ref.read(attendanceProvider.notifier).loadTodayStatus(employee.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final employee = ref.watch(authProvider).employee;
    if (employee == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    
    final attendance = ref.watch(attendanceProvider);
    final currentBreak = ref.watch(breakProvider).activeBreak;
    final shift = ref.watch(currentShiftProvider);
    
    final isCheckedIn = attendance.todayAttendance?.isCheckedIn ?? false;
    final isOnBreak = currentBreak != null;

    return Scaffold(
      extendBody: true, // For glass bottom nav
      body: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.paperDark : AppColors.paper,
          image: DecorationImage(
            image: AssetImage('assets/images/bg_blur.png'), // Assume a gradient blur bg exists
            fit: BoxFit.cover,
            opacity: isDark ? 0.2 : 0.4,
          ),
        ),
        child: CustomScrollView(
          slivers: [
            // ── Greeting Header ───────────────────────────────
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: GlassCard(
                    isDark: isDark,
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              AppDateUtils.getGreeting(),
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              employee.fullName,
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: isDark ? AppColors.inkDark : AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${shift.name} · ${shift.formattedTimeRange}',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.accent,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () => context.push('/profile'),
                          child: CircleAvatar(
                            radius: 24,
                            backgroundColor: AppColors.accent.withValues(alpha: 0.2),
                            child: Text(
                              employee.fullName.isNotEmpty ? employee.fullName[0] : 'U',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: AppColors.accent,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // ── Dynamic Action Center ─────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
                child: _buildDynamicActionCenter(context, isDark, isCheckedIn, isOnBreak),
              ),
            ),

            // ── Today's Stats (Glassy) ─────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: GlassCard(
                  isDark: isDark,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Today's Overview",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.inkDark : AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _StatItem(
                            label: 'Check In',
                            value: attendance.todayAttendance?.checkInTime != null
                                ? AppDateUtils.formatTime(attendance.todayAttendance!.checkInTime!)
                                : '--:--',
                            isDark: isDark,
                          ),
                          _StatItem(
                            label: 'Working Hr',
                            value: attendance.todayAttendance?.formattedWorkingHours ?? '0h 0m',
                            isDark: isDark,
                          ),
                          _StatItem(
                            label: 'Break',
                            value: '${attendance.todayAttendance?.totalBreakMinutes ?? 0}m',
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            const SliverToBoxAdapter(child: SizedBox(height: 100)), // Space for bottom nav
          ],
        ),
      ),
      
      // ── Glossy Bottom Navigation ────────────────────────
      bottomNavigationBar: Container(
        margin: const EdgeInsets.all(20).copyWith(bottom: 24),
        child: GlassCard(
          isDark: isDark,
          borderRadius: 30,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavIcon(icon: Icons.home_rounded, label: 'Home', isActive: _currentIndex == 0, onTap: () => setState(() => _currentIndex = 0)),
              _NavIcon(icon: Icons.history_rounded, label: 'History', isActive: _currentIndex == 1, onTap: () => context.push('/history')),
              _NavIcon(icon: Icons.event_note_rounded, label: 'Leave', isActive: _currentIndex == 2, onTap: () => context.push('/leave/request')),
              _NavIcon(icon: Icons.person_rounded, label: 'Profile', isActive: _currentIndex == 3, onTap: () => context.push('/profile')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDynamicActionCenter(BuildContext context, bool isDark, bool isCheckedIn, bool isOnBreak) {
    if (!isCheckedIn) {
      // Massive Check-in Circle
      return Center(
        child: GestureDetector(
          onTap: () => context.push('/face-scan'),
          child: Container(
            width: 220,
            height: 220,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppColors.glossyGradient,
              boxShadow: [
                BoxShadow(
                  color: AppColors.accent.withValues(alpha: 0.3),
                  blurRadius: 30,
                  spreadRadius: 10,
                ),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Inner Glass
                Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.2),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2),
                  ),
                ),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.fingerprint_rounded, size: 56, color: AppColors.accent),
                    const SizedBox(height: 8),
                    const Text(
                      'CHECK IN',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                        color: AppColors.accent,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Checked In state: Show Break and Check Out sequentially
    return Column(
      children: [
        // Working Pulse Indicator
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.accent3.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.accent3.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8, height: 8,
                decoration: const BoxDecoration(color: AppColors.accent3, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(
                isOnBreak ? 'ON BREAK' : 'ACTIVE SHIFT',
                style: const TextStyle(color: AppColors.accent3, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (!isOnBreak)
              _AnimatedActionButton(
                icon: Icons.coffee_rounded,
                label: 'Start Break',
                gradient: const LinearGradient(colors: [Color(0xFF4A8AD4), Color(0xFF1A4A8A)]),
                onTap: () => context.push('/break'),
              ),
            if (isOnBreak)
              _AnimatedActionButton(
                icon: Icons.play_arrow_rounded,
                label: 'End Break',
                gradient: const LinearGradient(colors: [Color(0xFF2A9660), Color(0xFF0A6640)]),
                onTap: () => ref.read(breakProvider.notifier).endBreak(faceScore: 0.99),
              ),
            const SizedBox(width: 20),
            _AnimatedActionButton(
              icon: Icons.logout_rounded,
              label: 'Check Out',
              gradient: AppColors.accentGradient,
              onTap: () => context.push('/face-scan'),
            ),
          ],
        ),
      ],
    );
  }
}

class _AnimatedActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final LinearGradient gradient;
  final VoidCallback onTap;

  const _AnimatedActionButton({required this.icon, required this.label, required this.gradient, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        height: 140,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          gradient: gradient,
          boxShadow: [
            BoxShadow(
              color: gradient.colors.last.withValues(alpha: 0.4),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 42, color: Colors.white),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;

  const _StatItem({required this.label, required this.value, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.inkDark : AppColors.ink,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: isDark ? AppColors.ink3Dark : AppColors.ink3,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _NavIcon extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavIcon({required this.icon, required this.label, required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppColors.accent : Colors.grey;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 26),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: color, fontSize: 10, fontWeight: isActive ? FontWeight.bold : FontWeight.normal),
          ),
        ],
      ),
    );
  }
}
