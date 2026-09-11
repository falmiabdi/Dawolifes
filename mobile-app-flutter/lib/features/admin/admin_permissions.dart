import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/repositories/admin_repository.dart';

/// Admin listing-permission moderation (mirror of web /admin/permissions).
class AdminPermissionsScreen extends StatefulWidget {
  const AdminPermissionsScreen({super.key});

  @override
  State<AdminPermissionsScreen> createState() => _AdminPermissionsScreenState();
}

class _AdminPermissionsScreenState extends State<AdminPermissionsScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _requests = [];
  String? _busyId;

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
      final requests = await context.read<AdminRepository>().fetchPermissionRequests();
      if (!mounted) return;
      setState(() {
        _requests = requests;
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

  Future<void> _decide(Map<String, dynamic> r, bool approve) async {
    setState(() => _busyId = r['id'] as String?);
    try {
      await context.read<AdminRepository>().decidePermission(r['id'] as String, approve);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(approve ? 'Permission approved' : 'Permission rejected')),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  Color _statusColor(String status) =>
      status == 'Pending' ? AppColors.primary : status == 'Approved' ? Colors.green : AppColors.mutedForeground;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Listing Permissions')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  ),
                )
              : _requests.isEmpty
                  ? const Center(child: Text('No permission requests'))
                  : RefreshIndicator(
                      onRefresh: () async => _load(),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _requests.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final r = _requests[i];
                          final type = r['type'] as String? ?? 'EDIT';
                          final entityType = r['entityType'] as String? ?? 'PROPERTY';
                          final status = r['status'] as String? ?? 'Pending';
                          final used = r['used'] == true;
                          final requester = (r['requester'] as Map<String, dynamic>?) ?? {};
                          final requesterName = (requester['username'] as String?) ?? 'Unknown';
                          final requesterEmail = (requester['email'] as String?) ?? '';
                          final reason = r['reason'] as String?;

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(AppColors.radius),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      type == 'EDIT' ? Icons.edit_outlined : Icons.delete_outline,
                                      size: 20,
                                      color: type == 'EDIT' ? AppColors.primary : Colors.red,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${type == 'EDIT' ? 'Edit' : 'Delete'} ${entityType == 'PROPERTY' ? 'Property' : 'Vehicle'}',
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: _statusColor(status).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(999),
                                      ),
                                      child: Text(
                                        status == 'Approved' && used ? '$status · used' : status,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: _statusColor(status),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '$requesterName · $requesterEmail',
                                  style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
                                ),
                                if (reason != null && reason.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text('“$reason”', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                                ],
                                const SizedBox(height: 10),
                                if (status == 'Pending')
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton.icon(
                                          onPressed: _busyId == r['id'] ? null : () => _decide(r, false),
                                          icon: const Icon(Icons.close, size: 18),
                                          label: const Text('Reject'),
                                          style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: FilledButton.icon(
                                          onPressed: _busyId == r['id'] ? null : () => _decide(r, true),
                                          icon: _busyId == r['id']
                                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                                              : const Icon(Icons.check, size: 18),
                                          label: const Text('Approve'),
                                        ),
                                      ),
                                    ],
                                  )
                                else
                                  Text(
                                    status == 'Approved' ? (used ? 'Granted — used' : 'Granted — not yet used') : 'Rejected',
                                    style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}