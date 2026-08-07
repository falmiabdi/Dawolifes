import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Persists the JWT token and cached user across app restarts,
/// mirroring the Capacitor app's Preferences storage.
class TokenStorage {
  TokenStorage(this._prefs);

  final SharedPreferences _prefs;

  Future<String?> getToken() => Future.value(_prefs.getString('auth_token'));

  Future<void> saveToken(String token) => _prefs.setString('auth_token', token);

  Future<void> clear() async {
    await _prefs.remove('auth_token');
    await _prefs.remove('auth_user');
  }

  Future<Map<String, dynamic>?> getCachedUser() async {
    final raw = _prefs.getString('auth_user');
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveUser(Map<String, dynamic>? user) async {
    if (user == null) {
      await _prefs.remove('auth_user');
    } else {
      await _prefs.setString('auth_user', jsonEncode(user));
    }
  }
}
