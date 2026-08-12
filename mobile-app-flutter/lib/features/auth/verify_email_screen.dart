import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import 'auth_shell.dart';
import 'login_screen.dart';

/// Email verification screen (link-based).
///
/// After registering (buyer or agent) the user lands here with the email they
/// signed up with. The backend emails a verification link; the user opens their
/// email app, taps the "Verify Email" button, then returns here and presses
/// "Check". The server confirms the account is now verified: for a buyer a
/// session is issued (straight to the app shell/dashboard); an agent, still
/// Pending admin approval, is sent to the login screen.
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key, required this.email});

  final String email;

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  bool _checking = false;
  bool _resending = false;
  String? _error;

  Future<void> _openEmail() async {
    final uri = Uri(scheme: 'mailto', path: widget.email);
    try {
      await launchUrl(uri);
    } catch (_) {
      // Email apps may not be installed; ignore.
    }
  }

  /// The user clicked the "Verify Email" button in their inbox. Ask the server
  /// whether the account is now verified, then route: buyer -> app shell
  /// (dashboard), agent -> login screen.
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

  /// Re-triggers the server to email a fresh verification link (60s cooldown
  /// enforced client-side). The link is the only verification path shown.
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
          const SizedBox(height: 20),
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
          const SizedBox(height: 20),
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
    );
  }
}