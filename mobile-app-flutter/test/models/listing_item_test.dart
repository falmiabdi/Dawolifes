import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/data/models/listing_item.dart';
import 'package:dawolife_mobile/data/models/property.dart';
import 'package:dawolife_mobile/data/models/vehicle.dart';
import 'package:dawolife_mobile/data/models/listing_agent.dart';

void main() {
  group('ListingItem', () {
    final property = Property(
      id: 'p1',
      title: 'Luxury Villa',
      type: 'Villa',
      listingType: 'For Sale',
      price: 5000000,
      priceType: 'Fixed Price',
      region: 'Addis Ababa',
      city: 'Bole',
      subCity: 'Bole',
      bedrooms: 4,
      bathrooms: 3,
      area: 300,
      features: ['Garden', 'Pool'],
      images: ['https://example.com/img.jpg'],
      agent: const ListingAgent(name: 'Agent Alice'),
      displayPhone: '0912345678',
    );

    final vehicle = Vehicle(
      id: 'v1',
      title: 'Toyota Camry',
      listingType: 'For Sale',
      price: 2000000,
      priceType: 'Negotiable',
      region: 'Addis Ababa',
      city: 'Bole',
      subCity: 'Bole',
      manufacturingYear: 2022,
      mileage: 15000,
      features: ['Leather Seats'],
      images: ['https://example.com/car.jpg'],
      agent: const ListingAgent(name: 'Agent Bob'),
    );

    group('fromProperty', () {
      test('maps property fields correctly', () {
        final item = ListingItem.fromProperty(property);
        expect(item.id, 'p1');
        expect(item.title, 'Luxury Villa');
        expect(item.listingType, 'For Sale');
        expect(item.price, 5000000);
        expect(item.priceType, 'Fixed Price');
        expect(item.location, 'Bole, Bole, Addis Ababa');
        expect(item.type, 'Villa');
        expect(item.beds, 4);
        expect(item.baths, 3);
        expect(item.area, 300);
        expect(item.features, ['Garden', 'Pool']);
        expect(item.isVehicle, false);
        expect(item.displayPhone, '0912345678');
        expect(item.agent?.name, 'Agent Alice');
      });

      test('uses empty string when no images', () {
        final p = Property(
          id: 'p2',
          title: 'No Image House',
          type: 'House',
          listingType: 'For Rent',
          price: 10000,
          images: const [],
        );
        final item = ListingItem.fromProperty(p);
        expect(item.image, '');
      });
    });

    group('fromVehicle', () {
      test('maps vehicle fields correctly', () {
        final item = ListingItem.fromVehicle(vehicle);
        expect(item.id, 'v1');
        expect(item.title, 'Toyota Camry');
        expect(item.listingType, 'For Sale');
        expect(item.price, 2000000);
        expect(item.type, 'Vehicle');
        expect(item.year, 2022);
        expect(item.mileage, 15000);
        expect(item.isVehicle, true);
        expect(item.agent?.name, 'Agent Bob');
      });

      test('defaults price to 0 when null', () {
        final v = Vehicle(
          id: 'v2',
          title: 'Old Car',
          listingType: 'For Sale',
          price: null,
          images: const [],
        );
        final item = ListingItem.fromVehicle(v);
        expect(item.price, 0);
      });
    });

    group('isRent', () {
      test('returns true for rent listing types', () {
        final rentItem = ListingItem(
          id: 'r1',
          image: '',
          title: 'Rent House',
          listingType: 'For Rent',
          price: 10000,
          isVehicle: false,
        );
        expect(rentItem.isRent, true);
      });

      test('returns true for both listing types', () {
        final bothItem = ListingItem(
          id: 'r2',
          image: '',
          title: 'Flexible',
          listingType: 'Both',
          price: 10000,
          isVehicle: false,
        );
        expect(bothItem.isRent, true);
      });

      test('returns false for sale listing types', () {
        final saleItem = ListingItem(
          id: 's1',
          image: '',
          title: 'For Sale House',
          listingType: 'For Sale',
          price: 5000000,
          isVehicle: false,
        );
        expect(saleItem.isRent, false);
      });
    });

    group('matches', () {
      final item = ListingItem(
        id: 'm1',
        image: '',
        title: 'Villa in Bole',
        listingType: 'For Sale',
        price: 5000000,
        priceType: 'Fixed Price',
        location: 'Bole, Addis Ababa',
        type: 'Villa',
        beds: 4,
        baths: 3,
        area: 300,
        year: 2021,
        mileage: null,
        features: ['Garden', 'Pool'],
        isVehicle: false,
      );

      test('matches by title', () {
        expect(item.matches(query: 'Villa'), true);
      });

      test('matches by location', () {
        expect(item.matches(query: 'Bole'), true);
      });

      test('matches by feature', () {
        expect(item.matches(query: 'Garden'), true);
      });

      test('matches by price', () {
        expect(item.matches(query: '5000000'), true);
      });

      test('matches by beds', () {
        expect(item.matches(query: '4'), true);
        expect(item.matches(query: 'bed 4'), true);
      });

      test('matches by baths', () {
        expect(item.matches(query: '3'), true);
        expect(item.matches(query: 'bath 3'), true);
      });

      test('matches by area', () {
        expect(item.matches(query: '300'), true);
      });

      test('matches by year', () {
        expect(item.matches(query: '2021'), true);
      });

      test('does not match unrelated query', () {
        expect(item.matches(query: 'xyz'), false);
      });

      test('matches empty query', () {
        expect(item.matches(query: ''), true);
      });

      test('filters by category Villa', () {
        expect(item.matches(query: '', category: 'Villa'), true);
        expect(item.matches(query: '', category: 'House'), false);
      });

      test('filters by category Vehicle', () {
        final vehicleItem = ListingItem(
          id: 'v1',
          image: '',
          title: 'Car',
          listingType: 'For Sale',
          price: 1000000,
          type: 'Vehicle',
          isVehicle: true,
        );
        expect(vehicleItem.matches(query: '', category: 'Vehicle'), true);
        expect(vehicleItem.matches(query: '', category: 'House'), false);
      });
    });
  });
}
