import 'package:flutter/material.dart';

/// HAMS Color System — derived from PRD design tokens.
/// Warm editorial palette with burnt-orange accent.
class AppColors {
  AppColors._();

  // ── Light Mode ──────────────────────────────────────────
  static const Color ink = Color(0xFF1A1917);
  static const Color ink2 = Color(0xFF4A4845);
  static const Color ink3 = Color(0xFF8A8880);

  static const Color paper = Color(0xFFFAFAF8);
  static const Color surface = Color(0xFFF3F2EF);
  static const Color card = Color(0xFFFFFFFF);

  static const Color accent = Color(0xFFC8410A);
  static const Color accent2 = Color(0xFF1A4A8A);
  static const Color accent3 = Color(0xFF0A6640);

  static const Color line = Color(0xFFE2E0DB);
  static const Color line2 = Color(0xFFCCC9C2);

  // ── Dark Mode ───────────────────────────────────────────
  static const Color inkDark = Color(0xFFF0EDE6);
  static const Color ink2Dark = Color(0xFFB0ADA6);
  static const Color ink3Dark = Color(0xFF706D68);

  static const Color paperDark = Color(0xFF1A1917);
  static const Color surfaceDark = Color(0xFF242220);
  static const Color cardDark = Color(0xFF2A2826);

  static const Color accentDark = Color(0xFFE86030);
  static const Color accent2Dark = Color(0xFF4A8AD4);
  static const Color accent3Dark = Color(0xFF2A9660);

  static const Color lineDark = Color(0xFF2E2C2A);
  static const Color line2Dark = Color(0xFF3A3836);

  // ── Semantic Colors ─────────────────────────────────────
  static const Color success = Color(0xFF0A6640);
  static const Color successDark = Color(0xFF2A9660);
  static const Color warning = Color(0xFF7A5A00);
  static const Color warningDark = Color(0xFFC09020);
  static const Color error = Color(0xFFC8410A);
  static const Color errorDark = Color(0xFFE86030);
  static const Color info = Color(0xFF1A4A8A);
  static const Color infoDark = Color(0xFF4A8AD4);

  // ── Status Badge Backgrounds ────────────────────────────
  static const Color presentBg = Color(0xFFE6F5EE);
  static const Color presentBgDark = Color(0xFF09261A);
  static const Color lateBg = Color(0xFFFFF0EC);
  static const Color lateBgDark = Color(0xFF2A1208);
  static const Color absentBg = Color(0xFFF3F2EF);
  static const Color absentBgDark = Color(0xFF242220);
  static const Color onBreakBg = Color(0xFFE8F0FA);
  static const Color onBreakBgDark = Color(0xFF0A1828);
  static const Color overtimeBg = Color(0xFFFDF5E0);
  static const Color overtimeBgDark = Color(0xFF241A00);

  // ── Gradients ───────────────────────────────────────────
  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFE86030), Color(0xFFC8410A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glossyGradient = LinearGradient(
    colors: [Color(0xFFFDE9DF), Color(0xFFF3E0D8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkCardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2E2C2A), Color(0xFF242220)],
  );

  static const LinearGradient headerGradient = LinearGradient(
    colors: [Color(0xFFC8410A), Color(0xFF8A2A04)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
