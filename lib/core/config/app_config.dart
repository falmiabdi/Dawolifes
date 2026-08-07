/// Central application configuration.
abstract final class AppConfig {
  /// Backend base URL (Render / Neon cloud). Must match the deployment the
  /// website (fullstack/web) talks to — see web/.env.local's
  /// NEXT_PUBLIC_API_URL. Both clients must share the same backend + database
  /// to stay feature-parity.
  static String apiBaseUrl = 'https://dawolifes-90qh.onrender.com';

  /// WebSocket base URL derived from the API base URL.
  static String get wsBaseUrl => apiBaseUrl.replaceFirst('http', 'ws');

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
}
