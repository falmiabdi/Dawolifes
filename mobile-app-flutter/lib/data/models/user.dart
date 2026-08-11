/// Authenticated user session, mirroring SessionUser from auth-guard.tsx.
class SessionUser {
  const SessionUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.roles,
    this.status,
    this.rejectionReason,
    this.isRootAdmin,
    this.profilePhoto,
    this.phone,
    this.onboardingComplete,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final List<String>? roles;
  final String? status;
  final String? rejectionReason;
  final bool? isRootAdmin;
  final String? profilePhoto;
  final String? phone;
  final bool? onboardingComplete;

  bool get isAdmin => role == 'admin' || (roles?.contains('admin') ?? false);

  bool get isAgent => role == 'agent';

  /// Whether the account can post listings.
  bool get canSell => isAgent || isAdmin;

  factory SessionUser.fromJson(Map<String, dynamic> json) {
    final name = (json['name'] as String?) ??
        (json['username'] as String?) ??
        '';

    return SessionUser(
      id: '${json['id'] ?? ''}',
      name: name,
      email: '${json['email'] ?? ''}',
      role: '${json['role'] ?? 'buyer'}',
      roles: (json['roles'] as List?)?.map((e) => '$e').toList(),
      status: json['status'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      isRootAdmin: json['isRootAdmin'] as bool?,
      profilePhoto: json['profilePhoto'] as String?,
      phone: json['phone'] as String?,
      onboardingComplete: json['onboardingComplete'] as bool?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'roles': roles,
        'status': status,
        'rejectionReason': rejectionReason,
        'isRootAdmin': isRootAdmin,
        'profilePhoto': profilePhoto,
        'phone': phone,
        'onboardingComplete': onboardingComplete,
      };
}
