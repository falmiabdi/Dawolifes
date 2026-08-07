/// Notification record returned by `/api/notifications`.
class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.read,
    this.createdAt,
    this.data,
  });

  final String id;
  final String title;
  final String body;
  final String type;
  final bool read;
  final String? createdAt;
  final Map<String, dynamic>? data;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: '${json['id'] ?? ''}',
      title: '${json['title'] ?? ''}',
      body: '${json['body'] ?? ''}',
      type: '${json['type'] ?? 'info'}',
      read: json['read'] == true,
      createdAt: json['createdAt'] as String?,
      data: json['data'] as Map<String, dynamic>?,
    );
  }

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      read: read ?? this.read,
      createdAt: createdAt,
      data: data,
    );
  }
}