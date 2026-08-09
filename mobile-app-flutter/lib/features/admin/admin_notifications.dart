import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/notification.dart';
import '../../data/repositories/admin_repository.dart';
import '../portal/widgets.dart';

/// Admin notification management mirroring the web admin notifications page:
/// list all notifications, send one to every user, and delete any.
class AdminNotificationsScreen extends StatefulWidget {
  const AdminNotificationsScreen({super.key});

  @override
  State<AdminNotificationsScreen> createState() => _AdminNotificationsScreenState();
}

class _AdminNotificationsScreenState extends State<AdminNotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _loading = true;
  String? _error;

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
      final items = await context.read<AdminRepository>().fetchAdminNotifications();
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

  Future<void> _sendToAll() async {
    final title = TextEditingController();
    final body = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final saving = ValueNotifier<bool>(false);

    final sent = await showDialog<int>(
      context: context,
      builder: (dialogContext) => ValueListenableBuilder<bool>(
        valueListenable: saving,
        builder: (context, busy, _) => AlertDialog(
          title: const Text('Send to All Users'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: title,
                  autofocus: true,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Title is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: body,
                  maxLines: 4,
                  minLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Message',
                    alignLabelWithHint: true,
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Message is required' : null,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: busy ? null : () => Navigator.of(dialogContext).pop(null),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: busy
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      saving.value = true;
                      try {
                        final count = await context.read<AdminRepository>().sendNotificationToAll(
                              title: title.text.trim(),
                              body: body.text.trim(),
                            );
                        if (dialogContext.mounted) Navigator.of(dialogContext).pop(count);
                      } catch (e) {
                        if (dialogContext.mounted) {
                          ScaffoldMessenger.of(dialogContext).showSnackBar(
                            SnackBar(content: Text('Failed to send notification: $e')),
                          );
                          saving.value = false;
                        }
                      }
                    },
              child: busy
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Send'),
            ),
          ],
        ),
      ),
    );

    if (sent != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Notification sent to $sent user${sent == 1 ? '' : 's'}')),
      );
      _load();
    }
  }

  Future<void> _delete(AppNotification notification) async {
    final repo = context.read<AdminRepository>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete Notification'),
        content: Text('Delete "${notification.title}" for this user? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.destructive),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await repo.deleteAdminNotification(notification.id);
      if (!mounted) return;
      setState(() {
        _notifications = _notifications.where((n) => n.id != notification.id).toList();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete notification: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Broadcast'),
        actions: [
          IconButton(
            tooltip: 'Send to all users',
            icon: const Icon(Icons.send_outlined),
            onPressed: _sendToAll,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _sendToAll,
        icon: const Icon(Icons.campaign_outlined),
        label: const Text('Send to All'),
      ),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _notifications.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: const [
                            SizedBox(height: 120),
                            EmptyState(
                              icon: Icons.notifications_none,
                              message: 'No notifications yet.',
                            ),
                          ],
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          itemCount: _notifications.length,
                          separatorBuilder: (_, _) => const Divider(height: 1),
                          itemBuilder: (context, i) {
                            final n = _notifications[i];
                            final (icon, color) = _typeStyle(n.type);
                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                              leading: CircleAvatar(
                                backgroundColor: color.withValues(alpha: 0.12),
                                child: Icon(icon, color: color, size: 20),
                              ),
                              title: Text(
                                n.title,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(n.body, style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground)),
                                  const SizedBox(height: 4),
                                  Text(
                                    n.createdAt != null ? _formatTime(n.createdAt!) : '',
                                    style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground),
                                  ),
                                ],
                              ),
                              trailing: IconButton(
                                tooltip: 'Delete',
                                icon: const Icon(Icons.delete_outline, color: AppColors.destructive),
                                onPressed: () => _delete(n),
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
