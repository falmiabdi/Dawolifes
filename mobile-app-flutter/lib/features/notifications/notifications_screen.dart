import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/network/websocket_service.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/listing_item.dart';
import '../../data/models/notification.dart';
import '../../data/repositories/listing_repository.dart';
import '../../data/repositories/notification_repository.dart';
import '../../providers/auth_provider.dart';
import '../admin/admin_agents.dart';
import '../listings/listing_detail_screen.dart';
import '../portal/widgets.dart';

/// Notifications list mirroring components/notifications/notification-list.tsx.
///
/// Stays fresh via real-time WebSocket pushes (same as the web app):
/// new notifications and unread-count changes reload the list, and a live
/// status pill mirrors the web sidebar's connection indicator. The underlying
/// WS client reconnects automatically with exponential backoff.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _loading = true;
  String? _error;
  StreamSubscription<WSMessage>? _wsSub;
  StreamSubscription<WSConnectionState>? _connSub;
  WSConnectionState _connection = WSConnectionState.disconnected;

  NotificationRepository get _repo => NotificationRepository(context.read<ApiClient>());

  @override
  void initState() {
    super.initState();
    _load();
    _wsSub = context.read<WebSocketService>().messages.listen((msg) {
      if (!mounted) return;
      switch (msg.type) {
        case WSMessageType.notification:
        case WSMessageType.unreadCount:
        case WSMessageType.markReadAck:
        case WSMessageType.markSingleReadAck:
          _load(silent: true);
          break;
        default:
          break;
      }
    });
    _connSub = context.read<WebSocketService>().connectionState.listen((state) {
      if (!mounted) return;
      setState(() => _connection = state);
    });
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    _connSub?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final items = await _repo.fetchNotifications();
      if (!mounted) return;
      setState(() {
        _notifications = items;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      if (!silent) {
        setState(() {
          _error = '$e';
          _loading = false;
        });
      }
    }
  }

  Future<void> _markAllRead() async {
    final ws = context.read<WebSocketService>();
    ws.markAllRead();
    try {
      await _repo.markAllRead();
      if (!mounted) return;
      setState(() {
        _notifications = _notifications.map((n) => n.copyWith(read: true)).toList();
      });
    } catch (_) {}
  }

  Future<void> _markRead(AppNotification notification) async {
    if (notification.read) return;
    context.read<WebSocketService>().markSingleRead(notification.id);
    try {
      await _repo.markRead(notification.id);
      if (!mounted) return;
      setState(() {
        final idx = _notifications.indexOf(notification);
        if (idx >= 0) _notifications[idx] = notification.copyWith(read: true);
      });
    } catch (_) {}
  }

  Future<void> _handleTap(AppNotification notification) async {
    _markRead(notification);
    final data = notification.data;
    final type = data?['type'] as String?;
    final id = data?['id'] as String?;
    if (type == null || id == null || id.isEmpty) return;
    switch (type) {
      case 'property':
        await _openListing(id, isVehicle: false);
        break;
      case 'vehicle':
        await _openListing(id, isVehicle: true);
        break;
      case 'agent':
        if (context.read<AuthProvider>().user?.isAdmin == true) {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const AdminAgentsScreen()),
          );
        }
        break;
      default:
        break;
    }
  }

  Future<void> _openListing(String id, {required bool isVehicle}) async {
    final repo = ListingRepository(context.read<ApiClient>());
    ListingItem? item;
    try {
      if (isVehicle) {
        final v = await repo.fetchVehicleDetail(id);
        item = v == null ? null : ListingItem.fromVehicle(v);
      } else {
        final p = await repo.fetchPropertyDetail(id);
        item = p == null ? null : ListingItem.fromProperty(p);
      }
    } catch (_) {
      item = null;
    }
    if (!mounted) return;
    final resolved = item;
    if (resolved == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open listing.')),
      );
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ListingDetailScreen(item: resolved)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unread = _notifications.where((n) => !n.read).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unread > 0)
            TextButton.icon(
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all, size: 18, color: Colors.white),
              label: const Text('Mark all read', style: TextStyle(color: Colors.white, fontSize: 13)),
            ),
        ],
      ),
      body: Column(
        children: [
          _ConnectionPill(state: _connection),
          Expanded(
            child: _loading
                ? const LoadingState()
                : _error != null
                    ? ErrorState(message: _error!, onRetry: _load)
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: _notifications.isEmpty
                            ? ListView(
                                physics: const AlwaysScrollableScrollPhysics(),
                                children: [
                                  const SizedBox(height: 120),
                                  Center(
                                    child: Column(
                                      children: [
                                        Icon(Icons.notifications_none, size: 48, color: AppColors.mutedForeground),
                                        const SizedBox(height: 12),
                                        Text('No notifications yet', style: TextStyle(color: AppColors.mutedForeground)),
                                      ],
                                    ),
                                  ),
                                ],
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: _notifications.length,
                                separatorBuilder: (_, _) => const Divider(height: 1),
                                itemBuilder: (context, i) {
                                  final n = _notifications[i];
                                  final (icon, color) = _typeStyle(n.type);
                                  return ListTile(
                                    onTap: () => _handleTap(n),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                    leading: CircleAvatar(
                                      backgroundColor: color.withValues(alpha: 0.12),
                                      child: Icon(icon, color: color, size: 20),
                                    ),
                                    title: Row(
                                      children: [
                                        if (!n.read)
                                          Container(width: 8, height: 8, margin: const EdgeInsets.only(right: 6), decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(4))),
                                        Expanded(
                                          child: Text(
                                            n.title,
                                            style: TextStyle(fontSize: 14, fontWeight: n.read ? FontWeight.normal : FontWeight.w600),
                                          ),
                                        ),
                                      ],
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const SizedBox(height: 4),
                                        Text(n.body, style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground)),
                                        const SizedBox(height: 4),
                                        Text(
                                          n.createdAt != null ? _formatTime(n.createdAt!) : '',
                                          style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
          ),
        ],
      ),
    );
  }

  (IconData, Color) _typeStyle(String type) {
    return switch (type) {
      'success' => (Icons.check_circle, Colors.green),
      'warning' => (Icons.warning_amber, Colors.amber),
      'error' => (Icons.error_outline, Colors.red),
      _ => (Icons.info_outline, Colors.blue),
    };
  }

  String _formatTime(String iso) {
    try {
      final dt = DateTime.parse(iso);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
      if (diff.inHours < 24) return '${diff.inHours} h ago';
      if (diff.inDays < 7) return '${diff.inDays} d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }
}

/// Thin live/offline bar mirroring the web app's connection indicator.
class _ConnectionPill extends StatelessWidget {
  const _ConnectionPill({required this.state});

  final WSConnectionState state;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (state) {
      WSConnectionState.connected => (Colors.green, 'Live'),
      WSConnectionState.connecting => (Colors.amber, 'Connecting…'),
      WSConnectionState.disconnected => (AppColors.mutedForeground, 'Offline'),
    };
    return Container(
      width: double.infinity,
      color: color.withValues(alpha: 0.08),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }
}