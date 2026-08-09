/// Announcement record returned by `/api/announcements` (the public News feed).
class Announcement {
  const Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.authorId,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String content;
  final String authorId;
  final String? createdAt;
  final String? updatedAt;

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: '${json['id'] ?? ''}',
      title: '${json['title'] ?? ''}',
      content: '${json['content'] ?? ''}',
      authorId: '${json['authorId'] ?? ''}',
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }
}
