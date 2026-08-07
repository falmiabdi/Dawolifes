import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/data/repositories/agent_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('AgentRepository', () {
    late MockApiClient api;
    late AgentRepository repository;

    setUp(() {
      api = MockApiClient();
      repository = AgentRepository(api);
    });

    group('uploadFile', () {
      test('returns URL from API response', () async {
        final response = {'url': 'https://cdn.example.com/upload.jpg'};
        when(() => api.uploadFile(
              '/api/agent/upload',
              bytes: [1, 2, 3],
              filename: 'photo.jpg',
              fields: {'field': 'image'},
            )).thenAnswer((_) async => response);

        final url = await repository.uploadFile(
          bytes: [1, 2, 3],
          filename: 'photo.jpg',
          field: 'image',
        );

        expect(url, 'https://cdn.example.com/upload.jpg');
      });

      test('throws ApiException when URL is null', () async {
        when(() => api.uploadFile(
              '/api/agent/upload',
              bytes: [1, 2, 3],
              filename: 'photo.jpg',
              fields: {'field': 'image'},
            )).thenAnswer((_) async => {'url': null});

        expect(
          () => repository.uploadFile(
            bytes: [1, 2, 3],
            filename: 'photo.jpg',
            field: 'image',
          ),
          throwsA(isA<ApiException>()),
        );
      });
    });

    group('fetchMyProperties', () {
      test('returns list of Properties', () async {
        final response = {
          'properties': [
            {
              'id': 'p1',
              'title': 'My House',
              'type': 'House',
              'listingType': 'For Sale',
              'price': 1000000,
              'images': const [],
            },
          ],
        };
        when(() => api.get('/api/agent/properties'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchMyProperties();

        expect(result.length, 1);
        expect(result[0].id, 'p1');
        expect(result[0].title, 'My House');
      });

      test('returns empty list when no properties', () async {
        when(() => api.get('/api/agent/properties'))
            .thenAnswer((_) async => const <String, dynamic>{});

        final result = await repository.fetchMyProperties();

        expect(result, isEmpty);
      });
    });

    group('fetchMyVehicles', () {
      test('returns list of Vehicles', () async {
        final response = {
          'vehicles': [
            {
              'id': 'v1',
              'title': 'My Car',
              'listingType': 'For Sale',
              'price': 2000000,
              'images': const [],
            },
          ],
        };
        when(() => api.get('/api/agent/vehicles'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchMyVehicles();

        expect(result.length, 1);
        expect(result[0].id, 'v1');
        expect(result[0].title, 'My Car');
      });

      test('returns empty list when no vehicles', () async {
        when(() => api.get('/api/agent/vehicles'))
            .thenAnswer((_) async => const <String, dynamic>{});

        final result = await repository.fetchMyVehicles();

        expect(result, isEmpty);
      });
    });

    group('createProperty', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/properties', {'title': 'New House'}))
            .thenAnswer((_) async => {});

        await repository.createProperty({'title': 'New House'});

        verify(() => api.post('/api/properties', {'title': 'New House'})).called(1);
      });
    });

    group('updateProperty', () {
      test('calls API with correct parameters', () async {
        when(() => api.patch('/api/properties/p1', {'title': 'Updated'}))
            .thenAnswer((_) async => {});

        await repository.updateProperty('p1', {'title': 'Updated'});

        verify(() => api.patch('/api/properties/p1', {'title': 'Updated'})).called(1);
      });
    });

    group('deleteProperty', () {
      test('calls API with correct parameters', () async {
        when(() => api.delete('/api/properties/p1'))
            .thenAnswer((_) async => {});

        await repository.deleteProperty('p1');

        verify(() => api.delete('/api/properties/p1')).called(1);
      });
    });

    group('createVehicle', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/vehicles', {'title': 'New Car'}))
            .thenAnswer((_) async => {});

        await repository.createVehicle({'title': 'New Car'});

        verify(() => api.post('/api/vehicles', {'title': 'New Car'})).called(1);
      });
    });

    group('updateVehicle', () {
      test('calls API with correct parameters', () async {
        when(() => api.patch('/api/vehicles/v1', {'title': 'Updated'}))
            .thenAnswer((_) async => {});

        await repository.updateVehicle('v1', {'title': 'Updated'});

        verify(() => api.patch('/api/vehicles/v1', {'title': 'Updated'})).called(1);
      });
    });

    group('deleteVehicle', () {
      test('calls API with correct parameters', () async {
        when(() => api.delete('/api/vehicles/v1'))
            .thenAnswer((_) async => {});

        await repository.deleteVehicle('v1');

        verify(() => api.delete('/api/vehicles/v1')).called(1);
      });
    });

    group('fetchProfile', () {
      test('returns user map from API response', () async {
        final response = {
          'user': {
            'id': 'u1',
            'name': 'Agent',
            'email': 'agent@test.com',
            'role': 'agent',
          },
        };
        when(() => api.get('/api/agent/profile'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchProfile();

        expect(result['id'], 'u1');
        expect(result['name'], 'Agent');
      });

      test('returns empty map when user missing', () async {
        when(() => api.get('/api/agent/profile'))
            .thenAnswer((_) async => const <String, dynamic>{});

        final result = await repository.fetchProfile();

        expect(result, isEmpty);
      });
    });
  });
}
