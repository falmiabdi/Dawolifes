import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../admin/admin_portal.dart';
import '../agent/agent_portal.dart';
import '../news/news_screen.dart';
import '../notifications/notifications_screen.dart';

/// "More" tab — quick links to News, Notifications and role portals,
/// mirroring the web site header's More menu + dashboard links.
class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _MoreCard(
            icon: Icons.campaign_outlined,
            title: 'News',
            subtitle: 'Announcements and updates from the DawoLife team',
            color: AppColors.primary,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NewsScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _MoreCard(
            icon: Icons.notifications_none,
            title: 'Notifications',
            subtitle: 'Listing approvals, rejections and messages',
            color: Colors.blue,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
          ),
          if (user != null && user.isAgent) ...[
            const SizedBox(height: 12),
            _MoreCard(
              icon: Icons.work_outline,
              title: 'Agent Portal',
              subtitle: 'Post properties & vehicles, track your listings',
              color: Colors.green,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AgentPortalScreen()),
              ),
            ),
          ],
          if (user != null && user.isAdmin) ...[
            const SizedBox(height: 12),
            _MoreCard(
              icon: Icons.admin_panel_settings_outlined,
              title: 'Admin Portal',
              subtitle: 'Manage agents, listings, payments & users',
              color: Colors.deepPurple,
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AdminPortalScreen()),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MoreCard extends StatelessWidget {
  const _MoreCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
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
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
                child: Icon(icon, color: color),
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
