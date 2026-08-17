import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/listing_item.dart';
import '../../data/models/vehicle.dart';
import '../../data/repositories/agent_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../listings/listing_detail_screen.dart';
import '../portal/widgets.dart';
import 'agent_post_vehicle.dart';

/// My vehicles mirroring app/agent/vehicles/page.tsx.
class AgentVehiclesScreen extends StatefulWidget {
  const AgentVehiclesScreen({super.key});

  @override
  State<AgentVehiclesScreen> createState() => _AgentVehiclesScreenState();
}

class _AgentVehiclesScreenState extends State<AgentVehiclesScreen> {
  bool _loading = true;
  String? _error;
  List<Vehicle> _items = [];

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
      final items = await context.read<AgentRepository>().fetchMyVehicles();
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

  Future<void> _delete(Vehicle v) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete listing?'),
        content: Text('Permanently delete "${v.title}"? This cannot be undone.'),
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
      await repo.deleteVehicle(v.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vehicle deleted')));
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
    final approved = context.watch<AuthProvider>().user?.status == 'Approved';
    return Scaffold(
      appBar: AppBar(title: const Text('My Vehicles')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: approved
            ? () async {
                await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPostVehicleScreen()));
                _load();
              }
            : () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Your account must be approved before posting.')),
                );
              },
        icon: Icon(approved ? Icons.add : Icons.lock_outline),
        label: Text(approved ? 'Post' : 'Pending Approval'),
      ),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : _items.isEmpty
                  ? const EmptyState(message: 'No vehicles listed yet.')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final v = _items[i];
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
                                    PortalThumb(url: v.images.isNotEmpty ? v.images.first : null, width: double.infinity, height: 140, icon: Icons.directions_car_outlined),
                                    Positioned(left: 8, top: 8, child: StatusChip(status: v.status ?? 'Pending')),
                                    Positioned(
                                      right: 8,
                                      top: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(10)),
                                        child: Text(tv(v.listingType),
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
                                            child: Text('${v.city ?? ''}, ${v.region ?? ''}',
                                                style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(v.title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text(
                                        v.price != null ? '${Formatters.formatPrice(v.price!)} ETB · ${tv(v.priceType ?? '')}' : (v.priceType ?? ''),
                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.orange.shade700),
                                      ),
                                      const SizedBox(height: 4),
                                      Text('${v.make ?? ''} ${v.model ?? ''} · ${v.manufacturingYear ?? ''}',
                                          style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                                      if (v.status == 'Rejected' && (v.rejectionReason ?? '').isNotEmpty) ...[
                                        const SizedBox(height: 8),
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: AppColors.destructive.withValues(alpha: 0.08),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text('Rejection reason: ${v.rejectionReason}',
                                              style: const TextStyle(fontSize: 12, color: AppColors.destructive)),
                                        ),
                                      ],
                                      const SizedBox(height: 10),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: [
                                          OutlinedButton.icon(
                                            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                                              builder: (_) => ListingDetailScreen(item: ListingItem.fromVehicle(v)),
                                            )),
                                            icon: const Icon(Icons.visibility_outlined, size: 15),
                                            label: const Text('View'),
                                          ),
                                          if (v.status == 'Rejected')
                                            OutlinedButton.icon(
                                              onPressed: () async {
                                                await Navigator.of(context).push(MaterialPageRoute(
                                                  builder: (_) => AgentPostVehicleScreen(edit: v),
                                                ));
                                                _load();
                                              },
                                              icon: const Icon(Icons.edit_outlined, size: 15),
                                              label: const Text('Edit'),
                                            ),
                                          OutlinedButton.icon(
                                            onPressed: () => _delete(v),
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
