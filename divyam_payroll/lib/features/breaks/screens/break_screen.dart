import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/break_model.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/primary_button.dart';

/// Break management screen — type selector, timer, history.
class BreakScreen extends ConsumerStatefulWidget {
  const BreakScreen({super.key});

  @override
  ConsumerState<BreakScreen> createState() => _BreakScreenState();
}

class _BreakScreenState extends ConsumerState<BreakScreen> {
  BreakType? _selectedType;
  bool _isOnBreak = false;
  DateTime? _breakStartTime;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Break Management'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!_isOnBreak) ...[
              // Break Type Selector
              Text(
                'SELECT BREAK TYPE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.2,
                  color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                ),
              ),
              const SizedBox(height: 12),
              ...BreakType.values.map((type) {
                final record = BreakRecord(
                  id: '',
                  attendanceId: '',
                  breakType: type,
                  startTime: DateTime.now(),
                );
                final isSelected = _selectedType == type;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: AppCard(
                    onTap: () => setState(() => _selectedType = type),
                    borderColor: isSelected
                        ? (isDark ? AppColors.accentDark : AppColors.accent)
                        : null,
                    child: Row(
                      children: [
                        Text(record.icon, style: const TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                record.displayName,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? AppColors.inkDark : AppColors.ink,
                                ),
                              ),
                              Text(
                                'Allowed: ${record.allowedMinutes} min',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          Icon(
                            Icons.check_circle,
                            color: isDark ? AppColors.accentDark : AppColors.accent,
                          ),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Start Break',
                icon: Icons.coffee_rounded,
                onPressed: _selectedType != null
                    ? () {
                        setState(() {
                          _isOnBreak = true;
                          _breakStartTime = DateTime.now();
                        });
                      }
                    : null,
              ),
            ] else ...[
              // Active Break View
              Center(
                child: Column(
                  children: [
                    const SizedBox(height: 40),
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: (isDark ? AppColors.accent2Dark : AppColors.accent2)
                            .withValues(alpha: 0.1),
                      ),
                      child: Icon(
                        Icons.coffee_rounded,
                        size: 48,
                        color: isDark ? AppColors.accent2Dark : AppColors.accent2,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'On Break',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.inkDark : AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 8),
                    StreamBuilder(
                      stream: Stream.periodic(const Duration(seconds: 1)),
                      builder: (context, snapshot) {
                        final elapsed = _breakStartTime != null
                            ? DateTime.now().difference(_breakStartTime!)
                            : Duration.zero;
                        final minutes = elapsed.inMinutes;
                        final seconds = elapsed.inSeconds % 60;
                        return Text(
                          '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
                          style: TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.w300,
                            fontFamily: 'monospace',
                            color: isDark ? AppColors.ink2Dark : AppColors.ink2,
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 40),
                    PrimaryButton(
                      label: 'End Break',
                      icon: Icons.stop_circle_outlined,
                      color: isDark ? AppColors.accent3Dark : AppColors.accent3,
                      onPressed: () {
                        setState(() {
                          _isOnBreak = false;
                          _breakStartTime = null;
                          _selectedType = null;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Break ended successfully')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
