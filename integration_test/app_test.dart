import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:dawolife_mobile/main.dart' as app;

/// End-to-end smoke test that runs on the real device against the live
/// Render backend:
///  1. Home loads and shows listings (house + vehicle grids).
///  2. User can sign in as the seeded buyer account.
///  3. Profile shows the signed-in user after logging in.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('home loads listings and buyer can sign in', (tester) async {
    await app.main();
    await tester.pump(const Duration(seconds: 2));

    // Allow the home screen to fetch properties/vehicles from the API.
    var loaded = false;
    for (var i = 0; i < 20; i++) {
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

    // Go to the Profile tab (last bottom-nav item) and open the sign-in screen.
    await tester.tap(find.text('Profile'));
    await tester.pump(const Duration(seconds: 1));
    await tester.tap(find.text('Sign in'));
    await tester.pump(const Duration(seconds: 1));

    // Fill the form and submit via the button (not the field's onSubmitted,
    // which would also submit and pop before we can assert).
    await tester.enterText(find.byType(TextFormField).first, 'shalama@gmail.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'SecurePass@123');
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(find.text('Sign in'));

    // Poll for the login round-trip to land back on the shell logged in.
    var signedIn = false;
    for (var i = 0; i < 20; i++) {
      await tester.pump(const Duration(milliseconds: 500));
      if (find.text('Log out').evaluate().isNotEmpty) {
        signedIn = true;
        break;
      }
      if (find.text('Welcome back').evaluate().isEmpty) {
        // Route popped; we're back on the shell.
        break;
      }
    }

    // Should land back on Profile showing the buyer account.
    expect(signedIn, isTrue, reason: 'Profile should show Log out after signing in');
    expect(find.text('Shalama'), findsOneWidget,
        reason: 'Signed-in profile should show the user name');
  });
}
