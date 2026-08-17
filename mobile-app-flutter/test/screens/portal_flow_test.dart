import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/core/network/websocket_service.dart';
import 'package:dawolife_mobile/core/storage/token_storage.dart';
import 'package:dawolife_mobile/data/repositories/admin_repository.dart';
import 'package:dawolife_mobile/data/repositories/agent_repository.dart';
import 'package:dawolife_mobile/data/repositories/announcement_repository.dart';
import 'package:dawolife_mobile/data/repositories/auth_repository.dart';
import 'package:dawolife_mobile/data/repositories/listing_repository.dart';
import 'package:dawolife_mobile/data/repositories/message_repository.dart';
import 'package:dawolife_mobile/features/agent/agent_portal.dart';
import 'package:dawolife_mobile/providers/auth_provider.dart';
import 'package:dawolife_mobile/providers/language_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> seedApprovedAgent(SharedPreferences p) async {
    await p.setString('auth_token', 'fake-token');
    await p.setString(
      'auth_user',
      jsonEncode({
        'id': 'agent-1',
        'name': 'Approved Agent',
        'email': 'agent@dawolife.app',
        'role': 'agent',
        'roles': ['agent'],
        'status': 'Approved',
        'emailVerified': true,
      }),
    );
  }

  Future<void> pumpPortal(WidgetTester tester, {double width = 360, double height = 780, double textScale = 1.0}) async {
    tester.view.physicalSize = Size(width * 2, height * 2);
    tester.view.devicePixelRatio = 2.0;
    final binding = tester.binding;
    binding.platformDispatcher.textScaleFactorTestValue = textScale;
    addTearDown(tester.view.reset);
    addTearDown(binding.platformDispatcher.clearTextScaleFactorTestValue);

    final p = await SharedPreferences.getInstance();
    await seedApprovedAgent(p);
    final storage = TokenStorage(p);
    final api = ApiClient(storage: storage);
    final auth = AuthProvider(repository: AuthRepository(api), storage: storage, webSocket: WebSocketService(api));
    final language = LanguageProvider(p);
    await Future.wait([auth.init(), language.init()]);

    final listingRepo = ListingRepository(api);
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: language),
          ChangeNotifierProvider.value(value: auth),
          Provider.value(value: listingRepo),
          Provider.value(value: MessageRepository(api)),
          Provider.value(value: AgentRepository(api)),
          Provider.value(value: AdminRepository(api)),
          Provider.value(value: AnnouncementRepository(api)),
          Provider.value(value: WebSocketService(api)),
          Provider.value(value: api),
        ],
        child: const MaterialApp(home: AgentPortalScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  }

  testWidgets('portal -> post property flow has no layout exceptions', (tester) async {
    await pumpPortal(tester);

    expect(find.text('Agent Portal'), findsOneWidget);

    await tester.tap(find.text('Post Property'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'navigating to post property');

    expect(find.byType(TextField), findsWidgets, reason: 'post property form should be visible');

    // scroll through the first step
    await tester.drag(find.byType(Scrollable).last, const Offset(0, -1500));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'scrolling step 0');

    // tap into a field to open the keyboard, then scroll again
    final titleField = find.byType(TextFormField).first;
    await tester.tap(titleField);
    await tester.pumpAndSettle();
    await tester.enterText(titleField, 'Test Villa');
    await tester.drag(find.byType(Scrollable).last, const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'with keyboard open');
  });

  testWidgets('portal -> post property flow narrow + large text', (tester) async {
    await pumpPortal(tester, width: 320, textScale: 2.0);

    await tester.tap(find.text('Post Property'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'navigate at narrow + big text');

    for (var i = 0; i < 4; i++) {
      await tester.drag(find.byType(Scrollable).last, const Offset(0, -2000));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'scroll step $i at narrow + big text');
    }
  });

  testWidgets('portal -> my properties flow has no layout exceptions', (tester) async {
    await pumpPortal(tester);

    await tester.tap(find.text('My Properties'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'navigating to my properties');
  });
}
