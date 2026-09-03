import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../agent/agent_onboarding_screen.dart';
import 'auth_shell.dart';
import 'login_screen.dart';

/// Email verification screen (6-digit code + link).
///
/// After registering (buyer or agent) the user lands here with the email they
/// signed up with. The backend emails a 6-digit OTP code and a verification
/// link. The user can enter the 6-digit code directly (primary path), or open
/// their email app and tap the "Verify Email" button then press "Check".
/// On success: a buyer gets a session (straight to the app shell/dashboard);
/// an agent gets a session and is sent straight to the agent application form
/// so they can complete it without waiting for admin approval.
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key, required this.email, this.devOtp});

  final String email;
  final String? devOtp;

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  static const _codeLength = 6;

  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;
  bool _verifying = false;
  bool _checking = false;
  bool _resending = false;
  String? _error;
  bool _codeFilled = false;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(_codeLength, (_) => TextEditingController());
    _focusNodes = List.generate(_codeLength, (i) => FocusNode(onKeyEvent: _onKey));

    final dev = widget.devOtp;
    if (dev != null && dev.length == _codeLength) {
      for (var i = 0; i < _codeLength; i++) {
        _controllers[i].text = dev[i];
      }
      _codeFilled = true;
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
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  String get _enteredCode => _controllers.map((c) => c.text.trim()).join();

  Future<void> _openEmail() async {
    final uri = Uri(scheme: 'mailto', path: widget.email);
    try {
      await launchUrl(uri);
    } catch (_) {
      // Email apps may not be installed; ignore.
    }
  }

  /// Routes the user based on the verify/check result: agent -> application
  /// form, buyer -> app shell (dashboard), otherwise -> login (verified).
  void _routeByResult(dynamic result) {
    final user = result.user;
    if (user != null) {
      if (user.isAgent) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const AgentOnboardingScreen()),
          (route) => route.isFirst,
        );
      } else {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } else {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen(verified: true)),
        (route) => route.isFirst,
      );
    }
  }

  /// Submits the 6-digit code the user typed. The server verifies it and has
  /// already emailed the OTP at registration time.
  Future<void> _verifyWithCode() async {
    final t = context.read<LanguageProvider>().t;
    if (_enteredCode.length != _codeLength) {
      setState(() => _error = t('enter_6_digit_code'));
      return;
    }

    setState(() {
      _verifying = true;
      _error = null;
    });

    try {
      final result = await context.read<AuthProvider>().verifyOtp(email: widget.email, otp: _enteredCode);
      if (!mounted) return;
      _routeByResult(result);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = context.read<LanguageProvider>().t('verification_failed'));
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  /// The user clicked the "Verify Email" button in their inbox. Ask the server
  /// whether the account is now verified, then route (buyer -> dashboard,
  /// agent -> application form).
  Future<void> _checkViaLink() async {
    setState(() {
      _checking = true;
      _error = null;
    });

    try {
      final result = await context.read<AuthProvider>().checkVerification(email: widget.email);
      if (!mounted) return;
      _routeByResult(result);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = context.read<LanguageProvider>().t('verification_failed'));
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  /// Re-triggers the server to email a fresh 6-digit OTP + link (60s cooldown
  /// enforced client-side).
  Future<void> _resendLink() async {
    if (_resending) return;
    setState(() {
      _resending = true;
      _error = null;
    });

    try {
      await context.read<AuthProvider>().resendOtp(email: widget.email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<LanguageProvider>().t('code_resent'))),
      );
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

  void _onDigitChanged(int index, String value) {
    setState(() => _error = null);
    final raw = value.trim();
    if (raw.isEmpty) {
      _controllers[index].clear();
      _codeFilled = _enteredCode.length == _codeLength;
      return;
    }
    if (raw.length > 1) {
      final chars = raw.replaceAll(RegExp(r'\D'), '');
      if (chars.length == _codeLength) {
        for (var i = 0; i < _codeLength; i++) {
          _controllers[i].text = chars[i];
        }
        _focusNodes.last.requestFocus();
        _codeFilled = true;
        return;
      }
    }
    final digit = raw.replaceAll(RegExp(r'\D'), '');
    if (digit.isEmpty) {
      _controllers[index].clear();
      _codeFilled = _enteredCode.length == _codeLength;
      return;
    }
    _controllers[index].text = digit.characters.last;
    if (index < _codeLength - 1) {
      _focusNodes[index + 1].requestFocus();
    } else {
      _focusNodes[index].unfocus();
    }
    _codeFilled = _enteredCode.length == _codeLength;
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
      for (var i = 0; i < _codeLength; i++) {
        if (_focusNodes[i].hasFocus && _controllers[i].text.isEmpty && i > 0) {
          _focusNodes[i - 1].requestFocus();
          break;
        }
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
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '${t('verify_email_subtitle')} ${widget.email}',
              style: const TextStyle(color: Color(0xFF475569), fontSize: 14),
            ),
            const SizedBox(height: 24),
            // 6-digit OTP entry (primary path).
            Text(
              t('enter_6_digit_code'),
              style: const TextStyle(color: Color(0xFF334155), fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
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
                        onSubmitted: (_) => _codeFilled ? _verifyWithCode() : null,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
                        decoration: InputDecoration(
                          counterText: '',
                          contentPadding: EdgeInsets.zero,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _verifying ? null : _verifyWithCode,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
                child: _verifying
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(t('verify')),
              ),
            ),
            const SizedBox(height: 18),
            Center(
              child: Text(
                t('or'),
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 14),
            // Link-based alternative.
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.mail_outline, size: 20, color: AppColors.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          t('verify_email_link_hint'),
                          style: const TextStyle(fontSize: 13, color: Color(0xFF9A3412), height: 1.4),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _openEmail,
                      icon: const Icon(Icons.open_in_new, size: 18),
                      label: Text(t('open_email')),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _checking ? null : _checkViaLink,
                      icon: _checking
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.check_circle_outline, size: 18),
                      label: Text(t('check_verification')),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
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
            const SizedBox(height: 12),
            Center(
              child: _resending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : TextButton(
                      onPressed: _resendLink,
                      child: Text(
                        t('resend_code'),
                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}