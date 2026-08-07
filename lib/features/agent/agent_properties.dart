import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/property.dart';
import '../../data/repositories/agent_repository.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';
import 'agent_post_property.dart';

/// My properties mirroring app/agent/properties/page.tsx.
class AgentPropertiesScreen extends StatefulWidget {
  const AgentPropertiesScreen({super.key});

  @override
  State<AgentPropertiesScreen> createState() => _AgentPropertiesScreenState();
}

class _AgentPropertiesScreenState extends State<AgentPropertiesScreen> {
  bool _loading = true;
  String? _error;
  List<Property> _items = [];

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
      final items = await context.read<AgentRepository>().fetchMyProperties();
      if (!mounted) return;
      setState(() {
        _items = items;
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

  Future<void> _delete(Property p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete listing?'),
        content: Text('Permanently delete "${p.title}"? This cannot be undone.'),
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
    if (ok != true) return;
    if (!mounted) return;
    final repo = context.read<AgentRepository>();
    try {
      await repo.deleteProperty(p.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property deleted')));
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
      appBar: AppBar(title: const Text('My Properties')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPostPropertyScreen()));
          _load();
        },
        icon: const Icon(Icons.add),
        label: const Text('Post'),
      ),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyState(message: 'No properties listed yet.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final p = _items[i];
                          return Card(
                            margin: EdgeInsets.zero,
                            elevation: 0,
                            color: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: const BorderSide(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Stack(
                                  children: [
                                    PortalThumb(url: p.images.isNotEmpty ? p.images.first : null, width: double.infinity, height: 140, icon: Icons.house_outlined),
                                    Positioned(left: 8, top: 8, child: StatusChip(status: p.status ?? 'Pending')),
                                    Positioned(
                                      right: 8,
                                      top: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(10)),
                                        child: Text(tv(p.listingType),
                                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                                      ),
                                    ),
                                  ],
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(Icons.place_outlined, size: 13, color: AppColors.mutedForeground),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text('${p.city ?? ''}, ${p.region ?? ''}',
                                                style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(p.title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text('${Formatters.formatPrice(p.price)} ETB · ${tv(p.priceType ?? '')}',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.orange.shade700)),
                                      if (p.status == 'Rejected' && (p.rejectionReason ?? '').isNotEmpty) ...[
                                        const SizedBox(height: 8),
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: AppColors.destructive.withValues(alpha: 0.08),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text('Rejection reason: ${p.rejectionReason}',
                                              style: const TextStyle(fontSize: 12, color: AppColors.destructive)),
                                        ),
                                      ],
                                      const SizedBox(height: 10),
                                      Row(
                                        children: [
                                          if (p.status == 'Rejected')
                                            OutlinedButton.icon(
                                              onPressed: () async {
                                                await Navigator.of(context).push(MaterialPageRoute(
                                                  builder: (_) => AgentPostPropertyScreen(edit: p),
                                                ));
                                                _load();
                                              },
                                              icon: const Icon(Icons.edit_outlined, size: 15),
                                              label: const Text('Edit'),
                                            ),
                                          const SizedBox(width: 8),
                                          OutlinedButton.icon(
                                            onPressed: () => _delete(p),
                                            style: OutlinedButton.styleFrom(foregroundColor: AppColors.destructive),
                                            icon: const Icon(Icons.delete_outline, size: 15),
                                            label: const Text('Delete'),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
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
