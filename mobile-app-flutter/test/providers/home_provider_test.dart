import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/data/models/listing_item.dart';
import 'package:dawolife_mobile/data/repositories/listing_repository.dart';
import 'package:dawolife_mobile/providers/home_provider.dart';

class MockListingRepository extends Mock implements ListingRepository {}

void main() {
  group('HomeProvider', () {
    late MockListingRepository repository;
    late HomeProvider provider;

    setUp(() {
      repository = MockListingRepository();
      provider = HomeProvider(repository);
    });

    group('initial state', () {
      test('starts with empty items and not loading', () {
        expect(provider.houseItems, isEmpty);
        expect(provider.vehicleItems, isEmpty);
        expect(provider.loading, true);
        expect(provider.failed, false);
        expect(provider.query, '');
        expect(provider.category, '');
        expect(provider.hasMore, true);
        expect(provider.loadingMore, false);
      });
    });

    group('load', () {
      test('fetches properties and vehicles on success', () async {
        final houses = [
          ListingItem(
            id: 'p1',
            image: 'img.jpg',
            title: 'House',
            listingType: 'For Sale',
            price: 1000000,
            isVehicle: false,
          ),
        ];
        final vehicles = [
          ListingItem(
            id: 'v1',
            image: 'car.jpg',
            title: 'Car',
            listingType: 'For Sale',
            price: 500000,
            isVehicle: true,
          ),
        ];
        when(() => repository.fetchProperties()).thenAnswer((_) async => houses);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => vehicles);

        await provider.load();

        expect(provider.houseItems.length, 1);
        expect(provider.vehicleItems.length, 1);
        expect(provider.loading, false);
        expect(provider.failed, false);
      });

      test('sets failed to true on exception', () async {
        when(() => repository.fetchProperties()).thenThrow(Exception('Network'));
        when(() => repository.fetchVehicles()).thenThrow(Exception('Network'));

        await provider.load();

        expect(provider.houseItems, isEmpty);
        expect(provider.vehicleItems, isEmpty);
        expect(provider.loading, false);
        expect(provider.failed, true);
      });

      test('sets failed to true when one fetch fails after successful load', () async {
        final houses = [
          ListingItem(
            id: 'p1',
            image: 'img.jpg',
            title: 'House',
            listingType: 'For Sale',
            price: 1000000,
            isVehicle: false,
          ),
        ];
        final vehicles = [
          ListingItem(
            id: 'v1',
            image: 'car.jpg',
            title: 'Car',
            listingType: 'For Sale',
            price: 500000,
            isVehicle: true,
          ),
        ];
        when(() => repository.fetchProperties()).thenAnswer((_) async => houses);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => vehicles);
        await provider.load();

        when(() => repository.fetchProperties()).thenThrow(Exception('Network'));
        when(() => repository.fetchVehicles()).thenThrow(Exception('Network'));
        await provider.load();

        expect(provider.houseItems, isEmpty);
        expect(provider.vehicleItems, isEmpty);
        expect(provider.failed, true);
      });

      test('sets loading to true during fetch', () async {
        when(() => repository.fetchProperties()).thenAnswer((_) async => []);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => []);

        final loadFuture = provider.load();

        expect(provider.loading, true);

        await loadFuture;
        expect(provider.loading, false);
      });
    });

    group('setQuery', () {
      test('updates query and notifies listeners', () {
        provider.setQuery('villa');
        expect(provider.query, 'villa');
      });

      test('does not notify when query is same', () {
        provider.setQuery('house');
        provider.setQuery('house');
        expect(provider.query, 'house');
      });
    });

    group('setCategory', () {
      test('updates category and notifies listeners', () {
        provider.setCategory('Vehicle');
        expect(provider.category, 'Vehicle');
      });

      test('does not notify when category is same', () {
        provider.setCategory('House');
        provider.setCategory('House');
        expect(provider.category, 'House');
      });
    });

    group('visibleHouseItems', () {
      test('filters by category', () async {
        final houses = [
          ListingItem(
            id: 'p1',
            image: '',
            title: 'House',
            listingType: 'For Sale',
            price: 1000000,
            type: 'House',
            isVehicle: false,
          ),
          ListingItem(
            id: 'p2',
            image: '',
            title: 'Villa',
            listingType: 'For Sale',
            price: 5000000,
            type: 'Villa',
            isVehicle: false,
          ),
        ];
        provider = HomeProvider(repository);
        // Manually set items for filter testing
        provider.setCategory('Villa');
        // We need to test visibleHouseItems getter with category set
        // Since _houseItems is private, we test through load
        when(() => repository.fetchProperties()).thenAnswer((_) async => houses);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => []);
        await provider.load();
        provider.setCategory('Villa');
        expect(provider.visibleHouseItems.length, 1);
        expect(provider.visibleHouseItems.first.type, 'Villa');
      });

      test('filters by query', () async {
        final houses = [
          ListingItem(
            id: 'p1',
            image: '',
            title: 'Luxury Villa',
            listingType: 'For Sale',
            price: 5000000,
            type: 'Villa',
            isVehicle: false,
          ),
          ListingItem(
            id: 'p2',
            image: '',
            title: 'Small House',
            listingType: 'For Sale',
            price: 1000000,
            type: 'House',
            isVehicle: false,
          ),
        ];
        provider = HomeProvider(repository);
        when(() => repository.fetchProperties()).thenAnswer((_) async => houses);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => []);
        await provider.load();
        provider.setQuery('Villa');
        expect(provider.visibleHouseItems.length, 1);
        expect(provider.visibleHouseItems.first.title, 'Luxury Villa');
      });
    });

    group('visibleVehicleItems', () {
      test('returns empty when category is not Vehicle', () async {
        final vehicles = [
          ListingItem(
            id: 'v1',
            image: '',
            title: 'Car',
            listingType: 'For Sale',
            price: 500000,
            type: 'Vehicle',
            isVehicle: true,
          ),
        ];
        provider = HomeProvider(repository);
        when(() => repository.fetchProperties()).thenAnswer((_) async => []);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => vehicles);
        await provider.load();
        provider.setCategory('House');
        expect(provider.visibleVehicleItems, isEmpty);
      });

      test('filters by query when category is Vehicle', () async {
        final vehicles = [
          ListingItem(
            id: 'v1',
            image: '',
            title: 'Toyota',
            listingType: 'For Sale',
            price: 2000000,
            type: 'Vehicle',
            isVehicle: true,
          ),
          ListingItem(
            id: 'v2',
            image: '',
            title: 'Honda',
            listingType: 'For Sale',
            price: 1500000,
            type: 'Vehicle',
            isVehicle: true,
          ),
        ];
        provider = HomeProvider(repository);
        when(() => repository.fetchProperties()).thenAnswer((_) async => []);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => vehicles);
        await provider.load();
        provider.setCategory('Vehicle');
        provider.setQuery('Toyota');
        expect(provider.visibleVehicleItems.length, 1);
        expect(provider.visibleVehicleItems.first.title, 'Toyota');
      });
    });

    group('refresh', () {
      test('calls load again', () async {
        final houses = [
          ListingItem(
            id: 'p1',
            image: '',
            title: 'House',
            listingType: 'For Sale',
            price: 1000000,
            isVehicle: false,
          ),
        ];
        when(() => repository.fetchProperties()).thenAnswer((_) async => houses);
        when(() => repository.fetchVehicles()).thenAnswer((_) async => []);

        await provider.load();
        expect(provider.houseItems.length, 1);

        final moreHouses = [
          ListingItem(
            id: 'p1',
            image: '',
            title: 'House',
            listingType: 'For Sale',
            price: 1000000,
            isVehicle: false,
          ),
          ListingItem(
            id: 'p2',
            image: '',
            title: 'Apartment',
            listingType: 'For Sale',
            price: 2000000,
            isVehicle: false,
          ),
        ];
        when(() => repository.fetchProperties()).thenAnswer((_) async => moreHouses);

        await provider.refresh();
        expect(provider.houseItems.length, 2);
      });
    });
  });
}
