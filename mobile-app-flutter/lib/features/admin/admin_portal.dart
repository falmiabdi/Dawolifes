import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/network/websocket_service.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/message_repository.dart';
import '../../data/repositories/notification_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../messages/messages_screen.dart';
import '../portal/widgets.dart';
import 'admin_agents.dart';
import 'admin_announcements.dart';
import 'admin_dashboard.dart';
import 'admin_notifications.dart';
import 'admin_payments.dart';
import 'admin_permissions.dart';
import 'admin_properties.dart';
import 'admin_settings.dart';
import 'admin_users.dart';
import 'admin_vehicles.dart';

/// Admin portal hub mirroring the admin sidebar in dashboard/sidebar.tsx.
///
/// Nav order, labels and the unread notification badge match the web sidebar:
/// Dashboard, Agents, Listing Permissions, Properties, Vehicles, Users,
/// Notifications, Announcements, Payments, Settings.
class AdminPortalScreen extends StatefulWidget {
  const AdminPortalScreen({super.key});

  @override
  State<AdminPortalScreen> createState() => _AdminPortalScreenState();
}

class _AdminPortalScreenState extends State<AdminPortalScreen> {
  int _unread = 0;
  int _msgUnread = 0;
  Timer? _unreadTimer;
  StreamSubscription<WSMessage>? _wsSub;

  NotificationRepository get _notifRepo => NotificationRepository(context.read<ApiClient>());
  MessageRepository get _msgRepo => MessageRepository(context.read<ApiClient>());

  @override
  void initState() {
    super.initState();
    // Mirror the web admin sidebar: poll the unread notification count every 30s.
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
        case WSMessageType.message:
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
    // Mirror the web sidebar: poll unread notification + message counts every
    // 30s so the admin portal badges stay fresh.
    try {
      final count = await _notifRepo.fetchUnreadCount();
      if (mounted && count != _unread) setState(() => _unread = count);
    } catch (_) {
      // Ignore polling failures.
    }
    try {
      final count = await _msgRepo.fetchUnreadCount();
      if (mounted && count != _msgUnread) setState(() => _msgUnread = count);
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
                  backgroundImage: (user?.profilePhoto?.isNotEmpty ?? false)
                      ? CachedNetworkImageProvider(user!.profilePhoto!)
                      : null,
                  child: (user?.profilePhoto?.isNotEmpty ?? false)
                      ? null
                      : Text(
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
                      if ((user?.phone ?? '').isNotEmpty)
                        Text(user!.phone!, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
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
          _menuTile(context, Icons.people_outline, 'Agent Management', () => _open(context, const AdminAgentsScreen())),
          _menuTile(context, Icons.shield_outlined, 'Listing Permissions', () => _open(context, const AdminPermissionsScreen())),
          _menuTile(context, Icons.house_outlined, 'Properties', () => _open(context, const AdminPropertiesScreen())),
          _menuTile(context, Icons.directions_car_outlined, 'Vehicles', () => _open(context, const AdminVehiclesScreen())),
          _menuTile(context, Icons.group_outlined, 'Users', () => _open(context, const AdminUsersScreen())),
          _menuTile(context, Icons.chat_outlined, 'Messages', () => _open(context, const MessagesScreen()), badge: _msgUnread),
          _menuTile(context, Icons.notifications_outlined, 'Notifications', () => _open(context, const AdminNotificationsScreen()), badge: _unread),
          _menuTile(context, Icons.campaign_outlined, 'Announcements', () => _open(context, const AdminAnnouncementsScreen())),
          _menuTile(context, Icons.credit_card_outlined, 'Payments', () => _open(context, const AdminPaymentsScreen())),
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
}