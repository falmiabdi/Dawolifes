import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/data/repositories/listing_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('ListingRepository', () {
    late MockApiClient api;
    late ListingRepository repository;

    setUp(() {
      api = MockApiClient();
      repository = ListingRepository(api);
    });

    group('fetchProperties', () {
      test('returns mapped ListingItems from API response', () async {
        final response = {
          'properties': [
            {
              'id': 'p1',
              'title': 'House',
              'type': 'House',
              'listingType': 'For Sale',
              'price': 1000000,
              'images': ['img1.jpg'],
            },
            {
              'id': 'p2',
              'title': 'Villa',
              'type': 'Villa',
              'listingType': 'For Rent',
              'price': 50000,
              'images': ['img2.jpg'],
            },
          ],
        };
        when(() => api.get('/api/properties?status=Approved&page=1&limit=8'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchProperties();

        expect(result.length, 2);
        expect(result[0].id, 'p1');
        expect(result[0].title, 'House');
        expect(result[0].isVehicle, false);
        expect(result[1].id, 'p2');
        expect(result[1].isVehicle, false);
      });

      test('filters out properties without images', () async {
        final response = {
          'properties': [
            {
              'id': 'p1',
              'title': 'No Image House',
              'type': 'House',
              'listingType': 'For Sale',
              'price': 1000000,
              'images': const [],
            },
            {
              'id': 'p2',
              'title': 'With Image House',
              'type': 'House',
              'listingType': 'For Sale',
              'price': 1000000,
              'images': ['img.jpg'],
            },
          ],
        };
        when(() => api.get('/api/properties?status=Approved&page=1&limit=8'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchProperties();

        expect(result.length, 1);
        expect(result[0].id, 'p2');
      });

      test('respects limit parameter', () async {
        final response = {
          'properties': List.generate(10, (i) => {
            'id': 'p$i',
            'title': 'House $i',
            'type': 'House',
            'listingType': 'For Sale',
            'price': 1000000,
            'images': ['img.jpg'],
          }),
        };
        when(() => api.get('/api/properties?status=Approved&page=1&limit=3'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchProperties(limit: 3);

        expect(result.length, 3);
      });

      test('returns empty list when no properties', () async {
        when(() => api.get('/api/properties?status=Approved&page=1&limit=8'))
            .thenAnswer((_) async => const <String, dynamic>{});

        final result = await repository.fetchProperties();

        expect(result, isEmpty);
      });
    });

    group('fetchVehicles', () {
      test('returns mapped ListingItems from API response', () async {
        final response = [
          {
            'id': 'v1',
            'title': 'Toyota',
            'listingType': 'For Sale',
            'price': 2000000,
            'images': ['car.jpg'],
          },
        ];
        when(() => api.get('/api/vehicles?page=1&limit=8')).thenAnswer((_) async => response);

        final result = await repository.fetchVehicles();

        expect(result.length, 1);
        expect(result[0].id, 'v1');
        expect(result[0].isVehicle, true);
      });

      test('handles map response with vehicles key', () async {
        final response = {
          'vehicles': [
            {
              'id': 'v1',
              'title': 'Toyota',
              'listingType': 'For Sale',
              'price': 2000000,
              'images': ['car.jpg'],
            },
          ],
        };
        when(() => api.get('/api/vehicles?page=1&limit=8')).thenAnswer((_) async => response);

        final result = await repository.fetchVehicles();

        expect(result.length, 1);
      });

      test('filters out vehicles without images', () async {
        final response = [
          {
            'id': 'v1',
            'title': 'No Image Car',
            'listingType': 'For Sale',
            'price': 2000000,
            'images': const [],
          },
          {
            'id': 'v2',
            'title': 'With Image Car',
            'listingType': 'For Sale',
            'price': 2000000,
            'images': ['car.jpg'],
          },
        ];
        when(() => api.get('/api/vehicles?page=1&limit=8')).thenAnswer((_) async => response);

        final result = await repository.fetchVehicles();

        expect(result.length, 1);
        expect(result[0].id, 'v2');
      });
    });

    group('fetchPropertyDetail', () {
      test('returns Property from API response', () async {
        final response = {
          'id': 'p1',
          'title': 'House',
          'type': 'House',
          'listingType': 'For Sale',
          'price': 1000000,
          'images': const [],
        };
        when(() => api.get('/api/properties/p1')).thenAnswer((_) async => response);

        final result = await repository.fetchPropertyDetail('p1');

        expect(result, isNotNull);
        expect(result!.id, 'p1');
        expect(result.title, 'House');
      });
    });

    group('fetchVehicleDetail', () {
      test('returns Vehicle from API response', () async {
        final response = {
          'id': 'v1',
          'title': 'Car',
          'listingType': 'For Sale',
          'price': 2000000,
          'images': const [],
        };
        when(() => api.get('/api/vehicles/v1')).thenAnswer((_) async => response);

        final result = await repository.fetchVehicleDetail('v1');

        expect(result, isNotNull);
        expect(result!.id, 'v1');
        expect(result.title, 'Car');
      });
    });

    group('fetchSaved', () {
      test('returns mapped ListingItems from favorites', () async {
        final response = {
          'items': [
            {
              'itemType': 'property',
              'item': {
                'id': 'p1',
                'title': 'House',
                'type': 'House',
                'listingType': 'For Sale',
                'price': 1000000,
                'images': ['img.jpg'],
              },
            },
            {
              'itemType': 'vehicle',
              'item': {
                'id': 'v1',
                'title': 'Car',
                'listingType': 'For Sale',
                'price': 2000000,
                'images': ['car.jpg'],
              },
            },
          ],
        };
        when(() => api.get('/api/favorites')).thenAnswer((_) async => response);

        final result = await repository.fetchSaved();

        expect(result.length, 2);
        expect(result[0].id, 'p1');
        expect(result[0].isVehicle, false);
        expect(result[1].id, 'v1');
        expect(result[1].isVehicle, true);
      });

      test('skips items with non-map item field', () async {
        final response = {
          'items': [
            {
              'itemType': 'property',
              'item': 'not-a-map',
            },
          ],
        };
        when(() => api.get('/api/favorites')).thenAnswer((_) async => response);

        final result = await repository.fetchSaved();

        expect(result, isEmpty);
      });
    });

    group('isSaved', () {
      test('returns true when saved', () async {
        when(() => api.get('/api/favorites/status?itemType=property&itemId=p1'))
            .thenAnswer((_) async => {'saved': true});

        final result = await repository.isSaved(itemType: 'property', itemId: 'p1');

        expect(result, true);
      });

      test('returns false when not saved', () async {
        when(() => api.get('/api/favorites/status?itemType=property&itemId=p1'))
            .thenAnswer((_) async => {'saved': false});

        final result = await repository.isSaved(itemType: 'property', itemId: 'p1');

        expect(result, false);
      });
    });

    group('save', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/favorites', {'itemType': 'property', 'itemId': 'p1'}))
            .thenAnswer((_) async => {});

        await repository.save(itemType: 'property', itemId: 'p1');

        verify(() => api.post('/api/favorites', {'itemType': 'property', 'itemId': 'p1'})).called(1);
      });
    });

    group('unsave', () {
      test('calls API with correct parameters', () async {
        when(() => api.delete('/api/favorites', {'itemType': 'property', 'itemId': 'p1'}))
            .thenAnswer((_) async => {});

        await repository.unsave(itemType: 'property', itemId: 'p1');

        verify(() => api.delete('/api/favorites', {'itemType': 'property', 'itemId': 'p1'})).called(1);
      });
    });
  });
}
