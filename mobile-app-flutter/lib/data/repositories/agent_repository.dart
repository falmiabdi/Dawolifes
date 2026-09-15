import '../../core/network/api_client.dart';
import '../models/property.dart';
import '../models/vehicle.dart';


class AgentRepository {
  AgentRepository(this._api);

  final ApiClient _api;

  
  Future<String> uploadFile({
    required List<int> bytes,
    required String filename,
    String field = 'image',
  }) async {
    final data = await _api.uploadFile(
      '/api/agent/upload',
      bytes: bytes,
      filename: filename,
      fields: {'field': field},
    ) as Map<String, dynamic>;
    final url = data['url'];
    if (url == null) {
      throw ApiException('Upload failed');
    }
    return '$url';
  }

  Future<List<Property>> fetchMyProperties() async {
    final data = await _api.get('/api/agent/properties') as Map<String, dynamic>;
    return (data['properties'] as List?)?.map((e) => Property.fromJson(e as Map<String, dynamic>)).toList() ?? const [];
  }

  Future<List<Vehicle>> fetchMyVehicles() async {
    final data = await _api.get('/api/agent/vehicles') as Map<String, dynamic>;
    return (data['vehicles'] as List?)?.map((e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList() ?? const [];
  }

  Future<void> createProperty(Map<String, dynamic> payload) async {
    await _api.post('/api/properties', payload);
  }

  Future<void> updateProperty(String id, Map<String, dynamic> payload) async {
    await _api.patch('/api/properties/$id', payload);
  }

  Future<void> deleteProperty(String id) async {
    await _api.delete('/api/properties/$id');
  }

  Future<void> createVehicle(Map<String, dynamic> payload) async {
    await _api.post('/api/vehicles', payload);
  }

  Future<void> updateVehicle(String id, Map<String, dynamic> payload) async {
    await _api.patch('/api/vehicles/$id', payload);
  }

  Future<void> deleteVehicle(String id) async {
    await _api.delete('/api/vehicles/$id');
  }

  Future<Map<String, dynamic>> fetchProfile() async {
    final data = await _api.get('/api/agent/profile') as Map<String, dynamic>;
    return (data['user'] as Map<String, dynamic>?) ?? {};
  }

  
  
  Future<void> saveOnboarding(Map<String, dynamic> payload) async {
    await _api.post('/api/agent/onboarding', payload);
  }

  Future<List<Map<String, dynamic>>> fetchMyPermissions() async {
    final data = await _api.get('/api/permissions/mine') as Map<String, dynamic>;
    return (data['requests'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
  }

  
  Future<void> updateProfileInfo({String? name, String? phone, String? profilePhoto}) async {
    await _api.patch('/api/auth/profile', {
      if (name != null && name.trim().isNotEmpty) 'name': name.trim(),
      if (phone != null) 'phone': phone.trim(),
      'profilePhoto': ?profilePhoto,
    });
  }

  Future<void> requestPermission({
    required String entityType,
    required String entityId,
    required String type,
  }) async {
    await _api.post('/api/permissions', {
      'entityType': entityType,
      'entityId': entityId,
      'type': type,
    });
  }
}
