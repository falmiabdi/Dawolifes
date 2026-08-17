import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/network/websocket_service.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/notification_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../notifications/notifications_screen.dart';
import '../portal/widgets.dart';
import 'agent_dashboard.dart';
import 'agent_payments.dart';
import 'agent_post_property.dart';
import 'agent_post_vehicle.dart';
import 'agent_profile.dart';
import 'agent_properties.dart';
import 'agent_settings.dart';
import 'agent_vehicles.dart';

/// Agent portal hub mirroring the agent sidebar in dashboard/sidebar.tsx.
///
/// All agents (Pending/Approved/Rejected) see the full hub. Post features
/// (Post Property, Post Vehicle) are locked until the profile is approved.
class AgentPortalScreen extends StatefulWidget {
  const AgentPortalScreen({super.key});

  @override
  State<AgentPortalScreen> createState() => _AgentPortalScreenState();
}

class _AgentPortalScreenState extends State<AgentPortalScreen> {
  int _unread = 0;
  Timer? _unreadTimer;
  StreamSubscription<WSMessage>? _wsSub;

  NotificationRepository get _notifRepo => NotificationRepository(context.read<ApiClient>());

  @override
  void initState() {
    super.initState();
    // Mirror the web sidebar: poll the unread notification count every 30s.
    _loadUnread();
    _unreadTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadUnread());
    // Real-time: refresh the badge on socket events.
    _wsSub = context.read<WebSocketService>().messages.listen((msg) {
      if (!mounted) return;
      switch (msg.type) {
        case WSMessageType.notification:
        case WSMessageType.unreadCount:
        case WSMessageType.markReadAck:
        case WSMessageType.markSingleReadAck:
          _loadUnread();
          break;
        default:
          break;
      }
    });
  }

  @override
  void dispose() {
    _unreadTimer?.cancel();
    _wsSub?.cancel();
    super.dispose();
  }

  Future<void> _loadUnread() async {
    try {
      final count = await _notifRepo.fetchUnreadCount();
      if (mounted && count != _unread) setState(() => _unread = count);
    } catch (_) {
      // Ignore polling failures.
    }
  }

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
    final approved = status == 'Approved';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agent Portal'),
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
                      Text(user?.name ?? 'Agent', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text(user?.email ?? '', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                    ],
                  ),
                ),
                StatusChip(status: status),
              ],
            ),
          ),
          if (!approved) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Color(0xFF16A34A), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      status == 'Rejected'
                          ? 'Your profile was rejected. Update your profile and resubmit for review.'
                          : 'Complete your profile and wait for admin approval to start posting.',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF15803D), height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          const SectionHeader(title: 'Menu'),
          _menuTile(context, Icons.dashboard_outlined, t('dashboard'), () => _open(context, const AgentDashboardScreen())),
          _menuTile(context, Icons.person_outline, 'My Profile', () => _open(context, const AgentProfileScreen())),
          _menuTile(context, Icons.house_outlined, 'My Properties', () => _open(context, const AgentPropertiesScreen())),
          _lockedMenuTile(
            context,
            Icons.add_home_outlined,
            t('post_property'),
            approved,
            status,
            () => _open(context, const AgentPostPropertyScreen()),
          ),
          _menuTile(context, Icons.directions_car_outlined, 'My Vehicles', () => _open(context, const AgentVehiclesScreen())),
          _lockedMenuTile(
            context,
            Icons.add_box_outlined,
            t('post_vehicle'),
            approved,
            status,
            () => _open(context, const AgentPostVehicleScreen())),
          _menuTile(context, Icons.notifications_outlined, 'Notifications', () => _open(context, const NotificationsScreen()), badge: _unread),
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

  Widget _menuTile(BuildContext context, IconData icon, String label, VoidCallback onTap, {int badge = 0}) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.border)),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label, style: const TextStyle(fontSize: 15)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (badge > 0)
              Container(
                constraints: const BoxConstraints(minWidth: 18),
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  badge > 99 ? '99+' : '$badge',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
          ],
        ),
        onTap: onTap,
      ),
    );
  }

  Widget _lockedMenuTile(BuildContext context, IconData icon, String label, bool approved, String status, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.border)),
      child: ListTile(
        leading: Icon(icon, color: approved ? AppColors.primary : AppColors.mutedForeground),
        title: Text(
          label,
          style: TextStyle(fontSize: 15, color: approved ? AppColors.foreground : AppColors.mutedForeground),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!approved)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: const Text(
                  'Locked',
                  style: TextStyle(fontSize: 10, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                ),
              ),
            const SizedBox(width: 4),
            Icon(
              approved ? Icons.chevron_right : Icons.lock_outline,
              color: AppColors.mutedForeground,
              size: 20,
            ),
          ],
        ),
        onTap: approved
            ? onTap
            : () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Row(
                      children: [
                        const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            status == 'Rejected'
                                ? 'Update your profile and resubmit to start posting.'
                                : 'Complete your profile and wait for admin approval to post.',
                            style: const TextStyle(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    backgroundColor: const Color(0xFF16A34A),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    duration: const Duration(seconds: 4),
                  ),
                );
              },
      ),
    );
  }
}
