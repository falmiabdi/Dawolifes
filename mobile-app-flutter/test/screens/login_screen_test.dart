import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:provider/provider.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/core/i18n/app_strings.dart';
import 'package:dawolife_mobile/providers/auth_provider.dart';
import 'package:dawolife_mobile/providers/language_provider.dart';
import 'package:dawolife_mobile/features/auth/login_screen.dart';
import 'package:dawolife_mobile/features/auth/signup_screen.dart';

class MockAuthProvider extends Mock implements AuthProvider {}
class MockLanguageProvider extends Mock implements LanguageProvider {}

void main() {
  group('LoginScreen', () {
    testWidgets('renders login form fields', (tester) async {
      final AuthProvider authProvider = MockAuthProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);
      when(() => authProvider.isLoggedIn).thenReturn(false);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: authProvider),
            ChangeNotifierProvider.value(value: langProvider),
          ],
          child: const MaterialApp(home: LoginScreen()),
        ),
      );

      expect(find.text('translated'), findsWidgets);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.byType(FilledButton), findsNWidgets(2));
    });

    testWidgets('shows validation errors for empty fields', (tester) async {
      final AuthProvider authProvider = MockAuthProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);
      when(() => authProvider.isLoggedIn).thenReturn(false);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: authProvider),
            ChangeNotifierProvider.value(value: langProvider),
          ],
          child: const MaterialApp(home: LoginScreen()),
        ),
      );

      await tester.tap(
        find.descendant(of: find.byType(Form), matching: find.byType(FilledButton)),
      );
      await tester.pump();

      expect(find.text('Email is required'), findsOneWidget);
      expect(find.text('Password is required'), findsOneWidget);
    });

    testWidgets('displays API error on login failure', (tester) async {
      final AuthProvider authProvider = MockAuthProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);
      when(() => authProvider.isLoggedIn).thenReturn(false);
      when(() => authProvider.login(email: any(named: 'email'), password: any(named: 'password')))
          .thenThrow(ApiException('Invalid credentials'));

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: authProvider),
            ChangeNotifierProvider.value(value: langProvider),
          ],
          child: const MaterialApp(home: LoginScreen()),
        ),
      );

      await tester.enterText(find.byType(TextFormField).first, 'test@test.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'password');
      await tester.pump();
      await tester.tap(
        find.descendant(of: find.byType(Form), matching: find.byType(FilledButton)),
      );
      await tester.pump();

      expect(find.text('Invalid credentials'), findsOneWidget);
    });

    testWidgets('navigates to signup on create account tap', (tester) async {
      final AuthProvider authProvider = MockAuthProvider();
      final LanguageProvider langProvider = MockLanguageProvider();
      when(() => langProvider.t(any())).thenReturn('translated');
      when(() => langProvider.t('create_account_link')).thenReturn('Create account');
      when(() => langProvider.lang).thenReturn(AppLanguage.english);
      when(() => authProvider.isLoggedIn).thenReturn(false);

      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider.value(value: authProvider),
            ChangeNotifierProvider.value(value: langProvider),
          ],
          child: const MaterialApp(home: LoginScreen()),
        ),
      );

      final createAccount = find.widgetWithText(TextButton, 'Create account');
      await tester.ensureVisible(createAccount);
      await tester.tap(createAccount);
      await tester.pumpAndSettle();

      expect(find.byType(SignupScreen), findsOneWidget);
    });
  });
}