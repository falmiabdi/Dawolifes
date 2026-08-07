import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/vehicle.dart';

void main() {
  group('Vehicle', () {
    test('isRent returns true for rent listing types', () {
      final v = Vehicle(
        id: 'v1',
        title: 'Rent Car',
        listingType: 'For Rent',
        images: const [],
      );
      expect(v.isRent, true);
    });

    test('isRent returns true for both listing types', () {
      final v = Vehicle(
        id: 'v2',
        title: 'Flex Car',
        listingType: 'Both',
        images: const [],
      );
      expect(v.isRent, true);
    });

    test('isRent returns false for sale listing types', () {
      final v = Vehicle(
        id: 'v3',
        title: 'Sale Car',
        listingType: 'For Sale',
        images: const [],
      );
      expect(v.isRent, false);
    });

    test('location joins non-empty parts', () {
      final v = Vehicle(
        id: 'v4',
        title: 'Car',
        listingType: 'For Sale',
        region: 'Addis Ababa',
        city: 'Bole',
        subCity: 'Kazanchis',
        images: const [],
      );
      expect(v.location, 'Kazanchis, Bole, Addis Ababa');
    });

    test('location skips empty parts', () {
      final v = Vehicle(
        id: 'v5',
        title: 'Car',
        listingType: 'For Sale',
        region: 'Addis Ababa',
        city: '',
        subCity: null,
        images: const [],
      );
      expect(v.location, 'Addis Ababa');
    });

    test('location returns empty string when all empty', () {
      final v = Vehicle(
        id: 'v6',
        title: 'Car',
        listingType: 'For Sale',
        images: const [],
      );
      expect(v.location, '');
    });

    test('fromJson parses all fields', () {
      final json = {
        'id': 'v10',
        'title': 'Toyota',
        'listingType': 'For Sale',
        'vehicleCategory': 'Sedan',
        'make': 'Toyota',
        'model': 'Camry',
        'manufacturingYear': 2022,
        'color': 'White',
        'countryOfOrigin': 'Japan',
        'fuelType': 'Gasoline',
        'transmission': 'Automatic',
        'mileage': 15000,
        'condition': 'Excellent',
        'price': 2000000,
        'priceType': 'Negotiable',
        'region': 'Addis Ababa',
        'city': 'Bole',
        'subCity': 'Bole',
        'description': 'Great car',
        'features': ['Leather', 'Sunroof'],
        'images': ['img1.jpg', 'img2.jpg'],
        'videoUrl': 'https://youtube.com/watch?v=1',
        'status': 'Approved',
        'agentName': 'Agent Alice',
        'rejectionReason': null,
        'createdAt': '2024-01-01T00:00:00.000Z',
        'agent': {
          'id': 'a1',
          'username': 'Alice',
          'phone': '0912345678',
        },
      };
      final v = Vehicle.fromJson(json);
      expect(v.id, 'v10');
      expect(v.title, 'Toyota');
      expect(v.listingType, 'For Sale');
      expect(v.vehicleCategory, 'Sedan');
      expect(v.make, 'Toyota');
      expect(v.model, 'Camry');
      expect(v.manufacturingYear, 2022);
      expect(v.color, 'White');
      expect(v.countryOfOrigin, 'Japan');
      expect(v.fuelType, 'Gasoline');
      expect(v.transmission, 'Automatic');
      expect(v.mileage, 15000);
      expect(v.condition, 'Excellent');
      expect(v.price, 2000000);
      expect(v.priceType, 'Negotiable');
      expect(v.region, 'Addis Ababa');
      expect(v.city, 'Bole');
      expect(v.subCity, 'Bole');
      expect(v.description, 'Great car');
      expect(v.features, ['Leather', 'Sunroof']);
      expect(v.images, ['img1.jpg', 'img2.jpg']);
      expect(v.videoUrl, 'https://youtube.com/watch?v=1');
      expect(v.status, 'Approved');
      expect(v.agentName, 'Agent Alice');
      expect(v.rejectionReason, null);
      expect(v.createdAt, '2024-01-01T00:00:00.000Z');
      expect(v.agent?.id, 'a1');
      expect(v.agent?.name, 'Alice');
      expect(v.agent?.phone, '0912345678');
    });

    test('fromJson falls back title from make/model', () {
      final json = {
        'id': 'v11',
        'listingType': 'For Sale',
        'make': 'Toyota',
        'vehicleModel': 'Corolla',
        'images': const [],
      };
      final v = Vehicle.fromJson(json);
      expect(v.title, 'Toyota Corolla');
    });

    test('fromJson handles null agent', () {
      final json = {
        'id': 'v12',
        'title': 'Car',
        'listingType': 'For Sale',
        'agent': null,
        'images': const [],
      };
      final v = Vehicle.fromJson(json);
      expect(v.agent, isNotNull);
      expect(v.agent!.displayName, 'Agent');
      expect(v.agent!.id, isNull);
    });

    test('fromJson defaults listingType when missing', () {
      final json = {
        'id': 'v13',
        'images': const [],
      };
      final v = Vehicle.fromJson(json);
      expect(v.listingType, 'For Sale');
    });
  });
}
