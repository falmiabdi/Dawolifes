import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/payment.dart';
import '../../data/repositories/admin_repository.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';
import 'overview_chart.dart';

/// Admin dashboard mirroring app/admin/page.tsx.
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  late Future<_AdminDashboardData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_AdminDashboardData> _load() async {
    final repo = context.read<AdminRepository>();
    final results = await Future.wait([
      repo.fetchAgents(status: 'all'),
      repo.fetchProperties(),
      repo.fetchVehicles(),
      repo.fetchPaymentStats(),
      repo.fetchPayments(role: 'admin', limit: 5),
    ]);
    return _AdminDashboardData(
      agents: results[0] as List,
      properties: results[1] as List,
      vehicles: results[2] as List,
      stats: results[3] as PaymentStats,
      recentPayments: results[4] as List<Payment>,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.watch<LanguageProvider>();
    final t = l10n.t;
    return Scaffold(
      appBar: AppBar(title: Text(t('dashboard'))),
      body: FutureBuilder<_AdminDashboardData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingState();
          }
          if (snapshot.hasError) {
            return ErrorState(message: '${snapshot.error}', onRetry: () => setState(() => _future = _load()));
          }
          final data = snapshot.data!;
          final agents = data.agents;
          final properties = data.properties;
          final vehicles = data.vehicles;
          final stats = data.stats;
          final pendingAgents = agents.where((a) => a.status == 'Pending').length;
          final pendingProperties = properties.where((p) => p.status == 'Pending').length;
          final pendingVehicles = vehicles.where((v) => v.status == 'Pending').length;

          return RefreshIndicator(
            onRefresh: () async {
              final f = _load();
              setState(() => _future = f);
              await f;
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const SectionHeader(title: 'Overview'),
                LayoutBuilder(
                  builder: (context, constraints) {
                    const spacing = 10.0;
                    final cardWidth = (constraints.maxWidth - spacing) / 2;
                    return Wrap(
                      spacing: spacing,
                      runSpacing: spacing,
                      children: [
                        SizedBox(
                          width: cardWidth,
                          child: StatCard(
                            label: 'Total Agents',
                            value: '${agents.length}',
                            icon: Icons.people_outline,
                            color: const Color(0xFF3B82F6),
                            subtitle: '$pendingAgents pending verification',
                          ),
                        ),
                        SizedBox(
                          width: cardWidth,
                          child: StatCard(
                            label: 'Verification Queue',
                            value: '$pendingAgents',
                            icon: Icons.verified_outlined,
                            color: AppColors.warning,
                            subtitle: 'Requires identity approval',
                          ),
                        ),
                        SizedBox(
                          width: cardWidth,
                          child: StatCard(
                            label: 'Total Properties',
                            value: '${properties.length}',
                            icon: Icons.house_outlined,
                            color: AppColors.success,
                            subtitle: '$pendingProperties awaiting review',
                          ),
                        ),
                        SizedBox(
                          width: cardWidth,
                          child: StatCard(
                            label: 'Total Vehicles',
                            value: '${vehicles.length}',
                            icon: Icons.directions_car_outlined,
                            color: const Color(0xFF3B82F6),
                            subtitle: '$pendingVehicles awaiting review',
                          ),
                        ),
                        SizedBox(
                          width: cardWidth,
                          child: StatCard(
                            label: 'Total Revenue',
                            value: 'ETB ${_fmt(stats.totalRevenue)}',
                            icon: Icons.attach_money,
                            color: AppColors.success,
                            subtitle: '${stats.completedCount} completed',
                          ),
                        ),
                        SizedBox(
                          width: cardWidth,
                          child: StatCard(
                            label: 'Pending Payments',
                            value: '${stats.pendingCount}',
                            icon: Icons.hourglass_empty,
                            color: AppColors.warning,
                            subtitle: '${stats.failedCount} failed',
                          ),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Growth & Revenue Analytics',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Monthly trend of listings posted vs platform billing revenue',
                        style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 12),
                      const OverviewChart(),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const SectionHeader(title: 'Recent Registrations'),
                if (agents.isEmpty)
                  const EmptyState(message: 'No agents registered yet.')
                else
                  ...agents.take(5).map(
                        (a) => ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.person_outline, color: AppColors.mutedForeground),
                          title: Text(a.displayName, style: const TextStyle(fontSize: 14)),
                          subtitle: Text(a.email, style: const TextStyle(fontSize: 12)),
                          trailing: StatusChip(status: a.status),
                        ),
                      ),
                const SizedBox(height: 8),
                const SectionHeader(title: 'Recent Payments'),
                if (data.recentPayments.isEmpty)
                  const EmptyState(message: 'No payments yet.')
                else
                  ...data.recentPayments.take(5).map(
                        (p) => ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.receipt_outlined, color: AppColors.mutedForeground),
                          title: Text(p.title ?? 'Payment', style: const TextStyle(fontSize: 14)),
                          subtitle: Text(
                            '${p.typeLabel} · ${p.method ?? ''}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          trailing: Text(
                            '+ETB ${_fmt(p.amount)}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  String _fmt(dynamic value) {
    final n = (value is num) ? value.toDouble() : 0.0;
    if (n == n.roundToDouble()) {
      return '${n.toInt()}';
    }
    return n.toStringAsFixed(2);
  }
}

class _AdminDashboardData {
  const _AdminDashboardData({
    required this.agents,
    required this.properties,
    required this.vehicles,
    required this.stats,
    required this.recentPayments,
  });

  final List agents;
  final List properties;
  final List vehicles;
  final PaymentStats stats;
  final List<Payment> recentPayments;
}
