import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/data/repositories/admin_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('AdminRepository', () {
    late MockApiClient api;
    late AdminRepository repository;

    setUp(() {
      api = MockApiClient();
      repository = AdminRepository(api);
    });

    group('fetchAgents', () {
      test('returns agents without params', () async {
        final response = {
          'agents': [
            {
              'id': 'a1',
              'username': 'agent1',
              'email': 'agent@test.com',
              'role': 'agent',
              'status': 'Pending',
            },
          ],
        };
        when(() => api.get('/api/admin/agents'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchAgents();

        expect(result.length, 1);
        expect(result[0].id, 'a1');
      });

      test('includes status param when provided', () async {
        when(() => api.get('/api/admin/agents?status=Approved'))
            .thenAnswer((_) async => {'agents': []});

        await repository.fetchAgents(status: 'Approved');

        verify(() => api.get('/api/admin/agents?status=Approved')).called(1);
      });

      test('includes search param when provided', () async {
        when(() => api.get('/api/admin/agents?search=alice'))
            .thenAnswer((_) async => {'agents': []});

        await repository.fetchAgents(search: 'alice');

        verify(() => api.get('/api/admin/agents?search=alice')).called(1);
      });

      test('skips status param when empty', () async {
        when(() => api.get('/api/admin/agents'))
            .thenAnswer((_) async => {'agents': []});

        await repository.fetchAgents(status: '');

        verify(() => api.get('/api/admin/agents')).called(1);
      });

      test('skips status param when all', () async {
        when(() => api.get('/api/admin/agents'))
            .thenAnswer((_) async => {'agents': []});

        await repository.fetchAgents(status: 'all');

        verify(() => api.get('/api/admin/agents')).called(1);
      });
    });

    group('agentAction', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/admin/agents', {
              'action': 'approve',
              'id': 'a1',
            })).thenAnswer((_) async => {});

        await repository.agentAction('a1', 'approve');

        verify(() => api.post('/api/admin/agents', {
              'action': 'approve',
              'id': 'a1',
            })).called(1);
      });

      test('includes rejectionReason when provided', () async {
        when(() => api.post('/api/admin/agents', {
              'action': 'reject',
              'id': 'a1',
              'rejectionReason': 'Missing docs',
            })).thenAnswer((_) async => {});

        await repository.agentAction('a1', 'reject', rejectionReason: 'Missing docs');

        verify(() => api.post('/api/admin/agents', {
              'action': 'reject',
              'id': 'a1',
              'rejectionReason': 'Missing docs',
            })).called(1);
      });
    });

    group('fetchUsers', () {
      test('returns list of AdminUsers', () async {
        final response = {
          'users': [
            {
              'id': 'u1',
              'username': 'user1',
              'email': 'user@test.com',
              'role': 'buyer',
              'status': 'Active',
            },
          ],
        };
        when(() => api.get('/api/admin/users'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchUsers();

        expect(result.length, 1);
        expect(result[0].id, 'u1');
        expect(result[0].username, 'user1');
      });
    });

    group('userAction', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/admin/users', {'action': 'ban', 'id': 'u1'}))
            .thenAnswer((_) async => {});

        await repository.userAction('u1', 'ban');

        verify(() => api.post('/api/admin/users', {'action': 'ban', 'id': 'u1'})).called(1);
      });
    });

    group('fetchProperties', () {
      test('returns filtered properties', () async {
        final response = {
          'properties': [
            {
              'id': 'p1',
              'title': 'House',
              'type': 'House',
              'listingType': 'For Sale',
              'price': 1000000,
              'images': const [],
            },
          ],
        };
        when(() => api.get('/api/admin/properties?status=Pending'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchProperties(status: 'Pending');

        expect(result.length, 1);
      });
    });

    group('approveProperty', () {
      test('calls patch API', () async {
        when(() => api.patch('/api/admin/properties/p1/approve'))
            .thenAnswer((_) async => {});

        await repository.approveProperty('p1');

        verify(() => api.patch('/api/admin/properties/p1/approve')).called(1);
      });
    });

    group('rejectProperty', () {
      test('calls patch API with reason', () async {
        when(() => api.patch('/api/admin/properties/p1/reject', {'reason': 'Bad'}))
            .thenAnswer((_) async => {});

        await repository.rejectProperty('p1', reason: 'Bad');

        verify(() => api.patch('/api/admin/properties/p1/reject', {'reason': 'Bad'})).called(1);
      });

      test('defaults reason to empty string', () async {
        when(() => api.patch('/api/admin/properties/p1/reject', {'reason': ''}))
            .thenAnswer((_) async => {});

        await repository.rejectProperty('p1');

        verify(() => api.patch('/api/admin/properties/p1/reject', {'reason': ''})).called(1);
      });
    });

    group('switchPropertyContact', () {
      test('returns ListingContact from response', () async {
        when(() => api.patch('/api/admin/properties/p1/contact')).thenAnswer(
            (_) async => {'contact': 'admin', 'agentName': 'DawoLife', 'displayPhone': '0912345678'});

        final result = await repository.switchPropertyContact('p1');

        expect(result, isA<ListingContact>());
        expect(result.displayName, 'DawoLife');
        expect(result.phone, '0912345678');
        expect(result.isAdmin, isTrue);
      });
    });

    group('switchVehicleContact', () {
      test('returns ListingContact from response', () async {
        when(() => api.patch('/api/admin/vehicles/v1/contact')).thenAnswer(
            (_) async => {'contact': 'agent', 'agentName': 'bob', 'displayPhone': '0987654321'});

        final result = await repository.switchVehicleContact('v1');

        expect(result, isA<ListingContact>());
        expect(result.displayName, 'bob');
        expect(result.phone, '0987654321');
        expect(result.isAdmin, isFalse);
      });
    });

    group('deleteProperty', () {
      test('calls delete API', () async {
        when(() => api.delete('/api/properties/p1'))
            .thenAnswer((_) async => {});

        await repository.deleteProperty('p1');

        verify(() => api.delete('/api/properties/p1')).called(1);
      });
    });

    group('fetchVehicles', () {
      test('returns filtered vehicles', () async {
        final response = {
          'vehicles': [
            {
              'id': 'v1',
              'title': 'Car',
              'listingType': 'For Sale',
              'price': 2000000,
              'images': const [],
            },
          ],
        };
        when(() => api.get('/api/admin/vehicles?status=Pending'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchVehicles(status: 'Pending');

        expect(result.length, 1);
      });
    });

    group('approveVehicle', () {
      test('calls patch API', () async {
        when(() => api.patch('/api/admin/vehicles/v1/approve'))
            .thenAnswer((_) async => {});

        await repository.approveVehicle('v1');

        verify(() => api.patch('/api/admin/vehicles/v1/approve')).called(1);
      });
    });

    group('rejectVehicle', () {
      test('calls patch API with reason', () async {
        when(() => api.patch('/api/admin/vehicles/v1/reject', {'rejectionReason': 'Bad'}))
            .thenAnswer((_) async => {});

        await repository.rejectVehicle('v1', reason: 'Bad');

        verify(() => api.patch('/api/admin/vehicles/v1/reject', {'rejectionReason': 'Bad'})).called(1);
      });
    });

    group('deleteVehicle', () {
      test('calls delete API', () async {
        when(() => api.delete('/api/vehicles/v1'))
            .thenAnswer((_) async => {});

        await repository.deleteVehicle('v1');

        verify(() => api.delete('/api/vehicles/v1')).called(1);
      });
    });

    group('fetchPayments', () {
      test('returns list of Payments', () async {
        final response = {
          'payments': [
            {
              '_id': 'pay1',
              'orderId': 'ord1',
              'title': 'Listing Fee',
              'amount': 5000,
              'status': 'Completed',
              'method': 'Telebirr',
              'paymentType': 'listing_fee',
              'createdAt': '2024-01-01',
              'user': {'fullName': 'Alice'},
            },
          ],
        };
        when(() => api.get('/api/payments?role=admin'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchPayments();

        expect(result.length, 1);
        expect(result[0].id, 'pay1');
        expect(result[0].userName, 'Alice');
      });

      test('includes query params for payments', () async {
        when(() => api.get('/api/payments?role=agent&status=Completed&limit=10&page=1'))
            .thenAnswer((_) async => {'payments': []});

        await repository.fetchPayments(role: 'agent', status: 'Completed', limit: 10, page: 1);

        verify(() => api.get('/api/payments?role=agent&status=Completed&limit=10&page=1')).called(1);
      });
    });

    group('fetchPaymentStats', () {
      test('returns PaymentStats', () async {
        final response = {
          'stats': {
            'totalRevenue': 10000,
            'completedCount': 5,
            'pendingCount': 2,
            'failedCount': 1,
            'totalCount': 8,
          },
        };
        when(() => api.get('/api/payments?role=admin'))
            .thenAnswer((_) async => response);

        final stats = await repository.fetchPaymentStats();

        expect(stats.totalRevenue, 10000);
        expect(stats.completedCount, 5);
        expect(stats.totalCount, 8);
      });
    });

    group('createAdmin', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/admin/create', {
              'username': 'newadmin',
              'email': 'admin@test.com',
              'password': 'pass123',
            })).thenAnswer((_) async => {});

        await repository.createAdmin(
          username: 'newadmin',
          email: 'admin@test.com',
          password: 'pass123',
        );

        verify(() => api.post('/api/admin/create', {
              'username': 'newadmin',
              'email': 'admin@test.com',
              'password': 'pass123',
            })).called(1);
      });
    });

    group('updateProfile', () {
      test('calls API with correct parameters', () async {
        when(() => api.put('/api/admin/profile', {
              'phone': '0912345678',
              'email': 'admin@test.com',
              'profilePhoto': 'photo.jpg',
            })).thenAnswer((_) async => {});

        await repository.updateProfile(
          phone: '0912345678',
          email: 'admin@test.com',
          profilePhoto: 'photo.jpg',
        );

        verify(() => api.put('/api/admin/profile', {
              'phone': '0912345678',
              'email': 'admin@test.com',
              'profilePhoto': 'photo.jpg',
            })).called(1);
      });

      test('omits null profilePhoto', () async {
        when(() => api.put('/api/admin/profile', {
              'phone': '0912345678',
              'email': 'admin@test.com',
            })).thenAnswer((_) async => {});

        await repository.updateProfile(
          phone: '0912345678',
          email: 'admin@test.com',
        );

        verify(() => api.put('/api/admin/profile', {
              'phone': '0912345678',
              'email': 'admin@test.com',
            })).called(1);
      });
    });
  });
}
