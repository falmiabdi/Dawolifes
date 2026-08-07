/// Conversation entry returned by GET /api/messages/inbox.
class Conversation {
  const Conversation({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.senderId,
    required this.senderName,
    required this.recipientId,
    required this.recipientName,
    required this.content,
    required this.read,
    required this.createdAt,
  });

  final String id;
  final String propertyId;
  final String propertyTitle;
  final String senderId;
  final String senderName;
  final String recipientId;
  final String recipientName;
  final String content;
  final bool read;
  final DateTime createdAt;

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        id: '${json['id']}',
        propertyId: '${json['propertyId'] ?? ''}',
        propertyTitle: '${json['propertyTitle'] ?? 'Listing'}',
        senderId: '${json['senderId'] ?? ''}',
        senderName: '${json['senderName'] ?? ''}',
        recipientId: '${json['recipientId'] ?? ''}',
        recipientName: '${json['recipientName'] ?? ''}',
        content: '${json['content'] ?? ''}',
        read: json['read'] == true,
        createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}')?.toLocal() ?? DateTime.now(),
      );
}

/// Chat message model.
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.propertyId,
    required this.senderId,
    required this.senderName,
    required this.recipientId,
    required this.recipientName,
    required this.content,
    this.read = false,
    required this.createdAt,
  });

  final String id;
  final String propertyId;
  final String senderId;
  final String senderName;
  final String recipientId;
  final String recipientName;
  final String content;
  final bool read;
  final DateTime createdAt;

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: '${json['id']}',
        propertyId: '${json['propertyId'] ?? ''}',
        senderId: '${json['senderId'] ?? ''}',
        senderName: '${json['senderName'] ?? ''}',
        recipientId: '${json['recipientId'] ?? ''}',
        recipientName: '${json['recipientName'] ?? ''}',
        content: '${json['content'] ?? ''}',
        read: json['read'] == true,
        createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}')?.toLocal() ?? DateTime.now(),
      );
}
