import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/payment.dart';
import '../../data/repositories/admin_repository.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';

/// Admin payments mirroring app/admin/payments/page.tsx.
class AdminPaymentsScreen extends StatefulWidget {
  const AdminPaymentsScreen({super.key});

  @override
  State<AdminPaymentsScreen> createState() => _AdminPaymentsScreenState();
}

class _AdminPaymentsScreenState extends State<AdminPaymentsScreen> {
  String _status = 'all';
  bool _loading = true;
  String? _error;
  List<Payment> _payments = [];
  PaymentStats? _stats;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = context.read<AdminRepository>();
      final status = _status == 'all' ? null : _status;
      final results = await Future.wait([
        repo.fetchPayments(role: 'admin', status: status),
        repo.fetchPaymentStats(role: 'admin'),
      ]);
      if (!mounted) return;
      setState(() {
        _payments = results[0] as List<Payment>;
        _stats = results[1] as PaymentStats;
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
    final stats = _stats;
    final l10n = context.read<LanguageProvider>();
    final t = l10n.t;
    final tv = l10n.tv;
    return Scaffold(
      appBar: AppBar(title: const Text('Payments')),
      body: Column(
        children: [
          if (stats != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _statBox(Icons.payments_outlined, 'Revenue', '${Formatters.formatPrice(stats.totalRevenue)} ETB'),
                  _statBox(Icons.check_circle_outline, 'Completed', '${stats.completedCount}'),
                  _statBox(Icons.schedule, t('pending'), '${stats.pendingCount}'),
                  _statBox(Icons.error_outline, 'Failed', '${stats.failedCount}'),
                ],
              ),
            ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              children: ['all', 'Pending', 'Completed', 'Failed'].map((s) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(tv(s)),
                    selected: _status == s,
                    onSelected: (_) {
                      setState(() => _status = s);
                      _load();
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: _loading
                ? const LoadingState()
                : _error != null
                    ? ErrorState(message: _error!, onRetry: _load)
                    : _payments.isEmpty
                        ? const EmptyState(message: 'No payments found.')
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _payments.length,
                              separatorBuilder: (_, _) => const SizedBox(height: 8),
                              itemBuilder: (context, i) {
                                final p = _payments[i];
                                return Card(
                                  margin: EdgeInsets.zero,
                                  elevation: 0,
                                  color: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    side: const BorderSide(color: AppColors.border),
                                  ),
                                  child: ListTile(
                                    leading: const CircleAvatar(
                                      backgroundColor: AppColors.primarySoft,
                                      child: Icon(Icons.receipt_outlined, color: AppColors.primary),
                                    ),
                                    title: Text(
                                      p.title ?? 'Payment',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('${p.userName ?? 'User'} · ${p.buyerPhone ?? ''}',
                                            style: const TextStyle(fontSize: 12)),
                                        Text('${Formatters.formatPrice(p.amount ?? 0)} ETB · ${p.typeLabel}',
                                            style: const TextStyle(fontSize: 12)),
                                      ],
                                    ),
                                    isThreeLine: true,
                                    trailing: StatusChip(status: p.status ?? ''),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _statBox(IconData icon, String label, String value) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary, size: 20),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
        ],
      ),
    );
  }
}
