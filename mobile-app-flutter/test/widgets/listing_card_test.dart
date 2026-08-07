import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/core/utils/formatters.dart';
import 'package:dawolife_mobile/data/models/listing_item.dart';
import 'package:dawolife_mobile/widgets/listing_card.dart';

void main() {
  group('ListingCard', () {
    testWidgets('renders property card with correct content', (tester) async {
      final item = ListingItem(
        id: 'p1',
        image: 'https://example.com/img.jpg',
        title: 'Luxury Villa',
        listingType: 'For Sale',
        price: 5000000,
        priceType: 'Fixed Price',
        location: 'Bole, Addis Ababa',
        type: 'Villa',
        beds: 4,
        baths: 3,
        area: 300,
        year: 2021,
        features: ['Garden', 'Pool'],
        isVehicle: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item)],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Luxury Villa'), findsOneWidget);
      expect(find.text('Bole, Addis Ababa'), findsOneWidget);
      expect(find.text('For Sale'), findsOneWidget);
      expect(find.text('4'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);
      expect(find.text('300 m²'), findsOneWidget);
      expect(find.text('2021'), findsOneWidget);
    });

    testWidgets('renders vehicle card with correct content', (tester) async {
      final item = ListingItem(
        id: 'v1',
        image: 'https://example.com/car.jpg',
        title: 'Toyota Camry',
        listingType: 'For Sale',
        price: 2000000,
        location: 'Bole, Addis Ababa',
        type: 'Vehicle',
        year: 2022,
        mileage: 15000,
        features: ['Leather Seats'],
        isVehicle: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item)],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Toyota Camry'), findsOneWidget);
      expect(find.text('Bole, Addis Ababa'), findsOneWidget);
      expect(find.text('For Sale'), findsOneWidget);
      expect(find.text('2022'), findsOneWidget);
      expect(find.text('${Formatters.formatPrice(15000)} km'), findsOneWidget);
    });

    testWidgets('renders rent badge with /mo suffix', (tester) async {
      final item = ListingItem(
        id: 'p1',
        image: '',
        title: 'Rent House',
        listingType: 'For Rent',
        price: 50000,
        isVehicle: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item)],
              ),
            ),
          ),
        ),
      );

      expect(find.text('For Rent'), findsOneWidget);
      // The /mo suffix is rendered inside a RichText TextSpan, so search the widget tree
      expect(find.byWidgetPredicate((w) {
        if (w is RichText) return w.text.toPlainText().contains('/mo');
        return false;
      }), findsOneWidget);
    });

    testWidgets('renders placeholder when image is empty', (tester) async {
      final item = ListingItem(
        id: 'p1',
        image: '',
        title: 'No Image House',
        listingType: 'For Sale',
        price: 1000000,
        isVehicle: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item)],
              ),
            ),
          ),
        ),
      );

      expect(find.text('No Image House'), findsOneWidget);
    });

    testWidgets('renders Ethiopia when location is empty', (tester) async {
      final item = ListingItem(
        id: 'p1',
        image: '',
        title: 'House',
        listingType: 'For Sale',
        price: 1000000,
        location: '',
        isVehicle: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item)],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Ethiopia'), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (tester) async {
      bool tapped = false;
      final item = ListingItem(
        id: 'p1',
        image: '',
        title: 'House',
        listingType: 'For Sale',
        price: 1000000,
        isVehicle: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item, onTap: () => tapped = true)],
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ListingCard));
      await tester.pump();

      expect(tapped, true);
    });

    testWidgets('does not call onTap when null', (tester) async {
      final item = ListingItem(
        id: 'p1',
        image: '',
        title: 'House',
        listingType: 'For Sale',
        price: 1000000,
        isVehicle: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item)],
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ListingCard));
      await tester.pump();

      // No exception should be thrown
    });

    testWidgets('does not show stats when beds/baths/area/year/mileage are null or zero', (tester) async {
      final item = ListingItem(
        id: 'p1',
        image: '',
        title: 'Empty Stats House',
        listingType: 'For Sale',
        price: 1000000,
        isVehicle: false,
        beds: 0,
        baths: 0,
        area: 0,
        year: null,
        mileage: null,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.light(),
          home: Scaffold(
            body: SizedBox(
              width: 300,
              child: ListView(
                children: [ListingCard(item: item)],
              ),
            ),
          ),
        ),
      );

      expect(find.text('Empty Stats House'), findsOneWidget);
      final bedIcon = find.byIcon(Icons.bed_outlined);
      final bathIcon = find.byIcon(Icons.bathtub_outlined);
      expect(bedIcon, findsNothing);
      expect(bathIcon, findsNothing);
    });
  });
}
