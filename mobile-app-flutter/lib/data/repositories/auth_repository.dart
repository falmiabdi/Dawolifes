import '../../core/network/api_client.dart';
import '../models/user.dart';

/// Outcome of a registration request.
///
/// The backend creates the DB record immediately at registration with
/// emailVerified=false. On the next signin the backend auto-verifies the
/// email, so the OTP step is no longer required. `devOtp` is kept for
/// backward compatibility (non-production only).
class RegistrationResult {
  const RegistrationResult({required this.message, this.devOtp});

  final String message;
  final String? devOtp;
}

/// Outcome of an OTP verification request.
///
/// The backend returns `{ message }` for agents, and additionally
/// `{ accessToken, refreshToken, user }` for buyers (role === 'user'), which
/// logs them in immediately. Agents remain `Pending` and must sign in.
class VerifyOtpResult {
  const VerifyOtpResult({required this.message, this.user});

  final String message;
  final SessionUser? user;
}

/// Auth API calls, mirroring auth-guard.tsx + verify-email/page.tsx.
class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Future<SessionUser?> fetchSession() async {
    final data = await _api.get('/api/auth/session');
    final userJson = (data as Map<String, dynamic>?)?['session']?['user'];
    if (userJson is Map<String, dynamic>) {
      return SessionUser.fromJson(userJson);
    }
    return null;
  }

  Future<SessionUser> signIn({required String email, required String password}) async {
    final data = await _api.post('/api/auth/signin', {'email': email, 'password': password}) as Map<String, dynamic>;
    final token = data['accessToken'] as String?;
    if (token != null && token.isNotEmpty) {
      await _api.saveToken(token);
    }
    return SessionUser.fromJson((data['user'] as Map<String, dynamic>?) ?? {});
  }

  /// Buyer / user registration. Pending until [verifyOtp] is confirmed.
  Future<RegistrationResult> registerBuyer({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final data = await _api.post('/api/auth/register-buyer', {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
    }) as Map<String, dynamic>;
    return _registration(data);
  }

  /// Seller / agent registration. Pending + awaiting admin approval after verify.
  Future<RegistrationResult> registerAgent({
    required String username,
    required String email,
    required String password,
  }) async {
    final data = await _api.post('/api/auth/register', {
      'username': username,
      'email': email,
      'password': password,
    }) as Map<String, dynamic>;
    return _registration(data);
  }

  /// Confirms the 6-digit OTP sent to [email]. For buyer accounts the server
  /// returns an access token + session, which is persisted for immediate login.
  Future<VerifyOtpResult> verifyOtp({
    required String email,
    required String otp,
  }) async {
    final data = await _api.post('/api/auth/verify-otp', {
      'email': email,
      'otp': otp,
    }) as Map<String, dynamic>;

    final token = data['accessToken'] as String?;
    final userJson = data['user'] as Map<String, dynamic>?;
    SessionUser? user;
    if (token != null && token.isNotEmpty) {
      await _api.saveToken(token);
    }
    if (userJson != null) {
      user = SessionUser.fromJson(userJson);
    }
    return VerifyOtpResult(message: '${data['message'] ?? ''}', user: user);
  }

  /// Regenerates + resends the OTP for [email] (60s cooldown enforced client-side).
  Future<RegistrationResult> resendOtp({required String email}) async {
    final data = await _api.post('/api/auth/resend-otp', {'email': email}) as Map<String, dynamic>;
    return _registration(data);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _api.post('/api/auth/change-password', {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  /// Requests a password reset code for [email]. Returns the server message
  /// (identical whether or not the account exists) plus any dev OTP.
  Future<RegistrationResult> forgotPassword({required String email}) async {
    final data = await _api.post('/api/auth/forgot-password', {
      'email': email,
    }) as Map<String, dynamic>;
    return _registration(data);
  }

  /// Resets the password with the emailed [otp] and the new password.
  Future<String> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final data = await _api.post('/api/auth/reset-password', {
      'email': email,
      'otp': otp,
      'newPassword': newPassword,
    }) as Map<String, dynamic>;
    return '${data['message'] ?? ''}';
  }

  /// Updates the authenticated user's profile (name, phone, profile photo)
  /// via `PATCH /api/auth/profile`, returning the updated [SessionUser].
  Future<SessionUser> updateProfile({
    String? name,
    String? phone,
    String? profilePhoto,
  }) async {
    final body = <String, dynamic>{};
    if (name != null && name.trim().isNotEmpty) body['name'] = name.trim();
    if (phone != null) body['phone'] = phone;
    if (profilePhoto != null && profilePhoto.isNotEmpty) body['profilePhoto'] = profilePhoto;
    if (body.isEmpty) {
      throw ApiException('Nothing to update');
    }
    final data = await _api.patch('/api/auth/profile', body) as Map<String, dynamic>;
    final userJson = data['user'] as Map<String, dynamic>?;
    if (userJson == null) {
      throw ApiException('Failed to update profile');
    }
    return SessionUser.fromJson(userJson);
  }

  RegistrationResult _registration(Map<String, dynamic> data) {
    final devOtp = data['devOtp'] as String?;
    return RegistrationResult(
      message: '${data['message'] ?? ''}',
      devOtp: (devOtp != null && devOtp.isNotEmpty) ? devOtp : null,
    );
  }
}