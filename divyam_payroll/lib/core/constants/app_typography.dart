import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// HAMS Typography System — Plus Jakarta Sans (primary), DM Mono (mono), DM Serif Display (display).
class AppTypography {
  AppTypography._();

  // ── Base Font Families ──────────────────────────────────
  static String get _sansFamily => GoogleFonts.plusJakartaSans().fontFamily!;
  static String get _monoFamily => GoogleFonts.dmMono().fontFamily!;
  static String get _serifFamily => GoogleFonts.dmSerifDisplay().fontFamily!;

  // ── Display (Serif) ─────────────────────────────────────
  static TextStyle displayLarge = GoogleFonts.dmSerifDisplay(
    fontSize: 42,
    fontWeight: FontWeight.w400,
    height: 1.1,
  );

  static TextStyle displayMedium = GoogleFonts.dmSerifDisplay(
    fontSize: 28,
    fontWeight: FontWeight.w400,
    height: 1.15,
  );

  static TextStyle displaySmall = GoogleFonts.dmSerifDisplay(
    fontSize: 22,
    fontWeight: FontWeight.w400,
    height: 1.2,
  );

  // ── Heading (Sans) ──────────────────────────────────────
  static TextStyle headlineLarge = GoogleFonts.plusJakartaSans(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );

  static TextStyle headlineMedium = GoogleFonts.plusJakartaSans(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );

  static TextStyle headlineSmall = GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.4,
  );

  // ── Title ───────────────────────────────────────────────
  static TextStyle titleLarge = GoogleFonts.plusJakartaSans(
    fontSize: 18,
    fontWeight: FontWeight.w500,
    height: 1.4,
  );

  static TextStyle titleMedium = GoogleFonts.plusJakartaSans(
    fontSize: 15,
    fontWeight: FontWeight.w500,
    height: 1.5,
  );

  static TextStyle titleSmall = GoogleFonts.plusJakartaSans(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    height: 1.5,
  );

  // ── Body ────────────────────────────────────────────────
  static TextStyle bodyLarge = GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.75,
  );

  static TextStyle bodyMedium = GoogleFonts.plusJakartaSans(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.6,
  );

  static TextStyle bodySmall = GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.6,
  );

  // ── Label ───────────────────────────────────────────────
  static TextStyle labelLarge = GoogleFonts.plusJakartaSans(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    height: 1.4,
    letterSpacing: 0.3,
  );

  static TextStyle labelMedium = GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.4,
  );

  static TextStyle labelSmall = GoogleFonts.plusJakartaSans(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.5,
  );

  // ── Mono (for tags, badges, codes) ──────────────────────
  static TextStyle monoLarge = GoogleFonts.dmMono(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    height: 1.4,
    letterSpacing: 0.6,
  );

  static TextStyle monoMedium = GoogleFonts.dmMono(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 0.8,
  );

  static TextStyle monoSmall = GoogleFonts.dmMono(
    fontSize: 10,
    fontWeight: FontWeight.w400,
    height: 1.4,
    letterSpacing: 1.0,
  );

  // ── KPI / Stats ─────────────────────────────────────────
  static TextStyle kpiValue = GoogleFonts.plusJakartaSans(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.0,
  );

  static TextStyle kpiLabel = GoogleFonts.dmMono(
    fontSize: 10,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.8,
  );

  static TextStyle counterLarge = GoogleFonts.dmMono(
    fontSize: 48,
    fontWeight: FontWeight.w500,
    height: 1.0,
  );
}
