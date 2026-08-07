import 'package:flutter/material.dart';

/// Design tokens mirrored from the Capacitor app's globals.css (light theme).
abstract final class AppColors {
  // Core surfaces.
  static const Color background = Color(0xFFFBFCFF);
  static const Color foreground = Color(0xFF2B2340);
  static const Color card = Colors.white;
  static const Color popover = Colors.white;

  // Brand.
  static const Color primary = Color(0xFFF97316);
  static const Color primarySoft = Color(0xFFFEF3E7);
  static const Color accent = Color(0xFF6C5CE7);

  // Neutrals.
  static const Color secondary = Color(0xFF2B2340);
  static const Color muted = Color(0xFFF6F7F9);
  static const Color mutedForeground = Color(0xFF8383A1);
  static const Color border = Color(0xFFEBECEF);
  static const Color input = Color(0xFFEBECEF);
  static const Color ring = Color(0xFFF97316);

  // Semantic.
  static const Color destructive = Color(0xFFE5484D);
  static const Color success = Color(0xFF3ECF8E);
  static const Color warning = Color(0xFFEAB339);

  // Service card backgrounds.
  static const Color serviceOur = Color(0xFFF6A19A);
  static const Color serviceBuy = Color(0xFF7FBF6B);
  static const Color serviceSell = Color(0xFFB6A63C);

  static const double radius = 16.0;
}
