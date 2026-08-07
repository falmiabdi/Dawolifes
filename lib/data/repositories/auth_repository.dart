import '../../core/network/api_client.dart';
import '../models/user.dart';

/// Outcome of a registration request.
///
/// Mirrors the web flow: both `/api/auth/register-buyer` and `/api/auth/register`
/// only persist a pending registration + send an OTP. The actual account is
/// created when the OTP is verified via [verifyOtp].
///
/// `devOtp` is only present in non-production responses and is auto-filled by
/// the web app's verify-email page; the Flutter app does the same.
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

  RegistrationResult _registration(Map<String, dynamic> data) {
    final devOtp = data['devOtp'] as String?;
    return RegistrationResult(
      message: '${data['message'] ?? ''}',
      devOtp: (devOtp != null && devOtp.isNotEmpty) ? devOtp : null,
    );
  }
}