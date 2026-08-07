import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../admin/admin_portal.dart';
import '../agent/agent_portal.dart';
import '../auth/login_screen.dart';
import '../auth/signup_screen.dart';

/// Profile tab, mirroring the profileHref destinations (verify/account).
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final l10n = context.watch<LanguageProvider>();
    final t = l10n.t;

    if (!auth.isLoggedIn) {
      return Scaffold(
        appBar: AppBar(title: Text(t('profile'))),
        body: ListView(
          padding: const EdgeInsets.all(32),
          children: [
            const Icon(Icons.person_outline, size: 48, color: AppColors.mutedForeground),
            const SizedBox(height: 12),
            const Text(
              'Sign in to see your profile',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.mutedForeground),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              ),
              child: Text(t('sign_in')),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SignupScreen()),
              ),
              child: Text(t('create_account_link')),
            ),
          ],
        ),
      );
    }

    final user = auth.user!;

    return Scaffold(
      appBar: AppBar(title: Text(t('profile'))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: AppColors.primary,
                child: Text(
                  user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 2),
                    Text(user.email, style: const TextStyle(color: AppColors.mutedForeground, fontSize: 13)),
                    const SizedBox(height: 4),
                    _RoleChip(role: user.role),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _InfoTile(icon: Icons.phone_outlined, label: t('phone'), value: user.phone ?? 'Not provided'),
          _InfoTile(icon: Icons.badge_outlined, label: 'Role', value: user.role),
          const SizedBox(height: 24),
          if (user.isAdmin)
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.border),
              ),
              child: ListTile(
                leading: const Icon(Icons.admin_panel_settings_outlined, color: AppColors.primary),
                title: const Text('Admin Portal', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                subtitle: const Text('Manage agents, listings, payments & users'),
                trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AdminPortalScreen()),
                ),
              ),
            ),
          if (user.isAgent)
            Card(
              margin: const EdgeInsets.only(bottom: 8),
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.border),
              ),
              child: ListTile(
                leading: const Icon(Icons.work_outline, color: AppColors.primary),
                title: const Text('Agent Portal', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                subtitle: const Text('Post properties & vehicles, track commissions'),
                trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AgentPortalScreen()),
                ),
              ),
            ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () async {
              await context.read<AuthProvider>().logout();
            },
            style: FilledButton.styleFrom(backgroundColor: AppColors.destructive),
            icon: const Icon(Icons.logout, size: 18),
            label: Text(t('logout')),
          ),
        ],
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  const _RoleChip({required this.role});

  final String role;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        role,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.mutedForeground),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppColors.mutedForeground),
      title: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
      subtitle: Text(value, style: const TextStyle(color: AppColors.foreground)),
    );
  }
}
