import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/admin.dart';
import '../../data/repositories/admin_repository.dart';
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

  Future<void> _act(AdminUser user, String action) async {
    try {
      await context.read<AdminRepository>().userAction(user.id, action);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(action == 'delete' ? 'User deleted' : 'User ${action}d successfully')),
      );
      _load();
    } on Exception catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _users.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final u = _users[i];
                      final isRoot = u.isRootAdmin || u.email.toLowerCase() == 'felmitesfaye@gmail.com';
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                    child: Text(
                                      u.username.isNotEmpty ? u.username[0].toUpperCase() : '?',
                                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Flexible(
                                              child: Text(
                                                u.username,
                                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            if (isRoot) ...[
                                              const SizedBox(width: 6),
                                              const Icon(Icons.shield_outlined, size: 14, color: AppColors.primary),
                                            ],
                                          ],
                                        ),
                                        Text(u.email, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  StatusChip(status: u.status),
                                  const SizedBox(width: 8),
                                  Text('Role: ${u.role}', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                                ],
                              ),
                              if (!isRoot) ...[
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    if (u.status == 'Suspended')
                                      TextButton.icon(
                                        onPressed: () => _act(u, 'activate'),
                                        icon: const Icon(Icons.rotate_left, size: 16),
                                        label: const Text('Activate'),
                                      )
                                    else
                                      TextButton.icon(
                                        onPressed: () => _act(u, 'suspend'),
                                        style: TextButton.styleFrom(foregroundColor: AppColors.warning),
                                        icon: const Icon(Icons.block, size: 16),
                                        label: const Text('Suspend'),
                                      ),
                                    TextButton.icon(
                                      onPressed: () => _confirmDelete(u),
                                      style: TextButton.styleFrom(foregroundColor: AppColors.destructive),
                                      icon: const Icon(Icons.delete_outline, size: 16),
                                      label: const Text('Delete'),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Future<void> _confirmDelete(AdminUser user) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete user?'),
        content: Text('Permanently delete "${user.username}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.destructive),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await _act(user, 'delete');
    }
  }
}
