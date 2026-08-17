import 'api_client.dart';

/// Application-level facade over [WSClient] so screens can subscribe to
/// real-time message and notification events without owning the socket.
///
/// Connect on login, disconnect on logout. The underlying [WSClient] handles
/// ping/keep-alive and exponential-backoff reconnects automatically.
class WebSocketService {
  WebSocketService(ApiClient api) : _client = WSClient(api);

  final WSClient _client;
  bool _disposed = false;

  Stream<WSMessage> get messages => _client.messages;
  Stream<WSConnectionState> get connectionState => _client.connectionState;

  /// Opens (or reuses) the socket if a token is present. Safe to call after
  /// login or after the token is refreshed.
  Future<void> connect() async {
    if (_disposed) return;
    await _client.connect();
  }

  /// Requests the current unread notification count over the socket.
  void requestUnreadCount() => _client.requestUnreadCount();

  /// Marks all notifications as read over the socket (server replies with an
  /// `mark_read_ack` push that listeners can use to refresh their badge).
  void markAllRead() => _client.markAllRead();

  /// Marks a single notification as read over the socket.
  void markSingleRead(String notificationId) => _client.markSingleRead(notificationId);

  /// Closes the socket (e.g. on logout).
  Future<void> disconnect() async {
    if (_disposed) return;
    await _client.disconnect();
  }

  void dispose() {
    _disposed = true;
    _client.dispose();
  }
}
