import 'package:flutter_test/flutter_test.dart';
import 'package:dawolife_mobile/core/i18n/app_strings.dart';

void main() {
  group('AppStrings', () {
    group('t', () {
      test('returns English translation for known key', () {
        expect(AppStrings.t(AppLanguage.english, 'home'), 'Home');
      });

      test('returns Amharic translation for known key', () {
        expect(AppStrings.t(AppLanguage.amharic, 'home'), 'መነሻ');
      });

      test('returns Oromo translation for known key', () {
        expect(AppStrings.t(AppLanguage.oromo, 'home'), 'Mana');
      });

      test('falls back to key for missing translations', () {
        expect(AppStrings.t(AppLanguage.english, 'missing_key'), 'missing_key');
        expect(AppStrings.t(AppLanguage.amharic, 'missing_key'), 'missing_key');
        expect(AppStrings.t(AppLanguage.oromo, 'missing_key'), 'missing_key');
      });

      test('returns English for missing keys in other languages', () {
        expect(AppStrings.t(AppLanguage.amharic, 'definitely_missing'), 'definitely_missing');
        expect(AppStrings.t(AppLanguage.oromo, 'definitely_missing'), 'definitely_missing');
      });

      test('returns form strings', () {
        expect(AppStrings.t(AppLanguage.amharic, 'property_title'), 'የንብረት ርዕስ');
        expect(AppStrings.t(AppLanguage.oromo, 'make'), 'Uumaa');
      });
    });

    group('tv', () {
      test('translates stored English option values', () {
        expect(AppStrings.tv(AppLanguage.amharic, 'For Sale'), 'ለሽያጭ');
        expect(AppStrings.tv(AppLanguage.oromo, 'Pending'), 'Eega');
      });

      test('falls back to original value when translation missing', () {
        expect(AppStrings.tv(AppLanguage.amharic, 'Approved'), 'Approved');
        expect(AppStrings.tv(AppLanguage.english, 'For Sale'), 'For Sale');
      });

      test('returns empty string for empty value', () {
        expect(AppStrings.tv(AppLanguage.amharic, ''), '');
      });
    });
  });

  group('AppLanguage', () {
    test('code returns correct locale code', () {
      expect(AppLanguage.english.code, 'en');
      expect(AppLanguage.amharic.code, 'am');
      expect(AppLanguage.oromo.code, 'om');
    });

    test('label returns correct display name', () {
      expect(AppLanguage.english.label, 'English');
      expect(AppLanguage.amharic.label, 'አማርኛ');
      expect(AppLanguage.oromo.label, 'Afaan Oromoo');
    });

    test('fromCode parses valid codes', () {
      expect(AppLanguageX.fromCode('en'), AppLanguage.english);
      expect(AppLanguageX.fromCode('am'), AppLanguage.amharic);
      expect(AppLanguageX.fromCode('om'), AppLanguage.oromo);
    });

    test('fromCode defaults to English for unknown code', () {
      expect(AppLanguageX.fromCode('fr'), AppLanguage.english);
      expect(AppLanguageX.fromCode(null), AppLanguage.english);
      expect(AppLanguageX.fromCode(''), AppLanguage.english);
    });
  });
}
