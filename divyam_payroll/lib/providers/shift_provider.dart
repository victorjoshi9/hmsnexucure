import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/shift_model.dart';

/// Current shift provider.
final currentShiftProvider = StateProvider<Shift>((ref) {
  return Shift.general; // Default to General shift
});

/// All available shifts.
final allShiftsProvider = FutureProvider<List<Shift>>((ref) async {
  await Future.delayed(const Duration(seconds: 1));
  return Shift.allMock;
});
