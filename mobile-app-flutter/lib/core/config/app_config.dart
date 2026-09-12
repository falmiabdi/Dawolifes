/// Central application configuration.
library;

import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

abstract final class AppConfig {
  /// Backend base URL. Must match the deployment the website (fullstack/web)
  /// talks to — see web/.env.local's NEXT_PUBLIC_API_URL. Both clients must
  /// share the same backend + database to stay feature-parity.
  ///
  /// Local E2E: the app probes [apiBaseCandidates] once at startup and uses the
  /// first reachable host, so it works on every device without flags:
  ///   - Android emulator     → http://10.0.2.2:4000 (emulator → host alias)
  ///   - Physical phone (USB) → adb reverse tcp:4000 tcp:4000, then localhost
  ///   - Web / Windows        → http://localhost:4000
  /// On a phone on your Wi-Fi (no USB), pass your PC's LAN IP explicitly:
  ///   flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000
  /// (allow inbound port 4000 through the Windows firewall)
  /// Restore the published URL before shipping:
  ///   flutter run --dart-define=API_BASE_URL=https://api.jebugeneraltrading.com
  /// Real production backend — probes this first (cPanel box on
  /// api.jebugeneraltrading.com, connected to the current Neon DB). The LAN IP
  /// and emulator aliases are only fallbacks for local testing.
  static const String _devLanBase = 'http://172.29.2.7:4000';
  static const String _realApiBase = 'https://api.jebugeneraltrading.com';

  static List<String> get apiBaseCandidates {
    const override = String.fromEnvironment('API_BASE_URL');
    final list = <String>[];
    if (override.isNotEmpty) list.add(override);
    list.add(_realApiBase);
    list.add(_devLanBase);
    if (!kIsWeb && Platform.isAndroid) {
      list.add('http://10.0.2.2:4000');
      list.add('http://localhost:4000');
    } else {
      list.add('http://localhost:4000');
    }
    return list.toSet().toList();
  }

  /// First reachable host is auto-detected by [ApiClient]; this is the
  /// fallback used before the probe resolves.
  static String get apiBaseUrl => apiBaseCandidates.first;

  /// Connection timeout for the initial TLS handshake. Render's free tier can
  /// take up to ~30s to wake from idle on the first request, so keep this
  /// generous.
  static const Duration connectTimeout = Duration(seconds: 30);

  /// Receive timeout for a single request, including retries. The first call
  /// after a cold wake can take ~20s; 60s leaves a comfortable margin without
  /// making the UI feel frozen.
  static const Duration receiveTimeout = Duration(seconds: 60);

  static const String authTokenKey = 'auth_token';
  static const String cachedUserKey = 'auth_user';
  static const String languageKey = 'dawolife_lang';

  /// Branding / share constants. Update [webShareBaseUrl] to your frontend
  /// deployment and [playStorePackageId] to the Play Store package id.
  static const String appName = 'DawoLife';
  static const String appTagline = "Ethiopia's Digital Real Estate Marketplace";
  static const String playStorePackageId = 'com.dawolife.mobile';

  /// Public web frontend used to build shareable listing deep-links.
  static String webShareBaseUrl = 'https://dawolife.jebugeneraltrading.com';

  /// Play Store listing URL for this app.
  static String get playStoreUrl =>
      'https://play.google.com/store/apps/details?id=$playStorePackageId';
}
