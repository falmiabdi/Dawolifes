import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dawolife_mobile/core/network/api_client.dart';
import 'package:dawolife_mobile/data/models/notification.dart';
import 'package:dawolife_mobile/data/repositories/notification_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('NotificationRepository', () {
    late MockApiClient api;
    late NotificationRepository repository;

    setUp(() {
      api = MockApiClient();
      repository = NotificationRepository(api);
    });

    group('fetchNotifications', () {
      test('parses the notifications list', () async {
        when(() => api.get('/api/notifications')).thenAnswer((_) async => {
              'notifications': [
                {
                  'id': 'n1',
                  'title': 'Listing approved',
                  'body': 'Your property was approved.',
                  'type': 'success',
                  'read': false,
                  'createdAt': '2026-01-01T00:00:00.000Z',
                },
              ],
            });

        final items = await repository.fetchNotifications();

        expect(items, hasLength(1));
        expect(items.first.id, 'n1');
        expect(items.first.title, 'Listing approved');
        expect(items.first.read, isFalse);
      });

      test('returns an empty list when no notifications key', () async {
        when(() => api.get('/api/notifications')).thenAnswer((_) async => const {'notifications': null});

        expect(await repository.fetchNotifications(), isEmpty);
      });
    });

    group('fetchUnreadCount', () {
      test('reads count from the response', () async {
        when(() => api.get('/api/notifications/count')).thenAnswer((_) async => {'count': 3});

        expect(await repository.fetchUnreadCount(), 3);
      });

      test('defaults to 0 when count is missing', () async {
        when(() => api.get('/api/notifications/count')).thenAnswer((_) async => const {'count': null});

        expect(await repository.fetchUnreadCount(), 0);
      });
    });

    group('markAllRead / markRead', () {
      test('calls the read-all endpoint', () async {
        when(() => api.patch('/api/notifications/read-all')).thenAnswer((_) async => const {});

        await repository.markAllRead();

        verify(() => api.patch('/api/notifications/read-all')).called(1);
      });

      test('calls the single-read endpoint', () async {
        when(() => api.patch('/api/notifications/n1/read')).thenAnswer((_) async => const {});

        await repository.markRead('n1');

        verify(() => api.patch('/api/notifications/n1/read')).called(1);
      });
    });

    group('push tokens', () {
      test('registerPushToken posts token and platform', () async {
        when(() => api.post(any(), any())).thenAnswer((_) async => {'message': 'Device token registered'});

        await repository.registerPushToken('abc123', platform: 'android');

        verify(() => api.post('/api/push-tokens/register', {
              'token': 'abc123',
              'platform': 'android',
            })).called(1);
      });

      test('unregisterPushToken deletes the token', () async {
        when(() => api.delete(any())).thenAnswer((_) async => {'message': 'Device token removed'});

        await repository.unregisterPushToken('abc123');

        verify(() => api.delete('/api/push-tokens/abc123')).called(1);
      });
    });

    group('AppNotification', () {
      test('copyWith updates the read flag', () {
        const n = AppNotification(id: 'n1', title: 't', body: 'b', type: 'info', read: false);
        final updated = n.copyWith(read: true);
        expect(updated.read, isTrue);
        expect(updated.id, 'n1');
      });
    });
  });
}