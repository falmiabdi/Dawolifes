import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as ws_status;

import '../config/app_config.dart';
import '../storage/token_storage.dart';


class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.cause});

  final String message;
  final int? statusCode;
  final Object? cause;

  @override
  String toString() => message;
}









class ApiClient {
  ApiClient({required this.storage, http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  final TokenStorage storage;
  final http.Client _http;

  String? _resolvedBase;

  
  
  
  
  
  
  
  Future<String> resolveApiBaseUrl() async {
    if (_resolvedBase != null) return _resolvedBase!;
    final candidates = AppConfig.apiBaseCandidates;
    if (const String.fromEnvironment('API_BASE_URL').isNotEmpty ||
        candidates.length == 1) {
      return _resolvedBase = candidates.first;
    }
    for (final candidate in candidates) {
      try {
        await _http
            .get(Uri.parse('$candidate/api/health'))
            .timeout(const Duration(milliseconds: 1500));
        return _resolvedBase = candidate;
      } catch (_) {
  // Try the next candidate.
  
        
      }
    }
    return _resolvedBase = candidates.first;
  }

  
  static const int _maxAttempts = 3;

  Future<void> saveToken(String token) => storage.saveToken(token);

  Future<void> clearToken() => storage.clear();

  Uri _uri(String base, String path) {
    final queryIndex = path.indexOf('?');
    if (queryIndex >= 0) {
      return Uri.parse('$base${path.substring(0, queryIndex)}')
          .replace(queryParameters: _parseQuery(path.substring(queryIndex + 1)));
    }
    return Uri.parse('$base$path');
  }

  Map<String, String> _parseQuery(String raw) {
    final map = <String, String>{};
    for (final pair in raw.split('&')) {
      final parts = pair.split('=');
      if (parts.length == 2) {
        map[Uri.decodeComponent(parts[0])] = Uri.decodeComponent(parts[1]);
      }
    }
    return map;
  }

  Future<Map<String, String>> _headers({bool json = true}) async {
    final headers = <String, String>{};
    if (json) headers['Content-Type'] = 'application/json';
    final token = await storage.getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  
  
  
  
  
  
  
  Future<http.Response> _attempt(Future<http.Response> Function(String base) run) async {
    final base = await resolveApiBaseUrl();
    var lastError = ApiException('Request failed');
    for (var attempt = 1; attempt <= _maxAttempts; attempt++) {
      try {
        return await run(base)
            .timeout(AppConfig.receiveTimeout);
      } on TimeoutException catch (_) {
  // Ignore parse errors
  
        lastError = ApiException('Request timed out. Check your connection.');
      } on SocketException catch (e) {
        lastError = ApiException('Cannot connect to the server. Check your connection.', cause: e);
      } on http.ClientException catch (e) {
        lastError = ApiException('Cannot connect to the server. Check your connection.', cause: e);
      } catch (e) {
        
        
        lastError = e is ApiException
            ? e
            : ApiException('$e');
        rethrow;
      }

      if (attempt < _maxAttempts) {
        await Future.delayed(Duration(seconds: 1 << (attempt - 1))); 
      }
    }
    throw lastError;
  }

  Future<dynamic> get(String path) async {
    final headers = await _headers();
    final response = await _attempt((base) => _http.get(_uri(base, path), headers: headers));
    return _decode(response);
  }

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    final headers = await _headers();
    final encoded = body == null ? null : jsonEncode(_stripNulls(body));
    final response = await _attempt(
      (base) => _http.post(
        _uri(base, path),
        headers: headers,
        body: encoded,
      ),
    );
    return _decode(response);
  }

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) async {
    final headers = await _headers();
    final encoded = body == null ? null : jsonEncode(_stripNulls(body));
    final response = await _attempt(
      (base) => _http.patch(
        _uri(base, path),
        headers: headers,
        body: encoded,
      ),
    );
    return _decode(response);
  }

  Future<dynamic> put(String path, [Map<String, dynamic>? body]) async {
    final headers = await _headers();
    final encoded = body == null ? null : jsonEncode(_stripNulls(body));
    final response = await _attempt(
      (base) => _http.put(
        _uri(base, path),
        headers: headers,
        body: encoded,
      ),
    );
    return _decode(response);
  }

  Future<dynamic> delete(String path, [Map<String, dynamic>? body]) async {
    final headers = await _headers();
    final encoded = body == null ? null : jsonEncode(_stripNulls(body));
    final response = await _attempt(
      (base) => _http.delete(
        _uri(base, path),
        headers: headers,
        body: encoded,
      ),
    );
    return _decode(response);
  }

  
  
  
  
  
  Future<dynamic> uploadFile(
    String path, {
    required List<int> bytes,
    required String filename,
    String? contentType,
    Map<String, String> fields = const {},
  }) async {
    final headers = await _headers(json: false);
    final response = await _attempt((base) async {
      final request = http.MultipartRequest('POST', _uri(base, path))
        ..headers.addAll(headers)
        ..files.add(http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: filename,
          contentType: contentType == null ? null : MediaType.parse(contentType),
        ));
      request.fields.addAll(fields);
      final streamed = await request.send().timeout(AppConfig.receiveTimeout);
      return http.Response.fromStream(streamed);
    });
    return _decode(response);
  }

  
  
  
  
  Map<String, dynamic> _stripNulls(Map<String, dynamic> body) {
    final cleaned = <String, dynamic>{};
    for (final entry in body.entries) {
      final value = entry.value;
      if (value == null) continue;
      cleaned[entry.key] = value is Map<String, dynamic> ? _stripNulls(value) : value;
    }
    return cleaned;
  }

  dynamic _decode(http.Response response) {
    dynamic data;
    try {
      data = jsonDecode(utf8.decode(response.bodyBytes));
    } catch (_) {
      data = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    final serverMessage = data is Map<String, dynamic> && data['message'] is String
        ? data['message'] as String
        : null;

    if (response.statusCode == 403 || response.statusCode == 401) {
      
      
      throw ApiException(
        serverMessage ?? 'Your account has been rejected or suspended.',
        statusCode: response.statusCode,
      );
    }

    throw ApiException(
      serverMessage ?? 'Request failed (${response.statusCode})',
      statusCode: response.statusCode,
    );
  }
}


enum WSMessageType {
  notification,
  unreadCount,
  markReadAck,
  markSingleReadAck,
  message,
  announcement,
}


class WSMessage {
  const WSMessage({
    required this.type,
    this.notification,
    this.message,
    this.announcement,
    this.count,
    this.notificationId,
    this.timestamp,
  });

  final WSMessageType type;
  final Map<String, dynamic>? notification;
  final Map<String, dynamic>? message;
  final Map<String, dynamic>? announcement;
  final int? count;
  final String? notificationId;
  final int? timestamp;

  factory WSMessage.fromJson(Map<String, dynamic> json) {
    final typeStr = json['type'] as String?;
    WSMessageType type;
    switch (typeStr) {
      case 'notification':
        type = WSMessageType.notification;
        break;
      case 'unread_count':
        type = WSMessageType.unreadCount;
        break;
      case 'mark_read_ack':
        type = WSMessageType.markReadAck;
        break;
      case 'mark_single_read_ack':
        type = WSMessageType.markSingleReadAck;
        break;
      case 'message':
        type = WSMessageType.message;
        break;
      case 'announcement':
        type = WSMessageType.announcement;
        break;
      default:
        type = WSMessageType.notification;
    }
    return WSMessage(
      type: type,
      notification: json['notification'] as Map<String, dynamic>?,
      message: json['message'] as Map<String, dynamic>?,
      announcement: json['announcement'] as Map<String, dynamic>?,
      count: json['count'] as int?,
      notificationId: json['notificationId'] as String?,
      timestamp: json['timestamp'] as int?,
    );
  }
}


class WSClient {
  WSClient(this._api);

  final ApiClient _api;
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const Duration _baseReconnectDelay = Duration(seconds: 1);
  static const Duration _maxReconnectDelay = Duration(seconds: 30);
  static const Duration _pingInterval = Duration(seconds: 25);

  final StreamController<WSMessage> _messageController = StreamController<WSMessage>.broadcast();
  final StreamController<WSConnectionState> _stateController = StreamController<WSConnectionState>.broadcast();

  Stream<WSMessage> get messages => _messageController.stream;
  Stream<WSConnectionState> get connectionState => _stateController.stream;

  
  Future<void> connect() async {
    if (_channel != null) return;
    
    final token = await _api.storage.getToken();
    if (token == null || token.isEmpty) {
      _stateController.add(WSConnectionState.disconnected);
      return;
    }

    _stateController.add(WSConnectionState.connecting);
    
    try {
      final base = await _api.resolveApiBaseUrl();
      final wsUrl = base.replaceFirst('http', 'ws');
      final uri = Uri.parse('$wsUrl/ws?token=${Uri.encodeComponent(token)}');
      _channel = WebSocketChannel.connect(uri);
      
      _subscription = _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDone,
      );
      
      _reconnectAttempts = 0;
      _startPingTimer();
      _stateController.add(WSConnectionState.connected);
    } catch (e) {
      _stateController.add(WSConnectionState.disconnected);
      _scheduleReconnect();
    }
  }

  void _onMessage(dynamic data) {
    try {
      final json = jsonDecode(data.toString());
      final message = WSMessage.fromJson(json as Map<String, dynamic>);
      _messageController.add(message);
} catch (e) {
      // Ignore parse errors
    }
  }

  void _onError(dynamic error) {
    _stateController.add(WSConnectionState.disconnected);
    _scheduleReconnect();
  }

  void _onDone() {
    _stopPingTimer();
    _stateController.add(WSConnectionState.disconnected);
    _scheduleReconnect();
  }

  void _startPingTimer() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(_pingInterval, (_) {
      _sendPing();
    });
  }

  void _stopPingTimer() {
    _pingTimer?.cancel();
    _pingTimer = null;
  }

  void _sendPing() {
    if (_channel != null) {
      try {
        _channel!.sink.add(jsonEncode({'type': 'ping'}));
      } catch (_) {}
    }
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      return;
    }
    
    final delay = Duration(
      seconds: (_baseReconnectDelay.inSeconds * (1 << _reconnectAttempts))
          .clamp(_baseReconnectDelay.inSeconds, _maxReconnectDelay.inSeconds),
    );
    
    _reconnectAttempts++;
    _reconnectTimer = Timer(delay, () {
      connect();
    });
  }

  
  void markAllRead() {
    _send({'type': 'mark_read'});
  }

  
  void markSingleRead(String notificationId) {
    _send({'type': 'mark_single_read', 'notificationId': notificationId});
  }

  
  void requestUnreadCount() {
    _send({'type': 'unread_count'});
  }

  void _send(Map<String, dynamic> message) {
    if (_channel != null) {
      try {
        _channel!.sink.add(jsonEncode(message));
      } catch (_) {}
    }
  }

  
  Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    _stopPingTimer();
    await _subscription?.cancel();
    await _channel?.sink.close(ws_status.normalClosure);
    _channel = null;
    _stateController.add(WSConnectionState.disconnected);
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _stateController.close();
  }
}


enum WSConnectionState {
  disconnected,
  connecting,
  connected,
}