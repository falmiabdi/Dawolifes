import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/language_provider.dart';

class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key});

  static const _categories = [
    (label: 'House', icon: Icons.home_outlined),
    (label: 'Apartment', icon: Icons.apartment_outlined),
    (label: 'Land', icon: Icons.landscape_outlined),
    (label: 'Commercial', icon: Icons.business_outlined),
    (label: 'Villa', icon: Icons.house_outlined),
    (label: 'Studio', icon: Icons.camera_alt_outlined),
    (label: 'Penthouse', icon: Icons.house_outlined),
    (label: 'Vehicle', icon: Icons.directions_car_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;

    return Scaffold(
      appBar: AppBar(title: Text(t('what_you_do'))),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          mainAxisExtent: 130,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          return _CategoryCard(
            label: category.label,
            icon: category.icon,
            onTap: () => Navigator.pop(context, category.label),
          );
        },
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.primary),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
