import '../../core/network/api_client.dart';
import '../models/listing_item.dart';
import '../models/property.dart';
import '../models/vehicle.dart';

/// Listing + favorites API calls, mirroring mobile-home.tsx and favorites.ts.
class ListingRepository {
  ListingRepository(this._api);

  final ApiClient _api;

  Future<List<ListingItem>> fetchProperties({int page = 1, int limit = 8}) async {
    final data = await _api.get('/api/properties?status=Approved&page=$page&limit=$limit');
    final docs = (data as Map<String, dynamic>?)?['properties'] as List? ?? [];
    final items = docs
        .whereType<Map<String, dynamic>>()
        .map(Property.fromJson)
        .where((p) => p.images.isNotEmpty)
        .take(limit)
        .map(ListingItem.fromProperty)
        .toList();
    return items;
  }

  Future<List<ListingItem>> fetchVehicles({int page = 1, int limit = 8}) async {
    final data = await _api.get('/api/vehicles?page=$page&limit=$limit');
    final docs = data is List ? data : (data as Map<String, dynamic>?)?['vehicles'] as List? ?? [];
    final items = docs
        .whereType<Map<String, dynamic>>()
        .map(Vehicle.fromJson)
        .where((v) => v.images.isNotEmpty)
        .take(limit)
        .map(ListingItem.fromVehicle)
        .toList();
    return items;
  }

  Future<Property?> fetchPropertyDetail(String id) async {
    final data = await _api.get('/api/properties/$id');
    final wrapped = data as Map<String, dynamic>;
    return Property.fromJson(wrapped['property'] ?? wrapped);
  }

  Future<Vehicle?> fetchVehicleDetail(String id) async {
    final data = await _api.get('/api/vehicles/$id');
    final wrapped = data as Map<String, dynamic>;
    return Vehicle.fromJson(wrapped['vehicle'] ?? wrapped);
  }

  Future<List<ListingItem>> fetchSaved() async {
    final data = await _api.get('/api/favorites') as Map<String, dynamic>;
    final items = (data['items'] as List? ?? []).whereType<Map<String, dynamic>>();
    final result = <ListingItem>[];
    for (final entry in items) {
      final itemType = '${entry['itemType']}';
      final item = entry['item'];
      if (item is! Map<String, dynamic>) continue;
      if (itemType == 'property') {
        result.add(ListingItem.fromProperty(Property.fromJson(item)));
      } else if (itemType == 'vehicle') {
        result.add(ListingItem.fromVehicle(Vehicle.fromJson(item)));
      }
    }
    return result;
  }

  Future<bool> isSaved({required String itemType, required String itemId}) async {
    final data = await _api.get('/api/favorites/status?itemType=$itemType&itemId=$itemId');
    return (data as Map<String, dynamic>?)?['saved'] == true;
  }

  Future<void> save({required String itemType, required String itemId}) async {
    await _api.post('/api/favorites', {'itemType': itemType, 'itemId': itemId});
  }

  Future<void> unsave({required String itemType, required String itemId}) async {
    await _api.delete('/api/favorites', {'itemType': itemType, 'itemId': itemId});
  }
}
