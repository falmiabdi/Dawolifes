import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/language_provider.dart';

/// Three colored service cards from service-cards.tsx.
class ServiceCards extends StatelessWidget {
  const ServiceCards({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;
    final cards = [
      (label: t('our_service'), bg: AppColors.serviceOur),
      (label: t('how_to_buy'), bg: AppColors.serviceBuy),
      (label: t('how_to_sell'), bg: AppColors.serviceSell),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          for (final card in cards)
            Expanded(
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
                      width: 26,
                      height: 26,
                      decoration: const BoxDecoration(color: Colors.black, shape: BoxShape.circle),
                      alignment: Alignment.center,
                      child: const Icon(Icons.check, color: Colors.white, size: 15),
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
        ],
      ),
    );
  }
}
