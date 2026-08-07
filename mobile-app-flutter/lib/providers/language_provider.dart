import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/app_config.dart';
import '../core/i18n/app_strings.dart';

/// Locale state mirroring the I18nProvider.
class LanguageProvider extends ChangeNotifier {
  LanguageProvider(this._prefs);

  final SharedPreferences _prefs;
  AppLanguage _lang = AppLanguage.english;

  AppLanguage get lang => _lang;

  String t(String key) => AppStrings.t(_lang, key);

  String tv(String value) => AppStrings.tv(_lang, value);

  Future<void> init() async {
    _lang = AppLanguageX.fromCode(_prefs.getString(AppConfig.languageKey));
    notifyListeners();
  }

  Future<void> setLang(AppLanguage lang) async {
    if (_lang == lang) return;
    _lang = lang;
    await _prefs.setString(AppConfig.languageKey, lang.code);
    notifyListeners();
  }
}
