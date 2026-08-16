import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import 'auth_shell.dart';
import 'login_screen.dart';
import 'verify_email_screen.dart';

/// Signup flow mirroring app/auth/signup/page.tsx + role-signup-form.tsx:
/// 1. Choose account type (Buyer/User or Seller/Agent).
/// 2. Buyer: full name, email, phone, password, confirm password (immediate
///    verification, returns to the app shell).
/// 3. Agent: username, email, password (submitted for review, then sign in).
///
/// Pass [initialRole] to skip the role picker (e.g. "Register as Agent" from
/// the Sell tab).
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key, this.initialRole});

  final SignupRole? initialRole;

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

enum SignupRole { buyer, agent }

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  SignupRole? _role;
  bool _showPassword = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _role = widget.initialRole;
  }

  @override
  void dispose() {
    _name.dispose();
    _username.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      final email = _email.text.trim();
      if (_role == SignupRole.buyer) {
        await auth.registerBuyer(
          name: _name.text.trim(),
          email: email,
          phone: _phone.text.trim(),
          password: _password.text,
        );
      } else {
        await auth.registerAgent(
          username: _username.text.trim(),
          email: email,
          password: _password.text,
        );
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => VerifyEmailScreen(email: email),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.message.toLowerCase().contains('already registered') ||
          e.message.toLowerCase().contains('already')) {
        setState(() => _error = 'This email is already registered. Try signing in instead.');
      } else {
        setState(() => _error = e.message);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Registration failed. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _submitGoogle() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      final roleStr = _role == SignupRole.agent ? 'agent' : 'user';
      final result = await auth.loginWithGoogle(role: roleStr);
      if (!mounted) return;

      if (result.user != null && !result.user!.emailVerified) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => VerifyEmailScreen(email: result.user!.email),
          ),
        );
        return;
      }

      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Google sign up failed. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;

    return AuthShell(
      title: t('create_free_account'),
      footer: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(t('already_have_account'), style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
          TextButton(
            onPressed: () => Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const LoginScreen()),
            ),
            child: Text(
              t('sign_in'),
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: Column(
          key: ValueKey(_role),
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_role == null) ...[
              _RolePicker(
                t: t,
                onSelect: (role) => setState(() {
                  _role = role;
                  _error = null;
                }),
              ),
              const SizedBox(height: 20),
              Row(
                children: const [
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('OR', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500)),
                  ),
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                ],
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _submitting ? null : _submitGoogle,
                icon: Image.network(
                  'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                  height: 18,
                  width: 18,
                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.g_mobiledata, size: 20),
                ),
                label: const Text('Continue with Google', style: TextStyle(fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ] else ...[
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _RoleBanner(
                      role: _role!,
                      t: t,
                      onBack: () => setState(() {
                        _role = null;
                        _error = null;
                      }),
                    ),
                    const SizedBox(height: 20),
                    if (_role == SignupRole.buyer) ...[
                      _Field(
                        label: t('full_name'),
                        hint: 'e.g. Abebe Bikila',
                        controller: _name,
                        validator: (v) =>
                            (v == null || v.trim().length < 2) ? 'Name must be at least 2 characters' : null,
                      ),
                      const SizedBox(height: 16),
                      _Field(
                        label: t('email'),
                        hint: 'you@example.com',
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                      ),
                      const SizedBox(height: 16),
                      _Field(
                        label: '${t('phone_number')} (Optional)',
                        hint: '+251 91 234 5678',
                        controller: _phone,
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 16),
                      _Field(
                        label: t('password'),
                        hint: 'At least 8 characters',
                        controller: _password,
                        obscure: !_showPassword,
                        suffix: IconButton(
                          icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility,
                              color: const Color(0xFF64748B)),
                          onPressed: () => setState(() => _showPassword = !_showPassword),
                        ),
                        validator: (v) =>
                            (v == null || v.length < 8) ? 'Password must be at least 8 characters' : null,
                      ),
                      const SizedBox(height: 16),
                      _Field(
                        label: t('confirm_password'),
                        hint: 'Re-enter your password',
                        controller: _confirm,
                        obscure: !_showPassword,
                        validator: (v) =>
                            (v != _password.text) ? 'Passwords do not match' : null,
                      ),
                    ] else ...[
                      _Field(
                        label: t('username'),
                        hint: 'e.g. abebe_realestate',
                        controller: _username,
                        validator: (v) =>
                            (v == null || v.trim().length < 2) ? 'Username must be at least 2 characters' : null,
                      ),
                      const SizedBox(height: 16),
                      _Field(
                        label: t('email'),
                        hint: 'agent@example.com',
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                      ),
                      const SizedBox(height: 16),
                      _Field(
                        label: t('password'),
                        hint: 'At least 8 characters',
                        controller: _password,
                        obscure: !_showPassword,
                        suffix: IconButton(
                          icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility,
                              color: const Color(0xFF64748B)),
                          onPressed: () => setState(() => _showPassword = !_showPassword),
                        ),
                        validator: (v) =>
                            (v == null || v.length < 8) ? 'Password must be at least 8 characters' : null,
                      ),
                      const SizedBox(height: 16),
                      _Field(
                        label: t('confirm_password'),
                        hint: 'Re-enter your password',
                        controller: _confirm,
                        obscure: !_showPassword,
                        validator: (v) =>
                            (v != _password.text) ? 'Passwords do not match' : null,
                      ),
                    ],
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
                          : Text(t('create_account')),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _role == SignupRole.buyer
                          ? 'We will email you a verification link to verify your account.'
                          : 'Your application will be reviewed by our team after verification.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: _submitting ? null : _submitGoogle,
                      icon: Image.network(
                        'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                        height: 18,
                        width: 18,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.g_mobiledata, size: 20),
                      ),
                      label: const Text('Sign up with Google', style: TextStyle(fontWeight: FontWeight.w600)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RolePicker extends StatelessWidget {
  const _RolePicker({required this.t, required this.onSelect});

  final String Function(String) t;
  final ValueChanged<SignupRole> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(t('choose_account_type'), style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _RoleCard(
                icon: Icons.shopping_bag,
                title: t('buyer_user'),
                desc: t('buyer_user_desc'),
                onTap: () => onSelect(SignupRole.buyer),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _RoleCard(
                icon: Icons.storefront,
                title: t('seller_agent'),
                desc: t('seller_agent_desc'),
                onTap: () => onSelect(SignupRole.agent),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.desc,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String desc;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(color: Color(0xFFFFEDD5), shape: BoxShape.circle),
                child: Icon(icon, color: AppColors.primary, size: 24),
              ),
              const SizedBox(height: 10),
              Text(title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 4),
              Text(desc,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleBanner extends StatelessWidget {
  const _RoleBanner({required this.role, required this.t, required this.onBack});

  final SignupRole role;
  final String Function(String) t;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final isBuyer = role == SignupRole.buyer;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: onBack,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Text(
              '← ${t('choose_account_type')}',
              style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(isBuyer ? Icons.person : Icons.storefront, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${isBuyer ? t('buyer_user') : t('seller_agent')} — ${isBuyer ? t('buyer_user_desc') : t('seller_agent_desc')}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF9A3412)),
                ),
              ),
              const Icon(Icons.check_circle, size: 18, color: Color(0xFF16A34A)),
            ],
          ),
        ),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.hint,
    required this.controller,
    this.validator,
    this.keyboardType,
    this.obscure = false,
    this.suffix,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final bool obscure;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          validator: validator,
          keyboardType: keyboardType,
          obscureText: obscure,
          decoration: InputDecoration(hintText: hint, suffixIcon: suffix),
        ),
      ],
    );
  }
}
