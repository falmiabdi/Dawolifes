import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/core/storage/token_storage.dart';
import 'package:dawolife_mobile/data/repositories/agent_repository.dart';
import 'package:dawolife_mobile/data/repositories/auth_repository.dart';
import 'package:dawolife_mobile/features/agent/agent_onboarding_screen.dart';
import 'package:dawolife_mobile/providers/auth_provider.dart';
import 'package:dawolife_mobile/providers/language_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpOnboarding(WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final lang = LanguageProvider(prefs);
    final storage = TokenStorage(prefs);
    final api = ApiClient(
      storage: storage,
      httpClient: MockClient((request) async {
        return http.Response(
          '{"message":"ok","user":{"id":"u1","name":"Test Agent",'
          '"email":"test@dawolife.app","role":"agent","status":"Pending",'
          '"onboardingComplete":false},"accessToken":"tok","refreshToken":"rt",'
          '"session":{"user":{"id":"u1","name":"Test Agent",'
          '"email":"test@dawolife.app","role":"agent","status":"Pending",'
          '"onboardingComplete":false}}}',
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    tester.view.physicalSize = const Size(390 * 3, 844 * 3);
    tester.view.devicePixelRatio = 3.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: lang),
          ChangeNotifierProvider(
            create: (_) => AuthProvider(
              repository: AuthRepository(api),
              storage: storage,
            ),
          ),
          Provider.value(value: AgentRepository(api)),
        ],
        child: const MaterialApp(
          home: AgentOnboardingScreen(),
        ),
      ),
    );
  }

  testWidgets('step 0 (Personal) renders all fields without layout errors',
      (tester) async {
    await pumpOnboarding(tester);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    expect(find.text('Personal Information'), findsOneWidget);
    expect(find.byType(TextField), findsWidgets);

    // Scroll to bottom to force layout of every field + the nav buttons.
    await tester.drag(find.byType(Scrollable).first, const Offset(0, -1200));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Save & Continue'), findsOneWidget);
  });

  testWidgets('dropdown menus open and lay out without infinite width',
      (tester) async {
    await pumpOnboarding(tester);
    await tester.pumpAndSettle();

    await tester.drag(find.byType(Scrollable).first, const Offset(0, -600));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Gender').last);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Male'), findsOneWidget);

    await tester.tap(find.text('I am registering as').last);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('all 6 steps lay out (no infinite width on any step)',
      (tester) async {
    await pumpOnboarding(tester);
    await tester.pumpAndSettle();

    for (var step = 0; step < 6; step++) {
      if (step > 0) {
        await tester.drag(find.byType(Scrollable).first, const Offset(0, -1200));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Save & Continue'));
        await tester.pumpAndSettle();
      }
      expect(tester.takeException(), isNull,
          reason: 'step $step must not throw during layout');
      await tester.drag(find.byType(Scrollable).first, const Offset(0, -1200));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull,
          reason: 'step $step scroll must not throw');
    }
  });

  testWidgets('keyboard inset does not break layout', (tester) async {
    await pumpOnboarding(tester);
    await tester.pumpAndSettle();

    await tester.showKeyboard(find.byType(TextFormField).first);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await tester.drag(find.byType(Scrollable).first, const Offset(0, -1200));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}