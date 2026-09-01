import '../../core/network/api_client.dart';
import '../models/notification.dart';

/// Notifications API calls, mirroring components/notifications/notification-list.tsx.
class NotificationRepository {
  NotificationRepository(this._api);

  final ApiClient _api;

  Future<List<AppNotification>> fetchNotifications() async {
    final data = await _api.get('/api/notifications') as Map<String, dynamic>;
    return (data['notifications'] as List?)
            ?.map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
            .toList() ??
        const [];
  }

  Future<int> fetchUnreadCount() async {
    final data = await _api.get('/api/notifications/count') as Map<String, dynamic>;
    return (data['count'] as num?)?.toInt() ?? 0;
  }

  Future<void> markAllRead() async {
    await _api.patch('/api/notifications/read-all');
  }

  Future<void> markRead(String id) async {
    await _api.patch('/api/notifications/$id/read');
  }

  /// Registers this device's FCM token for push notifications.
  Future<void> registerPushToken(String token, {String platform = 'android'}) async {
    await _api.post('/api/push-tokens/register', {
      'token': token,
      'platform': platform,
    });
  }

  /// Removes this device's FCM token (e.g. on logout).
  Future<void> unregisterPushToken(String token) async {
    await _api.delete('/api/push-tokens/$token');
  }
}