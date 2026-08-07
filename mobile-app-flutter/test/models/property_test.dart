import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/property.dart';

void main() {
  group('Property', () {
    test('isRent returns true for rent listing types', () {
      final p = Property(
        id: 'p1',
        title: 'Rent House',
        type: 'House',
        listingType: 'For Rent',
        price: 10000,
      );
      expect(p.isRent, true);
    });

    test('isRent returns true for both listing types', () {
      final p = Property(
        id: 'p2',
        title: 'Flex',
        type: 'House',
        listingType: 'Both',
        price: 10000,
      );
      expect(p.isRent, true);
    });

    test('isRent returns false for sale listing types', () {
      final p = Property(
        id: 'p3',
        title: 'Sale House',
        type: 'House',
        listingType: 'For Sale',
        price: 5000000,
      );
      expect(p.isRent, false);
    });

    test('location joins non-empty parts', () {
      final p = Property(
        id: 'p4',
        title: 'House',
        type: 'House',
        listingType: 'For Sale',
        price: 5000000,
        region: 'Addis Ababa',
        city: 'Bole',
        subCity: 'Kazanchis',
      );
      expect(p.location, 'Kazanchis, Bole, Addis Ababa');
    });

    test('location skips empty parts', () {
      final p = Property(
        id: 'p5',
        title: 'House',
        type: 'House',
        listingType: 'For Sale',
        price: 5000000,
        region: 'Addis Ababa',
        city: '',
        subCity: null,
      );
      expect(p.location, 'Addis Ababa');
    });

    test('location returns empty string when all empty', () {
      final p = Property(
        id: 'p6',
        title: 'House',
        type: 'House',
        listingType: 'For Sale',
        price: 5000000,
      );
      expect(p.location, '');
    });

    test('fromJson parses all fields', () {
      final json = {
        'id': 'p10',
        'title': 'Luxury Villa',
        'type': 'Villa',
        'listingType': 'For Sale',
        'price': 5000000,
        'priceType': 'Fixed Price',
        'region': 'Addis Ababa',
        'city': 'Bole',
        'subCity': 'Kazanchis',
        'woreda': 'Woreda 3',
        'area': 300.5,
        'bedrooms': 4,
        'bathrooms': 3,
        'condition': 'Excellent',
        'description': 'Beautiful villa',
        'features': ['Garden', 'Pool'],
        'images': ['img1.jpg'],
        'videoUrl': 'https://youtube.com/watch?v=1',
        'featured': true,
        'status': 'Approved',
        'agentName': 'Agent Alice',
        'displayPhone': '0912345678',
        'posterType': 'Agent',
        'ownerType': 'Agent',
        'legalizedYear': 2020,
        'latitude': 9.02,
        'longitude': 38.75,
        'rejectionReason': null,
        'createdAt': '2024-01-01T00:00:00.000Z',
        'agent': {
          'id': 'a1',
          'username': 'Alice',
          'phone': '0912345678',
        },
      };
      final p = Property.fromJson(json);
      expect(p.id, 'p10');
      expect(p.title, 'Luxury Villa');
      expect(p.type, 'Villa');
      expect(p.listingType, 'For Sale');
      expect(p.price, 5000000);
      expect(p.priceType, 'Fixed Price');
      expect(p.region, 'Addis Ababa');
      expect(p.city, 'Bole');
      expect(p.subCity, 'Kazanchis');
      expect(p.woreda, 'Woreda 3');
      expect(p.area, 300.5);
      expect(p.bedrooms, 4);
      expect(p.bathrooms, 3);
      expect(p.condition, 'Excellent');
      expect(p.description, 'Beautiful villa');
      expect(p.features, ['Garden', 'Pool']);
      expect(p.images, ['img1.jpg']);
      expect(p.videoUrl, 'https://youtube.com/watch?v=1');
      expect(p.featured, true);
      expect(p.status, 'Approved');
      expect(p.agentName, 'Agent Alice');
      expect(p.displayPhone, '0912345678');
      expect(p.posterType, 'Agent');
      expect(p.ownerType, 'Agent');
      expect(p.legalizedYear, 2020);
      expect(p.latitude, 9.02);
      expect(p.longitude, 38.75);
      expect(p.rejectionReason, null);
      expect(p.createdAt, '2024-01-01T00:00:00.000Z');
      expect(p.agent?.id, 'a1');
    });

    test('fromJson defaults listingType when missing', () {
      final json = {
        'id': 'p11',
        'title': 'House',
        'type': 'House',
        'images': const [],
      };
      final p = Property.fromJson(json);
      expect(p.listingType, 'For Sale');
    });

    test('fromJson defaults price to 0 when missing', () {
      final json = {
        'id': 'p12',
        'title': 'House',
        'type': 'House',
        'images': const [],
      };
      final p = Property.fromJson(json);
      expect(p.price, 0);
    });

    test('fromJson handles null agent', () {
      final json = {
        'id': 'p13',
        'title': 'House',
        'type': 'House',
        'listingType': 'For Sale',
        'price': 1000000,
        'agent': null,
        'images': const [],
      };
      final p = Property.fromJson(json);
      expect(p.agent, isNotNull);
      expect(p.agent!.displayName, 'Agent');
      expect(p.agent!.id, isNull);
    });
  });
}
