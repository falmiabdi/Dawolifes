import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/data/repositories/auth_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('AuthRepository', () {
    late MockApiClient api;
    late AuthRepository repository;

    setUp(() {
      api = MockApiClient();
      when(() => api.saveToken(any())).thenAnswer((_) async {});
      repository = AuthRepository(api);
    });

    group('fetchSession', () {
      test('returns SessionUser when user present in response', () async {
        final response = {
          'session': {
            'user': {
              'id': 'u1',
              'name': 'Test User',
              'email': 'test@test.com',
              'role': 'buyer',
            },
          },
        };
        when(() => api.get('/api/auth/session')).thenAnswer((_) async => response);

        final user = await repository.fetchSession();
        if (user == null) {
          fail('Expected an authenticated user in the session response');
        }

        expect(user.id, 'u1');
        expect(user.name, 'Test User');
        expect(user.email, 'test@test.com');
      });

      test('returns null when session missing', () async {
        when(() => api.get('/api/auth/session')).thenAnswer((_) async => const <String, dynamic>{});

        final user = await repository.fetchSession();

        expect(user, isNull);
      });

      test('returns null when user missing from session', () async {
        when(() => api.get('/api/auth/session'))
            .thenAnswer((_) async => {'session': {}});

        final user = await repository.fetchSession();

        expect(user, isNull);
      });
    });

    group('signIn', () {
      test('returns SessionUser and saves token', () async {
        final response = {
          'accessToken': 'token123',
          'user': {
            'id': 'u1',
            'name': 'Test User',
            'email': 'test@test.com',
            'role': 'buyer',
          },
        };
        when(() => api.post('/api/auth/signin', {
              'email': 'test@test.com',
              'password': 'pass',
            })).thenAnswer((_) async => response);

        final user = await repository.signIn(email: 'test@test.com', password: 'pass');

        expect(user.id, 'u1');
        expect(user.name, 'Test User');
        verify(() => api.saveToken('token123')).called(1);
      });

      test('handles missing accessToken', () async {
        final response = {
          'user': {
            'id': 'u1',
            'name': 'Test User',
            'email': 'test@test.com',
            'role': 'buyer',
          },
        };
        when(() => api.post('/api/auth/signin', {
              'email': 'test@test.com',
              'password': 'pass',
            })).thenAnswer((_) async => response);

        final user = await repository.signIn(email: 'test@test.com', password: 'pass');

        expect(user.id, 'u1');
        verifyNever(() => api.saveToken(any()));
      });

      test('handles null user in response', () async {
        final response = {
          'accessToken': 'token123',
        };
        when(() => api.post('/api/auth/signin', {
              'email': 'test@test.com',
              'password': 'pass',
            })).thenAnswer((_) async => response);

        final user = await repository.signIn(email: 'test@test.com', password: 'pass');

        expect(user.id, '');
        expect(user.name, '');
      });
    });

    group('registerBuyer', () {
      test('returns pending result with devOtp and saves no token', () async {
        final response = {
          'message': 'OTP sent',
          'pending': true,
          'devOtp': '123456',
        };
        when(() => api.post('/api/auth/register-buyer', {
              'name': 'New Buyer',
              'email': 'new@test.com',
              'phone': '0912345678',
              'password': 'pass123',
            })).thenAnswer((_) async => response);

        final result = await repository.registerBuyer(
          name: 'New Buyer',
          email: 'new@test.com',
          phone: '0912345678',
          password: 'pass123',
        );

        expect(result.message, 'OTP sent');
        expect(result.devOtp, '123456');
        verifyNever(() => api.saveToken(any()));
      });

      test('returns null devOtp when not in dev response', () async {
        final response = {'message': 'OTP sent', 'pending': true};
        when(() => api.post(any(), any())).thenAnswer((_) async => response);

        final result = await repository.registerBuyer(
          name: 'New Buyer',
          email: 'new@test.com',
          phone: '0912345678',
          password: 'pass123',
        );

        expect(result.devOtp, isNull);
      });
    });

    group('verifyOtp', () {
      test('saves token and returns user when issued by server', () async {
        final response = {
          'message': 'Verified',
          'accessToken': 'token789',
          'user': {
            'id': 'u3',
            'name': 'Verified Buyer',
            'email': 'v@test.com',
            'role': 'buyer',
          },
        };
        when(() => api.post('/api/auth/verify-otp', {
              'email': 'v@test.com',
              'otp': '123456',
            })).thenAnswer((_) async => response);

        final result = await repository.verifyOtp(email: 'v@test.com', otp: '123456');

        expect(result.message, 'Verified');
        expect(result.user, isNotNull);
        expect(result.user!.id, 'u3');
        verify(() => api.saveToken('token789')).called(1);
      });

      test('returns null user for agent (no session issued)', () async {
        final response = {'message': 'Verified'};
        when(() => api.post(any(), any())).thenAnswer((_) async => response);

        final result = await repository.verifyOtp(email: 'a@test.com', otp: '111111');

        expect(result.user, isNull);
        verifyNever(() => api.saveToken(any()));
      });
    });

    group('resendOtp', () {
      test('calls resend endpoint and parses devOtp', () async {
        final response = {'message': 'Resent', 'devOtp': '654321'};
        when(() => api.post('/api/auth/resend-otp', {'email': 'r@test.com'}))
            .thenAnswer((_) async => response);

        final result = await repository.resendOtp(email: 'r@test.com');

        expect(result.message, 'Resent');
        expect(result.devOtp, '654321');
      });
    });

    group('registerAgent', () {
      test('calls API with correct parameters and returns pending result', () async {
        when(() => api.post('/api/auth/register', {
              'username': 'agent1',
              'email': 'agent@test.com',
              'password': 'pass123',
            })).thenAnswer((_) async => {'message': 'OTP sent', 'devOtp': '000000'});

        final result = await repository.registerAgent(
          username: 'agent1',
          email: 'agent@test.com',
          password: 'pass123',
        );

        verify(() => api.post('/api/auth/register', {
              'username': 'agent1',
              'email': 'agent@test.com',
              'password': 'pass123',
            })).called(1);
        expect(result.message, 'OTP sent');
        expect(result.devOtp, '000000');
        verifyNever(() => api.saveToken(any()));
      });
    });

    group('changePassword', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/auth/change-password', {
              'currentPassword': 'oldpass',
              'newPassword': 'newpass',
            })).thenAnswer((_) async => {});

        await repository.changePassword(currentPassword: 'oldpass', newPassword: 'newpass');

        verify(() => api.post('/api/auth/change-password', {
              'currentPassword': 'oldpass',
              'newPassword': 'newpass',
            })).called(1);
      });
    });
  });
}
