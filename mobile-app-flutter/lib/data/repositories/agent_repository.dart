import '../../core/network/api_client.dart';
import '../models/property.dart';
import '../models/vehicle.dart';

/// Agent portal API calls, mirroring the app/agent pages of the web app.
class AgentRepository {
  AgentRepository(this._api);

  final ApiClient _api;

  /// Uploads an image/document to Cloudinary via the server and returns the URL.
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

  /// Saves one step of the agent/owner onboarding form (POST /api/agent/onboarding),
  /// mirroring the web app's app/agent/onboarding page.
  Future<void> saveOnboarding(Map<String, dynamic> payload) async {
    await _api.post('/api/agent/onboarding', payload);
  }
}
