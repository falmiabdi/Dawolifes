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
import 'agent_onboarding_screen.dart';
import 'agent_payments.dart';
import 'agent_post_property.dart';
import 'agent_post_vehicle.dart';
import 'agent_profile.dart';
import 'agent_properties.dart';
import 'agent_settings.dart';
import 'agent_vehicles.dart';

/// Agent portal hub mirroring the agent sidebar in dashboard/sidebar.tsx.
///
/// Non-approved agents (Pending/Rejected/Suspended) see a full-screen status
/// gate instead of the hub, matching the web app's PendingApprovalScreen: the
/// agent can only check their approval status or sign out (Rejected agents may
/// also re-enter onboarding to update and resubmit).
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
    if (status != 'Approved') {
      return _PendingApprovalView(
        status: status,
        rejectionReason: user?.rejectionReason,
        onRefresh: auth.refreshUser,
        onSignOut: () async {
          await auth.logout();
          if (context.mounted) Navigator.of(context).popUntil((r) => r.isFirst);
        },
        onUpdateProfile: () => _open(context, const AgentOnboardingScreen()),
      );
    }

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
                StatusChip(status: status),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const SectionHeader(title: 'Menu'),
          _menuTile(context, Icons.dashboard_outlined, t('dashboard'), () => _open(context, const AgentDashboardScreen())),
          _menuTile(context, Icons.person_outline, 'My Profile', () => _open(context, const AgentProfileScreen())),
          _menuTile(context, Icons.house_outlined, 'My Properties', () => _open(context, const AgentPropertiesScreen())),
          _menuTile(context, Icons.add_home_outlined, t('post_property'), () => _open(context, const AgentPostPropertyScreen())),
          _menuTile(context, Icons.directions_car_outlined, 'My Vehicles', () => _open(context, const AgentVehiclesScreen())),
          _menuTile(context, Icons.add_box_outlined, t('post_vehicle'), () => _open(context, const AgentPostVehicleScreen())),
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
}

/// Full-screen approval gate mirroring components/agent/pending-approval.tsx.
class _PendingApprovalView extends StatelessWidget {
  const _PendingApprovalView({
    required this.status,
    required this.onRefresh,
    required this.onSignOut,
    this.rejectionReason,
    this.onUpdateProfile,
  });

  final String status;
  final String? rejectionReason;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onSignOut;
  final VoidCallback? onUpdateProfile;

  @override
  Widget build(BuildContext context) {
    final isRejected = status == 'Rejected';
    final isSuspended = status == 'Suspended';

    final icon = isRejected
        ? Icons.cancel_outlined
        : isSuspended
            ? Icons.block_outlined
            : Icons.hourglass_empty;
    final color = isRejected || isSuspended ? AppColors.destructive : Colors.amber;

    final title = isRejected
        ? 'Account Rejected'
        : isSuspended
            ? 'Account Suspended'
            : 'Application Under Review';
    final message = isRejected
        ? (rejectionReason?.isNotEmpty == true ? rejectionReason! : 'Your agent application was not approved. Review the reason and update your profile to resubmit.')
        : isSuspended
            ? 'Your account has been suspended. Contact support for more information.'
            : 'Your application is being reviewed by our team. You will be able to post listings once approved. This usually takes 24–48 hours.';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              width: double.infinity,
              constraints: const BoxConstraints(maxWidth: 420),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppColors.radius),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: (isRejected || isSuspended ? AppColors.destructive : Colors.amber).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, size: 32, color: color),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.foreground),
                  ),
                  const SizedBox(height: 12),
                  StatusChip(status: status),
                  const SizedBox(height: 12),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.mutedForeground),
                  ),
                  if (isRejected) ...[
                    const SizedBox(height: 8),
                    const Text(
                      'Update your profile to resubmit your application.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.orange),
                    ),
                  ],
                  const SizedBox(height: 24),
                  OutlinedButton.icon(
                    onPressed: () async {
                      await onRefresh();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(context.read<AuthProvider>().user?.status == 'Approved' ? 'Approved! Welcome to the portal.' : 'Still under review.')),
                        );
                      }
                    },
                    icon: const Icon(Icons.refresh, size: 18),
                    label: const Text('Check Approval Status'),
                    style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 44)),
                  ),
                  if (onUpdateProfile != null) ...[
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: onUpdateProfile,
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text('Update Profile'),
                      style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 44)),
                    ),
                  ],
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () async {
                      await onSignOut();
                    },
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text('Sign Out'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 44),
                      foregroundColor: AppColors.destructive,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
