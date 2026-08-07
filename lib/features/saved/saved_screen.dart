import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/saved_provider.dart';
import '../../widgets/listing_card.dart';
import '../auth/signup_screen.dart';
import '../listings/listing_detail_screen.dart';

/// Saved items tab, mirroring app/saved/page.tsx.
class SavedScreen extends StatefulWidget {
  const SavedScreen({super.key});

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isLoggedIn) context.read<SavedProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isLoggedIn) {
      return _LoggedOut();
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Saved')),
      body: Consumer<SavedProvider>(
        builder: (context, saved, _) {
          if (saved.loading && saved.items.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (saved.items.isEmpty) {
            return const Center(
              child: Text(
                'No saved listings yet. Tap the bookmark on a listing to save it.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.mutedForeground),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: saved.load,
            child: GridView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                mainAxisExtent: 238,
              ),
              itemCount: saved.items.length,
              itemBuilder: (context, index) {
                final item = saved.items[index];
                return ListingCard(
                  item: item,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ListingDetailScreen(item: item)),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _LoggedOut extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = context.watch<LanguageProvider>().t;
    return Scaffold(
      appBar: AppBar(title: const Text('Saved')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.bookmark_border, size: 48, color: AppColors.mutedForeground),
              const SizedBox(height: 12),
              const Text(
                'Create an account to save listings',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.mutedForeground),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SignupScreen()),
                ),
                child: Text(t('create_account_link')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
