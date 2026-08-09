import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../agent/agent_post_property.dart';
import '../agent/agent_post_vehicle.dart';
import '../auth/login_screen.dart';
import '../auth/signup_screen.dart';

/// Sell tab gate, mirroring the bottom-nav Sell action + app/sell/page.tsx.
class SellScreen extends StatelessWidget {
  const SellScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final t = context.watch<LanguageProvider>().t;

    if (!auth.isLoggedIn) {
      return _Gate(
        icon: Icons.lock_outline,
        title: 'Sign in to sell',
        subtitle: 'You need an account to post listings.',
        actionLabel: t('sign_in'),
        onAction: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        ),
      );
    }

    if (!auth.user!.canSell) {
      return _Gate(
        icon: Icons.verified_outlined,
        title: 'Become a Seller / Agent',
        subtitle:
            'Your buyer account can browse, save and message. Register as a seller to post properties and vehicles.',
        actionLabel: 'Register as Agent',
        onAction: () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const SignupScreen(initialRole: SignupRole.agent)),
          );
        },
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Sell')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'What would you like to post?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.foreground),
          ),
          const SizedBox(height: 16),
          _SellCard(
            icon: Icons.home_work_outlined,
            title: 'Post Property',
            subtitle: 'House, apartment, villa, land or commercial space',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AgentPostPropertyScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _SellCard(
            icon: Icons.directions_car_outlined,
            title: 'Post Vehicle',
            subtitle: 'Car, SUV, truck or motorcycle',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AgentPostVehicleScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _Gate extends StatelessWidget {
  const _Gate({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 48, color: AppColors.mutedForeground),
              const SizedBox(height: 12),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.foreground),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.mutedForeground, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 20),
              FilledButton(onPressed: onAction, child: Text(actionLabel)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SellCard extends StatelessWidget {
  const _SellCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.12), shape: BoxShape.circle),
                child: Icon(icon, color: AppColors.primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.foreground)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
            ],
          ),
        ),
      ),
    );
  }
}
