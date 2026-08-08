import '../../core/network/api_client.dart';
import '../models/announcement.dart';

/// Announcements API calls, mirroring the web app's `/api/announcements`.
class AnnouncementRepository {
  AnnouncementRepository(this._api);

  final ApiClient _api;

  /// Public: list announcements (newest first).
  Future<List<Announcement>> fetchAnnouncements() async {
    final data = await _api.get('/api/announcements') as Map<String, dynamic>;
    return (data['announcements'] as List?)
            ?.whereType<Map<String, dynamic>>()
            .map(Announcement.fromJson)
            .toList() ??
        const [];
  }

  /// Admin: create an announcement.
  Future<Announcement> createAnnouncement({
    required String title,
    required String content,
  }) async {
    final data = await _api.post('/api/announcements', {
      'title': title,
      'content': content,
    }) as Map<String, dynamic>;
    return Announcement.fromJson(data['announcement'] as Map<String, dynamic>? ?? const {});
  }

  /// Admin: update an announcement.
  Future<Announcement> updateAnnouncement({
    required String id,
    String? title,
    String? content,
  }) async {
    final data = await _api.patch('/api/announcements/$id', {
      'title': ?title,
      'content': ?content,
    }) as Map<String, dynamic>;
    return Announcement.fromJson(data['announcement'] as Map<String, dynamic>? ?? const {});
  }

  /// Admin: delete an announcement.
  Future<void> deleteAnnouncement(String id) async {
    await _api.delete('/api/announcements/$id');
  }
}
