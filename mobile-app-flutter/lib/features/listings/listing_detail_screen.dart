import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/listing_item.dart';
import '../../data/models/property.dart';
import '../../data/models/vehicle.dart';
import '../../data/repositories/listing_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/saved_provider.dart';
import '../auth/login_screen.dart';
import '../messages/chat_screen.dart';

/// Listing detail screen mirroring app/listings/view/page.tsx. Fetches the
/// full record (all images, real description, video, documents) from the
/// backend by id and shows a loader until the data arrives.
class ListingDetailScreen extends StatefulWidget {
  const ListingDetailScreen({super.key, required this.item});

  final ListingItem item;

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  int _page = 0;
  late bool _saved = false;
  bool _loadingSaved = true;

  /// Full record fetched from the backend.
  dynamic _detail;
  bool _loadingDetail = true;
  String? _detailError;

  @override
  void initState() {
    super.initState();
    _loadSavedStatus();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    try {
      final repo = context.read<ListingRepository>();
      final dynamic full = widget.item.isVehicle
          ? await repo.fetchVehicleDetail(widget.item.id)
          : await repo.fetchPropertyDetail(widget.item.id);
      if (!mounted) return;
      setState(() {
        _detail = full;
        _loadingDetail = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _detailError = '$e';
        _loadingDetail = false;
      });
    }
  }

  List<String> get _allImages {
    if (_detail != null) {
      final imgs = _detail is Property ? (_detail as Property).images : (_detail as Vehicle).images;
      if (imgs.isNotEmpty) return imgs;
    }
    return [widget.item.image];
  }

  String get _description {
    if (_detail != null) {
      final d = _detail is Property ? (_detail as Property).description : (_detail as Vehicle).description;
      if (d != null && d.isNotEmpty) return d;
    }
    return 'Modern ${widget.item.type ?? 'listing'} with great location and accessibility.';
  }

  Future<void> _loadSavedStatus() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      setState(() => _loadingSaved = false);
      return;
    }
    try {
      final repo = context.read<ListingRepository>();
      final saved = await repo.isSaved(
        itemType: widget.item.isVehicle ? 'vehicle' : 'property',
        itemId: widget.item.id,
      );
      if (mounted) {
        setState(() {
          _saved = saved;
          _loadingSaved = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingSaved = false);
    }
  }

  Future<void> _toggleSave() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      _pushLogin();
      return;
    }
    final saved = context.read<SavedProvider>();
    setState(() => _saved = !_saved);
    try {
      await saved.toggle(widget.item);
    } catch (_) {
      if (mounted) setState(() => _saved = !_saved);
    }
  }

  void _pushLogin() {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _openMessage() {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      _pushLogin();
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          propertyId: widget.item.id,
          propertyTitle: widget.item.title,
          recipientId: widget.item.agent?.id ?? '',
          recipientName: widget.item.agent?.displayName ?? 'Agent',
        ),
      ),
    );
  }

  String get _phone {
    final p = widget.item.displayPhone ?? widget.item.agent?.phone;
    return (p ?? '').trim();
  }

  Future<void> _call() async {
    final phone = _phone.replaceAll(RegExp(r'[^0-9+]'), '');
    if (phone.isEmpty) return;
    final ok = await launchUrl(Uri.parse('tel:$phone'));
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to place call')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final tv = context.read<LanguageProvider>().tv;

    return Scaffold(
      body: _loadingDetail
          ? _LoadingView(images: _allImages)
          : _detailError != null && _detail == null
              ? _ErrorView(message: _detailError!, onRetry: _loadDetail, images: _allImages)
              : CustomScrollView(
              slivers: [
                SliverAppBar(
                  expandedHeight: 260,
                  pinned: true,
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  actions: [
                    IconButton(
                      icon: _loadingSaved
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Icon(
                              _saved ? Icons.bookmark : Icons.bookmark_border,
                              color: _saved ? Colors.amber : Colors.white,
                            ),
                      onPressed: _toggleSave,
                    ),
                  ],
                  flexibleSpace: FlexibleSpaceBar(
                    background: _Gallery(
                      images: _allImages,
                      currentPage: _page,
                      onPageChanged: (p) => setState(() => _page = p),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Badge(label: tv(item.listingType), isRent: item.isRent),
                        const SizedBox(height: 10),
                        Text(
                          item.title,
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.foreground),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 16, color: AppColors.mutedForeground),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                item.location?.isNotEmpty == true ? item.location! : tv('Ethiopia'),
                                style: const TextStyle(color: AppColors.mutedForeground, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${Formatters.formatPrice(item.price)} ETB${item.isRent ? ' / month' : ''}',
                          style: const TextStyle(color: AppColors.primary, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        _SpecsRow(item: item),
                        const SizedBox(height: 24),
                        if (item.features.isNotEmpty) _FeaturesList(features: item.features),
                        const SizedBox(height: 24),
                        _SectionTitle('About this listing'),
                        const SizedBox(height: 8),
                        Text(
                          _description,
                          style: const TextStyle(color: AppColors.foreground, fontSize: 14, height: 1.5),
                        ),
                        const SizedBox(height: 32),
                        _ContactCard(item: item, onCall: _call, onMessage: _openMessage),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Share coming soon')),
                            );
                          },
                          icon: const Icon(Icons.share_outlined, size: 18),
                          label: const Text('Share'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

/// Skeleton/spinner shown while the full listing is fetched from the backend.
class _LoadingView extends StatelessWidget {
  const _LoadingView({required this.images});

  final List<String> images;

  @override
  Widget build(BuildContext context) {
    return _PlaceholderShell(
      images: images,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 44,
            height: 44,
            child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary),
          ),
          const SizedBox(height: 16),
          Text(
            'Loading listing...',
            style: const TextStyle(color: AppColors.mutedForeground, fontSize: 14, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

/// Error state shown if the detail fetch fails; allows retry.
class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry, required this.images});

  final String message;
  final Future<void> Function() onRetry;
  final List<String> images;

  @override
  Widget build(BuildContext context) {
    return _PlaceholderShell(
      images: images,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.cloud_off, size: 44, color: AppColors.mutedForeground),
          const SizedBox(height: 12),
          Text('Could not load this listing.', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

/// Shared shell for the loading/error placeholder views: shows the first
/// image in the app bar area (so the screen isn't a blank flash) and centers
/// [child] below.
class _PlaceholderShell extends StatelessWidget {
  const _PlaceholderShell({required this.images, required this.child});

  final List<String> images;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 260,
          pinned: true,
          backgroundColor: AppColors.primary,
          automaticallyImplyLeading: true,
          flexibleSpace: FlexibleSpaceBar(
            background: ColoredBox(
              color: AppColors.muted,
              child: images.isNotEmpty
                  ? CachedNetworkImage(imageUrl: Formatters.imageUrl(images.first), fit: BoxFit.cover)
                  : const SizedBox.shrink(),
            ),
          ),
        ),
        SliverFillRemaining(
          hasScrollBody: false,
          child: Container(
            color: AppColors.background,
            padding: const EdgeInsets.all(24),
            child: child,
          ),
        ),
      ],
    );
  }
}

class _Gallery extends StatelessWidget {
  const _Gallery({
    required this.images,
    required this.currentPage,
    required this.onPageChanged,
  });

  final List<String> images;
  final int currentPage;
  final ValueChanged<int> onPageChanged;

  @override
  Widget build(BuildContext context) {
    final urls = images.map(Formatters.imageUrl).where((u) => u.isNotEmpty).toList();

    if (urls.isEmpty) {
      return const ColoredBox(color: AppColors.muted);
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          onPageChanged: onPageChanged,
          itemCount: urls.length,
          itemBuilder: (context, index) => CachedNetworkImage(
            imageUrl: urls[index],
            fit: BoxFit.cover,
            placeholder: (_, _) => const ColoredBox(color: AppColors.muted),
            errorWidget: (_, _, _) => const ColoredBox(color: AppColors.muted),
          ),
        ),
        if (urls.length > 1)
          Positioned(
            bottom: 12,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${currentPage + 1} / ${urls.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.isRent});

  final String label;
  final bool isRent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isRent ? AppColors.accent : AppColors.primary,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _SpecsRow extends StatelessWidget {
  const _SpecsRow({required this.item});

  final ListingItem item;

  @override
  Widget build(BuildContext context) {
    final specs = <Widget>[];
    void add(IconData icon, String label) {
      specs.add(Expanded(
        child: _SpecCard(icon: icon, label: label),
      ));
    }

    if (item.beds != null && item.beds! > 0) add(Icons.bed_outlined, '${item.beds} Beds');
    if (item.baths != null && item.baths! > 0) add(Icons.bathtub_outlined, '${item.baths} Baths');
    if (item.area != null && item.area! > 0) add(Icons.straighten, '${_num(item.area!)} m²');
    if (!item.isVehicle && item.floorNumber != null && item.floorNumber!.trim().isNotEmpty) {
      add(Icons.apartment_outlined, 'Floor ${item.floorNumber!.trim()}');
    }
    if (!item.isVehicle && item.condition != null && item.condition!.trim().isNotEmpty) {
      add(Icons.check_circle_outline, item.condition!.trim());
    }
    if (item.year != null) add(Icons.calendar_today_outlined, '${item.year}');
    if (item.mileage != null && item.mileage! > 0) add(Icons.speed, '${Formatters.formatPrice(item.mileage!)} km');

    if (specs.isEmpty) return const SizedBox.shrink();

    return Row(
      children: [for (int i = 0; i < specs.length; i++) ...[
        specs[i],
        if (i < specs.length - 1) const SizedBox(width: 8),
      ]],
    );
  }

  String _num(num value) => value == value.roundToDouble() ? '${value.round()}' : '$value';
}

class _SpecCard extends StatelessWidget {
  const _SpecCard({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.foreground, size: 20),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.foreground),
          ),
        ],
      ),
    );
  }
}

class _FeaturesList extends StatelessWidget {
  const _FeaturesList({required this.features});

  final List<String> features;

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(t('features')),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final feature in features.take(12))
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.muted,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  feature,
                  style: const TextStyle(fontSize: 12, color: AppColors.foreground),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.foreground),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.item, required this.onCall, required this.onMessage});

  final ListingItem item;
  final VoidCallback onCall;
  final VoidCallback onMessage;

  @override
  Widget build(BuildContext context) {
    final agent = item.agent;
    final tv = context.read<LanguageProvider>().tv;
    final phone = (item.displayPhone ?? agent?.phone ?? '').trim();
    final avatar = (agent?.avatar ?? '').trim();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.muted),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ADVERTISED BY',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.muted,
                foregroundImage: avatar.isNotEmpty
                    ? NetworkImage(Formatters.imageUrl(avatar))
                    : null,
                child: const Icon(Icons.person_outline, color: AppColors.mutedForeground),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      agent?.displayName ?? tv('Agent'),
                      style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.foreground),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Real Estate Agent',
                      style: TextStyle(fontSize: 12, color: AppColors.mutedForeground),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (phone.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.phone_outlined, size: 16, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(phone, style: const TextStyle(color: AppColors.foreground, fontSize: 14)),
                ),
              ],
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: phone.isEmpty ? null : onCall,
                  icon: const Icon(Icons.phone, size: 18),
                  label: const Text('Call Now'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onMessage,
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: const Text('Message'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}