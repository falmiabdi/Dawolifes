import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/user.dart';
import '../../data/repositories/admin_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../portal/change_password_screen.dart';

/// Admin settings mirroring app/admin/settings/page.tsx:
/// profile (photo/phone/email), change password, create admin (root only).
class AdminSettingsScreen extends StatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  State<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends State<AdminSettingsScreen> {
  final _phone = TextEditingController();
  final _email = TextEditingController();
  String? _profilePhoto;
  bool _saving = false;
  bool _uploading = false;

  final _uUsername = TextEditingController();
  final _uEmail = TextEditingController();
  final _uPassword = TextEditingController();
  bool _creating = false;

  SessionUser? _user;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_user == null) {
      final user = context.read<AuthProvider>().user;
      _user = user;
      _phone.text = user?.phone ?? '';
      _email.text = user?.email ?? '';
      _profilePhoto = user?.profilePhoto;
    }
  }

  @override
  void dispose() {
    _phone.dispose();
    _email.dispose();
    _uUsername.dispose();
    _uEmail.dispose();
    _uPassword.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final api = context.read<ApiClient>();
    try {
      final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 70);
      if (file == null) return;
      setState(() => _uploading = true);
      final bytes = await file.readAsBytes();
      final mime = file.mimeType?.isNotEmpty == true ? file.mimeType! : 'image/jpeg';
      final url = await api.uploadFile('/api/upload', bytes: bytes, filename: file.name, contentType: mime);
      if (!mounted) return;
      setState(() => _profilePhoto = url);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to upload photo: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _saving = true);
    try {
      final auth = context.read<AuthProvider>();
      await context.read<AdminRepository>().updateProfile(
            phone: _phone.text.trim(),
            email: _email.text.trim(),
            profilePhoto: _profilePhoto,
          );
      await auth.refreshUser();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update profile: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _createAdmin() async {
    if (_uUsername.text.trim().isEmpty || _uEmail.text.trim().isEmpty || _uPassword.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('All fields are required')));
      return;
    }
    if (_uPassword.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password must be at least 8 characters')));
      return;
    }
    setState(() => _creating = true);
    try {
      await context.read<AdminRepository>().createAdmin(
            username: _uUsername.text.trim(),
            email: _uEmail.text.trim(),
            password: _uPassword.text,
          );
      if (!mounted) return;
      _uUsername.clear();
      _uEmail.clear();
      _uPassword.clear();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Admin created successfully')));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to create admin: $e')));
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRoot = _user?.isRootAdmin ?? false;
    final t = context.read<LanguageProvider>().t;
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _section(
            icon: Icons.account_circle_outlined,
            title: t('profile'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.primarySoft,
                      backgroundImage: (_profilePhoto != null && _profilePhoto!.isNotEmpty)
                          ? NetworkImage(_profilePhoto!)
                          : null,
                      child: (_profilePhoto == null || _profilePhoto!.isEmpty)
                          ? const Icon(Icons.person, color: AppColors.primary, size: 32)
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_user?.name ?? 'Admin', style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text(_user?.email ?? '', style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: _uploading ? null : _pickPhoto,
                      tooltip: 'Upload photo',
                      icon: _uploading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.photo_camera_outlined),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  t('phone_number_label'),
                  style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(hintText: '+251 900 000 000'),
                ),
                const SizedBox(height: 12),
                Text(
                  t('email'),
                  style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _email,
                  decoration: const InputDecoration(hintText: 'you@example.com'),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _saving ? null : _saveProfile,
                  child: _saving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(t('save_profile')),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _section(
            icon: Icons.lock_outline,
            title: t('change_password'),
            child: OutlinedButton.icon(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChangePasswordScreen())),
              icon: const Icon(Icons.password, size: 16),
              label: const Text('Update Password'),
            ),
          ),
          if (isRoot) ...[
            const SizedBox(height: 16),
            _section(
              icon: Icons.person_add_alt_outlined,
              title: t('create_new_admin'),
              subtitle: t('only_root_admin'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _uUsername,
                    decoration: InputDecoration(labelText: t('username')),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _uEmail,
                    decoration: InputDecoration(labelText: t('email')),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _uPassword,
                    decoration: InputDecoration(labelText: t('password')),
                    obscureText: true,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _creating ? null : _createAdmin,
                    child: _creating
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(t('create_admin')),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _section({required IconData icon, required String title, String? subtitle, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
          ],
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}
