import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/i18n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/listing_item.dart';
import '../../providers/home_provider.dart';
import '../../providers/language_provider.dart';
import '../../widgets/listing_card.dart';
import '../../widgets/service_cards.dart';
import '../listings/listing_detail_screen.dart';

/// Main home screen mirroring mobile-home.tsx + mobile-header.tsx.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _category = '';

  static const _categoryOptions = [
    (value: '', label: 'select'),
    (value: 'House', label: 'House'),
    (value: 'Apartment', label: 'Apartment'),
    (value: 'Villa', label: 'Villa'),
    (value: 'Land', label: 'Land'),
    (value: 'Commercial', label: 'Commercial'),
    (value: 'Studio', label: 'Studio'),
    (value: 'Penthouse', label: 'Penthouse'),
    (value: 'Vehicle', label: 'Vehicle'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeProvider>().load();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applySearch() {
    context.read<HomeProvider>().setQuery(_searchController.text);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _Header(
              category: _category,
              searchController: _searchController,
              onCategory: (value) {
                setState(() => _category = value);
                context.read<HomeProvider>().setCategory(value);
              },
              onSearch: _applySearch,
            ),
            Expanded(child: _Body()),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.category,
    required this.searchController,
    required this.onCategory,
    required this.onSearch,
  });

  final String category;
  final TextEditingController searchController;
  final ValueChanged<String> onCategory;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LanguageProvider>().t;

    return Container(
      color: AppColors.primary,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: _LanguageDropdown(),
          ),
          const SizedBox(height: 12),
          Text(
            t('what_you_do'),
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _CategoryDropdown(value: category, onChanged: onCategory),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SearchField(controller: searchController, onSearch: onSearch),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CategoryDropdown extends StatelessWidget {
  const _CategoryDropdown({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down, color: Color(0xFF1E293B)),
          style: const TextStyle(color: Color(0xFF1E293B), fontSize: 14, fontWeight: FontWeight.w500),
          dropdownColor: Colors.white,
          items: _HomeScreenState._categoryOptions
              .map((o) => DropdownMenuItem(value: o.value, child: Text(o.label)))
              .toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller, required this.onSearch});

  final TextEditingController controller;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LanguageProvider>().t;

    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
      ),
      child: TextField(
        controller: controller,
        onSubmitted: (_) => onSearch(),
        textInputAction: TextInputAction.search,
        style: const TextStyle(color: Color(0xFF1E293B), fontSize: 14),
        decoration: InputDecoration(
          hintText: t('search_placeholder'),
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          suffixIcon: Padding(
            padding: const EdgeInsets.all(6),
            child: GestureDetector(
              onTap: onSearch,
              child: Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(color: Color(0xFF0F172A), shape: BoxShape.circle),
                child: const Icon(Icons.search, color: Colors.white, size: 18),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LanguageDropdown extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final language = context.watch<LanguageProvider>();

    return PopupMenuButton<AppLanguage>(
      color: Colors.white,
      onSelected: language.setLang,
      itemBuilder: (context) => AppLanguage.values
          .map((lang) => PopupMenuItem(
                value: lang,
                child: Text(
                  lang.label,
                  style: TextStyle(
                    color: AppColors.foreground,
                    fontWeight: language.lang == lang ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ))
          .toList(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.language, color: Colors.white, size: 16),
          const SizedBox(width: 4),
          Text(
            language.lang.code.toUpperCase(),
            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
          ),
          const Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
        ],
      ),
    );
  }
}

class _Body extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final home = context.watch<HomeProvider>();
    final t = context.read<LanguageProvider>().t;

    if (home.loading && home.houseItems.isEmpty && home.vehicleItems.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: home.refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const ServiceCards(),
          _ImageSection(
            title: t('buy_or_sell_house'),
            items: home.visibleHouseItems,
            empty: home.failed,
          ),
          _ImageSection(
            title: t('buy_or_sell_vehicle'),
            items: home.visibleVehicleItems,
            empty: false,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _ImageSection extends StatelessWidget {
  const _ImageSection({required this.title, required this.items, required this.empty});

  final String title;
  final List<ListingItem> items;
  final bool empty;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
      child: Column(
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.primary, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          if (empty)
            _Hint(text: 'Check your connection and pull to refresh.')
          else if (items.isEmpty)
            const _Hint(text: 'No listings yet.')
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                mainAxisExtent: 238,
              ),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return ListingCard(
                  item: item,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ListingDetailScreen(item: item),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _Hint extends StatelessWidget {
  const _Hint({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.mutedForeground, fontSize: 13),
      ),
    );
  }
}
