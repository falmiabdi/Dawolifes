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
}
