import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/firebase/firebase_auth_service.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../admin/admin_portal.dart';
import '../agent/agent_portal.dart';
import 'auth_shell.dart';
import 'login_screen.dart';

/// Email verification screen mirroring app/verify-email/page.tsx.
///
/// After registering (buyer or agent) the user lands here with the email they
/// signed up with. They enter the 6-digit OTP emailed by the backend; in
/// development the server echoes a `devOtp` which is auto-filled, matching the
/// web app. Resend is available after a 60s cooldown. On success the buyer is
/// logged in (server issues a session) and returned to the shell; an agent,
/// still `Pending` admin approval, is sent to the login screen.
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({
    super.key,
    required this.email,
    this.devOtp,
    this.password,
  });

  final String email;
  final String? devOtp;
  final String? password;

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  static const _codeLength = 6;
  static const _resendCooldown = Duration(seconds: 60);

  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;
  bool _submitting = false;
  bool _resending = false;
  bool _checkingFirebase = false;
  String? _error;
  Timer? _cooldownTimer;
  int _cooldown = 0;
  String get _firebasePassword => widget.password ?? '';

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(_codeLength, (_) => TextEditingController());
    _focusNodes = List.generate(_codeLength, (i) => FocusNode(onKeyEvent: (n, e) => _onKey(i, e)));

    if (widget.devOtp != null && widget.devOtp!.length == _codeLength) {
      for (var i = 0; i < _codeLength; i++) {
        _controllers[i].text = widget.devOtp![i];
      }
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _focusNodes.last.requestFocus();
      });
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _focusNodes.first.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startCooldown() {
    _cooldownTimer?.cancel();
    setState(() => _cooldown = _resendCooldown.inSeconds);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _cooldown--;
        if (_cooldown <= 0) timer.cancel();
      });
    });
  }

  String get _enteredCode => _controllers.map((c) => c.text.trim()).join();

  Future<void> _verify() async {
    final code = _enteredCode;
    if (code.length != _codeLength) {
      setState(() => _error = context.read<LanguageProvider>().t('enter_6_digit_code'));
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final result = await context.read<AuthProvider>().verifyOtp(
            email: widget.email,
            otp: code,
          );
      if (!mounted) return;

      
      if (result.user != null) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      } else {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen(verified: true)),
          (route) => route.isFirst,
        );
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = context.read<LanguageProvider>().t('verification_failed'));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _resend() async {
    if (_cooldown > 0 || _resending) return;
    setState(() {
      _resending = true;
      _error = null;
    });

    try {
      await context.read<AuthProvider>().resendOtp(email: widget.email);
      if (!mounted) return;
      for (final c in _controllers) {
        c.clear();
      }
      _focusNodes.first.requestFocus();
      _startCooldown();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.read<LanguageProvider>().t('code_resent'))),
        );
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = context.read<LanguageProvider>().t('resend_failed'));
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  /// Checks whether the Firebase verification link was clicked. When verified,
/// auto-logs in to the backend (which auto-verifies the email) and routes
/// the user to the appropriate screen:
/// - Agent → AgentPortalScreen (which gates on status: pending shows
///   onboarding, rejected shows rejection reason + edit, approved shows full menu)
/// - Admin → AdminPortalScreen
/// - Buyer → home
Future<void> _checkFirebaseVerification() async {
  setState(() {
    _checkingFirebase = true;
    _error = null;
  });
  try {
    final verified = await FirebaseAuthService().isEmailVerified();
    if (!mounted) return;
    if (!verified) {
      setState(() => _error = 'Your email is not verified yet. Click the link in the verification email we sent, then try again.');
      return;
    }

    // Firebase confirmed the email — now log in to the backend.
    // The backend auto-verifies the email on signin.
    final auth = context.read<AuthProvider>();
    try {
      await auth.login(email: widget.email, password: _firebasePassword);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Email verified, but login failed: ${e.message}');
      return;
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Email verified, but login failed. Please sign in manually.');
      return;
    }

    if (!mounted) return;
    Navigator.of(context).popUntil((route) => route.isFirst);
    final user = auth.user;
    if (user != null && user.isAdmin) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminPortalScreen()));
    } else if (user != null && user.isAgent) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPortalScreen()));
    }
  } catch (_) {
    if (!mounted) return;
    setState(() => _error = 'Could not check verification status. Is this email used in this app?');
  } finally {
    if (mounted) setState(() => _checkingFirebase = false);
  }
}

  Future<void> _resendFirebaseVerification() async {
    setState(() {
      _checkingFirebase = true;
      _error = null;
    });
    try {
      await FirebaseAuthService().resendVerification();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification email sent. Check your inbox.')),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not resend the verification email.');
    } finally {
      if (mounted) setState(() => _checkingFirebase = false);
    }
  }

  void _onDigitChanged(int index, String value) {
    setState(() => _error = null);
    final raw = value.trim();
    if (raw.isEmpty) return;
    // Support pasting the full code into any box.
    if (raw.length > 1) {
      final chars = raw.replaceAll(RegExp(r'\D'), '');
      if (chars.length == _codeLength) {
        for (var i = 0; i < _codeLength; i++) {
          _controllers[i].text = chars[i];
        }
        _focusNodes.last.requestFocus();
        return;
      }
    }
    final digit = raw.replaceAll(RegExp(r'\D'), '');
    if (digit.isEmpty) {
      _controllers[index].clear();
      return;
    }
    _controllers[index].text = digit.characters.last;
    if (index < _codeLength - 1) {
      _focusNodes[index + 1].requestFocus();
    } else {
      _focusNodes[index].unfocus();
    }
  }

  KeyEventResult _onKey(int index, KeyEvent event) {
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_controllers[index].text.isEmpty && index > 0) {
        _focusNodes[index - 1].requestFocus();
      }
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.read<LanguageProvider>();
    final t = lang.t;

    return AuthShell(
      title: t('verify_email_title'),
      footer: TextButton(
        onPressed: () => Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        ),
        child: Text(
          t('use_different_email'),
          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '${t('verify_email_subtitle')} ${widget.email}',
            style: const TextStyle(color: Color(0xFF475569), fontSize: 14),
          ),
          const SizedBox(height: 24),
          Row(
            children: List.generate(_codeLength, (i) {
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < _codeLength - 1 ? 8 : 0),
                  child: SizedBox(
                    height: 56,
                    child: TextField(
                      focusNode: _focusNodes[i],
                      controller: _controllers[i],
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      textAlignVertical: TextAlignVertical.center,
                      textInputAction: i < _codeLength - 1 ? TextInputAction.next : TextInputAction.done,
                      inputFormatters: [
                        LengthLimitingTextInputFormatter(1),
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      onChanged: (v) => _onDigitChanged(i, v),
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        counterText: '',
                        contentPadding: EdgeInsets.zero,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 14)),
            ),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _submitting ? null : _verify,
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(t('verify')),
          ),
          const SizedBox(height: 16),
          Center(
            child: _resending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : _cooldown > 0
                    ? Text(
                        '${t('resend_in')} ${_cooldown}s',
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      )
                    : TextButton(
                        onPressed: _resend,
                        child: Text(
                          t('resend_code'),
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                        ),
                      ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 18),
            child: Row(
              children: [
                Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text('OR', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600)),
                ),
                Expanded(child: Divider(color: Color(0xFFE2E8F0))),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Verify with an email link (Firebase)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF166534)),
                ),
                const SizedBox(height: 4),
                const Text(
                  'We also emailed you a verification link. Click it, then confirm below.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF166534)),
                ),
                const SizedBox(height: 10),
                FilledButton(
                  onPressed: _checkingFirebase ? null : _checkFirebaseVerification,
                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
                  child: _checkingFirebase
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('I clicked the link — continue'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _checkingFirebase ? null : _resendFirebaseVerification,
                  child: const Text(
                    'Resend verification link',
                    style: TextStyle(color: Color(0xFF166534), fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}