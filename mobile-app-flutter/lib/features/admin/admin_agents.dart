import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/admin.dart';
import '../../data/repositories/admin_repository.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';

/// Admin agent management mirroring app/admin/agents/page.tsx.
class AdminAgentsScreen extends StatefulWidget {
  const AdminAgentsScreen({super.key});

  @override
  State<AdminAgentsScreen> createState() => _AdminAgentsScreenState();
}

class _AdminAgentsScreenState extends State<AdminAgentsScreen> {
  final _search = TextEditingController();
  String _status = 'all';
  bool _loading = true;
  String? _error;
  List<AdminAgent> _agents = [];
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _search.addListener(_onSearchChanged);
    _load();
  }

  void _onSearchChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), _load);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final agents = await context.read<AdminRepository>().fetchAgents(
            status: _status,
            search: _search.text.trim(),
          );
      if (!mounted) return;
      setState(() {
        _agents = agents;
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
    final tv = context.read<LanguageProvider>().tv;
    return Scaffold(
      appBar: AppBar(title: const Text('Agent Management')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(hintText: 'Search agents by name or email...', prefixIcon: Icon(Icons.search)),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: ['all', 'Pending', 'Approved', 'Rejected', 'Suspended'].map((s) {
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
                    : _agents.isEmpty
                        ? const EmptyState(message: 'No agents found.')
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _agents.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 8),
                            itemBuilder: (context, i) {
                              final a = _agents[i];
                              return Card(
                                margin: EdgeInsets.zero,
                                elevation: 0,
                                color: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: const BorderSide(color: AppColors.border),
                                ),
                                child: ListTile(
                                  onTap: () async {
                                    await Navigator.of(context).push(
                                      MaterialPageRoute(builder: (_) => AgentDetailScreen(agent: a)),
                                    );
                                    _load();
                                  },
                                  leading: CircleAvatar(
                                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                    child: Text(
                                      a.displayName.isNotEmpty ? a.displayName[0].toUpperCase() : '?',
                                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  title: Text(a.displayName, style: const TextStyle(fontSize: 15)),
                                  subtitle: Text(a.email, style: const TextStyle(fontSize: 12)),
                                  trailing: StatusChip(status: a.status),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

/// Detail + verification panel for a single agent.
class AgentDetailScreen extends StatefulWidget {
  const AgentDetailScreen({super.key, required this.agent});

  final AdminAgent agent;

  @override
  State<AgentDetailScreen> createState() => _AgentDetailScreenState();
}

class _AgentDetailScreenState extends State<AgentDetailScreen> {
  late AdminAgent _agent;
  bool _busy = false;
  final _reason = TextEditingController();

  @override
  void initState() {
    super.initState();
    _agent = widget.agent;
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _act(String action) async {
    setState(() => _busy = true);
    try {
      await context.read<AdminRepository>().agentAction(
            _agent.id,
            action,
            rejectionReason: action == 'reject' ? _reason.text.trim() : null,
          );
      if (!mounted) return;
      final status = switch (action) {
        'approve' || 'reactivate' => 'Approved',
        'reject' => 'Rejected',
        'suspend' => 'Suspended',
        _ => _agent.status,
      };
      setState(() {
        _agent = _agent.copyWith(
          status: status,
          rejectionReason: action == 'reject' ? _reason.text.trim() : null,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Agent $action completed successfully')));
    } on Exception catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = _agent;
    final l10n = context.read<LanguageProvider>();
    final t = l10n.t;
    final tv = l10n.tv;
    return Scaffold(
      appBar: AppBar(title: Text(a.displayName)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.primary,
                child: Text(
                  a.displayName.isNotEmpty ? a.displayName[0].toUpperCase() : '?',
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(a.displayName, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                    Text(a.email, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                  ],
                ),
              ),
              StatusChip(status: a.status),
            ],
          ),
          if (a.rejectionReason != null && a.rejectionReason!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.destructive.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.destructive.withValues(alpha: 0.4)),
              ),
              child: Text(
                'Rejection reason: ${a.rejectionReason}',
                style: const TextStyle(color: AppColors.destructive, fontSize: 13),
              ),
            ),
          ],
          const SizedBox(height: 16),
          _section('Onboarding', [
            (t('gender'), tv(a.gender ?? '')),
            (t('date_of_birth'), a.dateOfBirth),
            (t('nationality'), tv(a.nationality ?? '')),
            (t('preferred_language'), tv(a.preferredLanguage ?? '')),
          ]),
          _section(t('contact'), [
            (t('phone'), a.phone),
            ('Safaricom', a.safaricomPhone),
            ('Address', [a.fullAddress, '${a.city}, ${a.region}'].where((e) => e?.isNotEmpty == true).join(', ')),
          ]),
          _section(t('professional'), [
            (t('education'), tv(a.highestEducation ?? '')),
            ('Experience', tv(a.agentExperience ?? '')),
            ('Company', a.companyName),
            ('TIN', a.tinNumber),
          ]),
          const SectionHeader(title: 'Verification Documents'),
          _docLink(t('doc_fayda_front'), a.faydaFront),
          _docLink(t('doc_fayda_back'), a.faydaBack),
          _docLink('Selfie', a.selfieFayda),
          _docLink(t('doc_passport'), a.passportPhoto),
          _docLink(t('doc_education'), a.educationCertificate),
          _docLink(t('doc_license'), a.businessLicenseFile),
          const SizedBox(height: 20),
          if (a.status == 'Pending') ...[
            TextField(
              controller: _reason,
              maxLines: 3,
              decoration: const InputDecoration(hintText: 'Rejection reason (required to reject)'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: _busy ? null : () => _act('approve'),
                    child: const Text('Approve'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _busy ? null : () => _act('reject'),
                    style: FilledButton.styleFrom(backgroundColor: AppColors.destructive),
                    child: const Text('Reject'),
                  ),
                ),
              ],
            ),
          ] else if (a.status == 'Approved') ...[
            FilledButton(
              onPressed: _busy ? null : () => _act('suspend'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.warning),
              child: const Text('Suspend Agent Account'),
            ),
          ] else if (a.status == 'Suspended') ...[
            FilledButton(
              onPressed: _busy ? null : () => _act('reactivate'),
              child: const Text('Reactivate Account'),
            ),
          ] else if (a.status == 'Rejected') ...[
            FilledButton(
              onPressed: _busy ? null : () => _act('reactivate'),
              child: const Text('Re-evaluate & Approve Account'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _section(String title, List<(String, String?)> rows) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: title),
        ...rows.where((r) => r.$2?.isNotEmpty == true).map((r) => InfoRow(label: r.$1, value: r.$2!)),
      ],
    );
  }

  Widget _docLink(String label, String? url) {
    if (url == null || url.isEmpty) {
      return const InfoRow(label: '   ', value: 'Not provided');
    }
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: const Icon(Icons.description_outlined, color: AppColors.primary),
      title: Text(label, style: const TextStyle(fontSize: 13)),
      trailing: const Icon(Icons.open_in_new, size: 16, color: AppColors.mutedForeground),
      onTap: () => showDialog<void>(
        context: context,
        builder: (_) => Dialog(
          child: InteractiveViewer(
            child: CachedNetworkImage(
              imageUrl: url,
              fit: BoxFit.contain,
              errorWidget: (_, _, _) =>
                  const Padding(padding: EdgeInsets.all(24), child: Icon(Icons.broken_image_outlined)),
            ),
          ),
        ),
      ),
    );
  }
}
