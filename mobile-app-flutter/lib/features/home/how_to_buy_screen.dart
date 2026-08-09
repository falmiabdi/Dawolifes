import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/language_provider.dart';

class HowToBuyScreen extends StatelessWidget {
  const HowToBuyScreen({super.key});

  static const _stepKeys = [
    ('buy_step1', 'buy_step1_desc'),
    ('buy_step2', 'buy_step2_desc'),
    ('buy_step3', 'buy_step3_desc'),
    ('buy_step4', 'buy_step4_desc'),
    ('buy_step5', 'buy_step5_desc'),
    ('buy_step6', 'buy_step6_desc'),
    ('buy_step7', 'buy_step7_desc'),
    ('buy_step8', 'buy_step8_desc'),
  ];

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;

    return Scaffold(
      appBar: AppBar(title: Text(t('how_to_buy'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(
              Icons.shopping_bag_outlined,
              size: 48,
              color: Color(0xFFF97316),
            ),
            const SizedBox(height: 12),
            Text(
              t('how_to_buy'),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.foreground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              t('how_to_buy_subtitle'),
              style: TextStyle(
                fontSize: 14,
                color: AppColors.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ..._stepKeys.asMap().entries.map((entry) {
              final index = entry.key;
              final (titleKey, descKey) = entry.value;
              return _StepItem(
                number: index + 1,
                title: t(titleKey),
                description: t(descKey),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _StepItem extends StatelessWidget {
  const _StepItem({
    required this.number,
    required this.title,
    required this.description,
  });

  final int number;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Color(0xFFF97316),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                '$number',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.mutedForeground,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
