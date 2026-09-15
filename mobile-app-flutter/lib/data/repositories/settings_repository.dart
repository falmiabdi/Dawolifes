import '../../core/network/api_client.dart';


class SettingsRepository {
  SettingsRepository(this._api);

  final ApiClient _api;

  
  Future<Map<String, dynamic>> fetchSettings() async {
    final data = await _api.get('/api/settings') as Map<String, dynamic>;
    return data;
  }
}
