import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dawolife_mobile/core/i18n/app_strings.dart';
import 'package:dawolife_mobile/providers/language_provider.dart';
import 'package:dawolife_mobile/widgets/service_cards.dart';

class FakeSharedPreferences extends Fake implements SharedPreferences {}

void main() {
  group('ServiceCards', () {
    testWidgets('renders three service cards', (tester) async {
      final prefs = FakeSharedPreferences();
      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(prefs),
          child: const MaterialApp(
            home: Scaffold(body: ServiceCards()),
          ),
        ),
      );

      expect(find.text('our Service'), findsOneWidget);
      expect(find.text('How to Buy'), findsOneWidget);
      expect(find.text('How to Sell'), findsOneWidget);
    });

    testWidgets('renders check icon in each card', (tester) async {
      final prefs = FakeSharedPreferences();
      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => LanguageProvider(prefs),
          child: const MaterialApp(
            home: Scaffold(body: ServiceCards()),
          ),
        ),
      );

      final checkIcons = find.byIcon(Icons.check);
      expect(checkIcons, findsNWidgets(3));
    });

    testWidgets('translates labels based on language', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final langProvider = LanguageProvider(prefs);
      await langProvider.setLang(AppLanguage.amharic);

      await tester.pumpWidget(
        ChangeNotifierProvider.value(
          value: langProvider,
          child: const MaterialApp(
            home: Scaffold(body: ServiceCards()),
          ),
        ),
      );

      expect(find.text('አገልግሎታችን'), findsOneWidget);
      expect(find.text('እንዴት መግዛት'), findsOneWidget);
      expect(find.text('እንዴት መሸጥ'), findsOneWidget);
    });
  });
}