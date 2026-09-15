import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../core/firebase/firebase_auth_service.dart';
import '../core/network/api_client.dart';
import '../core/network/websocket_service.dart';
import '../core/storage/token_storage.dart';
import '../data/models/user.dart';
import '../data/repositories/auth_repository.dart';


class AuthProvider extends ChangeNotifier {
  AuthProvider({
    required this.repository,
    required this.storage,
    this.webSocket,
  });

  final AuthRepository repository;
  final TokenStorage storage;
  final WebSocketService? webSocket;

  SessionUser? _user;
  bool _loading = true;
  bool _initialized = false;

  SessionUser? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;
  bool get isVerified => _user?.emailVerified ?? false;

  
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

  
  
  
  
  
  Future<VerifyOtpResult?> loginWithGoogle({String role = 'user'}) async {
    final idToken = await FirebaseAuthService().getGoogleIdToken();
    if (idToken == null) return null;

    final result = await repository.signInWithFirebase(
      idToken: idToken,
      role: role,
    );

    if (result.user != null && result.user!.emailVerified) {
      _setUser(result.user);
    }
    return result;
  }

  
  
  Future<VerifyOtpResult> signUpWithFirebase({
    required String email,
    required String password,
    required String name,
    String? phone,
    String role = 'user',
  }) async {
    final userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    await userCredential.user?.updateDisplayName(name);
    await userCredential.user?.sendEmailVerification();

    final idToken = await userCredential.user?.getIdToken(true);
    if (idToken == null) {
      throw ApiException('Failed to retrieve Firebase ID token');
    }

    final result = await repository.signInWithFirebase(
      idToken: idToken,
      role: role,
      name: name,
      phone: phone,
    );

    return result;
  }

  
  Future<VerifyOtpResult> signInWithFirebase({
    required String email,
    required String password,
  }) async {
    final userCredential = await FirebaseAuth.instance.signInWithEmailAndPassword(
      email: email,
      password: password,
    );

    
    await userCredential.user?.reload();
    final freshUser = FirebaseAuth.instance.currentUser;
    final idToken = await freshUser?.getIdToken(true);

    if (idToken == null) {
      throw ApiException('Failed to retrieve Firebase ID token');
    }

    final result = await repository.signInWithFirebase(
      idToken: idToken,
      name: freshUser?.displayName,
      phone: freshUser?.phoneNumber,
    );

    if (result.user != null && result.user!.emailVerified) {
      _setUser(result.user);
    }
    return result;
  }

  
  Future<VerifyOtpResult?> checkFirebaseEmailVerified() async {
    final firebaseUser = FirebaseAuth.instance.currentUser;
    if (firebaseUser == null) return null;

    await firebaseUser.reload();
    final refreshed = FirebaseAuth.instance.currentUser;
    if (refreshed == null) return null;

    final idToken = await refreshed.getIdToken(true);
    if (idToken == null) return null;

    final result = await repository.signInWithFirebase(idToken: idToken);
    if (result.user != null && result.user!.emailVerified) {
      _setUser(result.user);
    }
    return result;
  }

  
  
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

  
  
  Future<RegistrationResult> registerAgent({
    required String username,
    required String email,
    required String password,
    String role = 'agent',
  }) async {
    return repository.registerAgent(username: username, email: email, password: password, role: role);
  }

  
  
  
  Future<VerifyOtpResult> verifyOtp({required String email, required String otp}) async {
    final result = await repository.verifyOtp(email: email, otp: otp);
    if (result.user != null) _setUser(result.user);
    return result;
  }

  Future<RegistrationResult> resendOtp({required String email}) async {
    return repository.resendOtp(email: email);
  }

  
  
  
  Future<VerifyOtpResult> checkVerification({required String email}) async {
    final result = await repository.checkVerification(email: email);
    if (result.user != null) _setUser(result.user);
    return result;
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
    try {
      await FirebaseAuthService().signOut();
    } catch (_) {
  // Firebase/Google sign-out is best-effort; never block logout on it.
  
      
    }
    await webSocket?.disconnect();
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

  Future<RegistrationResult> forgotPassword({required String email}) {
    return repository.forgotPassword(email: email);
  }

  Future<String> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) {
    return repository.resetPassword(email: email, otp: otp, newPassword: newPassword);
  }

  
  Future<SessionUser> updateProfile({
    String? name,
    String? phone,
    String? profilePhoto,
  }) async {
    final user = await repository.updateProfile(
      name: name,
      phone: phone,
      profilePhoto: profilePhoto,
    );
    _setUser(user);
    return user;
  }

  void _setUser(SessionUser? user) async {
    _user = user;
    await storage.saveUser(user?.toJson());
    notifyListeners();
  }
}
