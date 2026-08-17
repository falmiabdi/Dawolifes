import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/i18n/app_strings.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/listing_item.dart';
import '../../data/models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/home_provider.dart';
import '../../providers/language_provider.dart';
import '../../widgets/listing_card.dart';
import '../../widgets/service_cards.dart';
import '../auth/login_screen.dart';
import '../auth/signup_screen.dart';
import '../listings/listing_detail_screen.dart';
import '../profile/profile_screen.dart';
import 'about_screen.dart';
import 'categories_screen.dart';
import 'how_to_buy_screen.dart';
import 'how_to_sell_screen.dart';
import 'services_screen.dart';

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

  Future<void> _openCategories() async {
    final result = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const CategoriesScreen()),
    );
    if (result != null && mounted) {
      setState(() => _category = result);
      context.read<HomeProvider>().setCategory(result);
    }
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
              onOpenCategories: _openCategories,
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
    required this.onOpenCategories,
  });

  final String category;
  final TextEditingController searchController;
  final ValueChanged<String> onCategory;
  final VoidCallback onSearch;
  final VoidCallback onOpenCategories;

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LanguageProvider>().t;

    return Container(
      color: AppColors.primary,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _LanguageDropdown(),
              const _AccountButton(),
            ],
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
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: onOpenCategories,
              icon: const Icon(Icons.grid_view, color: Colors.white, size: 18),
              label: const Text('Categories', style: TextStyle(color: Colors.white)),
            ),
          ),
          const SizedBox(height: 12),
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
    final t = context.read<LanguageProvider>().t;

    return PopupMenuButton<AppLanguage>(
      color: Colors.white,
      onSelected: language.setLang,
      itemBuilder: (context) => AppLanguage.values
          .map((lang) => PopupMenuItem(
                value: lang,
                child: Text(
                  switch (lang) {
                    AppLanguage.english => t('lang_english'),
                    AppLanguage.oromo => t('lang_oromo'),
                    AppLanguage.amharic => t('lang_amharic'),
                  },
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
          ServiceCards(
            onServices: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ServicesScreen()),
            ),
            onBuy: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const HowToBuyScreen()),
            ),
            onSell: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const HowToSellScreen()),
            ),
          ),
          _ImageSection(
            title: t('buy_or_sell_house'),
            items: home.visibleHouseItems,
            empty: home.failed,
            hasMore: home.hasMore,
            loadingMore: home.loadingMore,
            onLoadMore: home.loadMore,
          ),
          _ImageSection(
            title: t('buy_or_sell_vehicle'),
            items: home.visibleVehicleItems,
            empty: false,
            hasMore: home.hasMore,
            loadingMore: home.loadingMore,
            onLoadMore: home.loadMore,
          ),
          const SizedBox(height: 24),
          const _Footer(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _ImageSection extends StatelessWidget {
  const _ImageSection({
    required this.title,
    required this.items,
    required this.empty,
    required this.hasMore,
    required this.loadingMore,
    required this.onLoadMore,
  });

  final String title;
  final List<ListingItem> items;
  final bool empty;
  final bool hasMore;
  final bool loadingMore;
  final VoidCallback onLoadMore;

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
            Column(
              children: [
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
                if (hasMore)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: loadingMore
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                          )
                        : TextButton.icon(
                            onPressed: onLoadMore,
                            icon: const Icon(Icons.expand_more, size: 20),
                            label: const Text('Load More'),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.primary,
                            ),
                          ),
                  ),
              ],
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

class _Footer extends StatelessWidget {
  const _Footer();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 12,
        runSpacing: 8,
        children: [
          _FooterLink(
            label: 'Services',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ServicesScreen()),
            ),
          ),
          _FooterLink(
            label: 'About',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AboutScreen()),
            ),
          ),
          _FooterLink(
            label: 'Contact',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AboutScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  const _FooterLink({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Text(
          label,
          style: TextStyle(
            color: AppColors.primary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

/// Account entry point in the header, replacing the old bottom-nav person icon.
/// Logged-in users are taken to their Account page; guests get a choice between
/// creating an account (with the buyer/agent role picker) and signing in.
class _AccountButton extends StatelessWidget {
  const _AccountButton();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    return IconButton(
      onPressed: () => _openAccount(context, auth),
      tooltip: 'Account',
      icon: user != null
          ? _Avatar(user: user)
          : const Icon(Icons.person_outline, color: Colors.white, size: 26),
    );
  }

  void _openAccount(BuildContext context, AuthProvider auth) {
    if (auth.isLoggedIn) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const ProfileScreen()),
      );
      return;
    }

    final t = context.read<LanguageProvider>().t;

    showModalBottomSheet<void>(
      context: context,
      builder: (sheetCtx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                t('your_account'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: FilledButton.icon(
                onPressed: () {
                  Navigator.of(sheetCtx).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SignupScreen()),
                  );
                },
                icon: const Icon(Icons.person_add_alt_1, size: 18),
                label: Text(t('create_account')),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(sheetCtx).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                },
                icon: const Icon(Icons.login, size: 18),
                label: Text(t('sign_in')),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.user});

  final SessionUser user;

  @override
  Widget build(BuildContext context) {
    final photo = user.profilePhoto;
    if (photo != null && photo.isNotEmpty) {
      return Container(
        width: 34,
        height: 34,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 1.5),
        ),
        child: CachedNetworkImage(
          imageUrl: photo,
          fit: BoxFit.cover,
          errorWidget: (_, _, _) => _initialBadge(user),
        ),
      );
    }
    return _initialBadge(user);
  }

  Widget _initialBadge(SessionUser user) {
    final name = user.name.trim();
    final initial = name.isEmpty ? '?' : String.fromCharCode(name.runes.first).toUpperCase();
    return Container(
      width: 34,
      height: 34,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      child: Text(
        initial,
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 15,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
