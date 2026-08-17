import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';
import 'admin_agents.dart';
import 'admin_announcements.dart';
import 'admin_dashboard.dart';
import 'admin_notifications.dart';
import 'admin_payments.dart';
import 'admin_properties.dart';
import 'admin_settings.dart';
import 'admin_users.dart';
import 'admin_vehicles.dart';

/// Admin portal hub mirroring the admin sidebar in dashboard/sidebar.tsx.
class AdminPortalScreen extends StatelessWidget {
  const AdminPortalScreen({super.key});

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
      appBar: AppBar(
        title: const Text('Admin Portal'),
        leading: IconButton(
          icon: const Icon(Icons.home_outlined),
          tooltip: 'Home',
          onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
        ),
      ),
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
                      Text(user?.name ?? 'Admin', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text(user?.email ?? '', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                    ],
                  ),
                ),
                const StatusChip(status: 'Admin'),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const SectionHeader(title: 'Menu'),
          _menuTile(context, Icons.dashboard_outlined, t('dashboard'), () => _open(context, const AdminDashboardScreen())),
          _menuTile(context, Icons.people_outline, 'Agents', () => _open(context, const AdminAgentsScreen())),
          _menuTile(context, Icons.group_outlined, 'Users', () => _open(context, const AdminUsersScreen())),
          _menuTile(context, Icons.house_outlined, 'Properties', () => _open(context, const AdminPropertiesScreen())),
          _menuTile(context, Icons.directions_car_outlined, 'Vehicles', () => _open(context, const AdminVehiclesScreen())),
          _menuTile(context, Icons.credit_card_outlined, 'Payments', () => _open(context, const AdminPaymentsScreen())),
          _menuTile(context, Icons.campaign_outlined, 'Announcements', () => _open(context, const AdminAnnouncementsScreen())),
          _menuTile(context, Icons.notifications_outlined, 'Broadcast', () => _open(context, const AdminNotificationsScreen())),
          _menuTile(context, Icons.settings_outlined, 'Settings', () => _open(context, const AdminSettingsScreen())),
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
