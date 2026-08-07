import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dawolife_mobile/core/config/app_config.dart';
import 'package:dawolife_mobile/core/i18n/app_strings.dart';
import 'package:dawolife_mobile/providers/language_provider.dart';

class MockSharedPreferences extends Mock implements SharedPreferences {}

void main() {
  group('LanguageProvider', () {
    late MockSharedPreferences prefs;
    late LanguageProvider provider;

    setUp(() {
      prefs = MockSharedPreferences();
      provider = LanguageProvider(prefs);
    });

    test('defaults to English', () {
      expect(provider.lang, AppLanguage.english);
    });

    test('t delegates to AppStrings', () {
      expect(provider.t('home'), 'Home');
    });

    test('tv delegates to AppStrings', () {
      expect(provider.tv('For Sale'), 'For Sale');
    });

    group('init', () {
      test('loads saved language from prefs', () async {
        when(() => prefs.getString(AppConfig.languageKey)).thenReturn('am');
        await provider.init();
        expect(provider.lang, AppLanguage.amharic);
      });

      test('defaults to English when prefs returns null', () async {
        when(() => prefs.getString(AppConfig.languageKey)).thenReturn(null);
        await provider.init();
        expect(provider.lang, AppLanguage.english);
      });

      test('defaults to English for unknown code', () async {
        when(() => prefs.getString(AppConfig.languageKey)).thenReturn('fr');
        await provider.init();
        expect(provider.lang, AppLanguage.english);
      });
    });

    group('setLang', () {
      test('updates language and saves to prefs', () async {
        when(() => prefs.setString(AppConfig.languageKey, 'am'))
            .thenAnswer((_) async => true);
        await provider.setLang(AppLanguage.amharic);
        expect(provider.lang, AppLanguage.amharic);
        verify(() => prefs.setString(AppConfig.languageKey, 'am')).called(1);
      });

      test('does nothing when setting same language', () async {
        await provider.setLang(AppLanguage.english);
        verifyNever(() => prefs.setString(any(), any()));
      });

      test('changes translation after setting new language', () async {
        when(() => prefs.setString(AppConfig.languageKey, 'om'))
            .thenAnswer((_) async => true);
        await provider.setLang(AppLanguage.oromo);
        expect(provider.t('home'), 'Mana');
        expect(provider.tv('For Sale'), 'Gurgurtaaf');
      });
    });
  });
}
