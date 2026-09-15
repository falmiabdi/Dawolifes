
class SessionUser {
  const SessionUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.roles,
    this.status,
    this.emailVerified = false,
    this.rejectionReason,
    this.isRootAdmin,
    this.profilePhoto,
    this.phone,
    this.onboardingComplete = false,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final List<String>? roles;
  final String? status;
  final bool emailVerified;
  final String? rejectionReason;
  final bool? isRootAdmin;
  final String? profilePhoto;
  final String? phone;
  final bool onboardingComplete;

  bool get isAdmin => role == 'admin' || (roles?.contains('admin') ?? false);

  bool get isAgent => role == 'agent';

  bool get isOwner => role == 'owner';

  
  bool get canSell => isAgent || isOwner || isAdmin;

  
  
  bool get needsOnboarding => (isAgent || isOwner) && !onboardingComplete;

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
      emailVerified: json['emailVerified'] as bool? ?? false,
      rejectionReason: json['rejectionReason'] as String?,
      isRootAdmin: json['isRootAdmin'] as bool?,
      profilePhoto: json['profilePhoto'] as String?,
      phone: json['phone'] as String?,
      onboardingComplete: json['onboardingComplete'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'roles': roles,
        'status': status,
        'emailVerified': emailVerified,
        'rejectionReason': rejectionReason,
        'isRootAdmin': isRootAdmin,
        'profilePhoto': profilePhoto,
        'phone': phone,
        'onboardingComplete': onboardingComplete,
      };
}
