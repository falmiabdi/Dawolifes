import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/data/models/listing_item.dart';
import 'package:dawolife_mobile/data/repositories/listing_repository.dart';
import 'package:dawolife_mobile/providers/saved_provider.dart';

class MockListingRepository extends Mock implements ListingRepository {}

void main() {
  group('SavedProvider', () {
    late MockListingRepository repository;
    late SavedProvider provider;

    setUp(() {
      repository = MockListingRepository();
      provider = SavedProvider(repository);
    });

    test('starts with empty items and not loading', () {
      expect(provider.items, isEmpty);
      expect(provider.loading, false);
    });

    group('load', () {
      test('loads saved items on success', () async {
        final items = [
          ListingItem(
            id: 'p1',
            image: 'img.jpg',
            title: 'Saved House',
            listingType: 'For Sale',
            price: 1000000,
            isVehicle: false,
          ),
        ];
        when(() => repository.fetchSaved()).thenAnswer((_) async => items);

        await provider.load();

        expect(provider.items.length, 1);
        expect(provider.items.first.title, 'Saved House');
        expect(provider.loading, false);
      });

      test('sets loading to true during fetch', () async {
        when(() => repository.fetchSaved()).thenAnswer((_) async => []);

        final loadFuture = provider.load();

        expect(provider.loading, true);

        await loadFuture;
        expect(provider.loading, false);
      });

      test('clears items on exception', () async {
        when(() => repository.fetchSaved()).thenThrow(Exception('Network'));

        await provider.load();

        expect(provider.items, isEmpty);
        expect(provider.loading, false);
      });
    });

    group('toggle', () {
      test('saves item when not already saved', () async {
        final item = ListingItem(
          id: 'p1',
          image: 'img.jpg',
          title: 'House',
          listingType: 'For Sale',
          price: 1000000,
          isVehicle: false,
        );
        when(() => repository.save(itemType: 'property', itemId: 'p1'))
            .thenAnswer((_) async {});
        when(() => repository.fetchSaved()).thenAnswer((_) async => []);

        await provider.load();
        await provider.toggle(item);

        expect(provider.items.length, 1);
        expect(provider.items.first.id, 'p1');
        verify(() => repository.save(itemType: 'property', itemId: 'p1')).called(1);
      });

      test('unsaves item when already saved', () async {
        final item = ListingItem(
          id: 'p1',
          image: 'img.jpg',
          title: 'House',
          listingType: 'For Sale',
          price: 1000000,
          isVehicle: false,
        );
        when(() => repository.unsave(itemType: 'property', itemId: 'p1'))
            .thenAnswer((_) async {});
        when(() => repository.fetchSaved()).thenAnswer((_) async => [
          ListingItem(
            id: 'p1',
            image: 'img.jpg',
            title: 'House',
            listingType: 'For Sale',
            price: 1000000,
            isVehicle: false,
          ),
        ]);

        await provider.load();
        await provider.toggle(item);

        expect(provider.items, isEmpty);
        verify(() => repository.unsave(itemType: 'property', itemId: 'p1')).called(1);
      });

      test('uses vehicle type for vehicle items', () async {
        final item = ListingItem(
          id: 'v1',
          image: 'car.jpg',
          title: 'Car',
          listingType: 'For Sale',
          price: 500000,
          isVehicle: true,
        );
        when(() => repository.save(itemType: 'vehicle', itemId: 'v1'))
            .thenAnswer((_) async {});
        when(() => repository.fetchSaved()).thenAnswer((_) async => []);

        await provider.load();
        await provider.toggle(item);

        verify(() => repository.save(itemType: 'vehicle', itemId: 'v1')).called(1);
      });
    });
  });
}
