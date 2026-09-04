import '../../core/network/api_client.dart';

/// App-wide contact / social settings mirroring the web `/api/settings` route.
class SettingsRepository {
  SettingsRepository(this._api);

  final ApiClient _api;

  /// Public: fetch contact phones, email and social links.
  Future<Map<String, dynamic>> fetchSettings() async {
    final data = await _api.get('/api/settings') as Map<String, dynamic>;
    return data;
  }
}
