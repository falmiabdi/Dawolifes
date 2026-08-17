import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Firebase Auth wrapper for email/password + email verification.
///
/// The backend remains the source of truth for sessions and account state;
/// Firebase Auth is used specifically to send + verify the email verification
/// on both mobile and web. [register] sends the verification email and returns
/// the created user so callers can react to failures (e.g. already registered).
class FirebaseAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Creates a Firebase account (if it does not exist) and sends a
  /// verification email to [email]. Throws [FirebaseAuthException] on failure.
  Future<User> register({
    required String email,
    required String password,
  }) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    await cred.user?.sendEmailVerification();
    return cred.user!;
  }

  /// Resends the verification email to the currently signed-in user.
  Future<void> resendVerification() async {
    final user = _auth.currentUser;
    if (user == null) return;
    await user.sendEmailVerification();
  }

  /// Reloads the current user and reports whether the email is verified.
  Future<bool> isEmailVerified() async {
    final user = _auth.currentUser;
    if (user == null) return false;
    await user.reload();
    return user.emailVerified;
  }

  /// Signs in with Google and returns a fresh Firebase ID token for the
  /// signed-in user. Returns `null` if the user canceled the sign-in sheet.
  Future<String?> getGoogleIdToken() async {
    final googleSignIn = GoogleSignIn();
    final googleUser = await googleSignIn.signIn();
    if (googleUser == null) return null;

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final userCredential = await _auth.signInWithCredential(credential);
    return userCredential.user?.getIdToken(true);
  }

  /// Signs out of Firebase Auth and the Google Sign-In session (so the next
  /// Google sign-in shows the account chooser instead of auto-resolving).
  Future<void> signOut() async {
    await _auth.signOut();
    await GoogleSignIn().signOut();
  }
}