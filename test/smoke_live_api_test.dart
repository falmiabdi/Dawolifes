import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/core/storage/token_storage.dart';
import 'package:dawolife_mobile/data/repositories/listing_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Live smoke test against the deployed Render backend. Verifies the mobile
/// API client + listing repository correctly parse real property/vehicle
/// responses from the database. Skips automatically when offline.
void main() {
  late ApiClient api;
  late ListingRepository repo;

  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final storage = TokenStorage(prefs);
    api = ApiClient(storage: storage);
    repo = ListingRepository(api);
  });

  test('fetchProperties returns items with images from live backend', () async {
    final items = await repo.fetchProperties();
    expect(items, isNotEmpty, reason: 'Backend should expose Approved properties');
    for (final it in items) {
      expect(it.title, isNotEmpty);
      expect(it.image, isNotEmpty);
    }
  }, timeout: const Timeout(Duration(seconds: 90)));

  test('fetchVehicles returns items with images from live backend', () async {
    final items = await repo.fetchVehicles();
    expect(items, isNotEmpty, reason: 'Backend should expose vehicles');
    for (final it in items) {
      expect(it.title, isNotEmpty);
      expect(it.image, isNotEmpty);
    }
  }, timeout: const Timeout(Duration(seconds: 90)));

  test('health endpoint reachable', () async {
    final data = await api.get('/api/health') as Map<String, dynamic>;
    expect(data['status'], 'ok');
    expect(data['db'], 'connected');
  }, timeout: const Timeout(Duration(seconds: 90)));
}
