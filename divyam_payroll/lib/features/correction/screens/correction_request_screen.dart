import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/widgets/primary_button.dart';

/// Correction request screen — select date, describe issue, manager auto-notified.
class CorrectionRequestScreen extends StatefulWidget {
  const CorrectionRequestScreen({super.key});

  @override
  State<CorrectionRequestScreen> createState() => _CorrectionRequestScreenState();
}

class _CorrectionRequestScreenState extends State<CorrectionRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 2));
    setState(() => _isSubmitting = false);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Correction request submitted. Manager notified.')),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Correction'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'SELECT DATE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.2,
                  color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    suffixIcon: Icon(Icons.calendar_today, size: 18),
                  ),
                  child: Text(
                    '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                    style: TextStyle(color: isDark ? AppColors.inkDark : AppColors.ink),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Text(
                'DESCRIBE THE ISSUE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.2,
                  color: isDark ? AppColors.ink3Dark : AppColors.ink3,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _reasonController,
                validator: Validators.leaveReason,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: 'Explain what needs to be corrected...\ne.g., "Forgot to check out, was working until 5:30 PM"',
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isDark ? AppColors.lineDark : AppColors.line,
                    width: 0.5,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 16,
                      color: isDark ? AppColors.accent2Dark : AppColors.accent2,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your department head and HR will be notified automatically.',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.ink2Dark : AppColors.ink2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              PrimaryButton(
                label: 'Submit Correction Request',
                onPressed: _submit,
                isLoading: _isSubmitting,
                icon: Icons.edit_note_rounded,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
