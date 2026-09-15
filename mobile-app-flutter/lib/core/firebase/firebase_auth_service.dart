import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';







class FirebaseAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  
  
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

  
  Future<void> resendVerification() async {
    final user = _auth.currentUser;
    if (user == null) return;
    await user.sendEmailVerification();
  }

  
  Future<bool> isEmailVerified() async {
    final user = _auth.currentUser;
    if (user == null) return false;
    await user.reload();
    return user.emailVerified;
  }

  
  
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

  
  
  Future<void> signOut() async {
    await _auth.signOut();
    await GoogleSignIn().signOut();
  }
}