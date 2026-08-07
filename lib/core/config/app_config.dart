/// Central application configuration.
abstract final class AppConfig {
  /// Backend base URL (Render / Neon cloud). Must match the deployment the
  /// website (fullstack/web) talks to — see web/.env.local's
  /// NEXT_PUBLIC_API_URL. Both clients must share the same backend + database
  /// to stay feature-parity.
  static String apiBaseUrl = 'https://dawolifes-90qh.onrender.com';

  /// WebSocket base URL derived from the API base URL.
  static String get wsBaseUrl => apiBaseUrl.replaceFirst('http', 'ws');

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 20);

  static const String authTokenKey = 'auth_token';
  static const String cachedUserKey = 'auth_user';
  static const String languageKey = 'dawolife_lang';
}
