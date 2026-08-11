import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/language_provider.dart';

/// Three informational cards matching the website sections.
class ServiceCards extends StatelessWidget {
  const ServiceCards({
    super.key,
    this.onServices,
    this.onBuy,
    this.onSell,
  });

  final VoidCallback? onServices;
  final VoidCallback? onBuy;
  final VoidCallback? onSell;

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;
    final cards = [
      (
        label: t('our_service'),
        icon: Icons.work_outline,
        bg: AppColors.serviceOur,
        onTap: onServices,
      ),
      (
        label: t('how_to_buy'),
        icon: Icons.shopping_bag_outlined,
        bg: AppColors.serviceBuy,
        onTap: onBuy,
      ),
      (
        label: t('how_to_sell'),
        icon: Icons.local_offer_outlined,
        bg: AppColors.serviceSell,
        onTap: onSell,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          for (final card in cards)
            Expanded(
              child: GestureDetector(
                onTap: card.onTap,
                child: Container(
                  margin: EdgeInsets.only(left: card == cards.first ? 0 : 8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                  decoration: BoxDecoration(
                    color: card.bg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: const BoxDecoration(
                          color: Color(0xFFF97316),
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Icon(card.icon, color: Colors.white, size: 15),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          card.label,
                          maxLines: 2,
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
