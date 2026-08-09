import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import 'auth_shell.dart';
import 'login_screen.dart';

/// Reset password screen.
///
/// The user enters the 6-digit code emailed by the backend (in development a
/// `devOtp` is auto-filled) plus a new password, then resets it via
/// `/api/auth/reset-password`. On success they are returned to the login screen.
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.email, this.devOtp});

  final String email;
  final String? devOtp;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  static const _codeLength = 6;

  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _showPassword = false;
  bool _submitting = false;
  String? _error;

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
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  String get _enteredCode => _controllers.map((c) => c.text.trim()).join();

  Future<void> _submit() async {
    final t = context.read<LanguageProvider>().t;
    final code = _enteredCode;
    if (code.length != _codeLength) {
      setState(() => _error = t('enter_6_digit_code'));
      return;
    }
    if (_newPassword.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters');
      return;
    }
    if (_newPassword.text != _confirmPassword.text) {
      setState(() => _error = t('password_mismatch'));
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await context.read<AuthProvider>().resetPassword(
            email: widget.email,
            otp: code,
            newPassword: _newPassword.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(t('password_reset_success'))),
      );
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => route.isFirst,
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = t('verification_failed'));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _onDigitChanged(int index, String value) {
    setState(() => _error = null);
    final raw = value.trim();
    if (raw.isEmpty) return;
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
    final t = context.read<LanguageProvider>().t;

    return AuthShell(
      title: t('reset_password_title'),
      footer: TextButton(
        onPressed: () => Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        ),
        child: Text(
          t('sign_in_link'),
          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '${t('reset_password_subtitle')}\n${widget.email}',
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
          const SizedBox(height: 20),
          Text(
            t('new_password_label'),
            style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _newPassword,
            obscureText: !_showPassword,
            decoration: InputDecoration(
              hintText: 'Enter a new password',
              suffixIcon: IconButton(
                icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF64748B)),
                onPressed: () => setState(() => _showPassword = !_showPassword),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            t('confirm_new_password'),
            style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _confirmPassword,
            obscureText: !_showPassword,
            decoration: const InputDecoration(hintText: 'Confirm your new password'),
            onFieldSubmitted: (_) => _submit(),
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
            onPressed: _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(t('reset_password_button')),
          ),
        ],
      ),
    );
  }
}
