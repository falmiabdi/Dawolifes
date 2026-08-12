import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
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
  });

  final String email;
  final String? devOtp;

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
  bool _checking = false;
  String? _error;
  Timer? _cooldownTimer;
  int _cooldown = 0;

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

  Future<void> _openEmail() async {
    final uri = Uri(scheme: 'mailto', path: widget.email);
    try {
      await launchUrl(uri);
    } catch (_) {
      // Email apps may not be installed; ignore.
    }
  }

  /// The user clicked the "Verify Email" button in their inbox. Ask the server
  /// whether the account is now verified, then route like OTP verification:
  /// buyer -> app shell (dashboard), agent -> login screen.
  Future<void> _checkViaLink() async {
    setState(() {
      _checking = true;
      _error = null;
    });

    try {
      final result = await context.read<AuthProvider>().checkVerification(email: widget.email);
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
      if (mounted) setState(() => _checking = false);
    }
  }

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
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
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
                    const Icon(Icons.mail_outline, size: 18, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        t('verify_email_link_hint'),
                        style: const TextStyle(fontSize: 13, color: Color(0xFF9A3412)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _openEmail,
                        icon: const Icon(Icons.open_in_new, size: 16),
                        label: Text(t('open_email')),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.tonalIcon(
                        onPressed: _checking ? null : _checkViaLink,
                        icon: _checking
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.check_circle_outline, size: 16),
                        label: Text(t('check_verification')),
                        style: FilledButton.styleFrom(
                          foregroundColor: const Color(0xFF9A3412),
                          backgroundColor: const Color(0xFFFFEDD5),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
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
        ],
      ),
    );
  }
}