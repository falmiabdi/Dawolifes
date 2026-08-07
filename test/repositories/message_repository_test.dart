import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/data/repositories/message_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('MessageRepository', () {
    late MockApiClient api;
    late MessageRepository repository;

    setUp(() {
      api = MockApiClient();
      repository = MessageRepository(api);
    });

    group('fetchUnreadCount', () {
      test('returns count from API response', () async {
        when(() => api.get('/api/messages/unread'))
            .thenAnswer((_) async => {'count': 5});

        final count = await repository.fetchUnreadCount();

        expect(count, 5);
      });

      test('returns 0 when count is null', () async {
        when(() => api.get('/api/messages/unread'))
            .thenAnswer((_) async => const <String, dynamic>{});

        final count = await repository.fetchUnreadCount();

        expect(count, 0);
      });
    });

    group('fetchInbox', () {
      test('returns list of Conversations', () async {
        final response = {
          'messages': [
            {
              'id': 'c1',
              'propertyId': 'p1',
              'propertyTitle': 'Villa',
              'senderId': 'u1',
              'senderName': 'Alice',
              'recipientId': 'u2',
              'recipientName': 'Bob',
              'content': 'Hello',
              'read': true,
              'createdAt': '2024-01-01T10:00:00.000Z',
            },
          ],
        };
        when(() => api.get('/api/messages/inbox'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchInbox();

        expect(result.length, 1);
        expect(result[0].id, 'c1');
        expect(result[0].propertyTitle, 'Villa');
        expect(result[0].read, true);
      });

      test('returns empty list when no messages', () async {
        when(() => api.get('/api/messages/inbox'))
            .thenAnswer((_) async => {'messages': []});

        final result = await repository.fetchInbox();

        expect(result, isEmpty);
      });
    });

    group('fetchThread', () {
      test('returns list of ChatMessages', () async {
        final response = {
          'messages': [
            {
              'id': 'm1',
              'propertyId': 'p1',
              'senderId': 'u1',
              'senderName': 'Alice',
              'recipientId': 'u2',
              'recipientName': 'Bob',
              'content': 'Hi',
              'read': false,
              'createdAt': '2024-01-01T10:00:00.000Z',
            },
          ],
        };
        when(() => api.get('/api/messages/p1'))
            .thenAnswer((_) async => response);

        final result = await repository.fetchThread('p1');

        expect(result.length, 1);
        expect(result[0].id, 'm1');
        expect(result[0].content, 'Hi');
        expect(result[0].read, false);
      });

      test('returns empty list when no messages in thread', () async {
        when(() => api.get('/api/messages/p1'))
            .thenAnswer((_) async => const <String, dynamic>{});

        final result = await repository.fetchThread('p1');

        expect(result, isEmpty);
      });
    });

    group('send', () {
      test('calls API with correct parameters', () async {
        when(() => api.post('/api/messages/', {
              'propertyId': 'p1',
              'recipientId': 'u2',
              'recipientName': 'Bob',
              'content': 'Hello Bob',
            })).thenAnswer((_) async => {});

        await repository.send(
          propertyId: 'p1',
          recipientId: 'u2',
          recipientName: 'Bob',
          content: 'Hello Bob',
        );

        verify(() => api.post('/api/messages/', {
              'propertyId': 'p1',
              'recipientId': 'u2',
              'recipientName': 'Bob',
              'content': 'Hello Bob',
            })).called(1);
      });
    });
  });
}
