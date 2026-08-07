/// Minimal agent info attached to listings.
class ListingAgent {
  const ListingAgent({this.id, this.name, this.phone, this.email, this.avatar});

  final String? id;
  final String? name;
  final String? phone;
  final String? email;
  final String? avatar;

  String get displayName => (name?.isNotEmpty ?? false) ? name! : 'Agent';

  factory ListingAgent.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const ListingAgent();
    return ListingAgent(
      id: '${json['id'] ?? ''}',
      name: json['username'] as String? ?? json['name'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      avatar: json['profilePhoto'] as String? ?? json['avatar'] as String?,
    );
  }
}
