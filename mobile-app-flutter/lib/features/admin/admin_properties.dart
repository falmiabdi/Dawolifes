import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/listing_item.dart';
import '../../data/models/property.dart';
import '../../data/repositories/admin_repository.dart';
import '../../core/utils/formatters.dart';
import '../../providers/language_provider.dart';
import '../listings/listing_detail_screen.dart';
import '../portal/widgets.dart';

/// Admin property moderation mirroring app/admin/properties/page.tsx.
class AdminPropertiesScreen extends StatefulWidget {
  const AdminPropertiesScreen({super.key});

  @override
  State<AdminPropertiesScreen> createState() => _AdminPropertiesScreenState();
}

class _AdminPropertiesScreenState extends State<AdminPropertiesScreen> {
  String _status = 'all';
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
      final items = await context.read<AdminRepository>().fetchProperties(status: _status);
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
      appBar: AppBar(title: const Text('Properties')),
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
                        ? const EmptyState(message: 'No properties found.')
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _items.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 8),
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
                                  child: ListTile(
                                    onTap: () async {
                                      await Navigator.of(context).push(
                                        MaterialPageRoute(builder: (_) => AdminPropertyDetailScreen(property: p)),
                                      );
                                      _load();
                                    },
                                    leading: PortalThumb(url: p.images.isNotEmpty ? p.images.first : null),
                                    title: Text(p.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                    subtitle: Text(
                                      '${p.contactName} · ${Formatters.formatPrice(p.price)} ETB',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    trailing: StatusChip(status: p.status ?? 'Pending'),
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

/// Detail review panel for a single property.
class AdminPropertyDetailScreen extends StatefulWidget {
  const AdminPropertyDetailScreen({super.key, required this.property});

  final Property property;

  @override
  State<AdminPropertyDetailScreen> createState() => _AdminPropertyDetailScreenState();
}

class _AdminPropertyDetailScreenState extends State<AdminPropertyDetailScreen> {
  late Property _p;
  bool _busy = false;
  final _reason = TextEditingController();

  @override
  void initState() {
    super.initState();
    _p = widget.property;
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = _p;
    final l10n = context.read<LanguageProvider>();
    final t = l10n.t;
    final tv = l10n.tv;
    return Scaffold(
      appBar: AppBar(title: const Text('Review Property')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          PortalThumb(url: p.images.isNotEmpty ? p.images.first : null, width: double.infinity, height: 180, icon: Icons.house_outlined),
          const SizedBox(height: 12),
          Text(p.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(
            'By: ${p.contactName} · ${p.contactPhone}',
            style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              StatusChip(status: p.status ?? 'Pending'),
              const SizedBox(width: 8),
              Text('${Formatters.formatPrice(p.price)} ETB · ${p.priceType ?? ''}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
          if (p.rejectionReason != null && p.rejectionReason!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.destructive.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.destructive.withValues(alpha: 0.4)),
              ),
              child: Text('Rejection reason: ${p.rejectionReason}',
                  style: const TextStyle(color: AppColors.destructive, fontSize: 13)),
            ),
          ],
          const SizedBox(height: 16),
          const SectionHeader(title: 'Specifications'),
          InfoRow(label: t('type'), value: tv(p.type)),
          InfoRow(label: t('listing'), value: tv(p.listingType)),
          InfoRow(label: 'Poster', value: tv(p.posterType ?? '-')),
          InfoRow(label: 'Owner', value: tv(p.ownerType ?? '-')),
          InfoRow(label: 'Area', value: p.area != null ? '${p.area} m²' : '-'),
          InfoRow(label: t('bedrooms'), value: '${p.bedrooms ?? '-'}'),
          InfoRow(label: t('bathrooms'), value: '${p.bathrooms ?? '-'}'),
          InfoRow(label: t('condition'), value: tv(p.condition ?? '-')),
          InfoRow(label: 'Legalized', value: '${p.legalizedYear ?? '-'}'),
          SectionHeader(title: t('location')),
          InfoRow(label: t('location'), value: p.location),
          InfoRow(label: t('woreda'), value: p.woreda ?? '-'),
          InfoRow(label: 'Floor Number', value: p.floorNumber ?? '-'),
          InfoRow(label: 'House Number', value: p.houseNumber ?? '-'),
          if ((p.description ?? '').isNotEmpty) ...[
            SectionHeader(title: t('description')),
            Text(p.description!, style: const TextStyle(fontSize: 13, height: 1.4)),
          ],
          if (p.features.isNotEmpty) ...[
            SectionHeader(title: t('features')),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: p.features
                  .map((f) => Chip(
                        label: Text(tv(f), style: const TextStyle(fontSize: 11)),
                        visualDensity: VisualDensity.compact,
                      ))
                  .toList(),
            ),
          ],
          const SizedBox(height: 20),
          if (p.status == 'Pending') ...[
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
          if (p.status == 'Approved') ...[
            OutlinedButton.icon(
              onPressed: _busy ? null : _switchContact,
              icon: const Icon(Icons.swap_horiz_outlined, size: 16),
              label: const Text('Switch Contact'),
            ),
            const SizedBox(height: 8),
          ],
          OutlinedButton.icon(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ListingDetailScreen(item: ListingItem.fromProperty(p))),
            ),
            icon: const Icon(Icons.visibility_outlined, size: 16),
            label: const Text('View Public Listing'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _busy ? null : _delete,
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.destructive),
            icon: const Icon(Icons.delete_outline, size: 16),
            label: const Text('Delete Property'),
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
        await repo.approveProperty(_p.id);
      } else {
        await repo.rejectProperty(_p.id, reason: _reason.text.trim());
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(approve ? 'Property approved' : 'Property rejected')));
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
      final contact = await context.read<AdminRepository>().switchPropertyContact(_p.id);
      if (!mounted) return;
      setState(() {
        _p = _p.withContact(
          agentName: contact.agentName,
          displayPhone: contact.displayPhone,
          displayPhoto: contact.displayPhoto,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Contact switched to ${contact.displayName} · ${contact.phone}')),
      );
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
        title: const Text('Delete property?'),
        content: Text('Permanently delete "${_p.title}"? This cannot be undone.'),
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
      await repo.deleteProperty(_p.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property deleted')));
      Navigator.of(context).pop(true);
    } on Exception catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}
