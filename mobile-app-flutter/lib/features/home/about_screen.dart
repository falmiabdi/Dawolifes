import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/settings_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  Map<String, dynamic> _settings = const {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final repo = SettingsRepository(context.read<ApiClient>());
      final data = await repo.fetchSettings();
      if (mounted) setState(() => _settings = data);
    } catch (_) {
      // keep defaults
    }
  }

  String _phoneN(int n) => (_settings['contactPhone$n'] as String?) ?? '';
  String get _email =>
      (_settings['contactEmail'] as String?) ?? 'info@dawolife.com';
  String _social(String key) => (_settings['social$key'] as String?) ?? '';

  Future<void> _call(String phone) async {
    final cleaned = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    if (cleaned.isEmpty) return;
    final ok = await launchUrl(Uri.parse('tel:$cleaned'));
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to place call')),
      );
    }
  }

  Future<void> _launch(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null || !uri.hasScheme) return;
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open link')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final phones = [1, 2, 3]
        .map(_phoneN)
        .where((p) => p.isNotEmpty)
        .toList();
final socials = <(IconData, String, String)>[
      (Icons.facebook, 'Facebook', _social('Facebook')),
      (Icons.send, 'Telegram', _social('Telegram')),
      (Icons.chat, 'WhatsApp', _social('Whatsapp')),
      (Icons.music_video, 'TikTok', _social('Tiktok')),
      (Icons.business, 'LinkedIn', _social('Linkedin')),
      (Icons.camera_alt, 'Instagram', _social('Instagram')),
    ].where((s) => s.$3.isNotEmpty).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
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
              if (_email.isNotEmpty)
                _ActionTile(
                  icon: Icons.email_outlined,
                  label: _email,
                  onTap: () => _launch('mailto:$_email'),
                ),
              ...phones.map(
                (phone) => _ActionTile(
                  icon: Icons.phone_outlined,
                  label: phone,
                  onTap: () => _call(phone),
                ),
              ),
              _ActionTile(
                icon: Icons.location_on_outlined,
                label: 'Addis Ababa, Ethiopia',
                onTap: null,
              ),
            ]),
            if (socials.isNotEmpty) ...[
              const SizedBox(height: 24),
              _Section(title: 'Social Media', children: [
                for (final (icon, label, url) in socials)
                  _ActionTile(
                    icon: icon,
                    label: label,
                    onTap: () => _launch(url),
                  ),
              ]),
            ],
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
                  final auth = context.read<AuthProvider>();
                  final user = auth.user;
                  final approved = user?.status == 'Approved';
                  final isAgent = user?.isAgent == true;
                  if (isAgent && approved) {
                    final l10n = context.read<LanguageProvider>();
                    final t = l10n.t;
                    showDialog<void>(
                      context: context,
                      barrierDismissible: true,
                      builder: (_) => Dialog(
                        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppColors.radius)),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Padding(
                                padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(t('terms_conditions'), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.close, size: 20),
                                      onPressed: () => Navigator.of(context).pop(),
                                    ),
                                  ],
                                ),
                              ),
                              const Divider(height: 1),
                              Flexible(
                                child: SingleChildScrollView(
                                  padding: const EdgeInsets.all(20),
                                  child: Text(t('terms_conditions_agent_full'), style: const TextStyle(fontSize: 13, height: 1.5)),
                                ),
                              ),
                              const Divider(height: 1),
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: SizedBox(
                                  width: double.infinity,
                                  child: FilledButton(
                                    onPressed: () => Navigator.of(context).pop(),
                                    child: Text(t('close')),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('You are not an agent or owner.')),
                    );
                  }
                },
              ),
            ]),
          ],
        ),
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

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final tile = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: onTap == null ? AppColors.foreground : AppColors.primary,
                fontWeight: onTap == null ? FontWeight.normal : FontWeight.w500,
              ),
            ),
          ),
          if (onTap != null) const Icon(Icons.open_in_new, color: AppColors.mutedForeground, size: 16),
        ],
      ),
    );
    if (onTap == null) return tile;
    return InkWell(onTap: onTap, child: tile);
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
