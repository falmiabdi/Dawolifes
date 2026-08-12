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

    return Scaffold(
      appBar: AppBar(title: const Text('Agent Portal')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
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
                StatusChip(status: user?.status ?? 'Pending'),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const SectionHeader(title: 'Menu'),
          _menuTile(context, Icons.dashboard_outlined, t('dashboard'), () => _open(context, const AgentDashboardScreen())),
          _menuTile(context, Icons.person_outline, 'My Profile', () => _open(context, const AgentProfileScreen())),
          _menuTile(context, Icons.person_outline, t('complete_profile'), () => _open(context, const AgentOnboardingScreen())),
          _menuTile(context, Icons.house_outlined, 'My Properties', () => _open(context, const AgentPropertiesScreen())),
          _menuTile(context, Icons.add_home_outlined, t('post_property'), () => _open(context, const AgentPostPropertyScreen())),
          _menuTile(context, Icons.directions_car_outlined, 'My Vehicles', () => _open(context, const AgentVehiclesScreen())),
          _menuTile(context, Icons.add_box_outlined, t('post_vehicle'), () => _open(context, const AgentPostVehicleScreen())),
          _menuTile(context, Icons.notifications_outlined, 'Notifications', () => _open(context, const NotificationsScreen())),
          _menuTile(context, Icons.credit_card_outlined, 'Commission History', () => _open(context, const AgentPaymentsScreen())),
          _menuTile(context, Icons.settings_outlined, 'Settings', () => _open(context, const AgentSettingsScreen())),
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
