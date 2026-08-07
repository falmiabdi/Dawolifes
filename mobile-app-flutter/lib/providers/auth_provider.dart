import 'package:flutter/foundation.dart';

import '../core/storage/token_storage.dart';
import '../data/models/user.dart';
import '../data/repositories/auth_repository.dart';

/// Auth state mirroring AuthProvider from auth-guard.tsx.
class AuthProvider extends ChangeNotifier {
  AuthProvider({
    required this.repository,
    required this.storage,
  });

  final AuthRepository repository;
  final TokenStorage storage;

  SessionUser? _user;
  bool _loading = true;
  bool _initialized = false;

  SessionUser? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;
  bool get isVerified => _user != null;

  /// Restores the cached user immediately, then refreshes from the server.
  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    final cached = await storage.getCachedUser();
    if (cached != null) {
      _user = SessionUser.fromJson(cached);
      notifyListeners();
    }
    _loading = false;
    notifyListeners();

    await refreshUser();
  }

  Future<void> login({required String email, required String password}) async {
    final user = await repository.signIn(email: email, password: password);
    _setUser(user);
  }

  /// Buyer registration. Account is pending until the OTP is verified; no session
  /// is established here. Returns the server result (incl. dev OTP in dev mode).
  Future<RegistrationResult> registerBuyer({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    return repository.registerBuyer(
      name: name,
      email: email,
      phone: phone,
      password: password,
    );
  }

  /// Agent registration. Pending + admin approval even after OTP verification.
  Future<RegistrationResult> registerAgent({
    required String username,
    required String email,
    required String password,
  }) async {
    return repository.registerAgent(username: username, email: email, password: password);
  }

  /// Verifies the OTP emailed to [email]. For buyer accounts the server issues a
  /// session, which is applied immediately. Returns the verify outcome so the
  /// caller can route agents to login (no session) and buyers to the app shell.
  Future<VerifyOtpResult> verifyOtp({required String email, required String otp}) async {
    final result = await repository.verifyOtp(email: email, otp: otp);
    if (result.user != null) _setUser(result.user);
    return result;
  }

  Future<RegistrationResult> resendOtp({required String email}) async {
    return repository.resendOtp(email: email);
  }

  Future<void> refreshUser() async {
    final token = await storage.getToken();
    if (token == null || token.isEmpty) return;

    try {
      final user = await repository.fetchSession();
      if (user != null) _setUser(user);
    } catch (_) {
      // Silently fail, same as the web app.
    }
  }

  Future<void> logout() async {
    await storage.clear();
    _user = null;
    notifyListeners();
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await repository.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }

  void _setUser(SessionUser? user) async {
    _user = user;
    await storage.saveUser(user?.toJson());
    notifyListeners();
  }
}
