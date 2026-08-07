import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/core/theme/app_theme.dart';
import 'package:flutter/material.dart';

void main() {
  group('AppTheme', () {
    test('light theme is not null', () {
      expect(AppTheme.light, isNotNull);
    });

    test('light theme uses Material 3', () {
      expect(AppTheme.light.useMaterial3, true);
    });

    test('light theme has correct primary color', () {
      expect(AppTheme.light.colorScheme.primary, const Color(0xFFF97316));
    });

    test('light theme has correct brightness', () {
      expect(AppTheme.light.brightness, Brightness.light);
    });

    testWidgets('applies theme to widget tree', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          home: const Scaffold(body: Text('Hello')),
        ),
      );

      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.theme, AppTheme.light);
    });
  });
}
