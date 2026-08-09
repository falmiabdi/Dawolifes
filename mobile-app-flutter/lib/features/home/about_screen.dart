import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'DawoLife',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.foreground,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Your trusted platform for buying and selling properties and vehicles in Ethiopia.',
            style: TextStyle(color: AppColors.mutedForeground, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          _Section(title: 'Contact Us', children: [
            _ListTile(icon: Icons.email_outlined, label: 'info@dawolife.com'),
            _ListTile(icon: Icons.phone_outlined, label: '+251 911 234 567'),
            _ListTile(icon: Icons.location_on_outlined, label: 'Addis Ababa, Ethiopia'),
          ]),
          const SizedBox(height: 24),
          _Section(title: 'Quick Links', children: [
            _LinkTile(
              icon: Icons.home_outlined,
              label: 'Home',
              onTap: () => Navigator.pop(context),
            ),
            _LinkTile(
              icon: Icons.sell_outlined,
              label: 'Sell',
              onTap: () => Navigator.pop(context),
            ),
            _LinkTile(
              icon: Icons.bookmark_border,
              label: 'Saved',
              onTap: () => Navigator.pop(context),
            ),
          ]),
          const SizedBox(height: 24),
          _Section(title: 'Legal', children: [
            _LinkTile(
              icon: Icons.privacy_tip_outlined,
              label: 'Privacy Policy',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Privacy Policy coming soon.')),
                );
              },
            ),
            _LinkTile(
              icon: Icons.description_outlined,
              label: 'Terms of Service',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Terms of Service coming soon.')),
                );
              },
            ),
          ]),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.foreground,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _ListTile extends StatelessWidget {
  const _ListTile({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 20),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: AppColors.foreground)),
        ],
      ),
    );
  }
}

class _LinkTile extends StatelessWidget {
  const _LinkTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: AppColors.mutedForeground, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(color: AppColors.foreground))),
            const Icon(Icons.chevron_right, color: AppColors.mutedForeground, size: 20),
          ],
        ),
      ),
    );
  }
}
