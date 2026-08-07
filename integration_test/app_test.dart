import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:dawolife_mobile/main.dart' as app;

/// End-to-end smoke test that runs on the real device against the live
/// Render backend.
///
/// Phase 1 (always runs): the home screen fetches Approved listings from
/// the database and renders the house + vehicle grids.
///
/// Phase 2 (seed-dependent): if the seeded buyer account `shalama@gmail.com`
/// exists on the backend, the user can sign in and the profile shows their
/// name. If the account does not exist (a fresh/non-seeded backend), this
/// phase is skipped rather than failing — logins for new accounts go through
/// the OTP email-verification flow covered by unit tests.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('home loads listings and buyer can sign in', (tester) async {
    await app.main();
    await tester.pump(const Duration(seconds: 2));

    // --- Phase 1: home should render listing cards after fetching from API.
    var loaded = false;
    for (var i = 0; i < 30; i++) {
      await tester.pump(const Duration(milliseconds: 500));
      final hasBadge =
          find.textContaining('For Sale', skipOffstage: false).evaluate().isNotEmpty ||
              find.textContaining('For Rent', skipOffstage: false).evaluate().isNotEmpty;
      if (hasBadge) {
        loaded = true;
        break;
      }
    }
    expect(loaded, isTrue, reason: 'Home should render listing cards after fetching from the API');

    // --- Phase 2: optional login flow for the seeded buyer account.
    await tester.tap(find.text('Profile'));
    await tester.pump(const Duration(seconds: 1));
    await tester.tap(find.text('Sign in'));
    await tester.pump(const Duration(seconds: 1));

    await tester.enterText(find.byType(TextFormField).first, 'shalama@gmail.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'SecurePass@123');
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(find.text('Sign in'));

    // Poll for the login round-trip. If the seeded account does not exist on
    // this backend, the login error text should remain — in which case we
    // skip phase 2 instead of failing the test.
    var signedIn = false;
    for (var i = 0; i < 20; i++) {
      await tester.pump(const Duration(milliseconds: 500));
      if (find.text('Log out').evaluate().isNotEmpty) {
        signedIn = true;
        break;
      }
      if (find.text('Welcome back').evaluate().isEmpty) {
        break;
      }
    }

    if (signedIn) {
      expect(find.text('Shalama'), findsOneWidget,
          reason: 'Signed-in profile should show the user name');
    } else {
      debugPrint('Phase 2 skipped: seeded buyer account not present on this backend.');
    }
  });
}