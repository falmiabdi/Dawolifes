import 'api_client.dart';






class WebSocketService {
  WebSocketService(ApiClient api) : _client = WSClient(api);

  final WSClient _client;
  bool _disposed = false;

  Stream<WSMessage> get messages => _client.messages;
  Stream<WSConnectionState> get connectionState => _client.connectionState;

  
  
  Future<void> connect() async {
    if (_disposed) return;
    await _client.connect();
  }

  
  void requestUnreadCount() => _client.requestUnreadCount();

  
  
  void markAllRead() => _client.markAllRead();

  
  void markSingleRead(String notificationId) => _client.markSingleRead(notificationId);

  
  Future<void> disconnect() async {
    if (_disposed) return;
    await _client.disconnect();
  }

  void dispose() {
    _disposed = true;
    _client.dispose();
  }
}
