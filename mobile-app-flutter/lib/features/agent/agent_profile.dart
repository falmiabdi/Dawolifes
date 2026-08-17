import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../data/repositories/agent_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../portal/widgets.dart';
import '../agent/agent_onboarding_screen.dart';

/// Agent profile mirroring app/agent/profile/page.tsx. Shows all onboarding
/// info; read-only when Approved, shows rejection reason + resubmit CTA when
/// Rejected.
class AgentProfileScreen extends StatefulWidget {
  const AgentProfileScreen({super.key});

  @override
  State<AgentProfileScreen> createState() => _AgentProfileScreenState();
}

class _AgentProfileScreenState extends State<AgentProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _loading = true;
  String? _error;

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
      final data = await context.read<AgentRepository>().fetchProfile();
      if (!mounted) return;
      setState(() {
        _profile = data;
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

  String _s(String key) => '${_profile?[key] ?? ''}';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final t = context.read<LanguageProvider>().t;
    final name = _s('fullName').isNotEmpty ? _s('fullName') : _s('username');
    final email = _s('email').isNotEmpty ? _s('email') : (user?.email ?? '');
    final status = _s('status').isNotEmpty ? _s('status') : (user?.status ?? 'Pending');

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: _loading
          ? const LoadingState()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                    children: [
                      _bannerCard(name, email, status),
                      const SizedBox(height: 14),
                      Center(
                        child: FilledButton.icon(
                          onPressed: () async {
                            await Navigator.of(context).push<bool>(
                              MaterialPageRoute(builder: (_) => const AgentOnboardingScreen()),
                            );
                            if (mounted) _load();
                          },
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                          ),
                          icon: const Icon(Icons.edit_outlined, size: 18),
                          label: Text(t('edit_profile')),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (status == 'Rejected') _rejectionBanner(),
                      if (status == 'Approved') _approvedBanner(),
                      if (status == 'Pending') _pendingBanner(),
                      const SizedBox(height: 16),
                      _section('Personal & Identity', [
                        ('Full Name', _s('fullName')),
                        ('Gender', _s('gender')),
                        ('Date of Birth', _s('dateOfBirth')),
                        ('Nationality', _s('nationality')),
                        ('Preferred Language', _s('preferredLanguage')),
                      ]),
                      const SizedBox(height: 12),
                      _section('Contact', [
                        ('Phone', _s('phone').isNotEmpty ? _s('phone') : _s('ethPhone')),
                        ('Safaricom Phone', _s('safaricomPhone')),
                        ('Region', _s('region')),
                        ('City', _s('city')),
                        ('Woreda', _s('woreda')),
                        ('Kebele', _s('kebele')),
                        ('Full Address', _s('fullAddress')),
                      ]),
                      const SizedBox(height: 12),
                      _section('Education & Professional', [
                        ('Highest Education', _s('highestEducation')),
                        ('Experience', _s('agentExperience')),
                        ('Company', _s('companyName')),
                        ('Office Address', _s('officeAddress')),
                        ('TIN Number', _s('tinNumber')),
                        ('License Number', _s('businessLicenseNumber')),
                      ]),
                      const SizedBox(height: 12),
                      const SectionHeader(title: 'Uploaded Documents'),
                      _docLink('Fayda Front', _s('faydaFront')),
                      _docLink('Fayda Back', _s('faydaBack')),
                      _docLink('Selfie with Fayda', _s('selfieFayda')),
                      _docLink('Passport Photo', _s('passportPhoto')),
                      _docLink('Education Certificate', _s('educationCertificate')),
                      _docLink('Business License', _s('businessLicenseFile')),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
    );
  }

  Widget _bannerCard(String name, String email, String status) {
    final photo = _s('profilePhoto');
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 28, 16, 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.accent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppColors.radius + 4),
      ),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.white.withValues(alpha: 0.25),
                  backgroundImage: photo.isNotEmpty ? CachedNetworkImageProvider(photo) : null,
                  child: photo.isNotEmpty
                      ? null
                      : Text(name.isNotEmpty ? name[0].toUpperCase() : 'A',
                          style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                ),
              ),
              if (status == 'Approved')
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: const Icon(Icons.verified, color: AppColors.success, size: 22),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(name, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(email, style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 12)),
          const SizedBox(height: 10),
          StatusChip(status: status),
        ],
      ),
    );
  }

  Widget _rejectionBanner() {
    final reason = _s('rejectionReason');
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.cancel, color: Colors.red, size: 20),
              const SizedBox(width: 8),
              Text('Application Rejected', style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          if (reason.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(reason, style: const TextStyle(fontSize: 12, color: Colors.black87)),
          ],
          const SizedBox(height: 8),
          Text('Edit and resubmit your onboarding to update your information.',
              style: TextStyle(fontSize: 12, color: Colors.red.shade700, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _approvedBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          const Icon(Icons.verified, color: Colors.green, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text('Verified agent. Your profile is read-only.',
                style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w600, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _pendingBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade200),
      ),
      child: Row(
        children: [
          const Icon(Icons.access_time, color: Colors.amber, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text('Under review. Your profile is being reviewed by our team.',
                style: TextStyle(color: Colors.amber.shade800, fontWeight: FontWeight.w600, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, List<(String, String)> rows) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: title),
        ...rows.where((r) => r.$2.isNotEmpty).map((r) => InfoRow(label: r.$1, value: r.$2)),
      ],
    );
  }

  Widget _docLink(String label, String url) {
    if (url.isEmpty) {
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