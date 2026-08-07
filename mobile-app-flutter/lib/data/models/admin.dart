/// Flattened agent record returned by `/api/admin/agents`.
class AdminAgent {
  const AdminAgent({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    required this.status,
    this.rejectionReason,
    this.isRootAdmin = false,
    this.profilePhoto,
    this.phone,
    this.onboardingComplete = false,
    this.createdAt,
    this.fullName,
    this.gender,
    this.dateOfBirth,
    this.nationality,
    this.preferredLanguage,
    this.safaricomPhone,
    this.region,
    this.city,
    this.woreda,
    this.kebele,
    this.fullAddress,
    this.faydaFront,
    this.faydaBack,
    this.selfieFayda,
    this.passportPhoto,
    this.highestEducation,
    this.educationCertificate,
    this.agentExperience,
    this.companyName,
    this.officeAddress,
    this.businessLicenseNumber,
    this.businessLicenseFile,
    this.tinNumber,
  });

  final String id;
  final String username;
  final String email;
  final String role;
  final String status;
  final String? rejectionReason;
  final bool isRootAdmin;
  final String? profilePhoto;
  final String? phone;
  final bool onboardingComplete;
  final String? createdAt;
  final String? fullName;
  final String? gender;
  final String? dateOfBirth;
  final String? nationality;
  final String? preferredLanguage;
  final String? safaricomPhone;
  final String? region;
  final String? city;
  final String? woreda;
  final String? kebele;
  final String? fullAddress;
  final String? faydaFront;
  final String? faydaBack;
  final String? selfieFayda;
  final String? passportPhoto;
  final String? highestEducation;
  final String? educationCertificate;
  final String? agentExperience;
  final String? companyName;
  final String? officeAddress;
  final String? businessLicenseNumber;
  final String? businessLicenseFile;
  final String? tinNumber;

  String get displayName => fullName?.isNotEmpty == true ? fullName! : username;

  AdminAgent copyWith({
    String? status,
    String? rejectionReason,
  }) {
    return AdminAgent(
      id: id,
      username: username,
      email: email,
      role: role,
      status: status ?? this.status,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      isRootAdmin: isRootAdmin,
      profilePhoto: profilePhoto,
      phone: phone,
      onboardingComplete: onboardingComplete,
      createdAt: createdAt,
      fullName: fullName,
      gender: gender,
      dateOfBirth: dateOfBirth,
      nationality: nationality,
      preferredLanguage: preferredLanguage,
      safaricomPhone: safaricomPhone,
      region: region,
      city: city,
      woreda: woreda,
      kebele: kebele,
      fullAddress: fullAddress,
      faydaFront: faydaFront,
      faydaBack: faydaBack,
      selfieFayda: selfieFayda,
      passportPhoto: passportPhoto,
      highestEducation: highestEducation,
      educationCertificate: educationCertificate,
      agentExperience: agentExperience,
      companyName: companyName,
      officeAddress: officeAddress,
      businessLicenseNumber: businessLicenseNumber,
      businessLicenseFile: businessLicenseFile,
      tinNumber: tinNumber,
    );
  }

  factory AdminAgent.fromJson(Map<String, dynamic> json) {
    return AdminAgent(
      id: '${json['id']}',
      username: '${json['username'] ?? ''}',
      email: '${json['email'] ?? ''}',
      role: '${json['role'] ?? 'agent'}',
      status: '${json['status'] ?? 'Pending'}',
      rejectionReason: json['rejectionReason'] as String?,
      isRootAdmin: json['isRootAdmin'] == true,
      profilePhoto: json['profilePhoto'] as String?,
      phone: json['phone'] as String?,
      onboardingComplete: json['onboardingComplete'] == true,
      createdAt: json['createdAt'] as String?,
      fullName: json['fullName'] as String?,
      gender: json['gender'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      nationality: json['nationality'] as String?,
      preferredLanguage: json['preferredLanguage'] as String?,
      safaricomPhone: json['safaricomPhone'] as String?,
      region: json['region'] as String?,
      city: json['city'] as String?,
      woreda: json['woreda'] as String?,
      kebele: json['kebele'] as String?,
      fullAddress: json['fullAddress'] as String?,
      faydaFront: json['faydaFront'] as String?,
      faydaBack: json['faydaBack'] as String?,
      selfieFayda: json['selfieFayda'] as String?,
      passportPhoto: json['passportPhoto'] as String?,
      highestEducation: json['highestEducation'] as String?,
      educationCertificate: json['educationCertificate'] as String?,
      agentExperience: json['agentExperience'] as String?,
      companyName: json['companyName'] as String?,
      officeAddress: json['officeAddress'] as String?,
      businessLicenseNumber: json['businessLicenseNumber'] as String?,
      businessLicenseFile: json['businessLicenseFile'] as String?,
      tinNumber: json['tinNumber'] as String?,
    );
  }
}

/// User record returned by `/api/admin/users`.
class AdminUser {
  const AdminUser({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    required this.status,
    this.rejectionReason,
    this.isRootAdmin = false,
    this.createdAt,
    this.phone,
  });

  final String id;
  final String username;
  final String email;
  final String role;
  final String status;
  final String? rejectionReason;
  final bool isRootAdmin;
  final String? createdAt;
  final String? phone;

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: '${json['id']}',
      username: '${json['username'] ?? ''}',
      email: '${json['email'] ?? ''}',
      role: '${json['role'] ?? 'user'}',
      status: '${json['status'] ?? 'Pending'}',
      rejectionReason: json['rejectionReason'] as String?,
      isRootAdmin: json['isRootAdmin'] == true,
      createdAt: json['createdAt'] as String?,
      phone: json['phone'] as String?,
    );
  }
}
