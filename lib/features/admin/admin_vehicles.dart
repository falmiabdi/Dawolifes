import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/vehicle.dart';
import '../../data/repositories/admin_repository.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';

/// Admin vehicle moderation mirroring app/admin/vehicles/page.tsx.
class AdminVehiclesScreen extends StatefulWidget {
  const AdminVehiclesScreen({super.key});

  @override
  State<AdminVehiclesScreen> createState() => _AdminVehiclesScreenState();
}

class _AdminVehiclesScreenState extends State<AdminVehiclesScreen> {
  String _status = 'all';
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
      final items = await context.read<AdminRepository>().fetchVehicles(status: _status);
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

  @override
  Widget build(BuildContext context) {
    final tv = context.read<LanguageProvider>().tv;
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicles')),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              children: ['all', 'Pending', 'Approved', 'Rejected'].map((s) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(tv(s)),
                    selected: _status == s,
                    onSelected: (_) {
                      setState(() => _status = s);
                      _load();
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingState()
                : _error != null
                    ? ErrorState(message: _error!, onRetry: _load)
                    : _items.isEmpty
                        ? const EmptyState(message: 'No vehicles found.')
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _items.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 8),
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
                                  child: ListTile(
                                    onTap: () async {
                                      await Navigator.of(context).push(
                                        MaterialPageRoute(builder: (_) => AdminVehicleDetailScreen(vehicle: v)),
                                      );
                                      _load();
                                    },
                                    leading: PortalThumb(url: v.images.isNotEmpty ? v.images.first : null, icon: Icons.directions_car_outlined),
                                    title: Text(v.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                    subtitle: Text(
                                      '${v.make ?? ''} ${v.model ?? ''} · ${v.manufacturingYear ?? ''} · ${v.color ?? ''}',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    trailing: StatusChip(status: v.status ?? 'Pending'),
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
}

/// Detail review panel for a single vehicle.
class AdminVehicleDetailScreen extends StatefulWidget {
  const AdminVehicleDetailScreen({super.key, required this.vehicle});

  final Vehicle vehicle;

  @override
  State<AdminVehicleDetailScreen> createState() => _AdminVehicleDetailScreenState();
}

class _AdminVehicleDetailScreenState extends State<AdminVehicleDetailScreen> {
  late Vehicle _v;
  bool _busy = false;
  final _reason = TextEditingController();

  @override
  void initState() {
    super.initState();
    _v = widget.vehicle;
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final v = _v;
    final l10n = context.read<LanguageProvider>();
    final t = l10n.t;
    final tv = l10n.tv;
    return Scaffold(
      appBar: AppBar(title: const Text('Review Vehicle')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PortalThumb(url: v.images.isNotEmpty ? v.images.first : null, width: double.infinity, height: 180, icon: Icons.directions_car_outlined),
          const SizedBox(height: 12),
          Text(v.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            'By: ${v.agent?.displayName ?? v.agentName ?? 'Agent'} · ${v.agent?.phone ?? ''}',
            style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              StatusChip(status: v.status ?? 'Pending'),
              const SizedBox(width: 8),
              Text('${Formatters.formatPrice(v.price ?? 0)} ETB · ${v.priceType ?? ''}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
          if (v.rejectionReason != null && v.rejectionReason!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.destructive.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.destructive.withValues(alpha: 0.4)),
              ),
              child: Text('Rejection reason: ${v.rejectionReason}',
                  style: const TextStyle(color: AppColors.destructive, fontSize: 13)),
            ),
          ],
          const SizedBox(height: 16),
          const SectionHeader(title: 'Specifications'),
          InfoRow(label: t('category'), value: tv(v.vehicleCategory ?? '-')),
          InfoRow(label: t('make_model'), value: '${v.make ?? ''} ${v.model ?? ''}'),
          InfoRow(label: t('year'), value: '${v.manufacturingYear ?? '-'}'),
          InfoRow(label: t('color'), value: tv(v.color ?? '-')),
          InfoRow(label: 'Origin', value: tv(v.countryOfOrigin ?? '-')),
          InfoRow(label: t('condition'), value: tv(v.condition ?? '-')),
          InfoRow(label: t('fuel'), value: tv(v.fuelType ?? 'N/A')),
          InfoRow(label: t('transmission'), value: tv(v.transmission ?? 'N/A')),
          InfoRow(label: t('mileage'), value: v.mileage != null ? '${Formatters.formatPrice(v.mileage!)} km' : 'N/A'),
          SectionHeader(title: t('location')),
          InfoRow(label: t('location'), value: v.location),
          if ((v.description ?? '').isNotEmpty) ...[
            SectionHeader(title: t('description')),
            Text(v.description!, style: const TextStyle(fontSize: 13, height: 1.4)),
          ],
          const SizedBox(height: 20),
          if (v.status == 'Pending') ...[
            TextField(
              controller: _reason,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Reason (required to reject)'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: _busy ? null : () => _review(true),
                    child: const Text('Approve'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _busy ? null : () => _review(false),
                    style: FilledButton.styleFrom(backgroundColor: AppColors.destructive),
                    child: const Text('Reject'),
                  ),
                ),
              ],
            ),
          ],
          if (v.status == 'Approved') ...[
            OutlinedButton.icon(
              onPressed: _busy ? null : _switchContact,
              icon: const Icon(Icons.phone_outlined, size: 16),
              label: const Text('Switch Contact Phone'),
            ),
            const SizedBox(height: 8),
          ],
          OutlinedButton.icon(
            onPressed: _busy ? null : _delete,
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.destructive),
            icon: const Icon(Icons.delete_outline, size: 16),
            label: const Text('Delete Vehicle'),
          ),
        ],
      ),
    );
  }

  Future<void> _review(bool approve) async {
    if (!approve && _reason.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Rejection reason is required')));
      return;
    }
    setState(() => _busy = true);
    try {
      final repo = context.read<AdminRepository>();
      if (approve) {
        await repo.approveVehicle(_v.id);
      } else {
        await repo.rejectVehicle(_v.id, reason: _reason.text.trim());
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(approve ? 'Vehicle approved' : 'Vehicle rejected')));
      Navigator.of(context).pop(true);
    } on Exception catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete vehicle?'),
        content: Text('Permanently delete "${_v.title}"? This cannot be undone.'),
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
    final repo = context.read<AdminRepository>();
    setState(() => _busy = true);
    try {
      await repo.deleteVehicle(_v.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vehicle deleted')));
      Navigator.of(context).pop(true);
    } on Exception catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _switchContact() async {
    setState(() => _busy = true);
    try {
      final phone = await context.read<AdminRepository>().switchVehicleContact(_v.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Contact phone updated: $phone')));
    } on Exception catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}
