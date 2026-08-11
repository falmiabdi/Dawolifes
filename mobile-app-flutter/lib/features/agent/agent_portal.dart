import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';
import 'agent_dashboard.dart';
import 'agent_onboarding_screen.dart';
import 'agent_payments.dart';
import 'agent_post_property.dart';
import 'agent_post_vehicle.dart';
import 'agent_profile.dart';
import 'agent_properties.dart';
import 'agent_settings.dart';
import 'agent_vehicles.dart';
import '../notifications/notifications_screen.dart';

/// Agent portal hub mirroring the agent sidebar in dashboard/sidebar.tsx.
///
/// Gates the sidebar menu by approval status:
/// - Pending: only shows onboarding + notifications + logout (agent must
///   complete their profile and wait for admin approval).
/// - Rejected: shows rejection reason + edit profile (resubmit) + logout.
/// - Approved: shows the full sidebar menu.
/// - Suspended: shows suspended message + logout only.
class AgentPortalScreen extends StatelessWidget {
  const AgentPortalScreen({super.key});

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final l10n = context.watch<LanguageProvider>();
    final t = l10n.t;

    final status = user?.status ?? 'Pending';
    final onboardingDone = user?.onboardingComplete ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Agent Portal')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Status header ──────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppColors.radius),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.primary,
                  child: Text(
                    user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : 'A',
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'Agent', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text(user?.email ?? '', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                    ],
                  ),
                ),
                StatusChip(status: status),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // ── Status-gated content ───────────────────────────────────────
          if (status == 'Rejected') ...[
            _RejectionCard(
              rejectionReason: user?.rejectionReason,
              onEditProfile: () => _open(context, const AgentOnboardingScreen()),
            ),
            const SizedBox(height: 20),
            _menuTile(context, Icons.person_outline, 'Edit Profile & Resubmit', () => _open(context, const AgentOnboardingScreen())),
            _menuTile(context, Icons.notifications_outlined, 'Notifications', () => _open(context, const NotificationsScreen())),
          ] else if (status == 'Suspended') ...[
            _StatusMessage(
              icon: Icons.block,
              color: AppColors.mutedForeground,
              title: 'Account Suspended',
              message: 'Your account has been suspended. Please contact support for assistance.',
            ),
            const SizedBox(height: 20),
            _menuTile(context, Icons.notifications_outlined, 'Notifications', () => _open(context, const NotificationsScreen())),
          ] else if (status == 'Pending') ...[
            _StatusMessage(
              icon: Icons.hourglass_top,
              color: AppColors.warning,
              title: onboardingDone ? 'Awaiting Approval' : 'Complete Your Profile',
              message: onboardingDone
                  ? 'Your application is under review. You will be notified once approved.'
                  : 'Please complete your profile to submit your application for review.',
            ),
            const SizedBox(height: 20),
            if (!onboardingDone)
              _menuTile(context, Icons.person_outline, t('complete_profile'), () => _open(context, const AgentOnboardingScreen())),
            _menuTile(context, Icons.person_outline, 'My Profile', () => _open(context, const AgentProfileScreen())),
            _menuTile(context, Icons.notifications_outlined, 'Notifications', () => _open(context, const NotificationsScreen())),
          ] else ...[
            // ── Approved: full sidebar ───────────────────────────────────
            const SectionHeader(title: 'Menu'),
            _menuTile(context, Icons.dashboard_outlined, t('dashboard'), () => _open(context, const AgentDashboardScreen())),
            _menuTile(context, Icons.person_outline, 'My Profile', () => _open(context, const AgentProfileScreen())),
            _menuTile(context, Icons.house_outlined, 'My Properties', () => _open(context, const AgentPropertiesScreen())),
            _menuTile(context, Icons.add_home_outlined, t('post_property'), () => _open(context, const AgentPostPropertyScreen())),
            _menuTile(context, Icons.directions_car_outlined, 'My Vehicles', () => _open(context, const AgentVehiclesScreen())),
            _menuTile(context, Icons.add_box_outlined, t('post_vehicle'), () => _open(context, const AgentPostVehicleScreen())),
            _menuTile(context, Icons.notifications_outlined, 'Notifications', () => _open(context, const NotificationsScreen())),
            _menuTile(context, Icons.credit_card_outlined, 'Commission History', () => _open(context, const AgentPaymentsScreen())),
            _menuTile(context, Icons.settings_outlined, 'Settings', () => _open(context, const AgentSettingsScreen())),
          ],

          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (context.mounted) Navigator.of(context).popUntil((r) => r.isFirst);
            },
            style: FilledButton.styleFrom(backgroundColor: AppColors.destructive),
            icon: const Icon(Icons.logout, size: 18),
            label: Text(t('logout')),
          ),
        ],
      ),
    );
  }

  Widget _menuTile(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.border)),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label, style: const TextStyle(fontSize: 15)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
        onTap: onTap,
      ),
    );
  }
}

/// Rejection card showing the admin's rejection reason and a prompt to
/// edit the profile and resubmit.
class _RejectionCard extends StatelessWidget {
  const _RejectionCard({required this.rejectionReason, required this.onEditProfile});

  final String? rejectionReason;
  final VoidCallback onEditProfile;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.cancel, color: Color(0xFFDC2626), size: 20),
              const SizedBox(width: 8),
              const Text('Application Rejected', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF991B1B))),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            rejectionReason ?? 'Your application was not approved. Please update your profile and resubmit.',
            style: const TextStyle(fontSize: 13, color: Color(0xFF7F1D1D)),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: onEditProfile,
            icon: const Icon(Icons.edit, size: 16),
            label: const Text('Edit Profile & Resubmit'),
          ),
        ],
      ),
    );
  }
}

/// Generic status info card (pending / suspended).
class _StatusMessage extends StatelessWidget {
  const _StatusMessage({
    required this.icon,
    required this.color,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
          const SizedBox(height: 8),
          Text(message, style: TextStyle(fontSize: 13, color: color.withValues(alpha: 0.8))),
        ],
      ),
    );
  }
}
