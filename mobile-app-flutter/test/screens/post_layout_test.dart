import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/core/storage/token_storage.dart';
import 'package:dawolife_mobile/data/models/admin.dart';
import 'package:dawolife_mobile/data/models/payment.dart';
import 'package:dawolife_mobile/data/models/property.dart';
import 'package:dawolife_mobile/data/models/vehicle.dart';
import 'package:dawolife_mobile/data/repositories/admin_repository.dart';
import 'package:dawolife_mobile/data/repositories/agent_repository.dart';
import 'package:dawolife_mobile/features/admin/admin_dashboard.dart';
import 'package:dawolife_mobile/features/agent/agent_post_property.dart';
import 'package:dawolife_mobile/features/agent/agent_post_vehicle.dart';
import 'package:dawolife_mobile/providers/language_provider.dart';

class _FakeAdminRepo extends AdminRepository {
  _FakeAdminRepo(TokenStorage storage) : super(ApiClient(storage: storage));

  @override
  Future<List<AdminAgent>> fetchAgents({String? status, String? search}) async => [];
  @override
  Future<List<Property>> fetchProperties({String? status, String? search}) async => [];
  @override
  Future<List<Vehicle>> fetchVehicles({String? status, String? search}) async => [];
  @override
  Future<List<Payment>> fetchPayments({
    String role = 'admin',
    String? status,
    int? limit,
    int? page,
  }) async => [];
  @override
  Future<PaymentStats> fetchPaymentStats({String role = 'admin', int? limit}) async {
    return const PaymentStats(totalRevenue: 1234567, completedCount: 6, pendingCount: 2, failedCount: 0);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> setSmallView(WidgetTester tester, {double textScale = 1.3}) async {
    tester.view.physicalSize = const Size(360 * 2, 800 * 2);
    tester.view.devicePixelRatio = 2.0;
    final binding = tester.binding;
    binding.platformDispatcher.textScaleFactorTestValue = textScale;
    addTearDown(tester.view.reset);
    addTearDown(binding.platformDispatcher.clearTextScaleFactorTestValue);
  }

  Future<SharedPreferences> prefs() async {
    SharedPreferences.setMockInitialValues({});
    return SharedPreferences.getInstance();
  }

  testWidgets('admin dashboard has no overflow', (tester) async {
    await setSmallView(tester);
    final p = await prefs();
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: LanguageProvider(p)),
          Provider<AdminRepository>.value(value: _FakeAdminRepo(TokenStorage(p))),
        ],
        child: const MaterialApp(home: AdminDashboardScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await tester.drag(find.byType(Scrollable).first, const Offset(0, -800));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('post property wizard has no overflow on any step', (tester) async {
    await setSmallView(tester);
    final p = await prefs();
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: LanguageProvider(p)),
          Provider<AgentRepository>.value(value: AgentRepository(ApiClient(storage: TokenStorage(p)))),
          Provider<ApiClient>.value(value: ApiClient(storage: TokenStorage(p))),
        ],
        child: const MaterialApp(home: AgentPostPropertyScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    for (var step = 0; step < 5; step++) {
      await tester.drag(find.byType(Scrollable).first, const Offset(0, -2000));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull,
          reason: 'step $step scroll must not overflow');

      if (step < 4) {
        await tester.tap(find.text('Next'));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull,
            reason: 'tap Next from step $step must not overflow');
      }
    }
  });

  testWidgets('post vehicle form has no overflow', (tester) async {
    await setSmallView(tester);
    final p = await prefs();
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: LanguageProvider(p)),
          Provider<AgentRepository>.value(value: AgentRepository(ApiClient(storage: TokenStorage(p)))),
          Provider<ApiClient>.value(value: ApiClient(storage: TokenStorage(p))),
        ],
        child: const MaterialApp(home: AgentPostVehicleScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);

    await tester.drag(find.byType(Scrollable).first, const Offset(0, -3000));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}
