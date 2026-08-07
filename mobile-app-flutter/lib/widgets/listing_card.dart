import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/utils/formatters.dart';
import '../data/models/listing_item.dart';

/// Property/vehicle card from image-section.tsx.
class ListingCard extends StatelessWidget {
  const ListingCard({super.key, required this.item, this.onTap});

  final ListingItem item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isRent = item.isRent;

    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Thumbnail(item: item, isRent: isRent),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _PriceRow(item: item, isRent: isRent),
                    const SizedBox(height: 4),
                    Text(
                      item.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 11, color: AppColors.mutedForeground),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            item.location?.isNotEmpty == true ? item.location! : 'Ethiopia',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _StatsRow(item: item),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({required this.item, required this.isRent});

  final ListingItem item;
  final bool isRent;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 124),
      child: AspectRatio(
        aspectRatio: 4 / 3,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (item.image.isNotEmpty)
              CachedNetworkImage(
                imageUrl: Formatters.imageUrl(item.image),
                fit: BoxFit.cover,
                placeholder: (_, _) => const ColoredBox(color: AppColors.muted),
                errorWidget: (_, _, _) => const ColoredBox(color: AppColors.muted),
              )
            else
              const ColoredBox(color: AppColors.muted),
            Positioned(
              left: 8,
              top: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isRent ? AppColors.accent : AppColors.primary,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  item.listingType,
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({required this.item, required this.isRent});

  final ListingItem item;
  final bool isRent;

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        text: '${Formatters.formatPrice(item.price)} ETB',
        style: const TextStyle(color: AppColors.primary, fontSize: 14, fontWeight: FontWeight.bold),
        children: isRent
            ? [
                TextSpan(
                  text: ' /mo',
                  style: const TextStyle(
                    color: AppColors.mutedForeground,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ]
            : null,
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.item});

  final ListingItem item;

  Widget _stat(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: AppColors.mutedForeground),
        const SizedBox(width: 2),
        Text(label, style: const TextStyle(fontSize: 10, color: AppColors.mutedForeground)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final stats = <Widget>[];
    if (item.beds != null && item.beds! > 0) stats.add(_stat(Icons.bed_outlined, '${item.beds}'));
    if (item.baths != null && item.baths! > 0) stats.add(_stat(Icons.bathtub_outlined, '${item.baths}'));
    if (item.area != null && item.area! > 0) stats.add(_stat(Icons.straighten, '${_num(item.area!)} m²'));
    if (item.year != null) stats.add(_stat(Icons.calendar_today_outlined, '${item.year}'));
    if (item.mileage != null && item.mileage! > 0) {
      stats.add(_stat(Icons.speed, '${Formatters.formatPrice(item.mileage!)} km'));
    }

    return Container(
      padding: const EdgeInsets.only(top: 6),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.border))),
      child: Wrap(spacing: 10, runSpacing: 4, children: stats),
    );
  }

  String _num(num value) => value == value.roundToDouble() ? '${value.round()}' : '$value';
}
