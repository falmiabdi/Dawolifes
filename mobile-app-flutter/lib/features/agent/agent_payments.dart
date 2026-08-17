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
  final _withdrawAmount = TextEditingController();
  String _withdrawMethod = 'telebirr';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _withdrawAmount.dispose();
    super.dispose();
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
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _planCard('Current Plan', 'Free Tier', 'Max 5 listings')),
                          const SizedBox(width: 10),
                          Expanded(child: _upgradeCard()),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _withdrawForm(),
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

  Widget _planCard(String label, String value, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppColors.mutedForeground)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.foreground)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground)),
        ],
      ),
    );
  }

  Widget _upgradeCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.workspace_premium_outlined, size: 18, color: AppColors.primary),
              const SizedBox(width: 6),
              Expanded(
                child: Text('Premium Agent Plan', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.foreground)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text('ETB 499 / month', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.orange)),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Premium subscription is coming soon.')),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 8),
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              child: const Text('Subscribe'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _withdrawForm() {
    final methods = [
      ('telebirr', 'Telebirr', Icons.qr_code),
      ('chapa', 'Chapa', Icons.credit_card),
      ('cbe', 'CBE Birr', Icons.account_balance_outlined),
    ];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppColors.radius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Withdraw Funds', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.foreground)),
          const SizedBox(height: 4),
          const Text('Choose your payment network', style: TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
          const SizedBox(height: 10),
          Row(
            children: methods.map((m) {
              final (id, name, icon) = m;
              final selected = _withdrawMethod == id;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: InkWell(
                    onTap: () => setState(() => _withdrawMethod = id),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primarySoft : AppColors.muted,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: selected ? AppColors.primary : AppColors.border),
                      ),
                      child: Column(
                        children: [
                          Icon(icon, size: 18, color: selected ? AppColors.primary : AppColors.mutedForeground),
                          const SizedBox(height: 4),
                          Text(name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: selected ? AppColors.primary : AppColors.mutedForeground)),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _withdrawAmount,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: 'e.g. 5000',
              labelText: 'Withdrawal amount (ETB)',
              isDense: true,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _withdraw,
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
              icon: const Icon(Icons.account_balance_wallet_outlined, size: 18),
              label: Text('Withdraw to ${_withdrawMethod.toUpperCase()}'),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Withdrawals will be enabled in a future phase. Your request is recorded for now.',
            style: TextStyle(fontSize: 11, color: AppColors.mutedForeground),
          ),
        ],
      ),
    );
  }

  void _withdraw() {
    final amount = num.tryParse(_withdrawAmount.text.trim());
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid amount to withdraw.')));
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Withdrawal of ETB ${Formatters.formatPrice(amount)} via ${_withdrawMethod.toUpperCase()} is being processed.')),
    );
    _withdrawAmount.clear();
  }
}
