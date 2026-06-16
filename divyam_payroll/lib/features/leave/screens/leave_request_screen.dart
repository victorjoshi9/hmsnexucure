import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/validators.dart';
import '../../../data/models/leave_request_model.dart';
import '../../../shared/widgets/primary_button.dart';

/// Leave request form screen.
class LeaveRequestScreen extends ConsumerStatefulWidget {
  const LeaveRequestScreen({super.key});

  @override
  ConsumerState<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveRequestScreenState extends ConsumerState<LeaveRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  LeaveType _leaveType = LeaveType.casual;
  DateTime _fromDate = DateTime.now().add(const Duration(days: 1));
  DateTime _toDate = DateTime.now().add(const Duration(days: 1));
  bool _isSubmitting = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isFrom) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isFrom ? _fromDate : _toDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isFrom) {
          _fromDate = picked;
          if (_toDate.isBefore(_fromDate)) _toDate = _fromDate;
        } else {
          _toDate = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 2));
    setState(() => _isSubmitting = false);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Leave request submitted successfully!')),
    );
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final days = _toDate.difference(_fromDate).inDays + 1;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply Leave'),
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
              // Leave Type
              Text('LEAVE TYPE', style: _labelStyle(isDark)),
              const SizedBox(height: 8),
              DropdownButtonFormField<LeaveType>(
                initialValue: _leaveType,
                decoration: const InputDecoration(),
                items: LeaveType.values.map((type) {
                  final name = type.name[0].toUpperCase() + type.name.substring(1);
                  return DropdownMenuItem(value: type, child: Text(name));
                }).toList(),
                onChanged: (v) => setState(() => _leaveType = v!),
              ),
              const SizedBox(height: 20),

              // Date Range
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('FROM', style: _labelStyle(isDark)),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () => _pickDate(true),
                          child: InputDecorator(
                            decoration: const InputDecoration(),
                            child: Text(
                              '${_fromDate.day}/${_fromDate.month}/${_fromDate.year}',
                              style: TextStyle(color: isDark ? AppColors.inkDark : AppColors.ink),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('TO', style: _labelStyle(isDark)),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () => _pickDate(false),
                          child: InputDecorator(
                            decoration: const InputDecoration(),
                            child: Text(
                              '${_toDate.day}/${_toDate.month}/${_toDate.year}',
                              style: TextStyle(color: isDark ? AppColors.inkDark : AppColors.ink),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '$days day${days > 1 ? 's' : ''}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppColors.accentDark : AppColors.accent,
                ),
              ),
              const SizedBox(height: 20),

              // Reason
              Text('REASON', style: _labelStyle(isDark)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _reasonController,
                validator: Validators.leaveReason,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Describe the reason for leave...',
                ),
              ),
              const SizedBox(height: 32),

              PrimaryButton(
                label: 'Submit Leave Request',
                onPressed: _submit,
                isLoading: _isSubmitting,
                icon: Icons.send_rounded,
              ),
            ],
          ),
        ),
      ),
    );
  }

  TextStyle _labelStyle(bool isDark) => TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        letterSpacing: 1.2,
        color: isDark ? AppColors.ink3Dark : AppColors.ink3,
      );
}
