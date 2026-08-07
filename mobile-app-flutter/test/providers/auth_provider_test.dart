import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/storage/token_storage.dart';
import 'package:dawolife_mobile/data/models/user.dart';
import 'package:dawolife_mobile/data/repositories/auth_repository.dart';
import 'package:dawolife_mobile/providers/auth_provider.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

class MockTokenStorage extends Mock implements TokenStorage {}

void main() {
  group('AuthProvider', () {
    late MockAuthRepository repository;
    late MockTokenStorage storage;
    late AuthProvider provider;

    setUp(() {
      repository = MockAuthRepository();
      storage = MockTokenStorage();
      when(() => storage.saveUser(any())).thenAnswer((_) async {});
      provider = AuthProvider(repository: repository, storage: storage);
    });

    group('init', () {
      test('sets loading to false and notifies listeners', () async {
        when(() => storage.getCachedUser()).thenAnswer((_) async => null);
        when(() => storage.getToken()).thenAnswer((_) async => null);

        await provider.init();

        expect(provider.loading, false);
        expect(provider.isLoggedIn, false);
      });

      test('restores cached user if available', () async {
        final cachedUser = {
          'id': 'u1',
          'name': 'Cached User',
          'email': 'cached@test.com',
          'role': 'buyer',
        };
        when(() => storage.getCachedUser()).thenAnswer((_) async => cachedUser);
        when(() => storage.getToken()).thenAnswer((_) async => 'token123');

        await provider.init();

        expect(provider.user, isNotNull);
        expect(provider.user!.name, 'Cached User');
        expect(provider.user!.email, 'cached@test.com');
        expect(provider.isLoggedIn, true);
      });
    });

    group('login', () {
      test('sets user and saves to storage on success', () async {
        final user = SessionUser(
          id: 'u1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'buyer',
        );
        when(() => repository.signIn(email: 'test@test.com', password: 'pass'))
            .thenAnswer((_) async => user);

        await provider.login(email: 'test@test.com', password: 'pass');

        expect(provider.user, isNotNull);
        expect(provider.user!.name, 'Test User');
        expect(provider.isLoggedIn, true);
        verify(() => storage.saveUser(user.toJson())).called(1);
      });
    });

    group('registerBuyer', () {
      test('returns pending result and does not log in', () async {
        final result = RegistrationResult(message: 'OTP sent', devOtp: '123456');
        when(() => repository.registerBuyer(
              name: 'New Buyer',
              email: 'new@test.com',
              phone: '0912345678',
              password: 'pass123',
            )).thenAnswer((_) async => result);

        final r = await provider.registerBuyer(
          name: 'New Buyer',
          email: 'new@test.com',
          phone: '0912345678',
          password: 'pass123',
        );

        expect(r.message, 'OTP sent');
        expect(r.devOtp, '123456');
        expect(provider.user, isNull);
        expect(provider.isLoggedIn, false);
      });
    });

    group('registerAgent', () {
      test('returns pending result and does not log in', () async {
        final result = RegistrationResult(message: 'OTP sent', devOtp: '654321');
        when(() => repository.registerAgent(
              username: 'agent1',
              email: 'agent@test.com',
              password: 'pass123',
            )).thenAnswer((_) async => result);

        final r = await provider.registerAgent(
          username: 'agent1',
          email: 'agent@test.com',
          password: 'pass123',
        );

        expect(r.devOtp, '654321');
        expect(provider.user, isNull);
        expect(provider.isLoggedIn, false);
      });
    });

    group('verifyOtp', () {
      test('logs in when server issues a session', () async {
        final user = SessionUser(
          id: 'u3',
          name: 'Verified Buyer',
          email: 'v@test.com',
          role: 'buyer',
        );
        when(() => repository.verifyOtp(email: 'v@test.com', otp: '123456'))
            .thenAnswer((_) async => VerifyOtpResult(message: 'Verified', user: user));

        final result = await provider.verifyOtp(email: 'v@test.com', otp: '123456');

        expect(result.user, isNotNull);
        expect(provider.user, isNotNull);
        expect(provider.user!.name, 'Verified Buyer');
        expect(provider.isLoggedIn, true);
        verify(() => storage.saveUser(user.toJson())).called(1);
      });

      test('does not log in for agents (no session issued)', () async {
        when(() => repository.verifyOtp(email: 'a@test.com', otp: '111111'))
            .thenAnswer((_) async => VerifyOtpResult(message: 'Verified'));

        final result = await provider.verifyOtp(email: 'a@test.com', otp: '111111');

        expect(result.user, isNull);
        expect(provider.user, isNull);
        expect(provider.isLoggedIn, false);
      });
    });

    group('resendOtp', () {
      test('delegates to repository and returns result', () async {
        when(() => repository.resendOtp(email: 'r@test.com'))
            .thenAnswer((_) async => RegistrationResult(message: 'Resent', devOtp: '999999'));

        final r = await provider.resendOtp(email: 'r@test.com');

        expect(r.message, 'Resent');
        expect(r.devOtp, '999999');
      });
    });

    group('logout', () {
      test('clears user and storage', () async {
        final user = SessionUser(
          id: 'u1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'buyer',
        );
        when(() => repository.signIn(email: any(named: 'email'), password: any(named: 'password')))
            .thenAnswer((_) async => user);
        await provider.login(email: 'test@test.com', password: 'pass');

        when(() => storage.clear()).thenAnswer((_) async {});
        await provider.logout();

        expect(provider.user, isNull);
        expect(provider.isLoggedIn, false);
        verify(() => storage.clear()).called(1);
      });
    });

    group('refreshUser', () {
      test('updates user when session fetch succeeds', () async {
        final cachedUser = {
          'id': 'u1',
          'name': 'Cached User',
          'email': 'cached@test.com',
          'role': 'buyer',
        };
        when(() => storage.getCachedUser()).thenAnswer((_) async => cachedUser);
        when(() => storage.getToken()).thenAnswer((_) async => 'token123');

        final refreshedUser = SessionUser(
          id: 'u1',
          name: 'Refreshed User',
          email: 'refreshed@test.com',
          role: 'agent',
        );
        when(() => repository.fetchSession()).thenAnswer((_) async => refreshedUser);

        await provider.init();

        expect(provider.user!.name, 'Refreshed User');
        expect(provider.user!.role, 'agent');
      });

      test('keeps existing user when refresh fails', () async {
        final cachedUser = {
          'id': 'u1',
          'name': 'Cached User',
          'email': 'cached@test.com',
          'role': 'buyer',
        };
        when(() => storage.getCachedUser()).thenAnswer((_) async => cachedUser);
        when(() => storage.getToken()).thenAnswer((_) async => 'token123');
        when(() => repository.fetchSession()).thenThrow(Exception('Network error'));

        await provider.init();

        expect(provider.user, isNotNull);
        expect(provider.user!.name, 'Cached User');
      });
    });

    group('changePassword', () {
      test('calls repository with correct parameters', () async {
        when(() => repository.changePassword(
              currentPassword: 'oldpass',
              newPassword: 'newpass',
            )).thenAnswer((_) async {});

        await provider.changePassword(currentPassword: 'oldpass', newPassword: 'newpass');

        verify(() => repository.changePassword(
              currentPassword: 'oldpass',
              newPassword: 'newpass',
            )).called(1);
      });
    });
  });
}
