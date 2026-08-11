import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/admin.dart';
import '../../data/repositories/admin_repository.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';

/// Admin user management mirroring app/admin/users/page.tsx.
class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  bool _loading = true;
  String? _error;
  List<AdminUser> _users = [];

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
      final users = await context.read<AdminRepository>().fetchUsers();
      if (!mounted) return;
      setState(() {
        _users = users;
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

  Future<void> _handleAction(String action, String userId, {String? confirmMessage}) async {
    final repo = context.read<AdminRepository>();
    if (confirmMessage != null) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Confirm'),
          content: Text(confirmMessage),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
            FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: FilledButton.styleFrom(backgroundColor: AppColors.destructive),
              child: const Text('Confirm'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    try {
      await repo.userAction(userId, action);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(action == 'suspend' ? 'User suspended' : 'User activated')),
      );
      _load();
    } on Exception catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.read<LanguageProvider>();
    final tv = l10n.tv;

    return Scaffold(
      appBar: AppBar(title: const Text('User Management')),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _users.isEmpty
                  ? const EmptyState(message: 'No users found.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _users.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final u = _users[i];
                          final isRoot = u.isRootAdmin;
                          final isSuspended = u.status == 'Suspended';
                          return Card(
                            margin: EdgeInsets.zero,
                            elevation: 0,
                            color: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: AppColors.border),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 20,
                                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                    child: Text(
                                      u.username.isNotEmpty ? u.username[0].toUpperCase() : '?',
                                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                u.username,
                                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: u.role == 'admin'
                                                    ? AppColors.foreground.withValues(alpha: 0.12)
                                                    : AppColors.primary.withValues(alpha: 0.12),
                                                borderRadius: BorderRadius.circular(999),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(
                                                    u.role == 'admin' ? Icons.shield_outlined : Icons.person_outline,
                                                    size: 12,
                                                    color: u.role == 'admin' ? AppColors.foreground : AppColors.primary,
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    tv(u.role),
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.w600,
                                                      color: u.role == 'admin' ? AppColors.foreground : AppColors.primary,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(u.email, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            StatusChip(status: u.status),
                                            const SizedBox(width: 8),
                                            Text(
                                              u.createdAt != null
                                                  ? _formatDate(u.createdAt!)
                                                  : '-',
                                              style: const TextStyle(fontSize: 10, color: AppColors.mutedForeground),
                                            ),
                                            if (isRoot) ...[
                                              const SizedBox(width: 8),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                decoration: BoxDecoration(
                                                  color: AppColors.muted,
                                                  borderRadius: BorderRadius.circular(999),
                                                ),
                                                child: const Text(
                                                  'ROOT OWNER',
                                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.mutedForeground),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (!isRoot)
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (!isSuspended)
                                          IconButton(
                                            onPressed: () => _handleAction(
                                              'suspend',
                                              u.id,
                                              confirmMessage: 'Suspend ${u.username}? This will disable their account.',
                                            ),
                                            icon: const Icon(Icons.block_outlined, color: AppColors.warning, size: 20),
                                            tooltip: 'Suspend User',
                                          )
                                        else
                                          IconButton(
                                            onPressed: () => _handleAction(
                                              'activate',
                                              u.id,
                                            ),
                                            icon: const Icon(Icons.check_circle_outlined, color: AppColors.success, size: 20),
                                            tooltip: 'Activate User',
                                          ),
                                        IconButton(
                                          onPressed: () => _handleAction(
                                            'delete',
                                            u.id,
                                            confirmMessage: 'Permanently delete ${u.username}? This cannot be undone.',
                                          ),
                                          icon: const Icon(Icons.delete_outline, color: AppColors.destructive, size: 20),
                                          tooltip: 'Delete User',
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return iso;
    }
  }
}