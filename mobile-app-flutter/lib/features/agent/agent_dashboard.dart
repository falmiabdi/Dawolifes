import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/network/websocket_service.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/announcement.dart';
import '../../data/models/property.dart';
import '../../data/models/vehicle.dart';
import '../../data/repositories/agent_repository.dart';
import '../../data/repositories/announcement_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../news/news_screen.dart';
import '../portal/widgets.dart';
import 'agent_payments.dart';
import 'agent_post_property.dart';
import 'agent_post_vehicle.dart';
import 'agent_properties.dart';
import 'agent_vehicles.dart';

/// Agent dashboard mirroring app/agent/page.tsx.
class AgentDashboardScreen extends StatefulWidget {
  const AgentDashboardScreen({super.key});

  @override
  State<AgentDashboardScreen> createState() => _AgentDashboardScreenState();
}

class _AgentDashboardScreenState extends State<AgentDashboardScreen> {
  bool _loading = true;
  String? _error;
  List<Property> _properties = [];
  List<Vehicle> _vehicles = [];
  List<Announcement> _announcements = [];
  StreamSubscription<WSMessage>? _wsSub;

  @override
  void initState() {
    super.initState();
    _load();
    _wsSub = context.read<WebSocketService>().messages.listen((msg) {
      if (msg.type == WSMessageType.announcement && mounted) {
        _loadAnnouncements();
      }
    });
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    super.dispose();
  }

  Future<void> _loadAnnouncements() async {
    try {
      final items = await AnnouncementRepository(context.read<ApiClient>())
          .fetchAnnouncements();
      if (!mounted) return;
      setState(() {
        _announcements = items.take(3).toList();
        _error = null;
      });
    } catch (_) {
      // Announcements are secondary; keep the dashboard usable if they fail.
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = context.read<AgentRepository>();
      final results = await Future.wait([
        repo.fetchMyProperties(),
        repo.fetchMyVehicles(),
        AnnouncementRepository(context.read<ApiClient>()).fetchAnnouncements(),
      ]);
      if (!mounted) return;
      setState(() {
        _properties = results[0] as List<Property>;
        _vehicles = results[1] as List<Vehicle>;
        _announcements = (results[2] as List<Announcement>).take(3).toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final status = user?.status ?? 'Pending';
    final l10n = context.watch<LanguageProvider>();
    final t = l10n.t;

    return Scaffold(
      appBar: AppBar(title: Text(t('dashboard'))),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'AGENT WORKSPACE',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.5,
                                color: Colors.orangeAccent,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text('Welcome, ${user?.name ?? 'Agent'}!',
                                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            Text(
                              'Your central hub for managing properties, tracking performance, and growing your real estate business.',
                              style: TextStyle(color: Colors.grey[400], fontSize: 12, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                      if (status != 'Approved') ...[
                        const SizedBox(height: 12),
                        _statusBanner(status, user?.rejectionReason),
                      ],
                      const SizedBox(height: 16),
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        mainAxisExtent: 104,
                        children: [
                          _stat(Icons.house_outlined, AppColors.primary, AppColors.primarySoft, '${_properties.length}', 'Total Properties'),
                          _stat(Icons.schedule, Colors.amber.shade700, Colors.amber.shade50, '${_properties.where((p) => p.status == 'Pending').length}', 'Pending Properties'),
                          _stat(Icons.directions_car_outlined, Colors.purple, Colors.purple.shade50, '${_vehicles.length}', 'Total Vehicles'),
                          _stat(Icons.schedule, Colors.amber.shade700, Colors.amber.shade50, '${_vehicles.where((v) => v.status == 'Pending').length}', 'Pending Vehicles'),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const SectionHeader(title: 'Quick Actions'),
                      _actionCard(
                        context,
                        icon: Icons.add_home_outlined,
                        label: t('post_property'),
                        desc: 'List a new property for sale or rent',
                        enabled: status == 'Approved',
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPostPropertyScreen())),
                      ),
                      _actionCard(
                        context,
                        icon: Icons.add_box_outlined,
                        label: t('post_vehicle'),
                        desc: 'List a car, truck or motorcycle',
                        enabled: status == 'Approved',
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPostVehicleScreen())),
                      ),
                      _actionCard(
                        context,
                        icon: Icons.house_outlined,
                        label: 'My Properties',
                        desc: 'View and manage your listings',
                        enabled: true,
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPropertiesScreen())),
                      ),
                      _actionCard(
                        context,
                        icon: Icons.directions_car_outlined,
                        label: 'My Vehicles',
                        desc: 'View and manage your vehicle listings',
                        enabled: true,
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentVehiclesScreen())),
                      ),
                      _actionCard(
                        context,
                        icon: Icons.credit_card_outlined,
                        label: 'Commission History',
                        desc: 'Track your earnings and payments',
                        enabled: true,
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AgentPaymentsScreen())),
                      ),
                      if (_announcements.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        SectionHeader(
                          title: 'Announcements',
                          action: TextButton(
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const NewsScreen()),
                            ),
                            child: const Text('View all'),
                          ),
                        ),
                        _announcementsSection(),
                      ],
                      const SizedBox(height: 20),
                      const SectionHeader(title: 'Recent Activity'),
                      _recentActivity(),
                    ],
                  ),
                ),
    );
  }

  Widget _announcementsSection() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFFFF7ED), Color(0xFFFFFBF5)]),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Column(
        children: [
          for (final item in _announcements) ...[
            InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NewsScreen()),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    const Icon(Icons.campaign_outlined, color: Colors.orange, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.title,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.foreground),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            item.content,
                            style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 18, color: AppColors.mutedForeground),
                  ],
                ),
              ),
            ),
            if (item != _announcements.last) const Divider(height: 1, color: Colors.orange),
          ],
        ],
      ),
    );
  }

  Widget _recentActivity() {
    final items = <_RecentItem>[];
    for (final p in _properties) {
      items.add(_RecentItem(
        title: p.title,
        kind: 'Property',
        status: p.status,
        createdAt: p.createdAt,
      ));
    }
    for (final v in _vehicles) {
      items.add(_RecentItem(
        title: v.title,
        kind: 'Vehicle',
        status: v.status,
        createdAt: v.createdAt,
      ));
    }
    items.sort((a, b) => (b.createdAt ?? '').compareTo(a.createdAt ?? ''));

    if (items.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: const Column(
          children: [
            Icon(Icons.bar_chart_outlined, color: AppColors.mutedForeground, size: 36),
            SizedBox(height: 8),
            Text('No activity yet. Start by posting a property!',
                style: TextStyle(color: AppColors.mutedForeground, fontSize: 13)),
          ],
        ),
      );
    }

    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.border)),
      child: Column(
        children: items.take(5).map((item) {
          return ListTile(
            dense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            leading: Icon(
              item.kind == 'Vehicle' ? Icons.directions_car_outlined : Icons.house_outlined,
              color: AppColors.primary,
              size: 20,
            ),
            title: Text(item.title, style: const TextStyle(fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
            subtitle: Text(item.kind, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
            trailing: StatusChip(status: item.status ?? ''),
          );
        }).toList(),
      ),
    );
  }

  Widget _statusBanner(String status, String? rejectionReason) {
    final (color, bg, border, msg) = switch (status) {
      'Approved' => (
          Colors.green.shade700,
          Colors.green.shade50,
          Colors.green.shade200,
          'Your account is active. Start listing properties!',
        ),
      'Rejected' => (
          Colors.red.shade700,
          Colors.red.shade50,
          Colors.red.shade200,
          rejectionReason?.isNotEmpty == true ? rejectionReason! : 'Your application was rejected. Please update your documents and resubmit.',
        ),
      'Suspended' => (
          Colors.blueGrey.shade700,
          Colors.blueGrey.shade50,
          Colors.blueGrey.shade200,
          'Your account has been suspended. Contact support for assistance.',
        ),
      _ => (
          Colors.amber.shade800,
          Colors.amber.shade50,
          Colors.amber.shade200,
          'Your application is under review. You will be notified once approved.',
        ),
    };
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: border)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: color, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Account $status', style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 2),
                Text(msg, style: const TextStyle(color: Colors.black87, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _stat(IconData icon, Color color, Color bg, String value, String label) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _actionCard(BuildContext context, {required IconData icon, required String label, required String desc, required bool enabled, required VoidCallback onTap}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppColors.border)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primarySoft,
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        title: Row(
          children: [
            Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            if (!enabled) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(6)),
                child: Text('Requires Approval', style: TextStyle(fontSize: 10, color: Colors.amber.shade800)),
              ),
            ],
          ],
        ),
        subtitle: Text(desc, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.mutedForeground),
        onTap: enabled ? onTap : null,
      ),
    );
  }
}

class _RecentItem {
  const _RecentItem({
    required this.title,
    required this.kind,
    required this.status,
    required this.createdAt,
  });

  final String title;
  final String kind;
  final String? status;
  final String? createdAt;
}
