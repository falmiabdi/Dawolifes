import '../../core/network/api_client.dart';
import '../models/admin.dart';
import '../models/payment.dart';
import '../models/property.dart';
import '../models/vehicle.dart';

/// Admin panel API calls, mirroring the app/admin pages of the web app.
class AdminRepository {
  AdminRepository(this._api);

  final ApiClient _api;

  Future<List<AdminAgent>> fetchAgents({String? status, String? search}) async {
    final params = <String, String>{
      if (status != null && status.isNotEmpty && status != 'all') 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
    };
    final query = params.isEmpty ? '' : '?${params.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&')}';
    final data = await _api.get('/api/admin/agents$query') as Map<String, dynamic>;
    return (data['agents'] as List?)?.map((e) => AdminAgent.fromJson(e as Map<String, dynamic>)).toList() ?? const [];
  }

  Future<void> agentAction(String id, String action, {String? rejectionReason}) async {
    await _api.post('/api/admin/agents', {
      'action': action,
      'id': id,
      'rejectionReason': ?rejectionReason,
    });
  }

  Future<List<AdminUser>> fetchUsers() async {
    final data = await _api.get('/api/admin/users') as Map<String, dynamic>;
    return (data['users'] as List?)?.map((e) => AdminUser.fromJson(e as Map<String, dynamic>)).toList() ?? const [];
  }

  Future<void> userAction(String id, String action) async {
    await _api.post('/api/admin/users', {'action': action, 'id': id});
  }

  Future<List<Property>> fetchProperties({String? status, String? search}) async {
    final params = <String, String>{
      if (status != null && status.isNotEmpty && status != 'all') 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
    };
    final query = params.isEmpty ? '' : '?${params.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&')}';
    final data = await _api.get('/api/admin/properties$query') as Map<String, dynamic>;
    return (data['properties'] as List?)?.map((e) => Property.fromJson(e as Map<String, dynamic>)).toList() ?? const [];
  }

  Future<void> approveProperty(String id) async {
    await _api.patch('/api/admin/properties/$id/approve');
  }

  Future<void> rejectProperty(String id, {String? reason}) async {
    await _api.patch('/api/admin/properties/$id/reject', {'reason': reason ?? ''});
  }

  Future<String> switchPropertyContact(String id) async {
    final data = await _api.patch('/api/admin/properties/$id/contact') as Map<String, dynamic>;
    return '${data['displayPhone'] ?? ''}';
  }

  Future<void> deleteProperty(String id) async {
    await _api.delete('/api/properties/$id');
  }

  Future<List<Vehicle>> fetchVehicles({String? status, String? search}) async {
    final params = <String, String>{
      if (status != null && status.isNotEmpty && status != 'all') 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
    };
    final query = params.isEmpty ? '' : '?${params.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&')}';
    final data = await _api.get('/api/admin/vehicles$query') as Map<String, dynamic>;
    return (data['vehicles'] as List?)?.map((e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList() ?? const [];
  }

  Future<void> approveVehicle(String id) async {
    await _api.patch('/api/admin/vehicles/$id/approve');
  }

  Future<void> rejectVehicle(String id, {String? reason}) async {
    await _api.patch('/api/admin/vehicles/$id/reject', {'rejectionReason': reason ?? ''});
  }

  Future<void> deleteVehicle(String id) async {
    await _api.delete('/api/vehicles/$id');
  }

  Future<List<Payment>> fetchPayments({
    String role = 'admin',
    String? status,
    int? limit,
    int? page,
  }) async {
    final params = <String, String>{
      'role': role,
      if (status != null && status.isNotEmpty) 'status': status,
      if (limit != null) 'limit': '$limit',
      if (page != null) 'page': '$page',
    };
    final query = params.isEmpty ? '' : '?${params.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&')}';
    final data = await _api.get('/api/payments$query') as Map<String, dynamic>;
    final payments = (data['payments'] as List?)?.map((e) => Payment.fromJson(e as Map<String, dynamic>)).toList() ?? const [];
    return payments;
  }

  Future<PaymentStats> fetchPaymentStats({String role = 'admin', int? limit}) async {
    final params = <String, String>{
      'role': role,
      if (limit != null) 'limit': '$limit',
    };
    final query = params.isEmpty ? '' : '?${params.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&')}';
    final data = await _api.get('/api/payments$query') as Map<String, dynamic>;
    return PaymentStats.fromJson(data['stats'] as Map<String, dynamic>?);
  }

  Future<void> createAdmin({
    required String username,
    required String email,
    required String password,
  }) async {
    await _api.post('/api/admin/create', {
      'username': username,
      'email': email,
      'password': password,
    });
  }

  Future<void> updateProfile({
    required String phone,
    required String email,
    String? profilePhoto,
  }) async {
    await _api.put('/api/admin/profile', {
      'phone': phone,
      'email': email,
      'profilePhoto': ?profilePhoto,
    });
  }
}
