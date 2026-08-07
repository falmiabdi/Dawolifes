import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dawolife_mobile/core/storage/token_storage.dart';

class MockSharedPreferences extends Mock implements SharedPreferences {}

void main() {
  group('TokenStorage', () {
    late MockSharedPreferences prefs;
    late TokenStorage storage;

    setUp(() {
      prefs = MockSharedPreferences();
      storage = TokenStorage(prefs);
    });

    group('getToken', () {
      test('returns token when present', () async {
        when(() => prefs.getString('auth_token')).thenReturn('token123');
        final token = await storage.getToken();
        expect(token, 'token123');
      });

      test('returns null when token missing', () async {
        when(() => prefs.getString('auth_token')).thenReturn(null);
        final token = await storage.getToken();
        expect(token, isNull);
      });
    });

    group('saveToken', () {
      test('saves token to prefs', () async {
        when(() => prefs.setString('auth_token', 'token123'))
            .thenAnswer((_) async => true);
        await storage.saveToken('token123');
        verify(() => prefs.setString('auth_token', 'token123')).called(1);
      });
    });

    group('getCachedUser', () {
      test('returns cached user when present', () async {
        final userJson = {'id': 'u1', 'name': 'Test', 'email': 'test@test.com', 'role': 'buyer'};
        when(() => prefs.getString('auth_user')).thenReturn(jsonEncode(userJson));
        final user = await storage.getCachedUser();
        expect(user, isNotNull);
        expect(user!['id'], 'u1');
        expect(user['name'], 'Test');
      });

      test('returns null when no cached user', () async {
        when(() => prefs.getString('auth_user')).thenReturn(null);
        final user = await storage.getCachedUser();
        expect(user, isNull);
      });
    });

    group('saveUser', () {
      test('saves user JSON to prefs', () async {
        final userJson = {'id': 'u1', 'name': 'Test', 'email': 'test@test.com', 'role': 'buyer'};
        when(() => prefs.setString('auth_user', jsonEncode(userJson)))
            .thenAnswer((_) async => true);
        await storage.saveUser(userJson);
        verify(() => prefs.setString('auth_user', jsonEncode(userJson))).called(1);
      });

      test('removes cached user when user is null', () async {
        when(() => prefs.remove('auth_user')).thenAnswer((_) async => true);
        await storage.saveUser(null);
        verify(() => prefs.remove('auth_user')).called(1);
      });
    });

    group('clear', () {
      test('removes token and user from prefs', () async {
        when(() => prefs.remove('auth_token')).thenAnswer((_) async => true);
        when(() => prefs.remove('auth_user')).thenAnswer((_) async => true);
        await storage.clear();
        verify(() => prefs.remove('auth_token')).called(1);
        verify(() => prefs.remove('auth_user')).called(1);
      });
    });
  });
}
