import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/notification.dart';
import '../../data/repositories/notification_repository.dart';
import '../portal/widgets.dart';

/// Notifications list mirroring components/notifications/notification-list.tsx.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _loading = true;
  String? _error;

  NotificationRepository get _repo => NotificationRepository(context.read<ApiClient>());

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await _repo.fetchNotifications();
      if (!mounted) return;
      setState(() {
        _notifications = items;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  Future<void> _markAllRead() async {
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
    try {
      await _repo.markRead(notification.id);
      if (!mounted) return;
      setState(() {
        final idx = _notifications.indexOf(notification);
        if (idx >= 0) _notifications[idx] = notification.copyWith(read: true);
      });
    } catch (_) {}
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
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _notifications.isEmpty
                      ? ListView(
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
                              onTap: () => _markRead(n),
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