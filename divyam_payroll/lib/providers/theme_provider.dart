import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Theme mode provider.
final themeModeProvider = StateProvider<ThemeMode>((ref) {
  return ThemeMode.system;
});
