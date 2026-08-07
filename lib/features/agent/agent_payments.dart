import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/payment.dart';
import '../../data/repositories/admin_repository.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';

/// Agent commission history mirroring app/agent/payments/page.tsx.
class AgentPaymentsScreen extends StatefulWidget {
  const AgentPaymentsScreen({super.key});

  @override
  State<AgentPaymentsScreen> createState() => _AgentPaymentsScreenState();
}

class _AgentPaymentsScreenState extends State<AgentPaymentsScreen> {
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
      final results = await Future.wait([
        repo.fetchPayments(role: 'agent', limit: 50),
        repo.fetchPaymentStats(role: 'agent'),
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
    return Scaffold(
      appBar: AppBar(title: const Text('Payments & Billings')),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('TOTAL EARNED',
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: Colors.grey)),
                                  const SizedBox(height: 8),
                                  Text(
                                    'ETB ${Formatters.formatPrice(stats?.totalRevenue ?? 0)}',
                                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                  const SizedBox(height: 2),
                                  Text('From completed payments',
                                      style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _smallStat('Completed', '${stats?.completedCount ?? 0}'),
                          const SizedBox(width: 10),
                          _smallStat(t('pending'), '${stats?.pendingCount ?? 0}'),
                          const SizedBox(width: 10),
                          _smallStat('Failed', '${stats?.failedCount ?? 0}'),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const SectionHeader(title: 'Commission History'),
                      if (_payments.isEmpty)
                        const EmptyState(message: 'No payments yet.', icon: Icons.receipt_outlined)
                      else
                        ..._payments.map((p) => Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              elevation: 0,
                              color: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: const BorderSide(color: AppColors.border),
                              ),
                              child: ListTile(
                                leading: const CircleAvatar(
                                  backgroundColor: AppColors.primarySoft,
                                  child: Icon(Icons.receipt_outlined, color: AppColors.primary, size: 18),
                                ),
                                title: Text(p.title ?? 'Payment',
                                    maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                subtitle: Text(
                                  '${Formatters.formatPrice(p.amount ?? 0)} ETB · ${p.typeLabel}',
                                  style: const TextStyle(fontSize: 12),
                                ),
                                trailing: StatusChip(status: p.status ?? ''),
                              ),
                            )),
                    ],
                  ),
                ),
    );
  }

  Widget _smallStat(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground)),
          ],
        ),
      ),
    );
  }
}
