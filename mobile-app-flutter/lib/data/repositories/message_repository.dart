import '../../core/network/api_client.dart';
import '../models/message.dart';

/// Messaging API calls, mirroring messages.ts.
class MessageRepository {
  MessageRepository(this._api);

  final ApiClient _api;

  Future<int> fetchUnreadCount() async {
    final data = await _api.get('/api/messages/unread');
    return (data as Map<String, dynamic>?)?['count'] as int? ?? 0;
  }

  Future<List<Conversation>> fetchInbox() async {
    final data = await _api.get('/api/messages/inbox') as Map<String, dynamic>;
    return (data['messages'] as List? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(Conversation.fromJson)
        .toList();
  }

  Future<List<ChatMessage>> fetchThread(String propertyId) async {
    final data = await _api.get('/api/messages/$propertyId');
    return ((data as Map<String, dynamic>?)?['messages'] as List? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(ChatMessage.fromJson)
        .toList();
  }

  Future<void> send({
    required String propertyId,
    required String recipientId,
    required String recipientName,
    required String content,
  }) async {
    await _api.post('/api/messages/', {
      'propertyId': propertyId,
      'recipientId': recipientId,
      'recipientName': recipientName,
      'content': content,
    });
  }

  /// Marks a single message as read.
  Future<void> markRead(String messageId) async {
    await _api.patch('/api/messages/$messageId/read');
  }
}
