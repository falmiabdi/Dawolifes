import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/storage/token_storage.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';

class MockTokenStorage extends Mock implements TokenStorage {}

void main() {
  group('ApiClient', () {
    late MockTokenStorage storage;
    late ApiClient client;

    setUp(() {
      storage = MockTokenStorage();
      when(() => storage.getToken()).thenAnswer((_) async => null);
      client = ApiClient(storage: storage);
    });

    group('get', () {
      test('returns decoded JSON on success', () async {
        when(() => storage.getToken()).thenAnswer((_) async => 'token123');
        // We can't easily mock the HTTP client here without passing it in,
        // but we can test the decode logic through post with MockClient

        final mockClient = MockClient((request) async {
          return http.Response(jsonEncode({'data': 'test'}), 200,
              headers: {'content-type': 'application/json'});
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);
        final result = await testClient.get('/api/test');
        expect(result, {'data': 'test'});
      });
    });

    group('post', () {
      test('strips null values from body', () async {
        final mockClient = MockClient((request) async {
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(jsonEncode(body), 200,
              headers: {'content-type': 'application/json'});
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);
        final result = await testClient.post('/api/test', {
          'title': 'Test',
          'area': null,
          'bedrooms': null,
          'active': true,
          'features': <String>[],
          'name': '',
        });

        expect(result.containsKey('area'), false);
        expect(result.containsKey('bedrooms'), false);
        expect(result['active'], true);
        expect(result['title'], 'Test');
        expect(result['features'], <String>[]);
        expect(result['name'], '');
      });

      test('keeps explicit false booleans', () async {
        final mockClient = MockClient((request) async {
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(jsonEncode(body), 200,
              headers: {'content-type': 'application/json'});
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);
        final result = await testClient.post('/api/test', {
          'accidentFree': false,
          'driverIncluded': null,
        });

        expect(result['accidentFree'], false);
        expect(result.containsKey('driverIncluded'), false);
      });

      test('throws ApiException on 401 with server message', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
              jsonEncode({'message': 'Unauthorized'}), 401,
              headers: {'content-type': 'application/json'});
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);

        expect(
          () => testClient.get('/api/test'),
          throwsA(isA<ApiException>().having(
            (e) => e.message, 'message', 'Unauthorized',
          ).having((e) => e.statusCode, 'statusCode', 401)),
        );
      });

      test('throws generic ApiException on 401 without server message', () async {
        final mockClient = MockClient((request) async {
          return http.Response('', 401);
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);

        expect(
          () => testClient.get('/api/test'),
          throwsA(isA<ApiException>().having(
            (e) => e.message, 'message', 'Your account has been rejected or suspended.',
          ).having((e) => e.statusCode, 'statusCode', 401)),
        );
      });

      test('throws ApiException on 403 with server message', () async {
        final mockClient = MockClient((request) async {
          return http.Response(
              jsonEncode({'message': 'Account pending approval'}), 403,
              headers: {'content-type': 'application/json'});
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);

        expect(
          () => testClient.get('/api/test'),
          throwsA(isA<ApiException>().having(
            (e) => e.message, 'message', 'Account pending approval',
          )),
        );
      });
    });

    group('delete', () {
      test('sends DELETE request', () async {
        final mockClient = MockClient((request) async {
          expect(request.method, 'DELETE');
          return http.Response('', 200);
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);
        await testClient.delete('/api/test', {'id': 'p1'});
      });
    });

    group('patch', () {
      test('sends PATCH request', () async {
        final mockClient = MockClient((request) async {
          expect(request.method, 'PATCH');
          return http.Response('', 200);
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);
        await testClient.patch('/api/test', {'status': 'Approved'});
      });
    });

    group('put', () {
      test('sends PUT request', () async {
        final mockClient = MockClient((request) async {
          expect(request.method, 'PUT');
          return http.Response('', 200);
        });

        final testClient = ApiClient(storage: storage, httpClient: mockClient);
        await testClient.put('/api/test', {'name': 'Updated'});
      });
    });

    group('saveToken', () {
      test('delegates to storage', () async {
        when(() => storage.saveToken('token123')).thenAnswer((_) async {});
        await client.saveToken('token123');
        verify(() => storage.saveToken('token123')).called(1);
      });
    });

    group('clearToken', () {
      test('delegates to storage', () async {
        when(() => storage.clear()).thenAnswer((_) async {});
        await client.clearToken();
        verify(() => storage.clear()).called(1);
      });
    });
  });
}
