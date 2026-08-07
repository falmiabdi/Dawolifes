import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';

/// Typed API error surfaced to the UI.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.cause});

  final String message;
  final int? statusCode;
  final Object? cause;

  @override
  String toString() => message;
}

/// Thin HTTP client that attaches the bearer token to every request.
///
/// Resilient to Render free-tier cold starts (which can take 30+ seconds on
/// the first request after idle): connection/receive timeouts are generous
/// (30s/60s), and transient failures (timeouts, socket errors) are retried
/// with exponential backoff up to 3 attempts so a slow wakeup doesn't surface
/// as a connection error to the user. Failures are normalized into
/// [ApiException]s that preserve the underlying cause for diagnosis.
class ApiClient {
  ApiClient({required this.storage, http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  final TokenStorage storage;
  final http.Client _http;

  /// Number of attempts for transient failures (timeouts, socket errors).
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

  /// Runs [run] with retries against transient failures.
  ///
  /// Render's free tier can take 30+ seconds to wake from idle on the first
  /// request. Rather than failing immediately on a timeout or socket error,
  /// we retry up to [_maxAttempts] times with exponential backoff (1s, 2s, 4s),
  /// so a transient cold-start wake becomes a brief delay instead of a
  /// connection-error screen.
  Future<http.Response> _attempt(Future<http.Response> Function(String base) run) async {
    var lastError = ApiException('Request failed');
    for (var attempt = 1; attempt <= _maxAttempts; attempt++) {
      try {
        return await run(AppConfig.apiBaseUrl)
            .timeout(AppConfig.receiveTimeout);
      } on TimeoutException catch (_) {
        lastError = ApiException('Request timed out. Check your connection.');
      } on SocketException catch (e) {
        lastError = ApiException('Cannot connect to the server. Check your connection.', cause: e);
      } on http.ClientException catch (e) {
        lastError = ApiException('Cannot connect to the server. Check your connection.', cause: e);
      } catch (e) {
        // Non-transient: don't retry (e.g. ApiException from _decode, or a
        // clearly non-recoverable client setup error).
        lastError = e is ApiException
            ? e
            : ApiException('$e');
        rethrow;
      }

      if (attempt < _maxAttempts) {
        await Future.delayed(Duration(seconds: 1 << (attempt - 1))); // 1s, 2s, 4s
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

  /// Uploads a single file as multipart/form-data (field name `file`),
  /// mirroring the web app's `POST /api/upload` and `/api/agent/upload`.
  /// Pass [contentType] (e.g. `image/jpeg`) so the server's multer file
  /// filter accepts the upload; otherwise the default `application/octet-stream`
  /// is rejected as "File type not allowed".
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

  /// Removes null values from JSON bodies before encoding so optional
  /// fields the user left blank are omitted rather than sent as `null`
  /// (the backend treats null as "no change", but dropping them keeps every
  /// endpoint robust regardless of its schema). Lists are preserved as-is.
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
      // Prefer the backend's specific message (e.g. "awaiting admin
      // approval", "suspended") and only fall back to a generic one.
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