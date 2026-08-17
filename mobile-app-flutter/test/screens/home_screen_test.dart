import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:provider/provider.dart';
import 'package:dawolife_mobile/data/models/listing_item.dart';
import 'package:dawolife_mobile/core/i18n/app_strings.dart';
import 'package:dawolife_mobile/providers/auth_provider.dart';
import 'package:dawolife_mobile/providers/home_provider.dart';
import 'package:dawolife_mobile/providers/language_provider.dart';
import 'package:dawolife_mobile/features/home/home_screen.dart';

class MockHomeProvider extends Mock implements HomeProvider {}
class MockLanguageProvider extends Mock implements LanguageProvider {}
class MockAuthProvider extends Mock implements AuthProvider {}

void main() {
  group('HomeScreen', () {
    testWidgets('renders header with search and category dropdown', (tester) async {
      final HomeProvider homeProvider = MockHomeProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      final AuthProvider authProvider = MockAuthProvider();
      when(() => authProvider.isLoggedIn).thenReturn(false);
      when(() => homeProvider.load()).thenAnswer((_) async {});
      when(() => homeProvider.loading).thenReturn(false);
      when(() => homeProvider.houseItems).thenReturn([]);
      when(() => homeProvider.vehicleItems).thenReturn([]);
      when(() => homeProvider.failed).thenReturn(false);
      when(() => homeProvider.hasMore).thenReturn(false);
      when(() => homeProvider.loadingMore).thenReturn(false);
      when(() => homeProvider.visibleHouseItems).thenReturn([]);
      when(() => homeProvider.visibleVehicleItems).thenReturn([]);
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: homeProvider),
            ChangeNotifierProvider.value(value: langProvider),
            ChangeNotifierProvider.value(value: authProvider),
          ],
          child: const MaterialApp(home: HomeScreen()),
        ),
      );

      expect(find.byType(DropdownButton<String>), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('shows loading indicator when loading', (tester) async {
      final HomeProvider homeProvider = MockHomeProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      final AuthProvider authProvider = MockAuthProvider();
      when(() => authProvider.isLoggedIn).thenReturn(false);
      when(() => homeProvider.load()).thenAnswer((_) async {});
      when(() => homeProvider.loading).thenReturn(true);
      when(() => homeProvider.houseItems).thenReturn([]);
      when(() => homeProvider.vehicleItems).thenReturn([]);
      when(() => homeProvider.failed).thenReturn(false);
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: homeProvider),
            ChangeNotifierProvider.value(value: langProvider),
            ChangeNotifierProvider.value(value: authProvider),
          ],
          child: const MaterialApp(home: HomeScreen()),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows error message when fetch fails', (tester) async {
      final HomeProvider homeProvider = MockHomeProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      final AuthProvider authProvider = MockAuthProvider();
      when(() => authProvider.isLoggedIn).thenReturn(false);
      when(() => homeProvider.load()).thenAnswer((_) async {});
      when(() => homeProvider.loading).thenReturn(false);
      when(() => homeProvider.houseItems).thenReturn([]);
      when(() => homeProvider.vehicleItems).thenReturn([]);
      when(() => homeProvider.failed).thenReturn(true);
      when(() => homeProvider.hasMore).thenReturn(false);
      when(() => homeProvider.loadingMore).thenReturn(false);
      when(() => homeProvider.visibleHouseItems).thenReturn([]);
      when(() => homeProvider.visibleVehicleItems).thenReturn([]);
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: homeProvider),
            ChangeNotifierProvider.value(value: langProvider),
            ChangeNotifierProvider.value(value: authProvider),
          ],
          child: const MaterialApp(home: HomeScreen()),
        ),
      );

      expect(find.text('Check your connection and pull to refresh.'), findsOneWidget);
    });

    testWidgets('shows empty message when no listings', (tester) async {
      final HomeProvider homeProvider = MockHomeProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      final AuthProvider authProvider = MockAuthProvider();
      when(() => authProvider.isLoggedIn).thenReturn(false);
      when(() => homeProvider.load()).thenAnswer((_) async {});
      when(() => homeProvider.loading).thenReturn(false);
      when(() => homeProvider.houseItems).thenReturn([]);
      when(() => homeProvider.vehicleItems).thenReturn([]);
      when(() => homeProvider.failed).thenReturn(false);
      when(() => homeProvider.hasMore).thenReturn(false);
      when(() => homeProvider.loadingMore).thenReturn(false);
      when(() => homeProvider.visibleHouseItems).thenReturn([]);
      when(() => homeProvider.visibleVehicleItems).thenReturn([]);
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: homeProvider),
            ChangeNotifierProvider.value(value: langProvider),
            ChangeNotifierProvider.value(value: authProvider),
          ],
          child: const MaterialApp(home: HomeScreen()),
        ),
      );

      expect(find.text('No listings yet.'), findsNWidgets(2));
    });

    testWidgets('renders listing cards when items available', (tester) async {
      final HomeProvider homeProvider = MockHomeProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      final AuthProvider authProvider = MockAuthProvider();
      when(() => authProvider.isLoggedIn).thenReturn(false);
      when(() => homeProvider.load()).thenAnswer((_) async {});
      when(() => homeProvider.loading).thenReturn(false);
      when(() => homeProvider.houseItems).thenReturn([]);
      when(() => homeProvider.vehicleItems).thenReturn([]);
      when(() => homeProvider.failed).thenReturn(false);
      when(() => homeProvider.hasMore).thenReturn(false);
      when(() => homeProvider.loadingMore).thenReturn(false);
      when(() => homeProvider.visibleHouseItems).thenReturn([
        ListingItem(
          id: 'p1',
          image: '',
          title: 'House',
          listingType: 'For Sale',
          price: 1000000,
          isVehicle: false,
        ),
      ]);
      when(() => homeProvider.visibleVehicleItems).thenReturn([]);
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: homeProvider),
            ChangeNotifierProvider.value(value: langProvider),
            ChangeNotifierProvider.value(value: authProvider),
          ],
          child: const MaterialApp(home: HomeScreen()),
        ),
      );

      expect(find.text('House'), findsOneWidget);
    });
  });
}