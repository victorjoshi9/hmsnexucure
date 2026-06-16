import 'dart:math';

/// GPS utility functions for geo-fence validation.
class GpsUtils {
  GpsUtils._();

  /// Default geo-fence radius in meters (from PRD: 100m configurable).
  static const double defaultGeoFenceRadius = 100.0;

  /// Earth radius in meters.
  static const double _earthRadius = 6371000.0;

  /// Calculate the distance between two coordinates using the Haversine formula.
  /// Returns distance in meters.
  static double calculateDistance({
    required double lat1,
    required double lng1,
    required double lat2,
    required double lng2,
  }) {
    final dLat = _toRadians(lat2 - lat1);
    final dLng = _toRadians(lng2 - lng1);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) *
            cos(_toRadians(lat2)) *
            sin(dLng / 2) *
            sin(dLng / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return _earthRadius * c;
  }

  /// Check if a position is within the geo-fence.
  static bool isWithinGeoFence({
    required double userLat,
    required double userLng,
    required double hospitalLat,
    required double hospitalLng,
    double radiusMeters = defaultGeoFenceRadius,
  }) {
    final distance = calculateDistance(
      lat1: userLat,
      lng1: userLng,
      lat2: hospitalLat,
      lng2: hospitalLng,
    );
    return distance <= radiusMeters;
  }

  /// Get the distance from geo-fence boundary (negative = inside, positive = outside).
  static double distanceFromBoundary({
    required double userLat,
    required double userLng,
    required double hospitalLat,
    required double hospitalLng,
    double radiusMeters = defaultGeoFenceRadius,
  }) {
    final distance = calculateDistance(
      lat1: userLat,
      lng1: userLng,
      lat2: hospitalLat,
      lng2: hospitalLng,
    );
    return distance - radiusMeters;
  }

  static double _toRadians(double degrees) => degrees * pi / 180.0;
}
