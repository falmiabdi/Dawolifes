import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/language_provider.dart';
import '../portal/change_password_screen.dart';

/// Agent settings mirroring app/agent/settings/page.tsx:
/// change password + notification preferences.
class AgentSettingsScreen extends StatelessWidget {
  const AgentSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = context.read<LanguageProvider>();
    final t = l10n.t;
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.lock_outline, color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
                    Text(t('change_password'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Update the password used to sign in to your account.',
                    style: TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChangePasswordScreen())),
                  icon: const Icon(Icons.password, size: 16),
                  label: const Text('Update Password'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.notifications_outlined, color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
                    const Text('Notification Preferences', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 8),
                const _NotifyToggle(
                  title: 'New Leads Inquiries',
                  desc: 'Receive instant notifications when a customer sends an inquiry about your property listings.',
                ),
                const _NotifyToggle(
                  title: 'Listing Approval Status',
                  desc: 'Get notified when your posted properties are approved or rejected by the admin team.',
                ),
                const _NotifyToggle(
                  title: 'Monthly Billing & Invoices',
                  desc: 'Email alerts when subscriptions or premium features are processed.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotifyToggle extends StatefulWidget {
  const _NotifyToggle({required this.title, required this.desc});

  final String title;
  final String desc;

  @override
  State<_NotifyToggle> createState() => _NotifyToggleState();
}

class _NotifyToggleState extends State<_NotifyToggle> {
  bool _on = true;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      value: _on,
      onChanged: (v) => setState(() => _on = v),
      contentPadding: EdgeInsets.zero,
      title: Text(widget.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      subtitle: Text(widget.desc, style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground)),
      activeThumbColor: AppColors.primary,
    );
  }
}
