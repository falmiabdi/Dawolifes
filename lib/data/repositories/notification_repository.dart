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
}