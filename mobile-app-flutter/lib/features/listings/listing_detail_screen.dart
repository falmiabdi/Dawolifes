import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config/app_config.dart';
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
    return widget.item.contactPhone;
  }

  /// The fetched property record, when this listing is a property.
  Property? get _property =>
      _detail is Property ? _detail as Property : null;

  /// The fetched vehicle record, when this listing is a vehicle.
  Vehicle? get _vehicle => _detail is Vehicle ? _detail as Vehicle : null;

  String? get _videoUrl => _property?.videoUrl ?? _vehicle?.videoUrl;

  double? get _latitude => _property?.latitude ?? _vehicle?.latitude;

  double? get _longitude => _property?.longitude ?? _vehicle?.longitude;

  Future<void> _share() async {
    final item = widget.item;
    final video = _videoUrl;

    final webBase = AppConfig.webShareBaseUrl.replaceAll(RegExp(r'/+$'), '');
    final deepLink = item.isVehicle
        ? '$webBase/listings/vehicle?id=${item.id}'
        : '$webBase/listings/view?id=${item.id}';

    final caption = <String>[
      item.title,
      if (item.location?.isNotEmpty == true) item.location!,
      '${Formatters.formatPrice(item.price)} ETB${item.isRent ? ' / month' : ''}',
      if (_description.isNotEmpty) _description,
      '',
      'Listed on ${AppConfig.appName} — ${AppConfig.appTagline}',
      deepLink,
      AppConfig.playStoreUrl,
      if (video?.isNotEmpty == true) video!,
    ].where((e) => e.isNotEmpty).join('\n');

    // Download the first gallery image so it attaches (as a preview) on
    // WhatsApp, Telegram, Instagram etc. instead of just plain text.
    XFile? image;
    try {
      final src = _allImages.isNotEmpty ? Formatters.imageUrl(_allImages.first) : null;
      if (src != null && src.isNotEmpty) {
        final res = await http.get(Uri.parse(src)).timeout(const Duration(seconds: 20));
        if (res.statusCode == 200 && res.bodyBytes.isNotEmpty) {
          final file = File(
            '${Directory.systemTemp.path}/dawolife_share_${DateTime.now().millisecondsSinceEpoch}.jpg',
          );
          await file.writeAsBytes(res.bodyBytes, flush: true);
          image = XFile(file.path, mimeType: 'image/jpeg');
        }
      }
    } catch (_) {
      // Image attachment is best-effort; share the rich text even if it fails.
    }

    await SharePlus.instance.share(
      ShareParams(
        subject: '$item.title — ${AppConfig.appName}',
        text: caption,
        files: image == null ? null : [image],
        previewThumbnail: image,
      ),
    );
    if (!mounted) return;
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
                        _SpecsRow(item: item, detail: _detail),
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
                        if (_property != null) _PropertyInfoCard(property: _property!),
                        if (_vehicle != null) ...[
                          const SizedBox(height: 24),
                          _VehicleDetails(vehicle: _vehicle!),
                        ],
                        if (_videoUrl != null && _videoUrl!.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          _VideoTourCard(
                            videoUrl: _videoUrl!,
                            thumbnailUrl: _allImages.isNotEmpty ? _allImages.first : null,
                          ),
                        ],
                        if (_latitude != null && _longitude != null) ...[
                          const SizedBox(height: 24),
                          _LocationCard(
                            latitude: _latitude!,
                            longitude: _longitude!,
                            address: item.location?.isNotEmpty == true
                                ? item.location!
                                : '${_property?.subCity ?? ''} ${_property?.city ?? ''} ${_property?.region ?? ''}'.trim(),
                          ),
                        ],
                        const SizedBox(height: 32),
                        _ContactCard(item: item, onCall: _call, onMessage: _openMessage),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _share,
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
  const _SpecsRow({required this.item, this.detail});

  final ListingItem item;
  final dynamic detail;

  @override
  Widget build(BuildContext context) {
    final prop = detail is Property ? detail as Property : null;
    final veh = !item.isVehicle ? null : (detail is Vehicle ? detail as Vehicle : null);

    final condition = item.isVehicle
        ? (veh?.condition?.trim() ?? item.condition?.trim())
        : (prop?.condition?.trim() ?? item.condition?.trim());
    final beds = prop?.bedrooms ?? item.beds;
    final baths = prop?.bathrooms ?? item.baths;
    final area = prop?.area ?? item.area;
    final year = veh?.manufacturingYear ?? item.year;
    final mileage = veh?.mileage ?? item.mileage;

    final specs = <Widget>[];
    void add(IconData icon, String label) {
      specs.add(Expanded(
        child: _SpecCard(icon: icon, label: label),
      ));
    }

    if (beds != null && beds > 0) add(Icons.bed_outlined, '$beds Beds');
    if (baths != null && baths > 0) add(Icons.bathtub_outlined, '$baths Baths');
    if (area != null && area > 0) add(Icons.straighten, '${_num(area)} m²');
    if (!item.isVehicle && condition != null && condition.isNotEmpty) {
      add(Icons.check_circle_outline, condition);
    }
    if (year != null) add(Icons.calendar_today_outlined, '$year');
    if (mileage != null && mileage > 0) add(Icons.speed, '${Formatters.formatPrice(mileage)} km');

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

/// Card showing the property's address identifiers (parcel, block)
/// and full location details fetched from the database.
class _PropertyInfoCard extends StatelessWidget {
  const _PropertyInfoCard({required this.property});

  final Property property;

  @override
  Widget build(BuildContext context) {
    final info = <(String, String)>[
      ('Type', property.type),
      ('Status', property.listingType),
      if (property.posterType?.isNotEmpty == true) ('Listing By', property.posterType!),
      if (property.ownerType?.isNotEmpty == true) ('Owner Type', property.ownerType!),
      if (property.region?.isNotEmpty == true) ('Region', property.region!),
      if (property.city?.isNotEmpty == true) ('City', property.city!),
      if (property.subCity?.isNotEmpty == true) ('Sub-city', property.subCity!),
      if (property.woreda?.isNotEmpty == true) ('Woreda', property.woreda!),
      if (property.kebele?.isNotEmpty == true) ('Kebele', property.kebele!),
      if (property.parcel?.trim().isNotEmpty == true) ('Parcel', property.parcel!.trim()),
      if (property.block?.trim().isNotEmpty == true) ('Block', property.block!.trim()),
      if (property.area != null && property.area! > 0) ('Area', '${_num(property.area!)} m²'),
      if (property.condition?.isNotEmpty == true) ('Condition', property.condition!),
      if (property.legalizedYear != null) ('Legalized Year', '${property.legalizedYear}'),
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.home_work_outlined, size: 20, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Property Information',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.foreground),
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final (label, value) in info)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Flexible(
                    child: Text(
                      value,
                      textAlign: TextAlign.end,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.foreground),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _num(num value) => value == value.roundToDouble() ? '${value.round()}' : '$value';
}

/// Renders the full vehicle record fetched from the database, mirroring the
/// web detail page: key facts, interior/exterior/safety features, technical
/// specifications, condition, sale info and Ethiopian legal info.
class _VehicleDetails extends StatelessWidget {
  const _VehicleDetails({required this.vehicle});

  final Vehicle vehicle;

  @override
  Widget build(BuildContext context) {
    String clean(String? v) => (v ?? '').trim();
    String numVal(num? v) => v == null ? '' : _num(v);

    final facts = <(String, String)>[
      ('Make / Model', _join([clean(vehicle.make), clean(vehicle.model)], ' ')),
      ('Year', vehicle.manufacturingYear != null ? '${vehicle.manufacturingYear}' : ''),
      ('Mileage', vehicle.mileage != null ? '${numVal(vehicle.mileage)} km' : ''),
      ('Transmission', clean(vehicle.transmission)),
      ('Fuel Type', clean(vehicle.fuelType)),
      ('Seating', vehicle.seatingCapacity != null ? '${vehicle.seatingCapacity} Seats' : ''),
      ('Doors', vehicle.doors != null ? '${vehicle.doors}' : ''),
      ('Condition', clean(vehicle.condition)),
      ('Color', clean(vehicle.color)),
      ('Category', clean(vehicle.vehicleCategory)),
      ('Trim / Version', clean(vehicle.trimVersion)),
    ];

    final technical = <(String, String)>[
      ('Make', clean(vehicle.make)),
      ('Model', clean(vehicle.model)),
      ('Trim / Version', clean(vehicle.trimVersion)),
      ('Year', vehicle.manufacturingYear != null ? '${vehicle.manufacturingYear}' : ''),
      ('Color', clean(vehicle.color)),
      ('Country of Origin', clean(vehicle.countryOfOrigin)),
      ('Category', clean(vehicle.vehicleCategory)),
      ('Engine Size', vehicle.engineSize != null ? '${numVal(vehicle.engineSize)} cc' : ''),
      ('Horsepower', vehicle.horsepower != null ? '${numVal(vehicle.horsepower)} hp' : ''),
      ('Transmission', clean(vehicle.transmission)),
      ('Drivetrain', clean(vehicle.drivetrain)),
      ('Cylinders', vehicle.cylinders != null ? '${vehicle.cylinders}' : ''),
      ('Fuel Type', clean(vehicle.fuelType)),
      ('Mileage', vehicle.mileage != null ? '${numVal(vehicle.mileage)} km' : ''),
      ('Fuel Consumption', clean(vehicle.fuelConsumption)),
      ('Fuel Tank Capacity', vehicle.fuelTankCapacity != null ? '${numVal(vehicle.fuelTankCapacity)} L' : ''),
      ('Seating Capacity', vehicle.seatingCapacity != null ? '${vehicle.seatingCapacity}' : ''),
      ('Doors', vehicle.doors != null ? '${vehicle.doors}' : ''),
      ('Ground Clearance', vehicle.groundClearance != null ? '${numVal(vehicle.groundClearance)} mm' : ''),
      ('Weight', vehicle.weight != null ? '${numVal(vehicle.weight)} kg' : ''),
      ('Tire Size', clean(vehicle.tireSize)),
    ];

    final conditionRows = <(String, String)>[
      ('Condition', clean(vehicle.condition)),
      ('Accident Free', _yesNo(vehicle.accidentFree)),
      ('Imported', _yesNo(vehicle.imported)),
      ('Locally Assembled', _yesNo(vehicle.locallyAssembled)),
      if (clean(vehicle.accidentHistory).isNotEmpty) ('Accident History', clean(vehicle.accidentHistory)),
      ('Service History', _yesNo(vehicle.serviceHistoryAvailable)),
      if (vehicle.ownershipCount != null) ('Ownership Count', '${vehicle.ownershipCount}'),
    ];

    final sale = <(String, String)>[
      if (_isSale(vehicle) && vehicle.sellingPrice != null) ('Selling Price', '${Formatters.formatPrice(vehicle.sellingPrice!)} ETB'),
      ('Negotiable', _yesNo(vehicle.negotiable)),
      ('Financing Available', _yesNo(vehicle.financingAvailable)),
      ('Exchange Accepted', _yesNo(vehicle.exchangeAccepted)),
      ('Bank Loan Accepted', _yesNo(vehicle.bankLoanAccepted)),
      if (vehicle.isRent) ...[
        if (vehicle.dailyRate != null) ('Daily Rate', '${Formatters.formatPrice(vehicle.dailyRate!)} ETB'),
        if (vehicle.weeklyRate != null) ('Weekly Rate', '${Formatters.formatPrice(vehicle.weeklyRate!)} ETB'),
        if (vehicle.monthlyRate != null) ('Monthly Rate', '${Formatters.formatPrice(vehicle.monthlyRate!)} ETB'),
        if (vehicle.securityDeposit != null) ('Security Deposit', '${Formatters.formatPrice(vehicle.securityDeposit!)} ETB'),
        if (vehicle.driverIncluded != null) ('Driver Included', _yesNo(vehicle.driverIncluded)),
        if (vehicle.selfDrive != null) ('Self Drive', _yesNo(vehicle.selfDrive)),
        if (clean(vehicle.fuelPolicy).isNotEmpty) ('Fuel Policy', clean(vehicle.fuelPolicy)),
        if (vehicle.insuranceIncluded != null) ('Insurance Included', _yesNo(vehicle.insuranceIncluded)),
      ],
    ];

    final legal = <(String, String)>[
      ('Plate Number', clean(vehicle.plateNumber)),
      ('Plate Type', clean(vehicle.plateType)),
      ('Region Registration', clean(vehicle.regionRegistration)),
      ('Insurance Valid', _yesNo(vehicle.insuranceValid)),
      ('Ownership Certificate', _yesNo(vehicle.ownershipCertificate)),
      ('Road Fund Paid', _yesNo(vehicle.roadFundPaid)),
      ('Inspection Certificate', _yesNo(vehicle.inspectionCertificate)),
      ('Customs Clearance', _yesNo(vehicle.customsClearance)),
      ('Duty Paid', _yesNo(vehicle.dutyPaid)),
    ];

    final location = <(String, String)>[
      if (clean(vehicle.region).isNotEmpty) ('Region', clean(vehicle.region)),
      if (clean(vehicle.city).isNotEmpty) ('City', clean(vehicle.city)),
      if (clean(vehicle.subCity).isNotEmpty) ('Sub-city', clean(vehicle.subCity)),
      if (clean(vehicle.woreda).isNotEmpty) ('Woreda', clean(vehicle.woreda)),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _DetailCard(
          title: 'Vehicle Information',
          icon: Icons.directions_car_filled_outlined,
          rows: _filtered(facts),
        ),
        if (vehicle.interiorFeatures.isNotEmpty) ...[
          const SizedBox(height: 16),
          _DetailChips(title: 'Interior Features', values: vehicle.interiorFeatures),
        ],
        if (vehicle.exteriorFeatures.isNotEmpty) ...[
          const SizedBox(height: 16),
          _DetailChips(title: 'Exterior Features', values: vehicle.exteriorFeatures),
        ],
        if (vehicle.safetyFeatures.isNotEmpty) ...[
          const SizedBox(height: 16),
          _DetailChips(title: 'Safety Features', values: vehicle.safetyFeatures),
        ],
        const SizedBox(height: 16),
        _DetailCard(title: 'Technical Specifications', icon: Icons.tune, rows: _filtered(technical)),
        if (_filtered(conditionRows).isNotEmpty) ...[
          const SizedBox(height: 16),
          _DetailCard(title: 'Vehicle Condition', icon: Icons.verified_outlined, rows: _filtered(conditionRows)),
        ],
        if (_filtered(sale).isNotEmpty) ...[
          const SizedBox(height: 16),
          _DetailCard(title: 'Sale Information', icon: Icons.payments_outlined, rows: _filtered(sale)),
        ],
        if (_filtered(legal).isNotEmpty) ...[
          const SizedBox(height: 16),
          _DetailCard(title: 'Ethiopian Legal Information', icon: Icons.gavel_outlined, rows: _filtered(legal)),
        ],
        if (_filtered(location).isNotEmpty) ...[
          const SizedBox(height: 16),
          _DetailCard(title: 'Location', icon: Icons.map_outlined, rows: _filtered(location)),
        ],
      ],
    );
  }

  bool _isSale(Vehicle v) {
    final t = v.listingType.toLowerCase();
    return t.contains('sale') || t.contains('both') || v.sellingPrice != null;
  }

  String _join(List<String> parts, String sep) =>
      parts.where((e) => e.isNotEmpty).join(sep);

  String _yesNo(bool? b) =>
      b == null ? '' : (b ? 'Yes' : 'No');

  String _num(num value) => value == value.roundToDouble() ? '${value.round()}' : '$value';

  List<(String, String)> _filtered(List<(String, String)> rows) =>
      rows.where((r) => r.$2.isNotEmpty).toList();
}

/// A titled card that prints a list of label/value rows (values that are
/// empty are dropped by the caller).
class _DetailCard extends StatelessWidget {
  const _DetailCard({
    required this.title,
    required this.icon,
    required this.rows,
  });

  final String title;
  final IconData icon;
  final List<(String, String)> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.foreground),
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (final (label, value) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Flexible(
                    child: Text(
                      value,
                      textAlign: TextAlign.end,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.foreground),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// A titled wrap of pill chips (used for interior / exterior / safety lists).
class _DetailChips extends StatelessWidget {
  const _DetailChips({required this.title, required this.values});

  final String title;
  final List<String> values;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.foreground),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final value in values)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    value,
                    style: const TextStyle(fontSize: 12, color: AppColors.foreground),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Extracts a YouTube video ID from common share/embed URL formats, or
/// returns the original URL for non-YouTube hosts (e.g. Vimeo).
String _videoIdFromUrl(String url) {
  final trimmed = url.trim();
  final uri = Uri.tryParse(trimmed);
  if (uri == null || !trimmed.contains('youtu')) return trimmed;

  final host = (uri.host.startsWith('www.') ? uri.host.substring(4) : uri.host).toLowerCase();
  String? id;

  if (host == 'youtu.be') {
    id = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : null;
  } else if (uri.path.startsWith('/embed/') || uri.path.startsWith('/shorts/') || uri.path.startsWith('/live/')) {
    id = uri.pathSegments.isEmpty ? null : uri.pathSegments.first;
  } else {
    id = uri.queryParameters['v'];
  }

  return (id == null || id.isEmpty) ? trimmed : id;
}

/// Card showing the house image thumbnail with a play button that
/// opens the video in the YouTube app/browser.
class _VideoTourCard extends StatefulWidget {
  const _VideoTourCard({required this.videoUrl, this.thumbnailUrl});

  final String videoUrl;

  /// The first property image used as the video thumbnail, if available.
  final String? thumbnailUrl;

  @override
  State<_VideoTourCard> createState() => _VideoTourCardState();
}

class _VideoTourCardState extends State<_VideoTourCard> {
  late final String _videoRef;
  bool _isYoutube = false;

  @override
  void initState() {
    super.initState();
    _videoRef = _videoIdFromUrl(widget.videoUrl);
    _isYoutube = _videoRef != widget.videoUrl.trim() &&
        _videoRef.isNotEmpty &&
        _videoRef.length <= 20;
  }

  Future<void> _openExternally() async {
    final ok = await launchUrl(
      Uri.parse(widget.videoUrl.trim()),
      mode: LaunchMode.externalApplication,
    );
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open video on YouTube')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.muted),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.play_circle_fill, size: 22, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Video Tour',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.foreground),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: GestureDetector(
              onTap: _openExternally,
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: _thumbnail(),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _openExternally,
              icon: const Icon(Icons.play_arrow, size: 18),
              label: Text(_isYoutube ? 'Watch on YouTube' : 'Open Video'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _thumbnail() {
    final imageUrl = widget.thumbnailUrl?.isNotEmpty == true
        ? Formatters.imageUrl(widget.thumbnailUrl!)
        : (_isYoutube ? 'https://img.youtube.com/vi/$_videoRef/hqdefault.jpg' : null);
    return Stack(
      fit: StackFit.expand,
      children: [
        if (imageUrl != null)
          CachedNetworkImage(
            imageUrl: imageUrl,
            fit: BoxFit.cover,
            placeholder: (_, _) => const ColoredBox(color: AppColors.muted),
            errorWidget: (_, _, _) => _placeholderThumb(),
          )
        else
          _placeholderThumb(),
        Center(
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.play_arrow, color: Colors.white, size: 34),
          ),
        ),
      ],
    );
  }

  Widget _placeholderThumb() {
    return Container(
      color: AppColors.muted,
      alignment: Alignment.center,
      child: const Icon(Icons.videocam_outlined, size: 40, color: AppColors.mutedForeground),
    );
  }
}

/// Interactive map of the property location fetched from the database.
class _LocationCard extends StatelessWidget {
  const _LocationCard({
    required this.latitude,
    required this.longitude,
    required this.address,
  });

  final double latitude;
  final double longitude;
  final String address;

  @override
  Widget build(BuildContext context) {
    final point = LatLng(latitude, longitude);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.muted),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.map_outlined, size: 22, color: AppColors.primary),
              SizedBox(width: 8),
              Text(
                'Property Location',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.foreground),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 16, color: AppColors.mutedForeground),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  address,
                  style: const TextStyle(color: AppColors.mutedForeground, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              height: 200,
              width: double.infinity,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: point,
                  initialZoom: 15.0,
                  interactionOptions: const InteractionOptions(flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag),
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.dawolife.app',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: point,
                        width: 40,
                        height: 40,
                        child: const Icon(Icons.location_pin, color: AppColors.primary, size: 40),
                      ),
                    ],
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

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.item, required this.onCall, required this.onMessage});

  final ListingItem item;
  final VoidCallback onCall;
  final VoidCallback onMessage;

  @override
  Widget build(BuildContext context) {
    final phone = item.contactPhone;
    final avatar = item.contactPhoto;

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
                      item.contactName,
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