import 'package:flutter/material.dart';

/// HAMS Spacing & Radius tokens for consistent layout.
class AppSpacing {
  AppSpacing._();

  // ── Spacing Scale (4-pt grid) ───────────────────────────
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  static const double jumbo = 48.0;
  static const double mega = 64.0;

  // ── Padding Presets ─────────────────────────────────────
  static const EdgeInsets paddingScreen = EdgeInsets.symmetric(
    horizontal: 20.0,
    vertical: 16.0,
  );

  static const EdgeInsets paddingCard = EdgeInsets.all(16.0);

  static const EdgeInsets paddingCardCompact = EdgeInsets.symmetric(
    horizontal: 14.0,
    vertical: 12.0,
  );

  static const EdgeInsets paddingSection = EdgeInsets.symmetric(
    vertical: 24.0,
  );

  static const EdgeInsets paddingListTile = EdgeInsets.symmetric(
    horizontal: 16.0,
    vertical: 12.0,
  );

  static const EdgeInsets paddingButton = EdgeInsets.symmetric(
    horizontal: 24.0,
    vertical: 14.0,
  );

  static const EdgeInsets paddingChip = EdgeInsets.symmetric(
    horizontal: 10.0,
    vertical: 4.0,
  );

  // ── Border Radius ───────────────────────────────────────
  static const double radiusXs = 4.0;
  static const double radiusSm = 6.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 12.0;
  static const double radiusXl = 16.0;
  static const double radiusRound = 100.0;

  static final BorderRadius borderRadiusXs = BorderRadius.circular(radiusXs);
  static final BorderRadius borderRadiusSm = BorderRadius.circular(radiusSm);
  static final BorderRadius borderRadiusMd = BorderRadius.circular(radiusMd);
  static final BorderRadius borderRadiusLg = BorderRadius.circular(radiusLg);
  static final BorderRadius borderRadiusXl = BorderRadius.circular(radiusXl);
  static final BorderRadius borderRadiusRound = BorderRadius.circular(radiusRound);

  // ── Icon Sizes ──────────────────────────────────────────
  static const double iconSm = 16.0;
  static const double iconMd = 20.0;
  static const double iconLg = 24.0;
  static const double iconXl = 32.0;
  static const double iconJumbo = 48.0;

  // ── Elevation ───────────────────────────────────────────
  static const double elevationNone = 0.0;
  static const double elevationSm = 1.0;
  static const double elevationMd = 4.0;
  static const double elevationLg = 8.0;

  // ── Animation Durations ─────────────────────────────────
  static const Duration animFast = Duration(milliseconds: 150);
  static const Duration animNormal = Duration(milliseconds: 300);
  static const Duration animSlow = Duration(milliseconds: 500);
  static const Duration animHero = Duration(milliseconds: 800);
}
